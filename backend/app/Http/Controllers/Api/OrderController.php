<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::with(['user:id,name,email', 'items'])
            ->when($request->user()->role !== 'admin', fn ($query) => $query->where('user_id', $request->user()->id))
            ->latest()
            ->get();

        return response()->json($orders);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:20'],
            'payment_method' => ['required', Rule::in(['cash', 'paymongo'])],
            'contact_name' => ['required', 'string', 'max:255'],
            'phone_number' => ['required', 'string', 'max:30', 'regex:/^[+0-9().\-\s]{7,30}$/'],
            'shipping_address' => ['required', 'string', 'max:2000'],
        ]);

        if ($data['payment_method'] === 'paymongo' && ! config('services.paymongo.secret_key')) {
            throw new HttpException(503, 'Online payments are not configured. Add PAYMONGO_SECRET_KEY to the backend environment.');
        }

        $order = DB::transaction(function () use ($request, $data) {
            $products = Product::whereIn('id', collect($data['items'])->pluck('product_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $total = 0;
            foreach ($data['items'] as $item) {
                $product = $products->get($item['product_id']);
                if (! $product || $product->stock < $item['quantity']) {
                    throw ValidationException::withMessages(['items' => ['One or more products are out of stock. Refresh the shop and try again.']]);
                }
                $total += (int) round((float) $product->price * 100) * $item['quantity'];
            }

            $order = Order::create([
                'user_id' => $request->user()->id,
                'order_number' => 'MS-'.Str::upper(Str::random(8)),
                'contact_name' => $data['contact_name'],
                'phone_number' => $data['phone_number'],
                'total' => $total / 100,
                'status' => 'processing',
                'payment_method' => $data['payment_method'],
                'payment_status' => 'pending',
                'shipping_address' => $data['shipping_address'],
            ]);

            foreach ($data['items'] as $item) {
                $product = $products->get($item['product_id']);
                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                ]);
                $product->decrement('stock', $item['quantity']);
            }

            return $order;
        });

        if ($data['payment_method'] === 'paymongo') {
            try {
                $response = Http::withBasicAuth(config('services.paymongo.secret_key'), '')
                    ->acceptJson()
                    ->post('https://api.paymongo.com/v1/checkout_sessions', [
                        'data' => [
                            'attributes' => [
                                'line_items' => $order->items->map(fn ($item) => [
                                    'currency' => 'PHP',
                                    'amount' => (int) round((float) $item->unit_price * 100),
                                    'name' => $item->product_name,
                                    'quantity' => $item->quantity,
                                ])->values()->all(),
                                'payment_method_types' => ['card', 'gcash', 'grab_pay', 'paymaya'],
                                'description' => 'Master Shop order '.$order->order_number,
                                'reference_number' => $order->order_number,
                                'success_url' => rtrim(config('app.frontend_url'), '/').'/?payment=success&order='.$order->order_number,
                                'cancel_url' => rtrim(config('app.frontend_url'), '/').'/?payment=cancelled&order='.$order->order_number,
                            ],
                        ],
                    ]);

                if (! $response->successful()) {
                    throw new HttpException(502, 'PayMongo could not start checkout: '.$response->json('errors.0.detail', 'payment provider error'));
                }

                $checkout = $response->json('data');
                $order->update(['paymongo_checkout_id' => $checkout['id']]);

                return response()->json([
                    'order' => $order->load('items'),
                    'checkout_url' => $checkout['attributes']['checkout_url'],
                ], 201);
            } catch (Throwable $exception) {
                $this->releaseStockAndDelete($order);
                throw $exception;
            }
        }

        return response()->json(['order' => $order->load('items')], 201);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['processing', 'shipped', 'delivered', 'cancelled'])],
        ]);

        $order->update($data);

        return response()->json($order->fresh()->load(['user:id,name,email', 'items']));
    }

    public function paymongoWebhook(Request $request): JsonResponse
    {
        $secret = config('services.paymongo.webhook_secret');
        if (! $secret) {
            throw new HttpException(503, 'PayMongo webhook signing is not configured.');
        }

        $signature = [];
        foreach (explode(',', (string) $request->header('Paymongo-Signature')) as $part) {
            [$key, $value] = array_pad(explode('=', $part, 2), 2, '');
            $signature[$key] = $value;
        }

        $timestamp = $signature['t'] ?? '';
        $expected = hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $secret);
        $provided = $signature[app()->environment('production') ? 'li' : 'te'] ?? '';

        if (! $timestamp || abs(time() - (int) $timestamp) > 300 || ! $provided || ! hash_equals($expected, $provided)) {
            throw new HttpException(401, 'Invalid PayMongo webhook signature.');
        }

        $payload = $request->json()->all();
        $event = $payload['data']['attributes']['type'] ?? null;
        $sessionId = $payload['data']['attributes']['data']['id'] ?? null;

        if ($event === 'checkout_session.payment.paid' && $sessionId) {
            Order::where('paymongo_checkout_id', $sessionId)->update(['payment_status' => 'paid']);
        }

        return response()->json(['received' => true]);
    }

    private function releaseStockAndDelete(Order $order): void
    {
        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                if ($item->product_id) {
                    Product::whereKey($item->product_id)->increment('stock', $item->quantity);
                }
            }
            $order->delete();
        });
    }
}

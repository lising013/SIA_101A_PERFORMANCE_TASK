<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerAccountController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            User::query()
                ->where('role', 'customer')
                ->withCount('orders')
                ->latest()
                ->get(['id', 'name', 'email', 'created_at']),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $customer = User::create($data + ['role' => 'customer']);

        return response()->json($customer->only('id', 'name', 'email', 'created_at'), 201);
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->role !== 'customer') {
            return response()->json(['message' => 'Only customer accounts can be deleted here.'], 404);
        }

        DB::transaction(fn () => $user->delete());

        return response()->json(['message' => 'Customer account deleted. Existing orders have been preserved.']);
    }
}

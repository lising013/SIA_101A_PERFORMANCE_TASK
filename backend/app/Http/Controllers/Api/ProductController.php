<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->when($request->query('category'), fn ($query, $category) => $query->where('category', $category))
            ->latest()
            ->get();

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $product = Product::create($this->validated($request));

        return response()->json($product, 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $product->update($this->validated($request));

        return response()->json($product->fresh());
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Product deleted.']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'category' => ['required', 'string', 'max:80'],
            'price' => ['required', 'numeric', 'min:0.01', 'max:99999999.99'],
            'image_url' => ['required', 'url', 'max:2048'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_featured' => ['sometimes', 'boolean'],
        ]);
    }
}

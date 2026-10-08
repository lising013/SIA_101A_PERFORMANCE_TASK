<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAccountController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            User::query()
                ->where('role', 'admin')
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

        $admin = User::create($data + ['role' => 'admin']);

        return response()->json($admin->only('id', 'name', 'email', 'created_at'), 201);
    }
}

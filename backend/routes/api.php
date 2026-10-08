<?php

use App\Http\Controllers\Api\AdminAccountController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerAccountController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/payments/paymongo/webhook', [OrderController::class, 'paymongoWebhook']);
Route::get('/products', [ProductController::class, 'index']);

Route::middleware('auth.token')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);

    Route::middleware('admin')->group(function () {
        Route::get('/admins', [AdminAccountController::class, 'index']);
        Route::post('/admins', [AdminAccountController::class, 'store']);
        Route::get('/customers', [CustomerAccountController::class, 'index']);
        Route::post('/customers', [CustomerAccountController::class, 'store']);
        Route::delete('/customers/{user}', [CustomerAccountController::class, 'destroy']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    });
});

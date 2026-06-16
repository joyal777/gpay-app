<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\BeneficiaryController;
use Illuminate\Support\Facades\Route;


Route::get('/test', function() {
    return response()->json(['message' => 'API is working']);
});
/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Require Authentication)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth Routes
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Wallet Routes
    Route::get('/wallet/balance', [WalletController::class, 'balance']);
    Route::post('/wallet/add-money', [WalletController::class, 'addMoney']);
    Route::post('/wallet/send-money', [WalletController::class, 'sendMoney']);
    Route::get('/wallet/transactions', [WalletController::class, 'transactions']);

    // Beneficiary Routes
    Route::get('/beneficiaries', [BeneficiaryController::class, 'index']);
    Route::post('/beneficiaries', [BeneficiaryController::class, 'store']);
    Route::delete('/beneficiaries/{id}', [BeneficiaryController::class, 'destroy']);
});

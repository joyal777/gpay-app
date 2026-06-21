<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\BeneficiaryController;
use App\Http\Controllers\Api\ChatController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BankController;


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
    Route::post('/profile/upi-pin', [AuthController::class, 'setUpiPin']);
    Route::post('/profile/verify-pin', [AuthController::class, 'verifyUpiPin']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/pic', [AuthController::class, 'updateProfilePic']);
    Route::post('/logout', [AuthController::class, 'logout']);
    // User Search
    Route::get('/users/search', [UserController::class, 'search']);

    // Chat Routes
    Route::get('/chat/users', [ChatController::class, 'chatUsers']);
    Route::get('/chat/{userId}', [ChatController::class, 'getChat']);
    Route::post('/chat/send', [ChatController::class, 'sendMessage']);
    // Wallet Routes
    Route::get('/wallet/balance', [WalletController::class, 'balance']);
    Route::get('/wallet/transactions', [WalletController::class, 'transactions']);

    // Beneficiary Routes
    Route::get('/beneficiaries', [BeneficiaryController::class, 'index']);
    Route::post('/beneficiaries', [BeneficiaryController::class, 'store']);
    Route::delete('/beneficiaries/{id}', [BeneficiaryController::class, 'destroy']);

    // Bank Routes
// Bank Routes
Route::get('/bank/accounts', [BankController::class, 'getAccounts']);
Route::get('/bank/account', [BankController::class, 'getAccount']);
Route::post('/bank/account', [BankController::class, 'saveAccount']);
Route::post('/bank/account/{id}/default', [BankController::class, 'setDefault']);
Route::delete('/bank/account/{id}', [BankController::class, 'deleteAccount']);
Route::post('/bank/account/{id}/verify-pin', [BankController::class, 'verifyPin']);
Route::post('/bank/account/{id}/pin', [BankController::class, 'updatePin']);
Route::post('/bank/transfer', [BankController::class, 'transfer']);
Route::get('/bank/history', [BankController::class, 'history']);
});

// Routes that ALWAYS need PIN
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/wallet/send-money', [WalletController::class, 'sendMoney']);
    Route::post('/wallet/add-money', [WalletController::class, 'addMoney']);
});

// Chat route - PIN checked inside controller only if payment

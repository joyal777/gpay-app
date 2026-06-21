<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WalletController extends Controller
{
    // Get wallet balance
    public function balance(Request $request)
    {
        $wallet = $request->user()->wallet;

        return response()->json([
            'status' => true,
            'message' => 'Wallet balance fetched',
            'data' => [
                'balance' => $wallet->balance,
                'upi_id' => $wallet->upi_id,
                'is_active' => $wallet->is_active,
            ]
        ]);
    }

    // Add money to wallet (mock - in real app integrate payment gateway)
    public function addMoney(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:1|max:100000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        $wallet = $request->user()->wallet;
        $wallet->credit($request->amount);

        return response()->json([
            'status' => true,
            'message' => 'Money added successfully',
            'data' => [
                'amount_added' => $request->amount,
                'new_balance' => $wallet->fresh()->balance,
            ]
        ]);
    }

    // Send money to another user
    public function sendMoney(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:1',
            'note' => 'nullable|string|max:255',
            'account_id' => 'nullable|exists:bank_accounts,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        $sender = $request->user();
        $senderWallet = $sender->wallet;

        // Check balance
        if (!$senderWallet->hasSufficientBalance($request->amount)) {
            return response()->json([
                'status' => false,
                'message' => 'Insufficient balance'
            ], 400);
        }

        // Find receiver by UPI ID
        $receiverWallet = \App\Models\Wallet::where('upi_id', $request->upi_id)
            ->where('is_active', true)
            ->first();

        if (!$receiverWallet) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid UPI ID or receiver not found'
            ], 404);
        }

        if ($receiverWallet->user_id === $sender->id) {
            return response()->json([
                'status' => false,
                'message' => 'Cannot send money to yourself'
            ], 400);
        }

        // Process transaction
        $transactionId = Transaction::generateTransactionId();

        // Debit sender
        $senderWallet->debit($request->amount);

        // Credit receiver
        $receiverWallet->credit($request->amount);

        // Create transaction record
        $transaction = Transaction::create([
            'transaction_id' => $transactionId,
            'sender_id' => $sender->id,
            'receiver_id' => $receiverWallet->user_id,
            'amount' => $request->amount,
            'type' => 'debit',
            'status' => 'completed',
            'note' => $request->note,
        ]);

        Message::create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiverWallet->user_id,
            'amount' => $request->amount,
            'message' => $request->note ?? '💸 Payment sent',
            'transaction_id' => $transactionId,
            'type' => 'payment',
            'status' => 'completed',
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Money sent successfully',
            'data' => [
                'transaction' => $transaction->load(['sender', 'receiver']),
                'new_balance' => $senderWallet->fresh()->balance,
            ]
        ]);
    }

    // Transaction history
    public function transactions(Request $request)
    {
        $user = $request->user();

        $transactions = Transaction::where('sender_id', $user->id)
            ->orWhere('receiver_id', $user->id)
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'status' => true,
            'message' => 'Transactions fetched',
            'data' => $transactions
        ]);
    }
}

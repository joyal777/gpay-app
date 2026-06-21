<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\BankTransfer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BankController extends Controller
{
    // Save bank account
    public function saveAccount(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_number' => 'required|string|min:9|max:18',
            'ifsc_code' => 'required|string|size:11',
            'account_holder' => 'required|string',
            'bank_name' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $account = BankAccount::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'account_number' => $request->account_number,
                'ifsc_code' => strtoupper($request->ifsc_code),
                'account_holder' => $request->account_holder,
                'bank_name' => $request->bank_name,
            ]
        );

        return response()->json([
            'status' => true,
            'message' => 'Bank account saved',
            'account' => $account
        ]);
    }

    // Get saved bank account
    public function getAccount(Request $request)
    {
        $account = BankAccount::where('user_id', $request->user()->id)->first();

        return response()->json([
            'status' => true,
            'account' => $account
        ]);
    }

    // Bank transfer
    public function transfer(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_number' => 'required|string',
            'ifsc_code' => 'required|string',
            'receiver_name' => 'required|string',
            'amount' => 'required|numeric|min:1|max:500000',
            'note' => 'nullable|string',
            'is_self_transfer' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $sender = $request->user();
        $wallet = $sender->wallet;

        if (!$wallet->hasSufficientBalance($request->amount)) {
            return response()->json([
                'status' => false,
                'message' => 'Insufficient balance'
            ], 400);
        }

        // Debit wallet
        $wallet->debit($request->amount);

        // Create transfer record
        $transfer = BankTransfer::create([
            'transfer_id' => BankTransfer::generateTransferId(),
            'sender_id' => $sender->id,
            'receiver_account_number' => $request->account_number,
            'receiver_ifsc_code' => strtoupper($request->ifsc_code),
            'receiver_name' => $request->receiver_name,
            'amount' => $request->amount,
            'note' => $request->note,
            'is_self_transfer' => $request->is_self_transfer ?? false,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Bank transfer successful',
            'transfer' => $transfer,
            'new_balance' => $wallet->fresh()->balance,
        ]);
    }

    // Transfer history
    public function history(Request $request)
    {
        $transfers = BankTransfer::where('sender_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'status' => true,
            'transfers' => $transfers
        ]);
    }
}

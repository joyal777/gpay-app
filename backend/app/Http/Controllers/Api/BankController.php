<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\BankTransfer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class BankController extends Controller
{
    // Get all accounts for user
    public function getAccounts(Request $request)
    {
        $accounts = BankAccount::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->orderBy('is_default', 'desc')
            ->get();

        return response()->json([
            'status' => true,
            'accounts' => $accounts
        ]);
    }

    // Get single account (for backward compatibility)
    public function getAccount(Request $request)
    {
        $account = BankAccount::where('user_id', $request->user()->id)
            ->where('is_default', true)
            ->first();

        return response()->json([
            'status' => true,
            'account' => $account
        ]);
    }

    // Add new bank account
    public function saveAccount(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_number' => 'required|string|min:9|max:18',
            'ifsc_code' => 'required|string|size:11',
            'account_holder' => 'required|string',
            'bank_name' => 'nullable|string',
            'account_pin' => 'required|digits:4',
            'initial_balance' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Check duplicate account
        $exists = BankAccount::where('user_id', $request->user()->id)
            ->where('account_number', $request->account_number)
            ->exists();

        if ($exists) {
            return response()->json([
                'status' => false,
                'message' => 'This account number already exists'
            ], 422);
        }

        // First account = default
        $count = BankAccount::where('user_id', $request->user()->id)->count();

        $account = BankAccount::create([
            'user_id' => $request->user()->id,
            'account_number' => $request->account_number,
            'ifsc_code' => strtoupper($request->ifsc_code),
            'account_holder' => $request->account_holder,
            'bank_name' => $request->bank_name,
            'account_pin' => Hash::make($request->account_pin),
            'is_default' => $count === 0,
            'balance' => $request->initial_balance ?? 0.00,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Bank account added successfully',
            'upi_id' => $account->upi_id,
            'account' => $this->formatAccount($account)
        ], 201);
    }
    // Set/Update account PIN
public function updatePin(Request $request, $id)
{
    $validator = Validator::make($request->all(), [
        'account_pin' => 'required|digits:4',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'status' => false,
            'errors' => $validator->errors()
        ], 422);
    }

    $account = BankAccount::where('user_id', $request->user()->id)
        ->where('id', $id)->first();

    if (!$account) {
        return response()->json(['status' => false, 'message' => 'Account not found'], 404);
    }

    $account->update([
        'account_pin' => Hash::make($request->account_pin),
    ]);

    return response()->json([
        'status' => true,
        'message' => 'PIN updated successfully'
    ]);
}
    // Set default account
    public function setDefault(Request $request, $id)
    {
        $account = BankAccount::where('user_id', $request->user()->id)
            ->where('id', $id)->first();

        if (!$account) {
            return response()->json(['status' => false, 'message' => 'Account not found'], 404);
        }

        BankAccount::where('user_id', $request->user()->id)
            ->update(['is_default' => false]);

        $account->update(['is_default' => true]);

        return response()->json([
            'status' => true,
            'message' => 'Default account updated'
        ]);
    }

    // Delete account
    public function deleteAccount(Request $request, $id)
    {
        $account = BankAccount::where('user_id', $request->user()->id)
            ->where('id', $id)->first();

        if (!$account) {
            return response()->json(['status' => false, 'message' => 'Account not found'], 404);
        }

        if ($account->is_default) {
            return response()->json([
                'status' => false,
                'message' => 'Set another account as default first before removing'
            ], 400);
        }

        $account->delete();

        return response()->json(['status' => true, 'message' => 'Account removed']);
    }

    // Verify account PIN
    public function verifyPin(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'account_pin' => 'required|digits:4',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $account = BankAccount::where('user_id', $request->user()->id)
            ->where('id', $id)->first();

        if (!$account || !Hash::check($request->account_pin, $account->account_pin)) {
            return response()->json(['status' => false, 'message' => 'Invalid PIN'], 403);
        }

        return response()->json(['status' => true, 'message' => 'PIN verified']);
    }

    // Bank transfer
    // Bank transfer
    public function transfer(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_id' => 'required|exists:bank_accounts,id',
            'to_account_number' => 'required|string',
            'to_ifsc_code' => 'required|string',
            'receiver_name' => 'required|string',
            'amount' => 'required|numeric|min:1|max:500000',
            'note' => 'nullable|string',
            'account_pin' => 'required|digits:4',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $fromAccount = BankAccount::where('user_id', $user->id)
            ->where('id', $request->account_id)->first();

        if (!$fromAccount) {
            return response()->json(['status' => false, 'message' => 'Source account not found'], 404);
        }

        // Verify account PIN
        if (!Hash::check($request->account_pin, $fromAccount->account_pin)) {
            return response()->json(['status' => false, 'message' => 'Invalid account PIN'], 403);
        }

        // Check balance
        if ($fromAccount->balance < $request->amount) {
            return response()->json(['status' => false, 'message' => 'Insufficient balance'], 400);
        }

        // Find receiver's bank account
        $toAccount = BankAccount::where('account_number', $request->to_account_number)
            ->where('ifsc_code', strtoupper($request->to_ifsc_code))
            ->first();

        // Debit from sender
        $fromAccount->decrement('balance', $request->amount);

        // Credit to receiver (if found in our system)
        if ($toAccount) {
            $toAccount->increment('balance', $request->amount);
        }

        // Create transfer record
        $transfer = BankTransfer::create([
            'transfer_id' => BankTransfer::generateTransferId(),
            'sender_id' => $user->id,
            'receiver_account_number' => $request->to_account_number,
            'receiver_ifsc_code' => strtoupper($request->to_ifsc_code),
            'receiver_name' => $request->receiver_name,
            'amount' => $request->amount,
            'note' => $request->note,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Bank transfer successful' . ($toAccount ? '' : ' (External account)'),
            'transfer' => $transfer,
            'new_balance' => $fromAccount->fresh()->balance,
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

    // Hide pin from account response
    private function formatAccount($account)
    {
        return [
            'id' => $account->id,
            'bank_name' => $account->bank_name,
            'account_number' => $account->account_number,
            'account_holder' => $account->account_holder,
            'ifsc_code' => $account->ifsc_code,
            'is_default' => $account->is_default,
            'is_active' => $account->is_active,
        ];
    }
}

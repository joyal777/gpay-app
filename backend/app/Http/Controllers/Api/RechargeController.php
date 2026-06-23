<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MobileRecharge;
use App\Models\RechargePlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RechargeController extends Controller
{
    // Get plans by operator
    public function getPlans(Request $request)
    {
        $operator = $request->get('operator', '');

        $plans = RechargePlan::where('operator', $operator)
            ->where('is_active', true)
            ->orderBy('amount')
            ->get();

        return response()->json([
            'status' => true,
            'plans' => $plans
        ]);
    }

    // Get user's mobile network info
    public function getUserNetwork(Request $request, $userId)
    {
        $user = \App\Models\User::select('id', 'name', 'phone', 'mobile_network', 'mobile_number_recharge')
            ->find($userId);

        if (!$user) {
            return response()->json(['status' => false, 'message' => 'User not found'], 404);
        }

        return response()->json([
            'status' => true,
            'user' => $user
        ]);
    }

    // Save user's network preference
    public function saveNetwork(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mobile_network' => 'required|string|in:airtel,jio,vi,bsnl',
            'mobile_number_recharge' => 'required|string|min:10|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $user->update([
            'mobile_network' => $request->mobile_network,
            'mobile_number_recharge' => $request->mobile_number_recharge,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Network preference saved',
            'user' => $user
        ]);
    }

    // Process recharge
    public function recharge(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mobile_number' => 'required|string|min:10|max:10',
            'operator' => 'required|string|in:airtel,jio,vi,bsnl',
            'plan_id' => 'required|exists:recharge_plans,id',
            'amount' => 'required|numeric|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $plan = RechargePlan::find($request->plan_id);

        // Check wallet balance
        $wallet = $user->wallet;
        if (!$wallet->hasSufficientBalance($request->amount)) {
            return response()->json(['status' => false, 'message' => 'Insufficient balance'], 400);
        }

        // Debit wallet
        $wallet->debit($request->amount);

        // Create invoice
        $invoice = [
            'recharge_id' => MobileRecharge::generateRechargeId(),
            'mobile_number' => $request->mobile_number,
            'operator' => strtoupper($request->operator),
            'plan_name' => $plan->plan_name,
            'amount' => $plan->amount,
            'data_limit' => $plan->data_limit,
            'validity' => $plan->validity,
            'date' => now()->format('d M Y, h:i A'),
            'status' => 'Successful',
        ];

        // Create recharge record
        $recharge = MobileRecharge::create([
            'recharge_id' => $invoice['recharge_id'],
            'sender_id' => $user->id,
            'mobile_number' => $request->mobile_number,
            'operator' => $request->operator,
            'plan_id' => $plan->id,
            'amount' => $plan->amount,
            'status' => 'completed',
            'invoice_details' => json_encode($invoice),
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Recharge successful!',
            'invoice' => $invoice,
            'recharge' => $recharge,
            'new_balance' => $wallet->fresh()->balance,
        ]);
    }

    // Get recharge history
    public function history(Request $request)
    {
        $recharges = MobileRecharge::where('sender_id', $request->user()->id)
            ->with('plan')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'status' => true,
            'recharges' => $recharges
        ]);
    }

    // Get invoice details
    public function invoice(Request $request, $id)
    {
        $recharge = MobileRecharge::findOrFail($id);

        return response()->json([
            'status' => true,
            'invoice' => json_decode($recharge->invoice_details),
        ]);
    }
}

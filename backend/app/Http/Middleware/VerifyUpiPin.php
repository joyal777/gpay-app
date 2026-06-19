<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class VerifyUpiPin
{
    public function handle(Request $request, Closure $next)
    {
        // Only check if route involves payment
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // If user hasn't set UPI PIN, skip verification (they need to set it first)
        if (!$user->upi_pin) {
            return response()->json([
                'status' => false,
                'message' => 'Please set your UPI PIN first',
                'code' => 'PIN_NOT_SET'
            ], 403);
        }

        // Check for PIN in request
        $pin = $request->header('X-UPI-PIN') ?? $request->input('upi_pin');

        if (!$pin) {
            return response()->json([
                'status' => false,
                'message' => 'UPI PIN is required for payments',
                'code' => 'PIN_REQUIRED'
            ], 403);
        }

        // Verify PIN
        if (!Hash::check($pin, $user->upi_pin)) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid UPI PIN',
                'code' => 'INVALID_PIN'
            ], 403);
        }

        // PIN verified, proceed with request
        return $next($request);
    }
}

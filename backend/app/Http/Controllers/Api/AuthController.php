<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|unique:users,phone|max:15',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Generate UPI ID like GPay
        $namePart = strtolower(Str::slug($request->name, ''));
        $phonePart = substr($request->phone, -4);
        $upiId = $namePart . $phonePart . '@okaxis';

        // Create user
        $user = User::create([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'upi_id' => $upiId,
        ]);

        // Create wallet with initial balance
        Wallet::create([
            'user_id' => $user->id,
            'upi_id' => $upiId,
            'balance' => 1000.00, // Welcome bonus
            'is_active' => true,
        ]);

        // Generate token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Registration successful! Welcome bonus of ₹1,000 added.',
            'token' => $token,
            'user' => $user->load('wallet')
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('phone', $request->phone)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid phone number or password'
            ], 401);
        }

        // Revoke old tokens
        $user->tokens()->delete();

        // Create new token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user->load('wallet')
        ], 200);
    }
    public function setUpiPin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'upi_pin' => 'required|digits:4|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $user->upi_pin = Hash::make($request->upi_pin);
        $user->save();

        return response()->json([
            'status' => true,
            'message' => 'UPI PIN set successfully'
        ]);
    }

    public function verifyUpiPin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'upi_pin' => 'required|digits:4|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        if (!$user->upi_pin || !Hash::check($request->upi_pin, $user->upi_pin)) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid UPI PIN'
            ], 401);
        }

        return response()->json([
            'status' => true,
            'message' => 'PIN verified'
        ]);
    }

    public function profile(Request $request)
    {
        $user = $request->user()->load(['wallet', 'beneficiaries']);

        return response()->json([
            'status' => true,
            'message' => 'Profile fetched successfully',
            'user' => $user
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $request->user()->id,
            'profile_pic' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $user->update($request->only(['name', 'email', 'profile_pic']));

        return response()->json([
            'status' => true,
            'message' => 'Profile updated successfully',
            'user' => $user->fresh(['wallet', 'beneficiaries'])
        ]);
    }

    public function updateProfilePic(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'profile_pic' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        // Delete old profile pic if exists
        if ($user->profile_pic) {
            $oldPath = str_replace('/storage/', '', $user->profile_pic);
            Storage::disk('public')->delete($oldPath);
        }

        // Upload new image
        $path = $request->file('profile_pic')->store('profile-pics', 'public');
        $url = '/storage/' . $path;

        $user->update(['profile_pic' => $url]);

        return response()->json([
            'status' => true,
            'message' => 'Profile picture updated',
            'user' => $user->fresh(['wallet'])
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => true,
            'message' => 'Logged out successfully'
        ]);
    }
}

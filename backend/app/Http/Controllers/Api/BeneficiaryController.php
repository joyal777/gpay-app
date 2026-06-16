<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Beneficiary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BeneficiaryController extends Controller
{
    // List all beneficiaries
    public function index(Request $request)
    {
        $beneficiaries = $request->user()->beneficiaries()->latest()->get();

        return response()->json([
            'status' => true,
            'message' => 'Beneficiaries fetched',
            'data' => $beneficiaries
        ]);
    }

    // Add beneficiary
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'upi_id' => 'required|string',
            'phone' => 'nullable|string|max:15',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        $beneficiary = $request->user()->beneficiaries()->create([
            'name' => $request->name,
            'upi_id' => $request->upi_id,
            'phone' => $request->phone,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Beneficiary added',
            'data' => $beneficiary
        ], 201);
    }

    // Delete beneficiary
    public function destroy($id)
    {
        $beneficiary = Beneficiary::findOrFail($id);

        if ($beneficiary->user_id !== request()->user()->id) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $beneficiary->delete();

        return response()->json([
            'status' => true,
            'message' => 'Beneficiary removed'
        ]);
    }
}

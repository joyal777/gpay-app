<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->get('q', '');
        $currentUserId = $request->user()->id;

        if (strlen($query) < 1) {
            return response()->json([
                'status' => true,
                'users' => []
            ]);
        }

        $users = User::where('id', '!=', $currentUserId)
            ->where(function ($q) use ($query) {
                $q->where('name', 'ILIKE', "%{$query}%")
                  ->orWhere('phone', 'ILIKE', "%{$query}%")
                  ->orWhere('upi_id', 'ILIKE', "%{$query}%");
            })
            ->select('id', 'name', 'phone', 'upi_id', 'profile_pic')
            ->limit(10)
            ->get();

        return response()->json([
            'status' => true,
            'users' => $users
        ]);
    }
}

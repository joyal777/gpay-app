<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChatController extends Controller
{
    // Get all chat users (people you've messaged)
    public function chatUsers(Request $request)
    {
        $userId = $request->user()->id;

        // Get unique users you've chatted with
        $chatUserIds = Message::where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->selectRaw('
                CASE
                    WHEN sender_id = ? THEN receiver_id
                    ELSE sender_id
                END as chat_user_id
            ', [$userId])
            ->groupBy('chat_user_id')
            ->pluck('chat_user_id');

        $chatUsers = User::whereIn('id', $chatUserIds)
            ->select('id', 'name', 'phone', 'upi_id', 'profile_pic')
            ->get()
            ->map(function ($user) use ($userId) {
                $lastMessage = Message::where(function ($q) use ($userId, $user) {
                    $q->where('sender_id', $userId)->where('receiver_id', $user->id);
                })->orWhere(function ($q) use ($userId, $user) {
                    $q->where('sender_id', $user->id)->where('receiver_id', $userId);
                })->latest()->first();

                $user->last_message = $lastMessage;
                return $user;
            });

        return response()->json([
            'status' => true,
            'users' => $chatUsers
        ]);
    }

    // Get chat with specific user
    public function getChat(Request $request, $userId)
    {
        $currentUserId = $request->user()->id;

        $messages = Message::where(function ($q) use ($currentUserId, $userId) {
            $q->where('sender_id', $currentUserId)
              ->where('receiver_id', $userId);
        })->orWhere(function ($q) use ($currentUserId, $userId) {
            $q->where('sender_id', $userId)
              ->where('receiver_id', $currentUserId);
        })->with(['sender:id,name,profile_pic', 'receiver:id,name,profile_pic'])
        ->orderBy('created_at', 'asc')
        ->get();

        $chatUser = User::select('id', 'name', 'phone', 'upi_id', 'profile_pic')
            ->find($userId);

        return response()->json([
            'status' => true,
            'chat_user' => $chatUser,
            'messages' => $messages
        ]);
    }

    // Send message
    public function sendMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required_without:amount|string|nullable',
            'amount' => 'required_without:message|numeric|min:1|nullable',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $request->receiver_id,
            'message' => $request->message,
            'amount' => $request->amount,
            'type' => $request->amount ? 'payment' : 'text',
        ]);

        return response()->json([
            'status' => true,
            'message' => $message->load(['sender', 'receiver'])
        ], 201);
    }
}

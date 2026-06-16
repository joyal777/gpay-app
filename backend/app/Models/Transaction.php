<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'sender_id',
        'receiver_id',
        'amount',
        'type',
        'status',
        'note',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    // Relationships
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    // Generate unique transaction ID
    public static function generateTransactionId()
    {
        return 'GPAY' . date('Ymd') . strtoupper(uniqid());
    }
}

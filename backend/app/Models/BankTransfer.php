<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BankTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_id', 'sender_id', 'receiver_account_number',
        'receiver_ifsc_code', 'receiver_name', 'amount',
        'note', 'status', 'type', 'is_self_transfer'
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public static function generateTransferId()
    {
        return 'BANK' . date('Ymd') . strtoupper(uniqid());
    }
}

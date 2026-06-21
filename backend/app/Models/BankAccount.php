<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'account_number', 'ifsc_code',
        'bank_name', 'account_holder', 'is_verified',
        'is_default', 'is_active', 'account_pin',
    ];

    protected $hidden = ['account_pin'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

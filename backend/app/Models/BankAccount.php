<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
class BankAccount extends Model
{
    use HasFactory;

    protected $fillable = [
    'user_id', 'account_number', 'ifsc_code',
    'bank_name', 'account_holder', 'upi_id',
    'is_verified', 'is_default', 'is_active',
    'account_pin', 'balance',
];

protected $hidden = ['account_pin'];

protected $casts = [
    'balance' => 'decimal:2',
    'is_default' => 'boolean',
    'is_active' => 'boolean',
];

// Generate UPI ID when account is created
public static function boot()
{
    parent::boot();
    static::creating(function ($account) {
        if (!$account->upi_id) {
            $name = strtolower(Str::slug($account->account_holder, ''));
            $bank = strtolower(Str::slug($account->bank_name ?: 'bank', ''));
            $account->upi_id = $name . '@' . $bank;
        }
    });
}
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

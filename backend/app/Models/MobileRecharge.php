<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MobileRecharge extends Model
{
    use HasFactory;

    protected $fillable = [
        'recharge_id', 'sender_id', 'mobile_number',
        'operator', 'plan_id', 'amount', 'status', 'invoice_details'
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function plan()
    {
        return $this->belongsTo(RechargePlan::class, 'plan_id');
    }

    public static function generateRechargeId()
    {
        return 'RCH' . date('Ymd') . strtoupper(uniqid());
    }
}

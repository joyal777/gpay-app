<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RechargePlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'operator', 'plan_name', 'amount', 'data_limit',
        'validity', 'type', 'description', 'is_active'
    ];
}

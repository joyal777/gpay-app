<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SIM/Network info for each user
        Schema::table('users', function (Blueprint $table) {
            $table->string('mobile_network')->nullable()->after('phone'); // airtel, jio, vi, bsnl
            $table->string('mobile_number_recharge')->nullable()->after('mobile_network');
        });

        // Recharge plans
        Schema::create('recharge_plans', function (Blueprint $table) {
            $table->id();
            $table->string('operator'); // airtel, jio, vi, bsnl
            $table->string('plan_name');
            $table->decimal('amount', 10, 2);
            $table->string('data_limit')->nullable(); // 1GB/day, 2GB/day, Unlimited
            $table->string('validity'); // 28 days, 84 days
            $table->string('type')->default('prepaid'); // prepaid, postpaid
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Recharge history
        Schema::create('mobile_recharges', function (Blueprint $table) {
            $table->id();
            $table->string('recharge_id')->unique();
            $table->foreignId('sender_id')->constrained('users');
            $table->string('mobile_number');
            $table->string('operator');
            $table->foreignId('plan_id')->nullable()->constrained('recharge_plans');
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('completed');
            $table->text('invoice_details')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['mobile_network', 'mobile_number_recharge']);
        });
        Schema::dropIfExists('mobile_recharges');
        Schema::dropIfExists('recharge_plans');
    }
};

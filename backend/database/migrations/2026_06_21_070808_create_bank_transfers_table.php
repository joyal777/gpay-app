<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('account_number');
            $table->string('ifsc_code');
            $table->string('bank_name')->nullable();
            $table->string('account_holder')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
        });

        Schema::create('bank_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_id')->unique();
            $table->foreignId('sender_id')->constrained('users');
            $table->string('receiver_account_number');
            $table->string('receiver_ifsc_code');
            $table->string('receiver_name');
            $table->decimal('amount', 15, 2);
            $table->string('note')->nullable();
            $table->string('status')->default('completed');
            $table->string('type')->default('imps'); // imps, neft, rtgs
            $table->boolean('is_self_transfer')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_transfers');
        Schema::dropIfExists('bank_accounts');
    }
};

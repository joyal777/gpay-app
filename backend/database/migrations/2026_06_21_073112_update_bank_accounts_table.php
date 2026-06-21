<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add is_default and is_active to bank_accounts
        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->boolean('is_default')->default(false)->after('is_verified');
            $table->boolean('is_active')->default(true)->after('is_default');
            $table->string('account_pin')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->dropColumn(['is_default', 'is_active', 'account_pin']);
        });
    }
};

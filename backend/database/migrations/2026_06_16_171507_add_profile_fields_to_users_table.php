<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->unique()->after('email');
            $table->string('profile_pic')->nullable()->after('phone');
            $table->string('upi_id')->unique()->nullable()->after('profile_pic');
            $table->string('qr_code')->nullable()->after('upi_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'profile_pic', 'upi_id', 'qr_code']);
        });
    }
};

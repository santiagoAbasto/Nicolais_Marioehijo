<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_access_requests', function (Blueprint $table): void {
            if (! Schema::hasColumn('client_access_requests', 'last_plain_password')) {
                $table->text('last_plain_password')->nullable()->after('last_credentials_sent_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('client_access_requests', function (Blueprint $table): void {
            if (Schema::hasColumn('client_access_requests', 'last_plain_password')) {
                $table->dropColumn('last_plain_password');
            }
        });
    }
};

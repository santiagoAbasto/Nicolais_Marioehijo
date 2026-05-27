<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_access_requests', function (Blueprint $table): void {
            if (! Schema::hasColumn('client_access_requests', 'deactivated_at')) {
                $table->timestamp('deactivated_at')->nullable()->after('rejected_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('client_access_requests', function (Blueprint $table): void {
            if (Schema::hasColumn('client_access_requests', 'deactivated_at')) {
                $table->dropColumn('deactivated_at');
            }
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_price_list_files', function (Blueprint $table): void {
            $table->string('sort_code', 20)->default('A')->after('sort_order')->index();
        });
    }

    public function down(): void
    {
        Schema::table('client_price_list_files', function (Blueprint $table): void {
            $table->dropIndex(['sort_code']);
            $table->dropColumn('sort_code');
        });
    }
};

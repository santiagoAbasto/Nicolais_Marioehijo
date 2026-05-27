<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('footer_settings', function (Blueprint $table): void {
            if (! Schema::hasColumn('footer_settings', 'phone_tertiary')) {
                $table->string('phone_tertiary')->nullable()->after('phone_secondary');
            }
        });
    }

    public function down(): void
    {
        Schema::table('footer_settings', function (Blueprint $table): void {
            if (Schema::hasColumn('footer_settings', 'phone_tertiary')) {
                $table->dropColumn('phone_tertiary');
            }
        });
    }
};

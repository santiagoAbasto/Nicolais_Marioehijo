<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('footer_settings', function (Blueprint $table): void {
            $table->string('contact_hours')->nullable()->after('contact_address');
        });

        DB::table('footer_settings')
            ->whereNull('contact_hours')
            ->update([
                'contact_hours' => 'Lu a Vi de 10:00 - 13:30 / 14:00 - 17:30 hs',
            ]);
    }

    public function down(): void
    {
        Schema::table('footer_settings', function (Blueprint $table): void {
            $table->dropColumn('contact_hours');
        });
    }
};

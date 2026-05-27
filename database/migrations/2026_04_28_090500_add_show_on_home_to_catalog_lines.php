<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catalog_lines', function (Blueprint $table): void {
            $table->boolean('show_on_home')->default(false);
        });

        $homeVisibleLineIds = DB::table('catalog_lines')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->limit(6)
            ->pluck('id');

        DB::table('catalog_lines')->update(['show_on_home' => false]);

        if ($homeVisibleLineIds->isNotEmpty()) {
            DB::table('catalog_lines')
                ->whereIn('id', $homeVisibleLineIds)
                ->update(['show_on_home' => true]);
        }
    }

    public function down(): void
    {
        Schema::table('catalog_lines', function (Blueprint $table): void {
            $table->dropColumn('show_on_home');
        });
    }
};

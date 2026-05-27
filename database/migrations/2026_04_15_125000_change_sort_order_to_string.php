<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'catalog_families',
            'catalog_lines',
            'catalog_series',
            'catalog_grades',
        ];

        foreach ($tables as $t) {
            Schema::table($t, function (Blueprint $table) {
                $table->string('sort_order', 20)->default('')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'catalog_families',
            'catalog_lines',
            'catalog_series',
            'catalog_grades',
        ];

        foreach ($tables as $t) {
            Schema::table($t, function (Blueprint $table) {
                // Warning: Potential data loss if strings are present.
                $table->unsignedInteger('sort_order')->default(1)->change();
            });
        }
    }
};

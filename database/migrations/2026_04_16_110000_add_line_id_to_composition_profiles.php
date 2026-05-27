<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('catalog_composition_profiles', function (Blueprint $table) {
            $table->foreignId('catalog_line_id')
                ->nullable()
                ->after('id')
                ->constrained('catalog_lines')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('catalog_composition_profiles', function (Blueprint $table) {
            $table->dropForeign(['catalog_line_id']);
            $table->dropColumn('catalog_line_id');
        });
    }
};

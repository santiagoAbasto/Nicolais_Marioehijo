<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('catalog_chemical_elements', function (Blueprint $table) {
            $table->boolean('is_base_element')->default(false)->after('display_color');
        });
    }

    public function down(): void
    {
        Schema::table('catalog_chemical_elements', function (Blueprint $table) {
            $table->dropColumn('is_base_element');
        });
    }
};

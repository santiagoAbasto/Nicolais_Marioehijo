<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('catalog_staging_products') && ! Schema::hasColumn('catalog_staging_products', 'no_publicar')) {
            Schema::table('catalog_staging_products', function (Blueprint $table): void {
                $table->string('no_publicar')->nullable()->after('oferta');
            });
        }

        if (Schema::hasTable('catalog_product_variants') && ! Schema::hasColumn('catalog_product_variants', 'is_public_visible')) {
            Schema::table('catalog_product_variants', function (Blueprint $table): void {
                $table->boolean('is_public_visible')->default(true)->after('is_active');
                $table->index(['catalog_grade_product_id', 'is_active', 'is_public_visible'], 'cpv_grade_active_public_idx');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('catalog_product_variants') && Schema::hasColumn('catalog_product_variants', 'is_public_visible')) {
            Schema::table('catalog_product_variants', function (Blueprint $table): void {
                $table->dropIndex('cpv_grade_active_public_idx');
                $table->dropColumn('is_public_visible');
            });
        }

        if (Schema::hasTable('catalog_staging_products') && Schema::hasColumn('catalog_staging_products', 'no_publicar')) {
            Schema::table('catalog_staging_products', function (Blueprint $table): void {
                $table->dropColumn('no_publicar');
            });
        }
    }
};

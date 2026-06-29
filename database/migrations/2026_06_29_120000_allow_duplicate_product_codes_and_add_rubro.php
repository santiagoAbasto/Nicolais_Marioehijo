<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            if (! Schema::hasColumn('products', 'rubro')) {
                $table->string('rubro')->nullable()->after('brand_logo_media_id')->index();
            }
        });

        try {
            Schema::table('products', function (Blueprint $table): void {
                $table->dropUnique('products_sku_unique');
            });
        } catch (Throwable) {
            // The index may already have been removed on older deployments.
        }

        try {
            Schema::table('products', function (Blueprint $table): void {
                $table->index('sku', 'products_sku_index');
            });
        } catch (Throwable) {
            // Keep migration idempotent across cPanel/manual deploys.
        }
    }

    public function down(): void
    {
        try {
            Schema::table('products', function (Blueprint $table): void {
                $table->dropIndex('products_sku_index');
            });
        } catch (Throwable) {
            //
        }

        try {
            DB::statement('ALTER TABLE products ADD UNIQUE products_sku_unique (sku)');
        } catch (Throwable) {
            //
        }

        Schema::table('products', function (Blueprint $table): void {
            if (Schema::hasColumn('products', 'rubro')) {
                $table->dropColumn('rubro');
            }
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('catalog_offer_cards')) {
            if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
                DB::statement("ALTER TABLE catalog_offer_cards MODIFY sort_order VARCHAR(20) NOT NULL DEFAULT 'A'");
                DB::statement("UPDATE catalog_offer_cards SET sort_order = 'A' WHERE sort_order IS NULL OR sort_order = '' OR sort_order REGEXP '^[0-9]+$'");
            }
        }

        if (! Schema::hasTable('catalog_offer_card_product_variant')) {
            Schema::create('catalog_offer_card_product_variant', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('catalog_offer_card_id');
                $table->unsignedBigInteger('catalog_product_variant_id');
                $table->unsignedInteger('sort_order')->default(1);
                $table->timestamps();

                $table->foreign('catalog_offer_card_id', 'cocpv_offer_fk')
                    ->references('id')
                    ->on('catalog_offer_cards')
                    ->cascadeOnDelete();
                $table->foreign('catalog_product_variant_id', 'cocpv_variant_fk')
                    ->references('id')
                    ->on('catalog_product_variants')
                    ->cascadeOnDelete();
                $table->unique(['catalog_offer_card_id', 'catalog_product_variant_id'], 'cocpv_offer_variant_uq');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_offer_card_product_variant');

        if (Schema::hasTable('catalog_offer_cards')) {
            if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
                DB::statement('ALTER TABLE catalog_offer_cards MODIFY sort_order INT UNSIGNED NOT NULL DEFAULT 1');
            }
        }
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('catalog_offer_cards')) {
            Schema::create('catalog_offer_cards', function (Blueprint $table): void {
                $table->id();
                $table->string('title');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->string('badge_text', 50)->nullable();
                $table->foreignId('media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->string('sort_order', 20)->default('A');
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['is_active', 'sort_order'], 'coc_active_sort_idx');
            });
        }

        if (! Schema::hasTable('catalog_offer_card_grade_product')) {
            Schema::create('catalog_offer_card_grade_product', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('catalog_offer_card_id');
                $table->unsignedBigInteger('catalog_grade_product_id');
                $table->unsignedInteger('sort_order')->default(1);
                $table->timestamps();

                $table->foreign('catalog_offer_card_id', 'cocgp_offer_fk')
                    ->references('id')
                    ->on('catalog_offer_cards')
                    ->cascadeOnDelete();
                $table->foreign('catalog_grade_product_id', 'cocgp_grade_product_fk')
                    ->references('id')
                    ->on('catalog_grade_products')
                    ->cascadeOnDelete();
                $table->unique(['catalog_offer_card_id', 'catalog_grade_product_id'], 'cocgp_offer_product_uq');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_offer_card_grade_product');
        Schema::dropIfExists('catalog_offer_cards');
    }
};

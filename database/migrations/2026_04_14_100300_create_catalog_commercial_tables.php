<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('catalog_shape_families')) {
            Schema::create('catalog_shape_families', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->unsignedInteger('sort_order')->default(1);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('catalog_shapes')) {
            Schema::create('catalog_shapes', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_shape_family_id')->nullable()->constrained('catalog_shape_families')->nullOnDelete();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->string('formula_type', 100)->nullable();
                $table->boolean('is_calculable')->default(false);
                $table->unsignedInteger('sort_order')->default(1);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('catalog_shape_formula_fields')) {
            Schema::create('catalog_shape_formula_fields', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_shape_id')->constrained('catalog_shapes')->cascadeOnDelete();
                $table->string('field_key', 100);
                $table->string('label');
                $table->string('input_type', 50)->default('number');
                $table->string('unit_group', 50)->nullable();
                $table->string('default_unit', 50)->nullable();
                $table->boolean('is_required')->default(true);
                $table->unsignedInteger('sort_order')->default(1);
                $table->timestamps();

                $table->unique(['catalog_shape_id', 'field_key'], 'csff_shape_field_uq');
            });
        }

        if (! Schema::hasTable('catalog_shape_formula_rules')) {
            Schema::create('catalog_shape_formula_rules', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_shape_id')->constrained('catalog_shapes')->cascadeOnDelete();
                $table->string('formula_code', 100);
                $table->text('formula_description')->nullable();
                $table->string('result_unit', 50)->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['catalog_shape_id', 'formula_code'], 'csfr_shape_formula_uq');
            });
        }

        if (! Schema::hasTable('catalog_grade_products')) {
            Schema::create('catalog_grade_products', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_grade_id')->constrained('catalog_grades')->cascadeOnDelete();
                $table->foreignId('catalog_shape_id')->constrained('catalog_shapes')->cascadeOnDelete();
                $table->string('display_name')->nullable();
                $table->text('description')->nullable();
                $table->boolean('is_custom_order')->default(false);
                $table->boolean('is_discontinued')->default(false);
                $table->boolean('is_active')->default(true);
                $table->unsignedInteger('sort_order')->default(1);
                $table->timestamps();

                $table->unique(['catalog_grade_id', 'catalog_shape_id'], 'cgp_grade_shape_uq');
            });
        }

        if (! Schema::hasTable('catalog_product_variants')) {
            Schema::create('catalog_product_variants', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_grade_product_id')->constrained('catalog_grade_products')->cascadeOnDelete();
                $table->string('external_product_id')->nullable()->unique();
                $table->string('external_material_id')->nullable()->index();
                $table->string('external_code')->nullable()->index();
                $table->decimal('dimension_numeric', 12, 4)->nullable();
                $table->string('dimension_text')->nullable();
                $table->text('description')->nullable();
                $table->string('stock_status', 100)->nullable();
                $table->boolean('is_custom_order')->default(false);
                $table->boolean('is_offer')->default(false);
                $table->boolean('is_discontinued')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamp('last_imported_at')->nullable();
                $table->timestamps();

                $table->index(['catalog_grade_product_id', 'is_active'], 'cpv_grade_prod_active_idx');
            });
        }

        if (! Schema::hasTable('catalog_product_variant_media')) {
            Schema::create('catalog_product_variant_media', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('catalog_product_variant_id');
                $table->unsignedBigInteger('media_asset_id')->index();
                $table->boolean('is_primary')->default(false);
                $table->unsignedInteger('sort_order')->default(1);
                $table->timestamps();

                $table->foreign('catalog_product_variant_id', 'cpvm_variant_fk')
                    ->references('id')
                    ->on('catalog_product_variants')
                    ->cascadeOnDelete();
                $table->unique(['catalog_product_variant_id', 'media_asset_id'], 'cpvm_variant_media_uq');
            });
        }

        if (! Schema::hasTable('catalog_variant_offers')) {
            Schema::create('catalog_variant_offers', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_product_variant_id')->constrained('catalog_product_variants')->cascadeOnDelete();
                $table->string('title_override')->nullable();
                $table->string('subtitle_override')->nullable();
                $table->string('badge_text', 50)->nullable();
                $table->decimal('discount_percent', 8, 2)->nullable();
                $table->decimal('offer_price', 12, 2)->nullable();
                $table->decimal('original_price', 12, 2)->nullable();
                $table->unsignedBigInteger('hero_media_id')->nullable()->index();
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->unsignedInteger('sort_order')->default(1);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique('catalog_product_variant_id', 'cvo_variant_uq');
            });
        }

        if (! Schema::hasTable('catalog_calculator_logs')) {
            Schema::create('catalog_calculator_logs', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_grade_id')->nullable()->constrained('catalog_grades')->nullOnDelete();
                $table->foreignId('catalog_shape_id')->nullable()->constrained('catalog_shapes')->nullOnDelete();
                $table->json('input_payload')->nullable();
                $table->decimal('density_value', 12, 6)->nullable();
                $table->decimal('volume_value', 14, 6)->nullable();
                $table->decimal('result_weight', 14, 6)->nullable();
                $table->string('result_unit', 50)->nullable();
                $table->string('source', 50)->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_calculator_logs');
        Schema::dropIfExists('catalog_variant_offers');
        Schema::dropIfExists('catalog_product_variant_media');
        Schema::dropIfExists('catalog_product_variants');
        Schema::dropIfExists('catalog_grade_products');
        Schema::dropIfExists('catalog_shape_formula_rules');
        Schema::dropIfExists('catalog_shape_formula_fields');
        Schema::dropIfExists('catalog_shapes');
        Schema::dropIfExists('catalog_shape_families');
    }
};

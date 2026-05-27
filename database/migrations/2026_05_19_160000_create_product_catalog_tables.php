<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('product_families')) {
            Schema::create('product_families', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->foreignId('cover_media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->foreignId('banner_media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->string('accent_color', 20)->nullable();
                $table->string('sort_order', 20)->default('A');
                $table->boolean('is_active')->default(true);
                $table->boolean('show_on_products_page')->default(true);
                $table->boolean('show_on_home')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('product_subfamilies')) {
            Schema::create('product_subfamilies', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_family_id')->constrained('product_families')->cascadeOnDelete();
                $table->string('name');
                $table->string('slug');
                $table->string('short_description')->nullable();
                $table->text('description')->nullable();
                $table->foreignId('cover_media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->string('accent_color', 20)->nullable();
                $table->string('sort_order', 20)->default('A');
                $table->boolean('is_active')->default(true);
                $table->boolean('show_on_home')->default(false);
                $table->boolean('show_on_family_page')->default(true);
                $table->timestamps();

                $table->unique(['product_family_id', 'slug'], 'ps_family_slug_uq');
            });
        }

        if (! Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_family_id')->constrained('product_families')->cascadeOnDelete();
                $table->foreignId('product_subfamily_id')->nullable()->constrained('product_subfamilies')->nullOnDelete();
                $table->string('name');
                $table->string('slug')->unique();
                $table->string('sku')->nullable()->unique();
                $table->string('brand', 80)->nullable();
                $table->foreignId('brand_logo_media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->string('original_code')->nullable();
                $table->string('equivalence_code')->nullable();
                $table->string('oem_code')->nullable();
                $table->decimal('price', 14, 2)->nullable();
                $table->string('short_description')->nullable();
                $table->text('description')->nullable();
                $table->text('applications')->nullable();
                $table->text('material')->nullable();
                $table->text('treatment')->nullable();
                $table->text('observations')->nullable();
                $table->foreignId('main_media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->foreignId('technical_sheet_media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->string('sort_order', 20)->default('A');
                $table->boolean('is_active')->default(true);
                $table->boolean('is_featured_home')->default(false);
                $table->boolean('is_featured_family')->default(false);
                $table->timestamps();

                $table->index(['is_active', 'brand']);
            });
        } else {
            Schema::table('products', function (Blueprint $table): void {
                if (! Schema::hasColumn('products', 'brand')) {
                    $table->string('brand', 80)->nullable()->after('sku');
                }
                if (! Schema::hasColumn('products', 'brand_logo_media_id')) {
                    $table->foreignId('brand_logo_media_id')->nullable()->after('brand')->constrained('media_assets')->nullOnDelete();
                }
                if (! Schema::hasColumn('products', 'original_code')) {
                    $table->string('original_code')->nullable()->after('brand_logo_media_id');
                }
                if (! Schema::hasColumn('products', 'equivalence_code')) {
                    $table->string('equivalence_code')->nullable()->after('original_code');
                }
                if (! Schema::hasColumn('products', 'oem_code')) {
                    $table->string('oem_code')->nullable()->after('equivalence_code');
                }
                if (! Schema::hasColumn('products', 'price')) {
                    $table->decimal('price', 14, 2)->nullable()->after('oem_code');
                }
                if (! Schema::hasColumn('products', 'applications')) {
                    $table->text('applications')->nullable()->after('description');
                }
            });
        }

        if (! Schema::hasTable('product_media')) {
            Schema::create('product_media', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('media_id')->constrained('media_assets')->cascadeOnDelete();
                $table->string('sort_order', 20)->default('A');
                $table->boolean('is_primary')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('product_related')) {
            Schema::create('product_related', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('related_product_id')->constrained('products')->cascadeOnDelete();
                $table->string('sort_order', 20)->default('A');
                $table->timestamps();
                $table->unique(['product_id', 'related_product_id'], 'pr_product_related_uq');
            });
        }

        if (! Schema::hasTable('product_spec_tables')) {
            Schema::create('product_spec_tables', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->string('title')->nullable();
                $table->string('sort_order', 20)->default('A');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('product_spec_columns')) {
            Schema::create('product_spec_columns', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_spec_table_id')->constrained('product_spec_tables')->cascadeOnDelete();
                $table->string('label');
                $table->string('unit')->nullable();
                $table->string('sort_order', 20)->default('A');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('product_spec_rows')) {
            Schema::create('product_spec_rows', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_spec_table_id')->constrained('product_spec_tables')->cascadeOnDelete();
                $table->string('sort_order', 20)->default('A');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('product_spec_values')) {
            Schema::create('product_spec_values', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_spec_row_id')->constrained('product_spec_rows')->cascadeOnDelete();
                $table->foreignId('product_spec_column_id')->constrained('product_spec_columns')->cascadeOnDelete();
                $table->text('value')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_spec_values');
        Schema::dropIfExists('product_spec_rows');
        Schema::dropIfExists('product_spec_columns');
        Schema::dropIfExists('product_spec_tables');
        Schema::dropIfExists('product_related');
        Schema::dropIfExists('product_media');
        Schema::dropIfExists('products');
        Schema::dropIfExists('product_subfamilies');
        Schema::dropIfExists('product_families');
    }
};

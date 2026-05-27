<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('catalog_quote_requests')) {
            Schema::create('catalog_quote_requests', function (Blueprint $table): void {
                $table->id();
                $table->string('full_name');
                $table->string('email');
                $table->string('country', 120)->nullable();
                $table->string('phone', 120)->nullable();
                $table->string('company')->nullable();
                $table->foreignId('catalog_family_id')->nullable()->constrained('catalog_families')->nullOnDelete();
                $table->foreignId('catalog_line_id')->nullable()->constrained('catalog_lines')->nullOnDelete();
                $table->foreignId('catalog_series_id')->nullable()->constrained('catalog_series')->nullOnDelete();
                $table->foreignId('catalog_grade_id')->nullable()->constrained('catalog_grades')->nullOnDelete();
                $table->foreignId('catalog_shape_id')->nullable()->constrained('catalog_shapes')->nullOnDelete();
                $table->foreignId('catalog_product_variant_id')->nullable()->constrained('catalog_product_variants')->nullOnDelete();
                $table->text('dimensions_text')->nullable();
                $table->decimal('quantity', 12, 3)->nullable();
                $table->text('notes')->nullable();
                $table->decimal('calculated_weight', 14, 6)->nullable();
                $table->string('calculated_weight_unit', 50)->nullable();
                $table->string('source', 50)->default('manual');
                $table->string('status', 50)->default('new');
                $table->boolean('is_read')->default(false);
                $table->timestamps();

                $table->index(['status', 'created_at'], 'cqr_status_created_idx');
            });
        }

        if (! Schema::hasTable('catalog_quote_request_items')) {
            Schema::create('catalog_quote_request_items', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_quote_request_id')->constrained('catalog_quote_requests')->cascadeOnDelete();
                $table->foreignId('catalog_grade_id')->nullable()->constrained('catalog_grades')->nullOnDelete();
                $table->foreignId('catalog_shape_id')->nullable()->constrained('catalog_shapes')->nullOnDelete();
                $table->foreignId('catalog_product_variant_id')->nullable()->constrained('catalog_product_variants')->nullOnDelete();
                $table->text('dimensions_text')->nullable();
                $table->decimal('quantity', 12, 3)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('catalog_quote_request_attachments')) {
            Schema::create('catalog_quote_request_attachments', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('catalog_quote_request_id');
                $table->unsignedBigInteger('media_asset_id')->index();
                $table->string('file_name_snapshot')->nullable();
                $table->unsignedInteger('sort_order')->default(1);
                $table->timestamps();

                $table->foreign('catalog_quote_request_id', 'cqra_request_fk')
                    ->references('id')
                    ->on('catalog_quote_requests')
                    ->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('catalog_import_batches')) {
            Schema::create('catalog_import_batches', function (Blueprint $table): void {
                $table->id();
                $table->string('type', 100)->default('products_excel');
                $table->string('file_name');
                $table->string('file_path');
                $table->string('status', 50)->default('uploaded');
                $table->unsignedInteger('total_rows')->default(0);
                $table->unsignedInteger('processed_rows')->default(0);
                $table->unsignedInteger('success_rows')->default(0);
                $table->unsignedInteger('failed_rows')->default(0);
                $table->json('summary_json')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('finished_at')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('catalog_import_batch_errors')) {
            Schema::create('catalog_import_batch_errors', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_import_batch_id')->constrained('catalog_import_batches')->cascadeOnDelete();
                $table->unsignedInteger('row_number')->nullable();
                $table->string('field_name', 120)->nullable();
                $table->text('error_message');
                $table->json('raw_payload')->nullable();
                $table->timestamps();

                $table->index(['catalog_import_batch_id', 'row_number'], 'cibe_batch_row_idx');
            });
        }

        if (! Schema::hasTable('catalog_material_mappings')) {
            Schema::create('catalog_material_mappings', function (Blueprint $table): void {
                $table->id();
                $table->string('external_material_id')->nullable()->unique();
                $table->string('raw_material_name')->nullable();
                $table->string('normalized_material_name')->nullable()->index();
                $table->foreignId('catalog_family_id')->nullable()->constrained('catalog_families')->nullOnDelete();
                $table->foreignId('catalog_line_id')->nullable()->constrained('catalog_lines')->nullOnDelete();
                $table->foreignId('catalog_series_id')->nullable()->constrained('catalog_series')->nullOnDelete();
                $table->foreignId('catalog_grade_id')->nullable()->constrained('catalog_grades')->nullOnDelete();
                $table->boolean('is_active')->default(true);
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('catalog_shape_mappings')) {
            Schema::create('catalog_shape_mappings', function (Blueprint $table): void {
                $table->id();
                $table->string('external_shape_id')->nullable()->unique();
                $table->string('external_shape_family_id')->nullable()->index();
                $table->string('raw_shape_name')->nullable();
                $table->string('normalized_shape_name')->nullable()->index();
                $table->foreignId('catalog_shape_family_id')->nullable()->constrained('catalog_shape_families')->nullOnDelete();
                $table->foreignId('catalog_shape_id')->nullable()->constrained('catalog_shapes')->nullOnDelete();
                $table->boolean('is_active')->default(true);
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('catalog_staging_products')) {
            Schema::create('catalog_staging_products', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('catalog_import_batch_id');
                $table->unsignedInteger('row_number');
                $table->string('id_producto')->nullable();
                $table->string('id_material')->nullable()->index();
                $table->string('cod_num')->nullable();
                $table->string('id_familia_forma')->nullable()->index();
                $table->string('id_forma')->nullable()->index();
                $table->string('familia_forma')->nullable();
                $table->string('dimension')->nullable();
                $table->string('nombre_material')->nullable();
                $table->string('forma')->nullable();
                $table->string('dimensiones')->nullable();
                $table->string('a_pedido')->nullable();
                $table->text('descripcion')->nullable();
                $table->string('oferta')->nullable();
                $table->string('discontinuo')->nullable();
                $table->string('normalized_material_name')->nullable()->index();
                $table->string('normalized_shape_name')->nullable()->index();
                $table->unsignedBigInteger('mapped_catalog_family_id')->nullable();
                $table->unsignedBigInteger('mapped_catalog_line_id')->nullable();
                $table->unsignedBigInteger('mapped_catalog_series_id')->nullable();
                $table->unsignedBigInteger('mapped_catalog_grade_id')->nullable();
                $table->unsignedBigInteger('mapped_catalog_shape_family_id')->nullable();
                $table->unsignedBigInteger('mapped_catalog_shape_id')->nullable();
                $table->string('mapping_status', 50)->default('pending');
                $table->string('validation_status', 50)->default('pending');
                $table->text('mapping_notes')->nullable();
                $table->text('validation_notes')->nullable();
                $table->json('raw_payload')->nullable();
                $table->timestamp('published_at')->nullable();
                $table->timestamps();

                $table->foreign('catalog_import_batch_id', 'csp_batch_fk')->references('id')->on('catalog_import_batches')->cascadeOnDelete();
                $table->foreign('mapped_catalog_family_id', 'csp_mapped_family_fk')->references('id')->on('catalog_families')->nullOnDelete();
                $table->foreign('mapped_catalog_line_id', 'csp_mapped_line_fk')->references('id')->on('catalog_lines')->nullOnDelete();
                $table->foreign('mapped_catalog_series_id', 'csp_mapped_series_fk')->references('id')->on('catalog_series')->nullOnDelete();
                $table->foreign('mapped_catalog_grade_id', 'csp_mapped_grade_fk')->references('id')->on('catalog_grades')->nullOnDelete();
                $table->foreign('mapped_catalog_shape_family_id', 'csp_mapped_shape_family_fk')->references('id')->on('catalog_shape_families')->nullOnDelete();
                $table->foreign('mapped_catalog_shape_id', 'csp_mapped_shape_fk')->references('id')->on('catalog_shapes')->nullOnDelete();

                $table->unique(['catalog_import_batch_id', 'row_number'], 'csp_batch_row_uq');
                $table->index(['catalog_import_batch_id', 'mapping_status'], 'csp_batch_mapping_idx');
                $table->index(['catalog_import_batch_id', 'validation_status'], 'csp_batch_validation_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_staging_products');
        Schema::dropIfExists('catalog_shape_mappings');
        Schema::dropIfExists('catalog_material_mappings');
        Schema::dropIfExists('catalog_import_batch_errors');
        Schema::dropIfExists('catalog_import_batches');
        Schema::dropIfExists('catalog_quote_request_attachments');
        Schema::dropIfExists('catalog_quote_request_items');
        Schema::dropIfExists('catalog_quote_requests');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('catalog_reference_import_runs')) {
            Schema::create('catalog_reference_import_runs', function (Blueprint $table): void {
                $table->id();
                $table->string('file_name');
                $table->string('file_path');
                $table->string('status', 50)->default('processing');
                $table->json('families_json')->nullable();
                $table->json('headings_json')->nullable();
                $table->json('summary_json')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('finished_at')->nullable();
                $table->timestamp('rolled_back_at')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('catalog_reference_import_records')) {
            Schema::create('catalog_reference_import_records', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_reference_import_run_id')
                    ->constrained('catalog_reference_import_runs')
                    ->cascadeOnDelete();
                $table->string('model_type');
                $table->unsignedBigInteger('model_id');
                $table->string('action', 30);
                $table->json('original_attributes')->nullable();
                $table->timestamps();

                $table->unique(
                    ['catalog_reference_import_run_id', 'model_type', 'model_id'],
                    'crir_run_model_unique'
                );
                $table->index(['model_type', 'model_id'], 'crir_model_idx');
            });
        }

        if (! Schema::hasTable('catalog_reference_import_rows')) {
            Schema::create('catalog_reference_import_rows', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('catalog_reference_import_run_id');
                $table->unsignedInteger('row_number');
                $table->string('family_name')->nullable();
                $table->string('subfamily_name')->nullable();
                $table->string('product_name')->nullable();
                $table->json('row_payload');
                $table->timestamps();

                $table->foreign('catalog_reference_import_run_id', 'crir_rows_run_fk')
                    ->references('id')
                    ->on('catalog_reference_import_runs')
                    ->cascadeOnDelete();
                $table->index(['catalog_reference_import_run_id', 'row_number'], 'crirw_run_row_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_reference_import_rows');
        Schema::dropIfExists('catalog_reference_import_records');
        Schema::dropIfExists('catalog_reference_import_runs');
    }
};

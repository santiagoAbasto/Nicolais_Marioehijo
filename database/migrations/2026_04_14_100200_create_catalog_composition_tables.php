<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('catalog_chemical_elements')) {
            Schema::create('catalog_chemical_elements', function (Blueprint $table): void {
                $table->id();
                $table->string('symbol', 20)->unique();
                $table->string('name');
                $table->string('display_color', 20)->nullable();
                $table->unsignedInteger('sort_order')->default(1);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('catalog_composition_profiles')) {
            Schema::create('catalog_composition_profiles', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('catalog_series_id')->nullable();
                $table->unsignedBigInteger('catalog_grade_id')->nullable();
                $table->string('title');
                $table->string('subtitle')->nullable();
                $table->unsignedInteger('sort_order')->default(1);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('catalog_series_id', 'ccp_series_fk')->references('id')->on('catalog_series')->nullOnDelete();
                $table->foreign('catalog_grade_id', 'ccp_grade_fk')->references('id')->on('catalog_grades')->nullOnDelete();
                $table->index(['catalog_series_id', 'catalog_grade_id'], 'ccp_owner_idx');
            });
        }

        if (! Schema::hasTable('catalog_composition_standards')) {
            Schema::create('catalog_composition_standards', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('catalog_composition_profile_id');
                $table->string('label');
                $table->string('subtitle')->nullable();
                $table->unsignedInteger('sort_order')->default(1);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('catalog_composition_profile_id', 'ccs_profile_fk')
                    ->references('id')
                    ->on('catalog_composition_profiles')
                    ->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('catalog_composition_standard_items')) {
            Schema::create('catalog_composition_standard_items', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('catalog_composition_standard_id');
                $table->unsignedBigInteger('catalog_chemical_element_id');
                $table->string('display_label', 50)->nullable();
                $table->decimal('min_percent', 8, 4)->nullable();
                $table->decimal('max_percent', 8, 4)->nullable();
                $table->decimal('nominal_percent', 8, 4)->nullable();
                $table->decimal('display_percent', 8, 4)->nullable();
                $table->unsignedInteger('sort_order')->default(1);
                $table->timestamps();

                $table->foreign('catalog_composition_standard_id', 'ccsi_standard_fk')
                    ->references('id')
                    ->on('catalog_composition_standards')
                    ->cascadeOnDelete();
                $table->foreign('catalog_chemical_element_id', 'ccsi_element_fk')
                    ->references('id')
                    ->on('catalog_chemical_elements')
                    ->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_composition_standard_items');
        Schema::dropIfExists('catalog_composition_standards');
        Schema::dropIfExists('catalog_composition_profiles');
        Schema::dropIfExists('catalog_chemical_elements');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('catalog_grade_feature_items')) {
            Schema::create('catalog_grade_feature_items', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_grade_id')->constrained('catalog_grades')->cascadeOnDelete();
                $table->text('text');
                $table->unsignedInteger('sort_order')->default(1);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('catalog_grade_content_sections')) {
            Schema::create('catalog_grade_content_sections', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_grade_id')->constrained('catalog_grades')->cascadeOnDelete();
                $table->string('section_key', 100);
                $table->string('title')->nullable();
                $table->longText('content')->nullable();
                $table->unsignedInteger('sort_order')->default(1);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['catalog_grade_id', 'section_key'], 'cgcs_grade_section_idx');
            });
        }

        if (! Schema::hasTable('catalog_series_content_sections')) {
            Schema::create('catalog_series_content_sections', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_series_id')->constrained('catalog_series')->cascadeOnDelete();
                $table->string('section_key', 100);
                $table->string('title')->nullable();
                $table->longText('content')->nullable();
                $table->unsignedInteger('sort_order')->default(1);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['catalog_series_id', 'section_key'], 'cscs_series_section_idx');
            });
        }

        if (! Schema::hasTable('catalog_grade_properties')) {
            Schema::create('catalog_grade_properties', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_grade_id')->constrained('catalog_grades')->cascadeOnDelete();
                $table->string('group_name')->nullable();
                $table->string('name');
                $table->string('value_text');
                $table->string('unit', 50)->nullable();
                $table->unsignedInteger('sort_order')->default(1);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('catalog_grade_standards')) {
            Schema::create('catalog_grade_standards', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('catalog_grade_id')->constrained('catalog_grades')->cascadeOnDelete();
                $table->string('code');
                $table->string('title')->nullable();
                $table->text('description')->nullable();
                $table->unsignedInteger('sort_order')->default(1);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_grade_standards');
        Schema::dropIfExists('catalog_grade_properties');
        Schema::dropIfExists('catalog_series_content_sections');
        Schema::dropIfExists('catalog_grade_content_sections');
        Schema::dropIfExists('catalog_grade_feature_items');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_families', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('intro_title')->nullable();
            $table->text('intro_text')->nullable();
            $table->unsignedBigInteger('hero_media_id')->nullable()->index();
            $table->unsignedInteger('sort_order')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('catalog_lines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('catalog_family_id')->constrained('catalog_families')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('intro_title')->nullable();
            $table->text('intro_text')->nullable();
            $table->json('search_keywords')->nullable();
            $table->unsignedBigInteger('hero_media_id')->nullable()->index();
            $table->unsignedInteger('sort_order')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['catalog_family_id', 'slug'], 'cl_family_slug_uq');
        });

        Schema::create('catalog_series', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('catalog_line_id')->constrained('catalog_lines')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('intro_title')->nullable();
            $table->text('intro_text')->nullable();
            $table->json('search_keywords')->nullable();
            $table->unsignedBigInteger('hero_media_id')->nullable()->index();
            $table->unsignedInteger('sort_order')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['catalog_line_id', 'slug'], 'cs_line_slug_uq');
        });

        Schema::create('catalog_grades', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('catalog_series_id')->constrained('catalog_series')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('short_title')->nullable();
            $table->string('intro_title')->nullable();
            $table->text('intro_text')->nullable();
            $table->unsignedBigInteger('hero_media_id')->nullable()->index();
            $table->decimal('density_value', 12, 6)->nullable();
            $table->string('density_unit', 50)->nullable();
            $table->decimal('specific_weight_value', 12, 6)->nullable();
            $table->string('specific_weight_unit', 50)->nullable();
            $table->string('uns', 100)->nullable();
            $table->string('wk_nr', 100)->nullable();
            $table->boolean('request_quote_enabled')->default(true);
            $table->boolean('show_in_calculator')->default(true);
            $table->unsignedInteger('sort_order')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['catalog_series_id', 'slug'], 'cg_series_slug_uq');
            $table->index(['catalog_series_id', 'is_active', 'sort_order'], 'cg_series_active_sort_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_grades');
        Schema::dropIfExists('catalog_series');
        Schema::dropIfExists('catalog_lines');
        Schema::dropIfExists('catalog_families');
    }
};

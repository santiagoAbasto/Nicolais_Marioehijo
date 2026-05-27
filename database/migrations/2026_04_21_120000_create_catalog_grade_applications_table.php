<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('catalog_grade_applications')) {
            return;
        }

        Schema::create('catalog_grade_applications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('catalog_grade_id')->constrained('catalog_grades')->cascadeOnDelete();
            $table->foreignId('section_item_id')->constrained('section_items')->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(1);
            $table->timestamps();

            $table->unique(['catalog_grade_id', 'section_item_id'], 'cga_grade_application_uq');
            $table->index(['catalog_grade_id', 'sort_order'], 'cga_grade_sort_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_grade_applications');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_normas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_emisor');
            $table->string('norma');
            $table->string('descripcion_corta')->nullable();
            $table->text('descripcion_larga')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('catalog_grade_norma', function (Blueprint $table) {
            $table->id();
            $table->foreignId('catalog_grade_id')->constrained('catalog_grades')->cascadeOnDelete();
            $table->foreignId('catalog_norma_id')->constrained('catalog_normas')->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(1);
            $table->timestamps();
            $table->unique(['catalog_grade_id', 'catalog_norma_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_grade_norma');
        Schema::dropIfExists('catalog_normas');
    }
};

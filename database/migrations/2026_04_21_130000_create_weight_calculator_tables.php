<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weight_calculator_materials', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->decimal('density_kg_m3', 12, 4);
            $table->decimal('density_g_cm3', 12, 6);
            $table->string('uns')->nullable();
            $table->string('w_nr')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('weight_calculator_pipe_standards', function (Blueprint $table): void {
            $table->id();
            $table->unsignedInteger('order_index')->default(0);
            $table->string('name');
            $table->decimal('diameter_in', 12, 6);
            $table->decimal('diameter_mm', 12, 6);
            $table->string('schedule_label');
            $table->json('schedule_aliases')->nullable();
            $table->decimal('wall_in', 12, 6);
            $table->decimal('wall_mm', 12, 6);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['order_index', 'name']);
            $table->index('schedule_label');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weight_calculator_pipe_standards');
        Schema::dropIfExists('weight_calculator_materials');
    }
};

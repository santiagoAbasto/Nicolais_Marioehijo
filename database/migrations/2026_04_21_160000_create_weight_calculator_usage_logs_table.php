<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weight_calculator_usage_logs', function (Blueprint $table): void {
            $table->id();
            $table->ipAddress('ip_address')->nullable();
            $table->string('browser')->nullable();
            $table->string('platform')->nullable();
            $table->string('device_type')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('accept_language')->nullable();
            $table->string('material_name')->nullable();
            $table->string('shape_name')->nullable();
            $table->string('shape_key')->nullable();
            $table->string('pipe_standard_name')->nullable();
            $table->unsignedInteger('pieces')->default(0);
            $table->decimal('density_g_cm3', 12, 6)->nullable();
            $table->decimal('volume_cm3', 14, 6)->nullable();
            $table->decimal('result_value', 14, 6)->nullable();
            $table->string('result_unit', 12)->nullable();
            $table->string('page_url', 1000)->nullable();
            $table->string('referrer', 1000)->nullable();
            $table->json('fields_json')->nullable();
            $table->timestamps();

            $table->index('created_at');
            $table->index(['shape_key', 'created_at']);
            $table->index(['ip_address', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weight_calculator_usage_logs');
    }
};

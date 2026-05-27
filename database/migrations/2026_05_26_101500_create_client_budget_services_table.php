<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_budget_services', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('price', 14, 2)->default(0);
            $table->decimal('discount_price', 14, 2)->nullable();
            $table->string('sort_order')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_budget_services');
    }
};

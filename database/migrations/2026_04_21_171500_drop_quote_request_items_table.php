<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('quote_request_items');
    }

    public function down(): void
    {
        if (Schema::hasTable('quote_request_items')) {
            return;
        }

        Schema::create('quote_request_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('quote_request_id')->constrained('quote_requests')->cascadeOnDelete();
            $table->unsignedBigInteger('product_id')->nullable()->index();
            $table->string('product_name_snapshot')->nullable();
            $table->string('product_sku_snapshot')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();
        });

        if (Schema::hasTable('products')) {
            Schema::table('quote_request_items', function (Blueprint $table): void {
                $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();
            });
        }
    }
};

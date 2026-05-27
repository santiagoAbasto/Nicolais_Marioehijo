<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('client_access_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('order_number')->unique();
            $table->string('status')->default('pending')->index();
            $table->string('delivery_method')->nullable();
            $table->text('message')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('attachment_name')->nullable();
            $table->decimal('subtotal_list', 14, 2)->default(0);
            $table->decimal('discount_total', 14, 2)->default(0);
            $table->decimal('subtotal_discount', 14, 2)->default(0);
            $table->decimal('iva', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });

        Schema::create('client_order_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('client_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('family')->nullable();
            $table->string('code')->nullable();
            $table->text('description');
            $table->string('type')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('list_price', 14, 2)->default(0);
            $table->decimal('discounted_price', 14, 2)->default(0);
            $table->decimal('discount_percent', 8, 2)->default(0);
            $table->decimal('sale_price', 14, 2)->default(0);
            $table->decimal('margin_percent', 8, 2)->default(0);
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_order_items');
        Schema::dropIfExists('client_orders');
    }
};

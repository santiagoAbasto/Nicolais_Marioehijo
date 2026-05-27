<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_payment_receipts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('client_access_request_id')
                ->constrained('client_access_requests')
                ->cascadeOnDelete();
            $table->date('paid_at');
            $table->decimal('amount', 14, 2);
            $table->string('bank', 120);
            $table->string('branch', 120);
            $table->string('invoices', 180)->nullable();
            $table->text('observations')->nullable();
            $table->string('disk')->default('public');
            $table->string('attachment_path');
            $table->string('attachment_original_name');
            $table->string('attachment_mime')->nullable();
            $table->unsignedBigInteger('attachment_size')->default(0);
            $table->string('status', 30)->default('pending')->index();
            $table->text('admin_notes')->nullable();
            $table->foreignId('reviewed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_payment_receipts');
    }
};

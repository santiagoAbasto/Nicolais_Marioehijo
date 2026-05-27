<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_payment_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('bank_title')->default('Cuentas bancarias para efectuar el depósito:');
            $table->text('bank_details')->nullable();
            $table->string('terms_title')->default('Condiciones de pago vigentes');
            $table->text('terms_details')->nullable();
            $table->text('receipt_note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_payment_settings');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_price_list_file_clients', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('client_price_list_file_id')
                ->constrained('client_price_list_files')
                ->cascadeOnDelete();
            $table->foreignId('client_access_request_id')
                ->constrained('client_access_requests')
                ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['client_price_list_file_id', 'client_access_request_id'], 'price_list_client_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_price_list_file_clients');
    }
};

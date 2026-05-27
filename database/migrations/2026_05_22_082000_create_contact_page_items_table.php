<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('contact_page_items')) {
            Schema::create('contact_page_items', function (Blueprint $table): void {
                $table->id();
                $table->string('type', 40);
                $table->string('label')->nullable();
                $table->string('value');
                $table->string('sort_order', 20)->default('A');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_page_items');
    }
};

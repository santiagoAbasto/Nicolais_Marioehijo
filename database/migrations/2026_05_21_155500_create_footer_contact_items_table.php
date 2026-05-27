<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('footer_contact_items')) {
            Schema::create('footer_contact_items', function (Blueprint $table): void {
                $table->id();
                $table->string('type', 30);
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
        Schema::dropIfExists('footer_contact_items');
    }
};

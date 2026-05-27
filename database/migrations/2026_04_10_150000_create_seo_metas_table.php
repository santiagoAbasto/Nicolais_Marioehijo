<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seo_metas', function (Blueprint $table): void {
            $table->id();
            $table->string('page', 100)->unique();
            $table->string('title', 200)->nullable();
            $table->string('description', 500)->nullable();
            $table->string('keywords', 500)->nullable();
            $table->string('og_image')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_metas');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('security_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip_fingerprint', 128)->nullable()->index();
            $table->string('user_agent', 255)->nullable();
            $table->string('route', 160)->nullable()->index();
            $table->string('path', 255)->nullable();
            $table->string('method', 12)->nullable();
            $table->string('type', 80)->index();
            $table->string('severity', 24)->default('info')->index();
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->index(['type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_events');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_visit_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('route_name', 160)->nullable()->index();
            $table->string('page_key', 80)->nullable()->index();
            $table->string('section_key', 80)->nullable()->index();
            $table->string('section_label', 120)->nullable();
            $table->string('page_label', 255)->nullable();
            $table->string('path', 1000);
            $table->string('full_url', 1500)->nullable();
            $table->string('session_id', 120)->nullable()->index();
            $table->string('visitor_key', 64)->nullable()->index();
            $table->string('ip_address', 45)->nullable()->index();
            $table->string('country_code', 8)->nullable()->index();
            $table->string('country_name', 120)->nullable()->index();
            $table->string('browser', 120)->nullable()->index();
            $table->string('platform', 120)->nullable()->index();
            $table->string('device_type', 40)->nullable()->index();
            $table->text('user_agent')->nullable();
            $table->string('accept_language', 255)->nullable();
            $table->string('referrer', 1000)->nullable();
            $table->json('route_params_json')->nullable();
            $table->timestamps();

            $table->index(['created_at', 'page_key']);
            $table->index(['created_at', 'section_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_visit_logs');
    }
};

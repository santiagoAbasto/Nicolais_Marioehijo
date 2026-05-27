<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('contact_page_settings')) {
            Schema::create('contact_page_settings', function (Blueprint $table): void {
                $table->id();
                $table->string('address')->nullable();
                $table->string('phone_primary')->nullable();
                $table->string('phone_secondary')->nullable();
                $table->string('phone_tertiary')->nullable();
                $table->string('email_primary')->nullable();
                $table->string('email_secondary')->nullable();
                $table->text('map_iframe')->nullable();
                $table->string('map_link', 500)->nullable();
                $table->timestamps();
            });

            return;
        }

        Schema::table('contact_page_settings', function (Blueprint $table): void {
            if (! Schema::hasColumn('contact_page_settings', 'phone_tertiary')) {
                $table->string('phone_tertiary')->nullable()->after('phone_secondary');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_page_settings');
    }
};

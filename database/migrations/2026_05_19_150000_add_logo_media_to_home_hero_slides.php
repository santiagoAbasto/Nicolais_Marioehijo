<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('home_hero_slides', function (Blueprint $table): void {
            if (! Schema::hasColumn('home_hero_slides', 'logo_one_media_id')) {
                $table->foreignId('logo_one_media_id')
                    ->nullable()
                    ->after('mobile_media_id')
                    ->constrained('media_assets')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('home_hero_slides', 'logo_two_media_id')) {
                $table->foreignId('logo_two_media_id')
                    ->nullable()
                    ->after('logo_one_media_id')
                    ->constrained('media_assets')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('home_hero_slides', function (Blueprint $table): void {
            if (Schema::hasColumn('home_hero_slides', 'logo_two_media_id')) {
                $table->dropConstrainedForeignId('logo_two_media_id');
            }

            if (Schema::hasColumn('home_hero_slides', 'logo_one_media_id')) {
                $table->dropConstrainedForeignId('logo_one_media_id');
            }
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('media_assets')) {
            Schema::create('media_assets', function (Blueprint $table): void {
                $table->id();
                $table->string('type', 50)->default('image');
                $table->string('disk', 50)->default('public');
                $table->string('path');
                $table->string('title')->nullable();
                $table->string('alt_text')->nullable();
                $table->string('mime_type')->nullable();
                $table->string('extension', 20)->nullable();
                $table->unsignedBigInteger('size_bytes')->nullable();
                $table->unsignedInteger('width')->nullable();
                $table->unsignedInteger('height')->nullable();
                $table->unsignedInteger('duration_seconds')->nullable();
                $table->json('meta_json')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('home_hero_slides')) {
            Schema::create('home_hero_slides', function (Blueprint $table): void {
                $table->id();
                $table->string('title')->nullable();
                $table->string('subtitle')->nullable();
                $table->text('description')->nullable();
                $table->string('button_text')->nullable();
                $table->string('button_url')->nullable();
                $table->string('media_type', 30)->default('image');
                $table->foreignId('desktop_media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->foreignId('mobile_media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->string('alt_text')->nullable();
                $table->string('sort_order', 20)->default('A');
                $table->unsignedInteger('autoplay_override_seconds')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('site_sections')) {
            Schema::create('site_sections', function (Blueprint $table): void {
                $table->id();
                $table->string('page_key', 50);
                $table->string('section_key', 100);
                $table->string('title')->nullable();
                $table->string('subtitle')->nullable();
                $table->text('description')->nullable();
                $table->foreignId('media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->foreignId('secondary_media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->string('button_text')->nullable();
                $table->string('button_url')->nullable();
                $table->json('meta_json')->nullable();
                $table->string('sort_order', 20)->default('A');
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['page_key', 'section_key']);
            });
        }

        if (! Schema::hasTable('section_items')) {
            Schema::create('section_items', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('site_section_id')->constrained('site_sections')->cascadeOnDelete();
                $table->string('item_key', 100)->nullable();
                $table->string('title')->nullable();
                $table->string('subtitle')->nullable();
                $table->text('description')->nullable();
                $table->foreignId('media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->string('link_url')->nullable();
                $table->string('accent_color', 20)->nullable();
                $table->json('meta_json')->nullable();
                $table->string('sort_order', 20)->default('A');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('section_field_values')) {
            Schema::create('section_field_values', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('site_section_id')->constrained('site_sections')->cascadeOnDelete();
                $table->string('field_key', 100);
                $table->string('field_label')->nullable();
                $table->string('field_type', 50)->default('text');
                $table->text('field_value')->nullable();
                $table->string('sort_order', 20)->default('A');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('footer_settings')) {
            Schema::create('footer_settings', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('logo_media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->string('brand_name')->nullable();
                $table->string('newsletter_title')->nullable();
                $table->string('newsletter_placeholder')->nullable();
                $table->string('contact_title')->nullable();
                $table->text('contact_address')->nullable();
                $table->string('phone_primary')->nullable();
                $table->string('phone_secondary')->nullable();
                $table->string('email_primary')->nullable();
                $table->string('email_secondary')->nullable();
                $table->string('whatsapp_url')->nullable();
                $table->string('copyright_text')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('social_links')) {
            Schema::create('social_links', function (Blueprint $table): void {
                $table->id();
                $table->string('platform', 50);
                $table->string('label')->nullable();
                $table->string('url');
                $table->string('icon')->nullable();
                $table->string('location', 50)->default('footer');
                $table->string('sort_order', 20)->default('A');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('post_categories')) {
            Schema::create('post_categories', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->string('color', 20)->nullable();
                $table->string('sort_order', 20)->default('A');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('posts')) {
            Schema::create('posts', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('post_category_id')->nullable()->constrained('post_categories')->nullOnDelete();
                $table->string('title');
                $table->string('slug')->unique();
                $table->text('excerpt')->nullable();
                $table->longText('content')->nullable();
                $table->foreignId('cover_media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->string('author_name')->nullable();
                $table->timestamp('published_at')->nullable();
                $table->string('sort_order', 20)->default('A');
                $table->boolean('is_active')->default(true);
                $table->boolean('show_on_home')->default(false);
                $table->boolean('is_featured')->default(false);
                $table->string('seo_title')->nullable();
                $table->text('seo_description')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
        Schema::dropIfExists('post_categories');
        Schema::dropIfExists('social_links');
        Schema::dropIfExists('footer_settings');
        Schema::dropIfExists('section_field_values');
        Schema::dropIfExists('section_items');
        Schema::dropIfExists('site_sections');
        Schema::dropIfExists('home_hero_slides');
        Schema::dropIfExists('media_assets');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('quote_page_settings')) {
            Schema::create('quote_page_settings', function (Blueprint $table): void {
                $table->id();
                $table->string('notification_email_primary')->nullable();
                $table->string('notification_email_secondary')->nullable();
                $table->text('map_iframe')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('quote_requests')) {
            Schema::create('quote_requests', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('email');
                $table->string('country', 120)->nullable();
                $table->string('country_code', 8)->nullable();
                $table->string('phone', 120)->nullable();
                $table->string('company')->nullable();
                $table->string('material')->nullable();
                $table->string('shape')->nullable();
                $table->string('dimensions')->nullable();
                $table->string('quantity', 120)->nullable();
                $table->text('message')->nullable();
                $table->boolean('is_read')->default(false);
                $table->string('status', 50)->default('pendiente');
                $table->timestamps();
            });
        } else {
            Schema::table('quote_requests', function (Blueprint $table): void {
                if (! Schema::hasColumn('quote_requests', 'country')) {
                    $table->string('country', 120)->nullable()->after('email');
                }

                if (! Schema::hasColumn('quote_requests', 'country_code')) {
                    $table->string('country_code', 8)->nullable()->after('country');
                }

                if (! Schema::hasColumn('quote_requests', 'material')) {
                    $table->string('material')->nullable()->after('company');
                }

                if (! Schema::hasColumn('quote_requests', 'shape')) {
                    $table->string('shape')->nullable()->after('material');
                }

                if (! Schema::hasColumn('quote_requests', 'dimensions')) {
                    $table->string('dimensions')->nullable()->after('shape');
                }

                if (! Schema::hasColumn('quote_requests', 'quantity')) {
                    $table->string('quantity', 120)->nullable()->after('dimensions');
                }
            });
        }

        if (! Schema::hasTable('quote_request_attachments')) {
            Schema::create('quote_request_attachments', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('quote_request_id')->constrained('quote_requests')->cascadeOnDelete();
                $table->foreignId('media_id')->nullable()->constrained('media_assets')->nullOnDelete();
                $table->string('file_name_snapshot')->nullable();
                $table->string('sort_order', 20)->default('A');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_request_attachments');
        Schema::dropIfExists('quote_page_settings');
    }
};

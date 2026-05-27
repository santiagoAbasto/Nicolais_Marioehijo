<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('newsletter_subscribers')) {
            Schema::create('newsletter_subscribers', function (Blueprint $table): void {
                $table->id();
                $table->string('email')->unique();
                $table->boolean('is_active')->default(true);
                $table->timestamp('subscribed_at')->nullable();
                $table->timestamp('unsubscribed_at')->nullable();
                $table->string('unsubscribe_source', 80)->nullable();
                $table->string('unsubscribe_token', 80)->unique();
                $table->timestamp('last_sent_at')->nullable();
                $table->timestamps();
            });

            return;
        }

        Schema::table('newsletter_subscribers', function (Blueprint $table): void {
            if (! Schema::hasColumn('newsletter_subscribers', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('email');
            }

            if (! Schema::hasColumn('newsletter_subscribers', 'subscribed_at')) {
                $table->timestamp('subscribed_at')->nullable()->after('is_active');
            }

            if (! Schema::hasColumn('newsletter_subscribers', 'unsubscribed_at')) {
                $table->timestamp('unsubscribed_at')->nullable()->after('subscribed_at');
            }

            if (! Schema::hasColumn('newsletter_subscribers', 'unsubscribe_source')) {
                $table->string('unsubscribe_source', 80)->nullable()->after('unsubscribed_at');
            }

            if (! Schema::hasColumn('newsletter_subscribers', 'unsubscribe_token')) {
                $table->string('unsubscribe_token', 80)->nullable()->after('unsubscribe_source');
            }

            if (! Schema::hasColumn('newsletter_subscribers', 'last_sent_at')) {
                $table->timestamp('last_sent_at')->nullable()->after('unsubscribe_token');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_subscribers');
    }
};

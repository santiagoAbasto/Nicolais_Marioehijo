<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_orders', function (Blueprint $table): void {
            if (! Schema::hasColumn('client_orders', 'document_type')) {
                $table->string('document_type')->default('order')->index()->after('order_number');
            }

            if (! Schema::hasColumn('client_orders', 'draft_key')) {
                $table->string('draft_key')->nullable()->unique()->after('document_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('client_orders', function (Blueprint $table): void {
            if (Schema::hasColumn('client_orders', 'draft_key')) {
                $table->dropUnique(['draft_key']);
                $table->dropColumn('draft_key');
            }

            if (Schema::hasColumn('client_orders', 'document_type')) {
                $table->dropIndex(['document_type']);
                $table->dropColumn('document_type');
            }
        });
    }
};

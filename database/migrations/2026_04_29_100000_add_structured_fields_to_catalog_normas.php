<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catalog_normas', function (Blueprint $table): void {
            $table->string('familia')->nullable()->after('descripcion_larga');
            $table->string('subfamilia')->nullable()->after('familia');
            $table->string('tipo')->nullable()->after('subfamilia');
            $table->text('aplicacion_web_comercial')->nullable()->after('tipo');
            $table->text('keywords_seo')->nullable()->after('aplicacion_web_comercial');
            $table->text('fuente')->nullable()->after('keywords_seo');
        });
    }

    public function down(): void
    {
        Schema::table('catalog_normas', function (Blueprint $table): void {
            $table->dropColumn([
                'familia',
                'subfamilia',
                'tipo',
                'aplicacion_web_comercial',
                'keywords_seo',
                'fuente',
            ]);
        });
    }
};

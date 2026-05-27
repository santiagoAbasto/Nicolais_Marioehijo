<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catalog_staging_products', function (Blueprint $table): void {
            foreach ($this->columns() as $column) {
                if (! Schema::hasColumn('catalog_staging_products', $column)) {
                    $table->string($column)->nullable()->after('discontinuo');
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('catalog_staging_products', function (Blueprint $table): void {
            foreach (array_reverse($this->columns()) as $column) {
                if (Schema::hasColumn('catalog_staging_products', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    private function columns(): array
    {
        return [
            'tipo',
            'precio_lista',
            'precio_con_descuento',
            'precio_venta',
            'cantidad',
            'subtotal',
            'vista_publico',
        ];
    }
};

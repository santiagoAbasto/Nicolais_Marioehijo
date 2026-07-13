<?php

namespace Tests\Feature\Admin;

use App\Http\Controllers\Admin\ProductImportController;
use App\Models\Product;
use App\Models\ProductFamily;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductImportIdentityTest extends TestCase
{
    use RefreshDatabase;

    public function test_same_sku_and_brand_with_different_description_is_not_merged(): void
    {
        $this->createProduct('G4238', 'Nicolais Mario e Hijo', 'GUIA DE DIRECTA VW 15-170');

        $match = $this->controller()->findExisting([
            'code' => 'G4238',
            'brand' => 'Nicolais Mario e Hijo',
            'description' => 'GUIA DE DIRECTA CARGO 15170',
        ]);

        $this->assertNull($match);
    }

    public function test_legacy_imported_product_is_reused_when_nicolais_sku_and_name_match(): void
    {
        $legacy = $this->createProduct(
            '07.PB-8132',
            'Importado',
            'PALANCA BASTON F-1000/4000 91 FSO 2215/2615'
        );

        $match = $this->controller()->findExisting([
            'code' => '07.PB-8132',
            'brand' => 'Nicolais Mario e Hijo',
            'description' => 'PALANCA BASTON F-1000/4000 91 FSO 2215/2615',
        ]);

        $this->assertNotNull($match);
        $this->assertTrue($legacy->is($match));
    }

    public function test_same_sku_brand_and_normalized_description_is_reused(): void
    {
        $existing = $this->createProduct(
            'H-4084',
            'Nicolais Mario e Hijo',
            'HORQUILLA DE EMBRAGUE FIAT 500 / PALIO / PUNTO'
        );

        $match = $this->controller()->findExisting([
            'code' => 'H4084',
            'brand' => 'Nicolais Mario e Hijo',
            'description' => 'HORQUILLA DE EMBRAGUE FIAT 500/PALIO/PUNTO',
        ]);

        $this->assertNotNull($match);
        $this->assertTrue($existing->is($match));
    }

    public function test_alternative_type_is_imported_as_nicolais_product(): void
    {
        $parsed = $this->controller()->parseMapped(
            ['ENGRANAJES', 'CAJAS', 'Producto alternativo', 'Alternativo', 'Fiat', 'Ducato', 'NM-100'],
            ['familia', 'rubro', 'descripcion', 'tipo', 'marca', 'modelo', 'codigo']
        );

        $this->assertSame('Nicolais Mario e Hijo', $parsed['brand']);
        $this->assertSame('Fiat Ducato', $parsed['applications']);
    }

    public function test_imported_type_preserves_the_commercial_product_brand(): void
    {
        $parsed = $this->controller()->parseMapped(
            ['ENGRANAJES', 'CAJAS', 'Producto importado', 'Importado', 'Renault', 'Kangoo', 'Mahiro', 'MH-100'],
            ['familia', 'rubro', 'descripcion', 'tipo', 'marca', 'modelo', 'marca_producto', 'codigo']
        );

        $this->assertSame('Mahiro', $parsed['brand']);
        $this->assertSame('Renault Kangoo', $parsed['applications']);
    }

    protected function controller(): object
    {
        return new class extends ProductImportController
        {
            public function findExisting(array $parsed): ?Product
            {
                return $this->existingProductForImport($parsed);
            }

            public function parseMapped(array $row, array $headings): ?array
            {
                return $this->parseMappedProductRow($row, $headings, 'Importado', 'General', null);
            }
        };
    }

    protected function createProduct(string $sku, string $brand, string $name): Product
    {
        $family = ProductFamily::query()->firstOrCreate(
            ['slug' => 'engranajes'],
            [
                'name' => 'ENGRANAJES',
                'description' => 'Prueba',
                'sort_order' => 'A',
                'is_active' => true,
                'show_on_products_page' => true,
                'show_on_home' => false,
            ]
        );

        return Product::query()->create([
            'product_family_id' => $family->id,
            'name' => $name,
            'slug' => strtolower(preg_replace('/[^a-z0-9]+/i', '-', $sku.'-'.$brand.'-'.$name)),
            'sku' => $sku,
            'brand' => $brand,
            'sort_order' => 'A',
            'is_active' => true,
        ]);
    }
}

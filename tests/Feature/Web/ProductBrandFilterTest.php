<?php

namespace Tests\Feature\Web;

use App\Models\Product;
use App\Models\ProductFamily;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductBrandFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_catalog_filters_by_commercial_product_brand(): void
    {
        $family = ProductFamily::query()->create([
            'name' => 'ENGRANAJES',
            'slug' => 'engranajes',
            'sort_order' => 'A',
            'is_active' => true,
            'show_on_products_page' => true,
            'show_on_home' => true,
        ]);

        $this->createProduct($family, 'Mahiro', 'Producto Mahiro', 'MH-1');
        $this->createProduct($family, 'Tecnotrasmissioni', 'Producto Tecno', 'TT-1');
        $this->createProduct($family, 'Importado', 'Producto sin marca comercial', 'IMP-1');

        $response = $this->get(route('web.products.index', ['product_brand' => 'Mahiro']));

        $response->assertOk();
        $response->assertSee('Producto Mahiro');
        $response->assertDontSee('Producto Tecno');
        $response->assertSee('name="product_brand"', false);
        $response->assertDontSee('<option value="Importado"', false);
    }

    private function createProduct(ProductFamily $family, string $brand, string $name, string $sku): void
    {
        Product::query()->create([
            'product_family_id' => $family->id,
            'name' => $name,
            'slug' => strtolower($sku),
            'sku' => $sku,
            'brand' => $brand,
            'sort_order' => 'A',
            'is_active' => true,
        ]);
    }
}

<?php

namespace Tests\Feature\Admin;

use App\Http\Controllers\Admin\ProductCatalogAdminController;
use App\Models\Product;
use Tests\TestCase;

class ProductWorkbookTemplateTest extends TestCase
{
    public function test_template_contains_the_product_type_column(): void
    {
        $headers = $this->controller()->headers();

        $this->assertContains('tipo', $headers);
        $this->assertSame(3, array_search('tipo', $headers, true));
    }

    public function test_export_uses_the_public_product_type(): void
    {
        $product = new Product([
            'name' => 'Producto propio',
            'brand' => 'Nicolais Mario e Hijo',
        ]);

        $row = $this->controller()->exportRow($product);

        $this->assertSame('Alternativo', $row[3]);
    }

    public function test_template_can_be_generated_as_a_valid_xlsx_download(): void
    {
        $response = $this->controller()->template();

        ob_start();
        $response->sendContent();
        $contents = (string) ob_get_clean();

        $this->assertStringStartsWith('PK', $contents);
        $this->assertGreaterThan(1000, strlen($contents));
    }

    private function controller(): object
    {
        return new class extends ProductCatalogAdminController
        {
            public function headers(): array
            {
                return $this->productWorkbookHeaders();
            }

            public function exportRow(Product $product): array
            {
                return $this->productExportRow($product);
            }
        };
    }
}

<?php

namespace Tests\Feature\Admin;

use App\Http\Controllers\Admin\ProductImportController;
use App\Models\Product;
use App\Models\ProductFamily;
use App\Models\MediaAsset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductImageImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_image_can_match_a_unique_product_by_its_numeric_code(): void
    {
        Storage::fake('public');

        $family = ProductFamily::query()->create([
            'name' => 'ENGRANAJES',
            'slug' => 'engranajes',
            'sort_order' => 'A',
            'is_active' => true,
            'show_on_products_page' => true,
            'show_on_home' => false,
        ]);
        $product = Product::query()->create([
            'product_family_id' => $family->id,
            'name' => 'Producto de prueba',
            'slug' => 'producto-pr5209',
            'sku' => 'PR5209',
            'brand' => 'Nicolais Mario e Hijo',
            'sort_order' => 'A',
            'is_active' => true,
        ]);

        $request = Request::create('/admin/api/products/import/images', 'POST');
        $request->files->set('images', [UploadedFile::fake()->image('G5209.png')]);

        $summary = app(ProductImportController::class)->images($request)->getData(true)['summary'];

        $this->assertSame(1, $summary['uploaded']);
        $this->assertSame(1, $summary['matched_products']);
        $this->assertSame('unique_numeric_code', $summary['matched_files'][0]['match_strategy']);
        $this->assertNotNull($product->fresh()->main_media_id);
        $this->assertDatabaseHas('product_media', ['product_id' => $product->id]);
    }

    public function test_furcon_filename_can_represent_a_code_with_slash(): void
    {
        Storage::fake('public');

        $family = ProductFamily::query()->create([
            'name' => 'ENGRANAJES',
            'slug' => 'engranajes',
            'sort_order' => 'A',
            'is_active' => true,
            'show_on_products_page' => true,
            'show_on_home' => false,
        ]);
        $product = Product::query()->create([
            'product_family_id' => $family->id,
            'name' => 'Producto Furcon',
            'slug' => 'producto-cod-2243-1',
            'sku' => 'COD 2243/1',
            'brand' => 'Nicolais Mario e Hijo',
            'sort_order' => 'A',
            'is_active' => true,
        ]);

        $request = Request::create('/admin/api/products/import/images', 'POST');
        $request->files->set('images', [UploadedFile::fake()->image('G32243-1.png')]);

        $summary = app(ProductImportController::class)->images($request)->getData(true)['summary'];

        $this->assertSame(1, $summary['matched_products']);
        $this->assertSame('furcon_slash_code', $summary['matched_files'][0]['match_strategy']);
        $this->assertNotNull($product->fresh()->main_media_id);
    }

    public function test_reimporting_the_same_image_does_not_duplicate_media_or_gallery(): void
    {
        Storage::fake('public');

        $product = $this->createProduct('PR5209');

        foreach (range(1, 2) as $attempt) {
            $request = Request::create('/admin/api/products/import/images', 'POST');
            $request->files->set('images', [UploadedFile::fake()->image('G5209.png')]);
            app(ProductImportController::class)->images($request);
        }

        $this->assertDatabaseCount('media_assets', 1);
        $this->assertDatabaseCount('product_media', 1);
        $this->assertNotNull($product->fresh()->main_media_id);
    }

    public function test_unmatched_image_is_reported_without_creating_orphan_media(): void
    {
        Storage::fake('public');

        $request = Request::create('/admin/api/products/import/images', 'POST');
        $request->files->set('images', [UploadedFile::fake()->image('SIN-PRODUCTO.png')]);

        $summary = app(ProductImportController::class)->images($request)->getData(true)['summary'];

        $this->assertCount(1, $summary['unmatched']);
        $this->assertSame(0, $summary['matched_products']);
        $this->assertSame(0, MediaAsset::query()->count());
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    private function createProduct(string $sku): Product
    {
        $family = ProductFamily::query()->firstOrCreate(
            ['slug' => 'engranajes'],
            [
                'name' => 'ENGRANAJES',
                'sort_order' => 'A',
                'is_active' => true,
                'show_on_products_page' => true,
                'show_on_home' => false,
            ]
        );

        return Product::query()->create([
            'product_family_id' => $family->id,
            'name' => 'Producto '.$sku,
            'slug' => strtolower($sku),
            'sku' => $sku,
            'brand' => 'Nicolais Mario e Hijo',
            'sort_order' => 'A',
            'is_active' => true,
        ]);
    }
}

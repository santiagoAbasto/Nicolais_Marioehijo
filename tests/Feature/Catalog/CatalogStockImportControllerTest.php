<?php

namespace Tests\Feature\Catalog;

use App\Models\Catalog\CatalogFamily;
use App\Models\Catalog\CatalogGrade;
use App\Models\Catalog\CatalogImportBatch;
use App\Models\Catalog\CatalogLine;
use App\Models\Catalog\CatalogSeries;
use App\Models\Catalog\Shape;
use App\Models\Catalog\ShapeFamily;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CatalogStockImportControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_export_is_blocked_when_stock_was_cleaned(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/admin/productos/excel-stock')
            ->get(route('admin.products.stock-importer.export'));

        $response->assertRedirect('/admin/productos/excel-stock');
        $response->assertSessionHas('success', 'No hay stock activo para exportar. Primero subí un Excel nuevo.');
    }

    public function test_export_downloads_latest_original_stock_file_when_available(): void
    {
        Storage::fake('local');

        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        Storage::disk('local')->put('imports/catalog-products/stock-original.xlsx', 'mismo-archivo-subido');

        CatalogImportBatch::query()->create([
            'type' => 'product_stock_excel',
            'file_name' => 'stock-original.xlsx',
            'file_path' => 'imports/catalog-products/stock-original.xlsx',
            'status' => 'published',
        ]);

        $response = $this
            ->actingAs($user)
            ->get(route('admin.products.stock-importer.export'));

        $response->assertOk();
        $this->assertStringContainsString('stock-original.xlsx', (string) $response->headers->get('content-disposition'));
        $this->assertSame('mismo-archivo-subido', $response->streamedContent());
    }

    public function test_destroy_history_clears_only_stock_and_shapes_without_hiding_material_taxonomy(): void
    {
        Storage::fake('local');

        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        $family = CatalogFamily::query()->create([
            'name' => 'Metálicos',
            'slug' => 'metalicos',
            'is_active' => true,
        ]);

        $line = CatalogLine::query()->create([
            'catalog_family_id' => $family->id,
            'name' => 'Titanio y sus aleaciones',
            'slug' => 'titanio-y-sus-aleaciones',
            'is_active' => true,
        ]);

        $series = CatalogSeries::query()->create([
            'catalog_line_id' => $line->id,
            'name' => 'Titanio comercial',
            'slug' => 'titanio-comercial',
            'is_active' => true,
        ]);

        $grade = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'Titanio Grado 2',
            'slug' => 'titanio-grado-2',
            'is_active' => true,
        ]);

        $shapeFamily = ShapeFamily::query()->create([
            'name' => 'Tubular',
            'slug' => 'tubular',
            'is_active' => true,
        ]);

        $shape = Shape::query()->create([
            'catalog_shape_family_id' => $shapeFamily->id,
            'name' => 'Tubo',
            'slug' => 'tubo',
            'is_active' => true,
        ]);

        Storage::disk('local')->put('imports/catalog-stock/stock.xlsx', 'excel');

        CatalogImportBatch::query()->create([
            'type' => 'product_stock_excel',
            'file_name' => 'stock.xlsx',
            'file_path' => 'imports/catalog-stock/stock.xlsx',
            'status' => 'published',
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/admin/productos/excel-stock')
            ->delete(route('admin.products.stock-importer.destroy-history'));

        $response->assertRedirect('/admin/productos/excel-stock');
        $response->assertSessionHas('success');

        Storage::disk('local')->assertMissing('imports/catalog-stock/stock.xlsx');
        $this->assertDatabaseCount('catalog_import_batches', 0);
        $this->assertDatabaseHas('catalog_families', ['id' => $family->id, 'is_active' => true]);
        $this->assertDatabaseHas('catalog_lines', ['id' => $line->id, 'is_active' => true]);
        $this->assertDatabaseHas('catalog_series', ['id' => $series->id, 'is_active' => true]);
        $this->assertDatabaseHas('catalog_grades', ['id' => $grade->id, 'is_active' => true]);
        $this->assertDatabaseHas('catalog_shape_families', ['id' => $shapeFamily->id, 'is_active' => false]);
        $this->assertDatabaseHas('catalog_shapes', ['id' => $shape->id, 'is_active' => false]);
    }
}

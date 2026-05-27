<?php

namespace Tests\Feature\Catalog;

use App\Models\Catalog\CatalogReferenceImportRow;
use App\Models\Catalog\CatalogReferenceImportRun;
use App\Models\Catalog\CatalogFamily;
use App\Models\Catalog\CatalogLine;
use App\Models\Catalog\CatalogSeries;
use App\Models\Catalog\CatalogGrade;
use App\Models\Catalog\ShapeFamily;
use App\Models\Catalog\Shape;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CatalogReferenceImportControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_export_is_blocked_when_reference_imports_were_cleaned(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/admin/productos/importador')
            ->get(route('admin.products.reference-importer.export'));

        $response->assertRedirect('/admin/productos/importador');
        $response->assertSessionHas('success', 'No hay materiales activos para exportar. Primero subí un Excel nuevo.');
    }

    public function test_destroy_history_removes_only_reference_history_and_keeps_live_catalog_data(): void
    {
        Storage::fake('local');

        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        Storage::disk('local')->put('imports/catalog-reference/referencia.xlsx', 'excel');

        $run = CatalogReferenceImportRun::query()->create([
            'file_name' => 'referencia.xlsx',
            'file_path' => 'imports/catalog-reference/referencia.xlsx',
            'status' => CatalogReferenceImportRun::STATUS_COMPLETED,
            'families_json' => ['Metálicos'],
            'headings_json' => ['familia', 'grado'],
            'summary_json' => ['processed_rows' => 1, 'raw_rows_saved' => 1],
            'started_at' => now(),
            'finished_at' => now(),
            'created_by' => $user->id,
        ]);

        CatalogReferenceImportRow::query()->create([
            'catalog_reference_import_run_id' => $run->id,
            'row_number' => 2,
            'family_name' => 'Metálicos',
            'subfamily_name' => 'Titanio',
            'product_name' => 'Titanio Grado 2',
            'row_payload' => ['familia' => 'Metálicos', 'grado' => 'Titanio Grado 2'],
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

        $response = $this
            ->actingAs($user)
            ->from('/admin/productos/importador')
            ->delete(route('admin.products.reference-importer.destroy-history'));

        $response->assertRedirect('/admin/productos/importador');
        $response->assertSessionHas('success');

        $this->assertDatabaseCount('catalog_reference_import_runs', 0);
        $this->assertDatabaseCount('catalog_reference_import_rows', 0);
        Storage::disk('local')->assertMissing('imports/catalog-reference/referencia.xlsx');
        $this->assertDatabaseHas('catalog_families', ['id' => $family->id, 'is_active' => true]);
        $this->assertDatabaseHas('catalog_lines', ['id' => $line->id, 'is_active' => true]);
        $this->assertDatabaseHas('catalog_series', ['id' => $series->id, 'is_active' => true]);
        $this->assertDatabaseHas('catalog_grades', ['id' => $grade->id, 'is_active' => true]);
        $this->assertDatabaseHas('catalog_shape_families', ['id' => $shapeFamily->id, 'is_active' => true]);
        $this->assertDatabaseHas('catalog_shapes', ['id' => $shape->id, 'is_active' => true]);
    }
}

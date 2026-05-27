<?php

namespace Tests\Feature\Catalog;

use App\Models\Catalog\CatalogFamily;
use App\Models\Catalog\CatalogGrade;
use App\Models\Catalog\CatalogLine;
use App\Models\Catalog\CatalogNorma;
use App\Models\Catalog\CatalogReferenceImportRow;
use App\Models\Catalog\CatalogReferenceImportRun;
use App\Models\Catalog\CatalogSeries;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class CatalogNormasImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_normas_export_is_blocked_when_there_are_no_normas(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/admin/productos/normas')
            ->get(route('admin.products.normas.export'));

        $response->assertRedirect('/admin/productos/normas');
        $response->assertSessionHas('success', 'No hay normas para exportar. Primero cargá o importá normas.');
    }

    public function test_normas_can_be_imported_and_attached_to_selected_grades(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        [$gradeA, $gradeB] = $this->seedGrades();

        $response = $this
            ->actingAs($user)
            ->from('/admin/productos/normas')
            ->post(route('admin.products.normas.import'), [
                'file' => $this->makeWorkbookUpload([
                    ['ASTM', 'B265', 'Titanium and titanium alloy strip, sheet, and plate', 'Titanio', 'Planchas', 'Norma', 'Titanio laminado para uso industrial', 'astm b265 titanio placas', 'ASTM'],
                    ['AWS', 'A5.16', 'Titanium and titanium-alloy bare welding rods and electrodes', 'Titanio', 'Soldadura', 'Aporte', 'Aporte TIG/MIG para titanio', 'aws a5.16 titanio soldadura', 'AWS'],
                ]),
                'grade_ids' => [$gradeA->id, $gradeB->id],
            ]);

        $response->assertRedirect('/admin/productos/normas');
        $response->assertSessionHas('success');

        $this->assertDatabaseCount('catalog_normas', 2);
        $this->assertDatabaseCount('catalog_grade_norma', 4);

        $this->assertDatabaseHas('catalog_normas', [
            'nombre_emisor' => 'ASTM',
            'norma' => 'B265',
            'descripcion_corta' => 'Titanium and titanium alloy strip, sheet, and plate',
            'familia' => 'Titanio',
            'subfamilia' => 'Planchas',
            'tipo' => 'Norma',
            'aplicacion_web_comercial' => 'Titanio laminado para uso industrial',
            'keywords_seo' => 'astm b265 titanio placas',
            'fuente' => 'ASTM',
            'is_imported' => true,
        ]);

        $this->assertDatabaseHas('catalog_grade_norma', [
            'catalog_grade_id' => $gradeA->id,
        ]);
        $this->assertDatabaseHas('catalog_grade_norma', [
            'catalog_grade_id' => $gradeB->id,
        ]);
    }

    public function test_reimport_updates_existing_norma_without_losing_manual_assignments(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        [$gradeA, $gradeB] = $this->seedGrades();

        $norma = CatalogNorma::query()->create([
            'nombre_emisor' => 'ASTM',
            'norma' => 'B265',
            'descripcion_corta' => 'Versión vieja',
            'descripcion_larga' => 'Texto viejo',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $norma->grades()->attach([
            $gradeA->id => ['sort_order' => 1],
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/admin/productos/normas')
            ->post(route('admin.products.normas.import'), [
                'file' => $this->makeWorkbookUpload([
                    ['ASTM', 'B265', 'Nueva descripción ASTM B265', 'Titanio', 'Planchas', 'Norma', 'Nueva aplicación comercial', 'astm b265 titanio placas', 'ASTM'],
                ]),
                'grade_ids' => [$gradeB->id],
            ]);

        $response->assertRedirect('/admin/productos/normas');
        $response->assertSessionHas('success');

        $this->assertDatabaseCount('catalog_normas', 1);
        $this->assertDatabaseHas('catalog_normas', [
            'id' => $norma->id,
            'descripcion_corta' => 'Nueva descripción ASTM B265',
            'familia' => 'Titanio',
            'subfamilia' => 'Planchas',
            'tipo' => 'Norma',
            'aplicacion_web_comercial' => 'Nueva aplicación comercial',
            'keywords_seo' => 'astm b265 titanio placas',
            'fuente' => 'ASTM',
            'is_imported' => false,
        ]);

        $this->assertDatabaseHas('catalog_grade_norma', [
            'catalog_norma_id' => $norma->id,
            'catalog_grade_id' => $gradeA->id,
        ]);
        $this->assertDatabaseHas('catalog_grade_norma', [
            'catalog_norma_id' => $norma->id,
            'catalog_grade_id' => $gradeB->id,
        ]);
        $this->assertDatabaseCount('catalog_grade_norma', 2);
    }

    public function test_normas_import_relinks_existing_reference_grade_when_materials_were_imported_first(): void
    {
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
            'name' => 'TITANIO ALEADO',
            'slug' => 'titanio-aleado',
            'is_active' => true,
        ]);

        $grade = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'TITANIO 6Al7Nb',
            'slug' => 'titanio-6al7nb',
            'density_value' => 4.52,
            'density_unit' => 'g/cm3',
            'is_active' => true,
        ]);

        $run = CatalogReferenceImportRun::query()->create([
            'file_name' => 'referencia.xlsx',
            'file_path' => 'imports/catalog-reference/referencia.xlsx',
            'status' => CatalogReferenceImportRun::STATUS_COMPLETED,
            'families_json' => ['TITANIO y sus aleaciones'],
            'headings_json' => ['fuente_norma_utilizada', 'normas'],
            'summary_json' => ['processed_rows' => 1],
            'started_at' => now(),
            'finished_at' => now(),
            'created_by' => $user->id,
        ]);

        CatalogReferenceImportRow::query()->create([
            'catalog_reference_import_run_id' => $run->id,
            'row_number' => 2,
            'family_name' => 'TITANIO y sus aleaciones',
            'subfamily_name' => 'TITANIO ALEADO',
            'product_name' => 'TITANIO 6Al7Nb',
            'row_payload' => [
                [
                    'index' => 10,
                    'heading' => 'Fuente / Norma utilizada',
                    'normalized_heading' => 'fuente_norma_utilizada',
                    'value' => 'ASTM F1295',
                ],
                [
                    'index' => 11,
                    'heading' => 'Normas',
                    'normalized_heading' => 'normas',
                    'value' => 'ISO 5832-11; EN ISO 5832-11',
                ],
            ],
        ]);

        $this->assertSame([], $grade->normas()->pluck('catalog_normas.id')->all());

        $response = $this
            ->actingAs($user)
            ->from('/admin/productos/normas')
            ->post(route('admin.products.normas.import'), [
                'file' => $this->makeWorkbookUpload([
                    ['ASTM', 'F1295', 'ASTM F1295', 'Titanio', 'Titanio aleado', 'Norma', 'Implantes quirúrgicos', 'astm f1295 titanio', 'ASTM'],
                    ['ISO', '5832-11', 'ISO 5832-11', 'Titanio', 'Titanio aleado', 'Norma', 'Implantes quirúrgicos', 'iso 5832-11 titanio', 'ISO'],
                ]),
            ]);

        $response->assertRedirect('/admin/productos/normas');
        $response->assertSessionHas('success');

        $this->assertSame(
            ['ASTM F1295', 'ISO 5832-11'],
            $grade->fresh()
                ->normas()
                ->orderBy('catalog_grade_norma.sort_order')
                ->get()
                ->map(fn (CatalogNorma $norma) => trim($norma->nombre_emisor.' '.$norma->norma))
                ->all()
        );
    }

    public function test_destroy_imported_only_removes_imported_normas_and_keeps_manual_ones(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        $manualNorma = CatalogNorma::query()->create([
            'nombre_emisor' => 'ISO',
            'norma' => '5832-2',
            'descripcion_corta' => 'Manual',
            'sort_order' => 1,
            'is_active' => true,
            'is_imported' => false,
        ]);

        $importedNorma = CatalogNorma::query()->create([
            'nombre_emisor' => 'ASTM',
            'norma' => 'B265',
            'descripcion_corta' => 'Importada',
            'sort_order' => 2,
            'is_active' => true,
            'is_imported' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/admin/productos/normas')
            ->delete(route('admin.products.normas.destroy-imported'));

        $response->assertRedirect('/admin/productos/normas');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('catalog_normas', [
            'id' => $manualNorma->id,
        ]);
        $this->assertDatabaseMissing('catalog_normas', [
            'id' => $importedNorma->id,
        ]);
        $this->assertDatabaseCount('catalog_normas', 1);
    }

    public function test_grade_page_only_shows_title_and_subtitle_for_assigned_normas(): void
    {
        [$grade] = $this->seedGrades();

        $norma = CatalogNorma::query()->create([
            'nombre_emisor' => 'ASTM',
            'norma' => 'B265',
            'descripcion_corta' => 'Titanium and titanium alloy strip, sheet, and plate',
            'descripcion_larga' => 'Aplicacion web/comercial: debe quedar oculta en la ficha publica.',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $norma->grades()->attach([
            $grade->id => ['sort_order' => 1],
        ]);

        $response = $this->get(route('web.products.grade', [
            $grade->series->line->slug,
            $grade->series->slug,
            $grade->slug,
        ]));

        $response->assertOk();
        $response->assertSee('ASTM');
        $response->assertSee('B265');
        $response->assertSee('Titanium and titanium alloy strip, sheet, and plate');
        $response->assertDontSee('Aplicacion web/comercial: debe quedar oculta en la ficha publica.');
    }

    public function test_normas_index_hides_inactive_legacy_catalog_branches(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        [$activeGrade] = $this->seedGrades();

        $legacyFamily = CatalogFamily::query()->create([
            'name' => 'Metálicos',
            'slug' => 'metalicos-legacy',
            'is_active' => true,
        ]);

        $legacyLine = CatalogLine::query()->create([
            'catalog_family_id' => $legacyFamily->id,
            'name' => 'Aceros',
            'slug' => 'aceros',
            'is_active' => false,
        ]);

        $legacySeries = CatalogSeries::query()->create([
            'catalog_line_id' => $legacyLine->id,
            'name' => 'ACERO BAJA TEMPERATURA',
            'slug' => 'acero-baja-temperatura-legacy',
            'is_active' => false,
        ]);

        CatalogGrade::query()->create([
            'catalog_series_id' => $legacySeries->id,
            'name' => $activeGrade->name,
            'slug' => 'grado-legacy',
            'density_value' => 4.51,
            'density_unit' => 'g/cm3',
            'is_active' => false,
        ]);

        $this->actingAs($user)
            ->get(route('admin.products.normas.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Catalog/Normas')
                ->where('catalogTree.0.lines.0.name', 'Titanio')
                ->missing('catalogTree.0.lines.1')
            );
    }

    /**
     * @return array{0: CatalogGrade, 1: CatalogGrade}
     */
    private function seedGrades(): array
    {
        $family = CatalogFamily::query()->create([
            'name' => 'Metálicos',
            'slug' => 'metalicos',
            'is_active' => true,
        ]);

        $line = CatalogLine::query()->create([
            'catalog_family_id' => $family->id,
            'name' => 'Titanio',
            'slug' => 'titanio',
            'is_active' => true,
        ]);

        $series = CatalogSeries::query()->create([
            'catalog_line_id' => $line->id,
            'name' => 'Grados comerciales',
            'slug' => 'grados-comerciales',
            'is_active' => true,
        ]);

        $gradeA = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'Grado 2',
            'slug' => 'grado-2',
            'density_value' => 4.51,
            'density_unit' => 'g/cm3',
            'is_active' => true,
        ]);

        $gradeB = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'Grado 5',
            'slug' => 'grado-5',
            'density_value' => 4.43,
            'density_unit' => 'g/cm3',
            'is_active' => true,
        ]);

        return [$gradeA, $gradeB];
    }

    private function makeWorkbookUpload(array $dataRows): UploadedFile
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Normas');

        $sheet->fromArray([
            ['Emisor', 'Norma', 'Título', 'Familia', 'Subfamilia', 'Tipo', 'Aplicación web/comercial', 'Keywords SEO', 'Fuente'],
            ...$dataRows,
        ]);

        $tempPath = tempnam(sys_get_temp_dir(), 'catalog-normas-import');
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);

        return new UploadedFile(
            $tempPath,
            'catalog-normas-import.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );
    }
}

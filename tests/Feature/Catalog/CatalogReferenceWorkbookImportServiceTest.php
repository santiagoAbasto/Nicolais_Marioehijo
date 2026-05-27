<?php

namespace Tests\Feature\Catalog;

use App\Models\Catalog\CatalogFamily;
use App\Models\Catalog\CatalogGrade;
use App\Models\Catalog\CatalogLine;
use App\Models\Catalog\CatalogMaterialMapping;
use App\Models\Catalog\CatalogNorma;
use App\Models\Catalog\CatalogReferenceImportRun;
use App\Models\Catalog\CatalogSeries;
use App\Models\Catalog\CompositionProfile;
use App\Models\Catalog\CompositionStandard;
use App\Models\Catalog\CompositionStandardItem;
use App\Models\Catalog\ChemicalElement;
use App\Models\Catalog\GradeContentSection;
use App\Models\Catalog\GradeFeatureItem;
use App\Models\Catalog\GradeProperty;
use App\Models\Catalog\GradeStandard;
use App\Models\Catalog\SeriesContentSection;
use App\Models\SectionItem;
use App\Models\SiteSection;
use App\Services\Catalog\CatalogPublicResetService;
use App\Services\Catalog\Imports\CatalogReferenceWorkbookImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class CatalogReferenceWorkbookImportServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_reference_import_creates_a_distinct_line_for_each_steel_family(): void
    {
        $path = $this->makeReferenceWorkbook([
            ['ACEROS ALEADOS Y ESPECIALES', 'ACERO BAJA TEMPERATURA', 'Acero ASTM A333 Gr.3'],
            ['ACEROS INOXIDABLES', 'AISI 300', 'Acero AISI 304'],
        ]);

        $summary = app(CatalogReferenceWorkbookImportService::class)->import($path, ['all'], 'referencia.xlsx');

        $this->assertSame(2, $summary['processed_rows']);
        $this->assertSame(2, $summary['lines']);
        $this->assertSame(2, $summary['series']);
        $this->assertSame(2, $summary['grades']);

        $this->assertDatabaseHas('catalog_lines', [
            'slug' => 'aceros-aleados-y-especiales',
            'name' => 'Aceros aleados y especiales',
        ]);

        $this->assertDatabaseHas('catalog_lines', [
            'slug' => 'aceros-inoxidables',
            'name' => 'Aceros inoxidables',
        ]);

        $this->assertDatabaseMissing('catalog_lines', [
            'slug' => 'aceros',
        ]);
    }

    public function test_reference_import_keeps_excel_family_name_as_public_first_level_title(): void
    {
        $path = $this->makeReferenceWorkbook([
            ['ALEACIONES FUSIBLES Y BISMUTO Y SUS ALEACIONES', 'Aleaciones', 'ALEACION FUSIBLE 47°C'],
            ['ALEACIONES FUSIBLES Y BISMUTO Y SUS ALEACIONES', 'Bismuto', 'BISMUTO 99.99+%'],
        ]);

        $summary = app(CatalogReferenceWorkbookImportService::class)->import($path, ['all'], 'referencia.xlsx');

        $this->assertSame(2, $summary['processed_rows']);
        $this->assertDatabaseHas('catalog_lines', [
            'slug' => 'bismuto-y-aleaciones-fusibles',
            'name' => 'Aleaciones fusibles y bismuto y sus aleaciones',
            'intro_title' => 'Aleaciones fusibles y bismuto y sus aleaciones',
        ]);
        $this->assertDatabaseHas('catalog_series', [
            'slug' => 'aleaciones',
            'name' => 'Aleaciones',
        ]);
        $this->assertDatabaseHas('catalog_series', [
            'slug' => 'bismuto',
            'name' => 'Bismuto',
        ]);
    }

    public function test_reference_import_deactivates_legacy_steel_umbrella_line_when_split_families_exist(): void
    {
        $family = CatalogFamily::query()->create([
            'name' => 'Metálicos',
            'slug' => 'metalicos',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $legacyLine = CatalogLine::query()->create([
            'catalog_family_id' => $family->id,
            'name' => 'Aceros',
            'slug' => 'aceros',
            'sort_order' => 20,
            'is_active' => true,
        ]);

        $legacySeries = CatalogSeries::query()->create([
            'catalog_line_id' => $legacyLine->id,
            'name' => 'Aceros aleados',
            'slug' => 'aceros-aleados',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $legacyGrade = CatalogGrade::query()->create([
            'catalog_series_id' => $legacySeries->id,
            'name' => 'Acero 10CrMo910',
            'slug' => 'acero-10crmo910',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        CatalogMaterialMapping::query()->create([
            'external_material_id' => '848',
            'raw_material_name' => 'Acero 10CrMo910',
            'normalized_material_name' => 'acero 10crmo910',
            'catalog_family_id' => $family->id,
            'catalog_line_id' => $legacyLine->id,
            'catalog_series_id' => $legacySeries->id,
            'catalog_grade_id' => $legacyGrade->id,
            'is_active' => true,
        ]);

        $path = $this->makeReferenceWorkbook([
            ['ACEROS ALEADOS Y ESPECIALES', 'ACERO CROMO MOLIBDENO', 'Acero 10CrMo910'],
        ]);

        app(CatalogReferenceWorkbookImportService::class)->import($path, ['all'], 'referencia.xlsx');

        $this->assertDatabaseHas('catalog_lines', [
            'slug' => 'aceros',
            'is_active' => false,
        ]);

        $this->assertDatabaseHas('catalog_series', [
            'catalog_line_id' => $legacyLine->id,
            'slug' => 'aceros-aleados',
            'is_active' => false,
        ]);

        $this->assertDatabaseHas('catalog_grades', [
            'catalog_series_id' => $legacySeries->id,
            'slug' => 'acero-10crmo910',
            'is_active' => false,
        ]);

        $this->assertDatabaseHas('catalog_material_mappings', [
            'external_material_id' => '848',
            'is_active' => false,
        ]);
    }

    public function test_reference_import_reuses_same_line_and_grade_records_after_public_reset_and_keeps_image_ids(): void
    {
        $path = $this->makeReferenceWorkbook([
            ['ALEACIONES FUSIBLES Y BISMUTO Y SUS ALEACIONES', 'Aleaciones', 'ALEACION FUSIBLE 47°C'],
        ]);

        $summary = app(CatalogReferenceWorkbookImportService::class)->import($path, ['all'], 'referencia.xlsx');

        $this->assertSame(1, $summary['processed_rows']);

        $line = CatalogLine::query()->where('slug', 'bismuto-y-aleaciones-fusibles')->firstOrFail();
        $series = CatalogSeries::query()->where('catalog_line_id', $line->id)->where('slug', 'aleaciones')->firstOrFail();
        $grade = CatalogGrade::query()->where('catalog_series_id', $series->id)->where('slug', 'aleacion-fusible-47c')->firstOrFail();

        $line->update(['hero_media_id' => 601]);
        $grade->update(['hero_media_id' => 602]);

        app(CatalogPublicResetService::class)->reset();

        $this->assertDatabaseHas('catalog_reference_import_runs', [
            'status' => CatalogReferenceImportRun::STATUS_ROLLED_BACK,
        ]);
        $this->assertDatabaseHas('catalog_lines', [
            'id' => $line->id,
            'is_active' => false,
            'hero_media_id' => 601,
        ]);
        $this->assertDatabaseHas('catalog_grades', [
            'id' => $grade->id,
            'is_active' => false,
            'hero_media_id' => 602,
        ]);

        app(CatalogReferenceWorkbookImportService::class)->import($path, ['all'], 'referencia.xlsx');

        $reloadedLine = CatalogLine::query()->where('slug', 'bismuto-y-aleaciones-fusibles')->firstOrFail();
        $reloadedSeries = CatalogSeries::query()->where('catalog_line_id', $reloadedLine->id)->where('slug', 'aleaciones')->firstOrFail();
        $reloadedGrade = CatalogGrade::query()->where('catalog_series_id', $reloadedSeries->id)->where('slug', 'aleacion-fusible-47c')->firstOrFail();

        $this->assertSame($line->id, $reloadedLine->id);
        $this->assertSame($grade->id, $reloadedGrade->id);
        $this->assertSame(601, $reloadedLine->hero_media_id);
        $this->assertSame(602, $reloadedGrade->hero_media_id);
        $this->assertTrue($reloadedLine->is_active);
        $this->assertTrue($reloadedGrade->is_active);
    }

    public function test_public_reset_clears_product_admin_content_and_next_import_repopulates_from_excel(): void
    {
        $path = $this->makeReferenceWorkbook([
            ['TITANIO y sus aleaciones', 'TITANIO ALEADO', 'TITANIO Grado 2'],
        ]);

        app(CatalogReferenceWorkbookImportService::class)->import($path, ['all'], 'referencia.xlsx');

        $line = CatalogLine::query()->where('slug', 'titanio-y-sus-aleaciones')->firstOrFail();
        $series = CatalogSeries::query()->where('catalog_line_id', $line->id)->where('slug', 'titanio-aleado')->firstOrFail();
        $grade = CatalogGrade::query()->where('catalog_series_id', $series->id)->where('slug', 'titanio-grado-2')->firstOrFail();

        $line->update([
            'intro_title' => 'Título viejo de línea',
            'intro_text' => 'Texto viejo de línea',
        ]);
        $series->update([
            'intro_title' => 'Título viejo de serie',
            'intro_text' => 'Texto viejo de serie',
        ]);
        $grade->update([
            'short_title' => 'Short viejo',
            'intro_title' => 'Título viejo de grado',
            'intro_text' => 'Texto viejo de grado',
            'uns' => 'UNS-VIEJO',
        ]);

        SeriesContentSection::query()->create([
            'catalog_series_id' => $series->id,
            'section_key' => 'legacy',
            'title' => 'Legacy',
            'content' => 'Legacy',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        GradeContentSection::query()->create([
            'catalog_grade_id' => $grade->id,
            'section_key' => 'legacy',
            'title' => 'Legacy',
            'content' => 'Legacy',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        GradeFeatureItem::query()->create([
            'catalog_grade_id' => $grade->id,
            'text' => 'Feature vieja',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        GradeProperty::query()->create([
            'catalog_grade_id' => $grade->id,
            'group_name' => 'Grupo',
            'name' => 'Propiedad vieja',
            'value_text' => '123',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        GradeStandard::query()->create([
            'catalog_grade_id' => $grade->id,
            'code' => 'ASTM B265',
            'title' => 'Norma vieja',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $profile = CompositionProfile::query()->create([
            'catalog_grade_id' => $grade->id,
            'title' => 'Composición vieja',
            'subtitle' => 'Legacy',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $standard = CompositionStandard::query()->create([
            'catalog_composition_profile_id' => $profile->id,
            'label' => 'ASTM',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $element = ChemicalElement::query()->create([
            'symbol' => 'Ti',
            'name' => 'Titanio',
            'display_color' => '#25A7CA',
            'sort_order' => 1,
        ]);

        CompositionStandardItem::query()->create([
            'catalog_composition_standard_id' => $standard->id,
            'catalog_chemical_element_id' => $element->id,
            'display_label' => 'Ti',
            'display_percent' => 99.5,
            'sort_order' => 1,
        ]);

        $applicationsSection = SiteSection::query()->create([
            'page_key' => 'home',
            'section_key' => 'applications',
            'title' => 'Aplicaciones',
            'is_active' => true,
        ]);

        $application = SectionItem::query()->create([
            'site_section_id' => $applicationsSection->id,
            'title' => 'Aplicación vieja',
            'item_key' => 'aplicacion-vieja',
            'sort_order' => 'A',
            'is_active' => true,
        ]);

        DB::table('catalog_grade_applications')->insert([
            'catalog_grade_id' => $grade->id,
            'section_item_id' => $application->id,
            'sort_order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        app(CatalogPublicResetService::class)->reset();

        $this->assertDatabaseCount('catalog_series_content_sections', 0);
        $this->assertDatabaseCount('catalog_grade_content_sections', 0);
        $this->assertDatabaseCount('catalog_grade_feature_items', 0);
        $this->assertDatabaseCount('catalog_grade_properties', 0);
        $this->assertDatabaseCount('catalog_grade_standards', 0);
        $this->assertDatabaseCount('catalog_composition_profiles', 0);
        $this->assertDatabaseCount('catalog_composition_standards', 0);
        $this->assertDatabaseCount('catalog_composition_standard_items', 0);
        $this->assertDatabaseCount('catalog_grade_norma', 0);
        $this->assertDatabaseCount('catalog_grade_applications', 0);
        $this->assertDatabaseHas('catalog_lines', [
            'id' => $line->id,
            'intro_title' => null,
            'intro_text' => null,
            'is_active' => false,
        ]);
        $this->assertDatabaseHas('catalog_series', [
            'id' => $series->id,
            'intro_title' => null,
            'intro_text' => null,
            'is_active' => false,
        ]);
        $this->assertDatabaseHas('catalog_grades', [
            'id' => $grade->id,
            'short_title' => null,
            'intro_title' => null,
            'intro_text' => null,
            'uns' => null,
            'is_active' => false,
        ]);

        app(CatalogReferenceWorkbookImportService::class)->import($path, ['all'], 'referencia.xlsx');

        $reloadedLine = CatalogLine::query()->findOrFail($line->id);
        $reloadedSeries = CatalogSeries::query()->findOrFail($series->id);
        $reloadedGrade = CatalogGrade::query()->findOrFail($grade->id);

        $this->assertSame('Titanio y sus aleaciones', $reloadedLine->intro_title);
        $this->assertSame('Línea importada desde el Excel de referencia técnico-comercial.', $reloadedLine->intro_text);
        $this->assertSame('TITANIO ALEADO', $reloadedSeries->intro_title);
        $this->assertSame('Serie importada desde el Excel de referencia del catálogo.', $reloadedSeries->intro_text);
        $this->assertSame('TITANIO Grado 2', $reloadedGrade->short_title);
        $this->assertSame('TITANIO Grado 2', $reloadedGrade->intro_title);
    }

    public function test_reference_import_maps_copete_to_intro_text_and_extra_texts_to_editorial_sections(): void
    {
        $astmNorma = CatalogNorma::query()->create([
            'nombre_emisor' => 'ASTM',
            'norma' => 'F1295',
            'descripcion_corta' => 'ASTM F1295',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $isoNorma = CatalogNorma::query()->create([
            'nombre_emisor' => 'ISO',
            'norma' => '5832-11',
            'descripcion_corta' => 'ISO 5832-11',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $enIsoNorma = CatalogNorma::query()->create([
            'nombre_emisor' => 'EN ISO',
            'norma' => '5832-11',
            'descripcion_corta' => 'EN ISO 5832-11',
            'sort_order' => 3,
            'is_active' => true,
        ]);

        $path = $this->makeReferenceWorkbookWithHeaders(
            ['FAMILIA', 'SUBFAMILIA', 'PRODUCTO', 'Comentarios', 'Fuente / Norma utilizada', 'Normas', 'Copete', 'Texto 1', 'Título 2', 'Texto 2'],
            [[
                'TITANIO y sus aleaciones',
                'TITANIO ALEADO',
                'TITANIO 6Al7Nb',
                'Comentario técnico breve',
                'ASTM F1295',
                'ISO 5832-11; EN ISO 5832-11',
                'Aleación de titanio biocompatible libre de vanadio',
                'Titanio Ti-6Al-7Nb',
                '<p>Texto extendido del material.</p>',
                'Normas y propiedades médicas',
            ]]
        );

        app(CatalogReferenceWorkbookImportService::class)->import($path, ['all'], 'referencia.xlsx');

        $grade = CatalogGrade::query()
            ->where('slug', 'titanio-6al7nb')
            ->firstOrFail();

        $this->assertSame('TITANIO 6Al7Nb', $grade->intro_title);
        $this->assertSame('Aleación de titanio biocompatible libre de vanadio', $grade->intro_text);

        $this->assertSame(
            [
                [
                    'section_key' => 'excel-import-primary',
                    'title' => 'Titanio Ti-6Al-7Nb',
                    'content' => '<p>Texto extendido del material.</p>',
                ],
                [
                    'section_key' => 'excel-import-secondary',
                    'title' => 'Normas y propiedades médicas',
                    'content' => 'Comentario técnico breve',
                ],
            ],
            GradeContentSection::query()
                ->where('catalog_grade_id', $grade->id)
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['section_key', 'title', 'content'])
                ->map(fn (GradeContentSection $section) => [
                    'section_key' => $section->section_key,
                    'title' => $section->title,
                    'content' => $section->content,
                ])
                ->all()
        );

        $this->assertSame([], $grade->standards()->pluck('code')->all());

        $this->assertSame(
            [$astmNorma->id, $isoNorma->id, $enIsoNorma->id],
            $grade->normas()
                ->orderBy('catalog_grade_norma.sort_order')
                ->pluck('catalog_normas.id')
                ->map(fn ($id) => (int) $id)
                ->all()
        );
    }

    public function test_reference_import_can_match_norma_by_unique_code_when_excel_prefix_differs(): void
    {
        $astmNorma = CatalogNorma::query()->create([
            'nombre_emisor' => 'ASTM',
            'norma' => 'F1295',
            'descripcion_corta' => 'ASTM F1295',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $isoNorma = CatalogNorma::query()->create([
            'nombre_emisor' => 'ISO',
            'norma' => '5832-11',
            'descripcion_corta' => 'ISO 5832-11',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $path = $this->makeReferenceWorkbookWithHeaders(
            ['FAMILIA', 'SUBFAMILIA', 'PRODUCTO', 'Fuente / Norma utilizada', 'Normas'],
            [[
                'TITANIO y sus aleaciones',
                'TITANIO ALEADO',
                'TITANIO 6Al7Nb',
                'ASTM F1295',
                'EN ISO 5832-11',
            ]]
        );

        app(CatalogReferenceWorkbookImportService::class)->import($path, ['all'], 'referencia.xlsx');

        $grade = CatalogGrade::query()
            ->where('slug', 'titanio-6al7nb')
            ->firstOrFail();

        $this->assertSame(
            [$astmNorma->id, $isoNorma->id],
            $grade->normas()
                ->orderBy('catalog_grade_norma.sort_order')
                ->pluck('catalog_normas.id')
                ->map(fn ($id) => (int) $id)
                ->all()
        );
    }

    public function test_reference_import_matches_norma_when_excel_adds_parenthetical_qualifier(): void
    {
        $awsNorma = CatalogNorma::query()->create([
            'nombre_emisor' => 'AWS',
            'norma' => 'A5.16',
            'descripcion_corta' => 'AWS A5.16',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $path = $this->makeReferenceWorkbookWithHeaders(
            ['FAMILIA', 'SUBFAMILIA', 'PRODUCTO', 'Normas'],
            [[
                'TITANIO y sus aleaciones',
                'TITANIO ALEADO',
                'TITANIO Grado 5 (6Al4V)',
                'AWS A5.16 (ERTi-5)',
            ]]
        );

        app(CatalogReferenceWorkbookImportService::class)->import($path, ['all'], 'referencia.xlsx');

        $grade = CatalogGrade::query()
            ->where('slug', 'titanio-grado-5-6al4v')
            ->firstOrFail();

        $this->assertSame(
            [$awsNorma->id],
            $grade->normas()
                ->orderBy('catalog_grade_norma.sort_order')
                ->pluck('catalog_normas.id')
                ->map(fn ($id) => (int) $id)
                ->all()
        );
    }

    public function test_reference_import_expands_grouped_slash_norma_codes(): void
    {
        $b337 = CatalogNorma::query()->create([
            'nombre_emisor' => 'ASTM',
            'norma' => 'B337',
            'descripcion_corta' => 'ASTM B337',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $b338 = CatalogNorma::query()->create([
            'nombre_emisor' => 'ASTM',
            'norma' => 'B338',
            'descripcion_corta' => 'ASTM B338',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $path = $this->makeReferenceWorkbookWithHeaders(
            ['FAMILIA', 'SUBFAMILIA', 'PRODUCTO', 'Normas'],
            [[
                'TITANIO y sus aleaciones',
                'TITANIO PURO',
                'TITANIO Grado 2',
                'ASTM B337/B338',
            ]]
        );

        app(CatalogReferenceWorkbookImportService::class)->import($path, ['all'], 'referencia.xlsx');

        $grade = CatalogGrade::query()
            ->where('slug', 'titanio-grado-2')
            ->firstOrFail();

        $this->assertSame(
            [$b337->id, $b338->id],
            $grade->normas()
                ->orderBy('catalog_grade_norma.sort_order')
                ->pluck('catalog_normas.id')
                ->map(fn ($id) => (int) $id)
                ->all()
        );
    }

    public function test_reference_import_keeps_long_copete_in_intro_text_and_grade_name_as_title(): void
    {
        $copete = 'Aleación de titanio alfa beta biocompatible con seis por ciento de aluminio y siete por ciento de niobio. '
            .'Desarrollada para implantes médicos de alta exigencia como alternativa libre de vanadio al Ti-6Al-4V. '
            .'Conserva alta resistencia mecánica y excelente biocompatibilidad para usos ortopédicos y quirúrgicos.';

        $path = $this->makeReferenceWorkbookWithHeaders(
            ['FAMILIA', 'SUBFAMILIA', 'PRODUCTO', 'Copete', 'Texto 1'],
            [[
                'TITANIO y sus aleaciones',
                'TITANIO ALEADO',
                'TITANIO 6Al7Nb',
                $copete,
                'Aplicaciones médicas y quirúrgicas',
            ]]
        );

        app(CatalogReferenceWorkbookImportService::class)->import($path, ['all'], 'referencia.xlsx');

        $grade = CatalogGrade::query()
            ->where('slug', 'titanio-6al7nb')
            ->firstOrFail();

        $this->assertSame('TITANIO 6Al7Nb', $grade->intro_title);
        $this->assertSame($copete, $grade->intro_text);
        $this->assertSame(
            [[
                'section_key' => 'excel-import-primary',
                'title' => null,
                'content' => 'Aplicaciones médicas y quirúrgicas',
            ]],
            GradeContentSection::query()
                ->where('catalog_grade_id', $grade->id)
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['section_key', 'title', 'content'])
                ->map(fn (GradeContentSection $section) => [
                    'section_key' => $section->section_key,
                    'title' => $section->title,
                    'content' => $section->content,
                ])
                ->all()
        );
    }

    public function test_reference_import_reads_secondary_editorial_html_from_extra_column_after_texto_2(): void
    {
        $path = $this->makeReferenceWorkbookWithHeaders(
            ['FAMILIA', 'SUBFAMILIA', 'PRODUCTO', 'Copete', 'Texto 1', 'Título 2', 'Texto 2', ''],
            [[
                'TITANIO y sus aleaciones',
                'TITANIO ALEADO',
                'TITANIO 6Al7Nb',
                'Copete breve del material.',
                'Titanio Ti-6Al-7Nb: La Aleación para Implantes sin Vanadio',
                '<p>Bloque principal del material.</p>',
                'Normas ISO y Propiedades Médicas',
                '<h3>Propiedades mecánicas</h3><ul><li>TS: 900 MPa mín.</li></ul>',
            ]]
        );

        app(CatalogReferenceWorkbookImportService::class)->import($path, ['all'], 'referencia.xlsx');

        $grade = CatalogGrade::query()
            ->where('slug', 'titanio-6al7nb')
            ->firstOrFail();

        $this->assertSame(
            [
                [
                    'section_key' => 'excel-import-primary',
                    'title' => 'Titanio Ti-6Al-7Nb: La Aleación para Implantes sin Vanadio',
                    'content' => '<p>Bloque principal del material.</p>',
                ],
                [
                    'section_key' => 'excel-import-secondary',
                    'title' => 'Normas ISO y Propiedades Médicas',
                    'content' => '<h3>Propiedades mecánicas</h3><ul><li>TS: 900 MPa mín.</li></ul>',
                ],
            ],
            GradeContentSection::query()
                ->where('catalog_grade_id', $grade->id)
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['section_key', 'title', 'content'])
                ->map(fn (GradeContentSection $section) => [
                    'section_key' => $section->section_key,
                    'title' => $section->title,
                    'content' => $section->content,
                ])
                ->all()
        );
    }

    public function test_reference_preview_treats_inactive_cleaned_materials_as_new_upload_data(): void
    {
        $family = CatalogFamily::query()->create([
            'name' => 'Metálicos',
            'slug' => 'metalicos',
            'is_active' => false,
        ]);

        $line = CatalogLine::query()->create([
            'catalog_family_id' => $family->id,
            'name' => 'Titanio y sus aleaciones',
            'slug' => 'titanio-y-sus-aleaciones',
            'is_active' => false,
        ]);

        $series = CatalogSeries::query()->create([
            'catalog_line_id' => $line->id,
            'name' => 'TITANIO ALEADO',
            'slug' => 'titanio-aleado',
            'is_active' => false,
        ]);

        $grade = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'TITANIO 6Al7Nb',
            'slug' => 'titanio-6al7nb',
            'is_active' => false,
        ]);

        CatalogMaterialMapping::query()->create([
            'external_material_id' => '848',
            'raw_material_name' => 'TITANIO 6Al7Nb',
            'normalized_material_name' => 'titanio 6al7nb',
            'catalog_family_id' => $family->id,
            'catalog_line_id' => $line->id,
            'catalog_series_id' => $series->id,
            'catalog_grade_id' => $grade->id,
            'is_active' => false,
        ]);

        $path = $this->makeReferenceWorkbookWithHeaders(
            ['IDMater', 'FAMILIA', 'SUBFAMILIA', 'PRODUCTO'],
            [['848', 'TITANIO y sus aleaciones', 'TITANIO ALEADO', 'TITANIO 6Al7Nb']]
        );

        $preview = app(CatalogReferenceWorkbookImportService::class)->preview($path, ['all']);

        $this->assertSame(1, $preview['new_lines_count']);
        $this->assertSame(1, $preview['new_series_count']);
        $this->assertSame(1, $preview['new_grades_count']);
        $this->assertSame(1, $preview['new_material_mappings_count']);
    }

    private function makeReferenceWorkbook(array $rows): string
    {
        return $this->makeReferenceWorkbookWithHeaders(
            ['FAMILIA', 'SUBFAMILIA', 'PRODUCTO'],
            $rows,
        );
    }

    private function makeReferenceWorkbookWithHeaders(array $headers, array $rows): string
    {
        $spreadsheet = new Spreadsheet();
        $groupSheet = $spreadsheet->getActiveSheet();
        $groupSheet->setTitle('GRUPO');
        $groupSheet->fromArray([
            ['FAMILIA'],
            ['TODO'],
        ]);

        $materialsSheet = $spreadsheet->createSheet();
        $materialsSheet->setTitle('Materiales');
        $materialsSheet->fromArray([
            $headers,
            ...$rows,
        ]);

        $path = tempnam(sys_get_temp_dir(), 'catalog-reference-');

        (new Xlsx($spreadsheet))->save($path);

        return $path;
    }
}

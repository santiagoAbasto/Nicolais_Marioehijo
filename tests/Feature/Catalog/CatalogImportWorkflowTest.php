<?php

namespace Tests\Feature\Catalog;

use App\Models\Catalog\CatalogFamily;
use App\Models\Catalog\CatalogGrade;
use App\Models\Catalog\CatalogImportBatch;
use App\Models\Catalog\CatalogLine;
use App\Models\Catalog\CatalogMaterialMapping;
use App\Models\Catalog\CatalogSeries;
use App\Models\Catalog\CatalogShapeMapping;
use App\Models\Catalog\CatalogStagingProduct;
use App\Models\Catalog\Shape;
use App\Models\Catalog\ShapeFamily;
use App\Models\Catalog\ProductVariantMedia;
use App\Models\Catalog\VariantOffer;
use App\Services\Catalog\CatalogPublicResetService;
use App\Services\Catalog\Imports\CatalogProductImportService;
use App\Services\Catalog\Imports\CatalogProductImportValidator;
use App\Services\Catalog\Imports\CatalogProductMappingResolver;
use App\Services\Catalog\Imports\CatalogProductPublishService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class CatalogImportWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_batch_requires_mapping_before_publish(): void
    {
        Storage::fake('local');

        $file = $this->makeWorkbookUpload([
            ['1001', '44', 'SKU-44', '10', '20', 'Tornilleria', '6.35', 'Titanio Grado 2', 'Arandela', 'Ø int. 6.350 mm', 'Si', 'Arandela titanio', 'Si', 'No'],
        ]);

        $batch = app(CatalogProductImportService::class)->uploadAndStage($file);

        $this->assertSame('needs_mapping', $batch->status);
        $this->assertDatabaseCount('catalog_staging_products', 1);
        $this->assertDatabaseCount('catalog_import_batch_errors', 1);
        $this->assertDatabaseHas('catalog_import_batch_errors', [
            'field_name' => 'id_material',
            'error_message' => 'La fila no tiene material mapeado a un grado del catálogo.',
        ]);
    }

    public function test_import_can_be_revalidated_and_published_after_mappings_exist(): void
    {
        Storage::fake('local');

        [$family, $line, $series, $grade, $shapeFamily, $shape] = $this->seedCatalog();

        $file = $this->makeWorkbookUpload([
            ['1001', '44', 'SKU-44', '10', '20', 'Tornilleria', '6.35', 'Titanio Comercial G2', 'Arandela', 'Ø int. 6.350 mm', 'Si', 'Arandela titanio', 'Si', 'No'],
        ]);

        $importService = app(CatalogProductImportService::class);
        $resolver = app(CatalogProductMappingResolver::class);
        $validator = app(CatalogProductImportValidator::class);
        $publishService = app(CatalogProductPublishService::class);

        $batch = $importService->uploadAndStage($file);
        $this->assertSame('needs_mapping', $batch->status);

        CatalogMaterialMapping::query()->create([
            'external_material_id' => '44',
            'raw_material_name' => 'Titanio Comercial G2',
            'normalized_material_name' => 'titanio comercial g2',
            'catalog_family_id' => $family->id,
            'catalog_line_id' => $line->id,
            'catalog_series_id' => $series->id,
            'catalog_grade_id' => $grade->id,
            'is_active' => true,
        ]);

        CatalogShapeMapping::query()->create([
            'external_shape_id' => '20',
            'external_shape_family_id' => '10',
            'raw_shape_name' => 'Arandela',
            'normalized_shape_name' => 'arandela',
            'catalog_shape_family_id' => $shapeFamily->id,
            'catalog_shape_id' => $shape->id,
            'is_active' => true,
        ]);

        $resolver->resolveBatch($batch->fresh());
        $validator->validateBatch($batch->fresh());
        $batch = $batch->fresh();

        $this->assertSame('ready_to_publish', $batch->status);

        $publishService->publish($batch);

        $this->assertDatabaseHas('catalog_grade_products', [
            'catalog_grade_id' => $grade->id,
            'catalog_shape_id' => $shape->id,
        ]);

        $this->assertDatabaseHas('catalog_product_variants', [
            'external_product_id' => '1001',
            'external_material_id' => '44',
            'external_code' => 'SKU-44',
            'is_offer' => true,
            'is_active' => true,
        ]);

        $this->assertDatabaseCount('catalog_variant_offers', 1);
        $this->assertDatabaseHas('catalog_import_batches', [
            'id' => $batch->id,
            'status' => 'published',
        ]);
    }

    public function test_import_uses_material_name_before_stale_external_material_mapping(): void
    {
        Storage::fake('local');

        [$family, $line, $series, $grade] = $this->seedCatalog();
        $grade->update([
            'name' => 'Titanio Grado 2',
            'short_title' => 'Titanio Grado 2',
            'slug' => 'titanio-grado-2',
        ]);

        $wrongSeries = CatalogSeries::query()->create([
            'catalog_line_id' => $line->id,
            'name' => 'Titanio aleado',
            'slug' => 'titanio-aleado',
        ]);

        $wrongGrade = CatalogGrade::query()->create([
            'catalog_series_id' => $wrongSeries->id,
            'name' => 'Titanio Grado 23 (6Al4V-ELI)',
            'slug' => 'titanio-grado-23-6al4v-eli',
            'density_value' => 4.43,
            'density_unit' => 'g/cm3',
        ]);

        CatalogMaterialMapping::query()->create([
            'external_material_id' => '44',
            'raw_material_name' => 'Titanio Grado 23 (6Al4V-ELI)',
            'normalized_material_name' => 'titanio grado 23 (6al4v-eli)',
            'catalog_family_id' => $family->id,
            'catalog_line_id' => $line->id,
            'catalog_series_id' => $wrongSeries->id,
            'catalog_grade_id' => $wrongGrade->id,
            'is_active' => true,
        ]);

        $file = $this->makeWorkbookUpload([
            ['1001', '44', 'SKU-44', '10', '20', 'Tornilleria', '6.35', 'Titanio Grado 2', 'Arandela', 'Ø int. 6.350 mm', 'Si', 'Arandela titanio', 'No', 'No'],
        ]);

        $batch = app(CatalogProductImportService::class)->uploadAndStage($file);

        $this->assertSame('ready_to_publish', $batch->status);
        $this->assertDatabaseHas('catalog_staging_products', [
            'catalog_import_batch_id' => $batch->id,
            'mapped_catalog_grade_id' => $grade->id,
            'validation_status' => 'valid',
        ]);

        app(CatalogProductPublishService::class)->publish($batch->fresh());

        $this->assertDatabaseHas('catalog_grade_products', [
            'catalog_grade_id' => $grade->id,
        ]);

        $this->assertDatabaseMissing('catalog_grade_products', [
            'catalog_grade_id' => $wrongGrade->id,
        ]);
    }

    public function test_stock_import_can_be_uploaded_repeatedly_without_duplicates_and_deactivates_missing_rows(): void
    {
        Storage::fake('local');

        [, , , $grade, $shapeFamily, $shape] = $this->seedCatalog();
        $grade->update([
            'name' => 'Titanio Grado 2',
            'short_title' => 'Titanio Grado 2',
            'slug' => 'titanio-grado-2',
        ]);

        $secondShape = Shape::query()->create([
            'catalog_shape_family_id' => $shapeFamily->id,
            'name' => 'Chapa',
            'slug' => 'chapa',
            'is_active' => true,
        ]);

        $rows = [
            ['1001', '44', 'SKU-44', '10', '20', 'Tornilleria', '6.35', 'Titanio Grado 2', $shape->name, 'Ø int. 6.350 mm', 'Si', 'Arandela titanio', 'No', 'No'],
            ['1002', '44', 'SKU-45', '10', '21', 'Tornilleria', '1.00', 'Titanio Grado 2', $secondShape->name, 'Espesor 1.000 mm', 'No', 'Chapa titanio', 'No', 'No'],
        ];

        $importService = app(CatalogProductImportService::class);
        $publishService = app(CatalogProductPublishService::class);

        $firstBatch = $importService->uploadAndStage($this->makeWorkbookUpload($rows));
        $publishService->publish($firstBatch->fresh());

        $secondBatch = $importService->uploadAndStage($this->makeWorkbookUpload($rows));
        $publishService->publish($secondBatch->fresh());

        $this->assertDatabaseCount('catalog_product_variants', 2);
        $this->assertDatabaseCount('catalog_grade_products', 2);
        $this->assertDatabaseHas('catalog_product_variants', [
            'external_product_id' => '1001',
            'is_active' => true,
        ]);
        $this->assertDatabaseHas('catalog_product_variants', [
            'external_product_id' => '1002',
            'is_active' => true,
        ]);

        $replacementBatch = $importService->uploadAndStage($this->makeWorkbookUpload([$rows[0]]));
        $publishService->publish($replacementBatch->fresh());

        $this->assertDatabaseCount('catalog_product_variants', 2);
        $this->assertDatabaseHas('catalog_product_variants', [
            'external_product_id' => '1001',
            'is_active' => true,
        ]);
        $this->assertDatabaseHas('catalog_product_variants', [
            'external_product_id' => '1002',
            'is_active' => false,
        ]);
        $this->assertDatabaseHas('catalog_grade_products', [
            'catalog_grade_id' => $grade->id,
            'catalog_shape_id' => $secondShape->id,
            'is_active' => false,
        ]);

        $this->assertSame(1, $replacementBatch->fresh()->summary_json['deactivated_rows']);
        $this->assertSame(1, $replacementBatch->fresh()->summary_json['deactivated_grade_products']);
    }

    public function test_import_can_mark_offer_as_hidden_from_public_web_when_no_publicar_is_set(): void
    {
        Storage::fake('local');

        [$family, $line, $series, $grade, $shapeFamily, $shape] = $this->seedCatalog();

        CatalogMaterialMapping::query()->create([
            'external_material_id' => '848',
            'raw_material_name' => 'Acero 10CrMo910',
            'normalized_material_name' => 'acero 10crmo910',
            'catalog_family_id' => $family->id,
            'catalog_line_id' => $line->id,
            'catalog_series_id' => $series->id,
            'catalog_grade_id' => $grade->id,
            'is_active' => true,
        ]);

        CatalogShapeMapping::query()->create([
            'external_shape_id' => 'BAR RED',
            'external_shape_family_id' => 'RED',
            'raw_shape_name' => 'Barra Red. / Varilla',
            'normalized_shape_name' => 'barra red. / varilla',
            'catalog_shape_family_id' => $shapeFamily->id,
            'catalog_shape_id' => $shape->id,
            'is_active' => true,
        ]);

        $file = $this->makeWorkbookUpload(
            [
                [3320, 848, 'SKU-848', 'RED', 'BAR RED', 'Largos: Barras y Perfiles', 'Acero 10CrMo910', 'Barra Red. / Varilla', 'Ø', 133, 'mm', '', 'Acero 10CrMo910 Barra Red. / Varilla Ø 0133.000 mm', 'VERDADERO', 'X', 'X', ''],
            ],
            ['IDproducto', 'CódigoMaterial', 'Cod_Num', 'CódigoFamiliaForma', 'CódigoForma', 'FamiliaForma', 'Material', 'Forma', 'Dimensión Principal', 'ValorDimensionPrincipal', 'UnidadDimensionPrincipal', 'OtrasDimensiones', 'Descripción', 'A_Pedido', 'Oferta', 'NOPublicar', 'Discontinuo']
        );

        $batch = app(CatalogProductImportService::class)->uploadAndStage($file);

        $this->assertSame('ready_to_publish', $batch->status);

        app(CatalogProductPublishService::class)->publish($batch->fresh());

        $this->assertDatabaseHas('catalog_product_variants', [
            'external_product_id' => '3320',
            'external_material_id' => '848',
            'is_offer' => true,
            'is_active' => true,
            'is_public_visible' => false,
        ]);

        $this->assertDatabaseCount('catalog_variant_offers', 1);
        $this->assertSame(0, $batch->fresh()->summary_json['public_visible_rows']);
        $this->assertSame(1, $batch->fresh()->summary_json['hidden_from_web_rows']);
        $this->assertSame(1, $batch->fresh()->summary_json['offer_flag_rows']);
    }

    public function test_import_matches_existing_grade_when_excel_uses_flexible_titanium_aliases(): void
    {
        Storage::fake('local');

        [$family, $line, $series, $grade, $shapeFamily, $shape] = $this->seedCatalog();

        $grade->update([
            'name' => 'TITANIO Grado 5 (6Al4V)',
            'short_title' => 'TITANIO Grado 5 (6Al4V)',
            'slug' => 'titanio-grado-5-6al4v',
        ]);

        $secondGrade = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'TITANIO 6Al7Nb',
            'short_title' => 'TITANIO 6Al7Nb',
            'slug' => 'titanio-6al7nb',
            'density_value' => 4.51,
            'density_unit' => 'g/cm3',
        ]);

        CatalogShapeMapping::query()->create([
            'external_shape_id' => '20',
            'external_shape_family_id' => '10',
            'raw_shape_name' => 'Arandela',
            'normalized_shape_name' => 'arandela',
            'catalog_shape_family_id' => $shapeFamily->id,
            'catalog_shape_id' => $shape->id,
            'is_active' => true,
        ]);

        $file = $this->makeWorkbookUpload([
            ['1001', '44', 'SKU-44', '10', '20', 'Tornilleria', '6.35', 'Titanio Grado 5', 'Arandela', 'Ø int. 6.350 mm', 'Si', 'Arandela titanio', 'No', 'No'],
            ['1002', '45', 'SKU-45', '10', '20', 'Tornilleria', '6.35', 'Titanio 6Al-7Nb F-1295', 'Arandela', 'Ø int. 6.350 mm', 'Si', 'Arandela titanio', 'No', 'No'],
        ]);

        $batch = app(CatalogProductImportService::class)->uploadAndStage($file);

        $this->assertSame('ready_to_publish', $batch->status);
        $this->assertDatabaseHas('catalog_staging_products', [
            'catalog_import_batch_id' => $batch->id,
            'nombre_material' => 'Titanio Grado 5',
            'mapped_catalog_grade_id' => $grade->id,
            'validation_status' => 'valid',
        ]);
        $this->assertDatabaseHas('catalog_staging_products', [
            'catalog_import_batch_id' => $batch->id,
            'nombre_material' => 'Titanio 6Al-7Nb F-1295',
            'mapped_catalog_grade_id' => $secondGrade->id,
            'validation_status' => 'valid',
        ]);
    }

    public function test_import_matches_existing_grade_when_excel_uses_real_world_metallurgical_aliases(): void
    {
        Storage::fake('local');

        [$family, $line, $series, , $shapeFamily, $shape] = $this->seedCatalog();

        $alloyGrade = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'ALLOY 20Cb3',
            'short_title' => 'ALLOY 20Cb3',
            'slug' => 'alloy-20cb3',
            'uns' => 'N08020',
            'density_value' => 8.0,
            'density_unit' => 'g/cm3',
        ]);

        $duplexGrade = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'ACERO DUPLEX 2507',
            'short_title' => 'ACERO DUPLEX 2507',
            'slug' => 'acero-duplex-2507',
            'uns' => 'S32750',
            'density_value' => 7.8,
            'density_unit' => 'g/cm3',
        ]);

        $cuproniquelGrade = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'CUPRONIQUEL 90/10',
            'short_title' => 'CUPRONIQUEL 90/10',
            'slug' => 'cuproniquel-90-10',
            'uns' => 'C70600',
            'density_value' => 8.9,
            'density_unit' => 'g/cm3',
        ]);

        $aisi431Grade = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'ACERO AISI 431',
            'short_title' => 'ACERO AISI 431',
            'slug' => 'acero-aisi-431',
            'uns' => 'S43100',
            'density_value' => 7.7,
            'density_unit' => 'g/cm3',
        ]);

        CatalogShapeMapping::query()->create([
            'external_shape_id' => '20',
            'external_shape_family_id' => '10',
            'raw_shape_name' => 'Arandela',
            'normalized_shape_name' => 'arandela',
            'catalog_shape_family_id' => $shapeFamily->id,
            'catalog_shape_id' => $shape->id,
            'is_active' => true,
        ]);

        $file = $this->makeWorkbookUpload([
            ['2001', '501', 'SKU-501', '10', '20', 'Tornilleria', '6.35', 'Alloy 20', 'Arandela', 'Ø int. 6.350 mm', 'Si', 'Alias comercial', 'No', 'No'],
            ['2002', '502', 'SKU-502', '10', '20', 'Tornilleria', '6.35', 'Acero Duplex S32750 2507', 'Arandela', 'Ø int. 6.350 mm', 'Si', 'Alias por UNS', 'No', 'No'],
            ['2003', '503', 'SKU-503', '10', '20', 'Tornilleria', '6.35', 'Cobre Niquel 90/10', 'Arandela', 'Ø int. 6.350 mm', 'Si', 'Sinonimo comercial', 'No', 'No'],
            ['2004', '504', 'SKU-504', '10', '20', 'Tornilleria', '6.35', 'Acero AISI 431 WN 1.4057', 'Arandela', 'Ø int. 6.350 mm', 'Si', 'Alias con Werkstoff', 'No', 'No'],
        ]);

        $batch = app(CatalogProductImportService::class)->uploadAndStage($file);

        $this->assertSame('ready_to_publish', $batch->status);
        $this->assertDatabaseHas('catalog_staging_products', [
            'catalog_import_batch_id' => $batch->id,
            'nombre_material' => 'Alloy 20',
            'mapped_catalog_grade_id' => $alloyGrade->id,
            'validation_status' => 'valid',
        ]);
        $this->assertDatabaseHas('catalog_staging_products', [
            'catalog_import_batch_id' => $batch->id,
            'nombre_material' => 'Acero Duplex S32750 2507',
            'mapped_catalog_grade_id' => $duplexGrade->id,
            'validation_status' => 'valid',
        ]);
        $this->assertDatabaseHas('catalog_staging_products', [
            'catalog_import_batch_id' => $batch->id,
            'nombre_material' => 'Cobre Niquel 90/10',
            'mapped_catalog_grade_id' => $cuproniquelGrade->id,
            'validation_status' => 'valid',
        ]);
        $this->assertDatabaseHas('catalog_staging_products', [
            'catalog_import_batch_id' => $batch->id,
            'nombre_material' => 'Acero AISI 431 WN 1.4057',
            'mapped_catalog_grade_id' => $aisi431Grade->id,
            'validation_status' => 'valid',
        ]);
    }

    public function test_existing_stock_batch_can_be_reprocessed_after_creating_missing_grade(): void
    {
        Storage::fake('local');

        [$family, $line, $series, , $shapeFamily, $shape] = $this->seedCatalog();

        CatalogShapeMapping::query()->create([
            'external_shape_id' => 'TUB',
            'external_shape_family_id' => 'TUB',
            'raw_shape_name' => 'Tubo',
            'normalized_shape_name' => 'tubo',
            'catalog_shape_family_id' => $shapeFamily->id,
            'catalog_shape_id' => $shape->id,
            'is_active' => true,
        ]);

        $file = $this->makeWorkbookUpload(
            [
                [3320, 848, 'TUB', 'TUB', 'Tubular: Tubos, caños y sus accesorios', 'Acero 10CrMo910', 'Tubo', 'Øe', 33.7, 'mm', 'x3.6mm s/c', 'Acero 10CrMo910 Tubo Øe 0033.700 mm x3.6mm s/c', 'No', 'No'],
            ],
            ['IDproducto', 'CódigoMaterial', 'CódigoFamiliaForma', 'CódigoForma', 'FamiliaForma', 'Material', 'Forma', 'Dimensión Principal', 'ValorDimensionPrincipal', 'UnidadDimensionPrincipal', 'OtrasDimensiones', 'Descripción', 'NOPublicar', 'Discontinuo']
        );

        $batch = app(CatalogProductImportService::class)->uploadAndStage($file, type: 'product_stock_excel');

        $this->assertSame('needs_mapping', $batch->status);
        $this->assertDatabaseHas('catalog_staging_products', [
            'catalog_import_batch_id' => $batch->id,
            'nombre_material' => 'Acero 10CrMo910',
            'mapped_catalog_grade_id' => null,
        ]);

        $grade = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'Acero 10CrMo910',
            'short_title' => 'Acero 10CrMo910',
            'slug' => 'acero-10crmo910',
            'density_value' => 7.85,
            'density_unit' => 'g/cm3',
            'is_active' => true,
        ]);

        app(CatalogProductMappingResolver::class)->resolveBatch($batch->fresh());
        app(CatalogProductImportValidator::class)->validateBatch($batch->fresh());
        app(CatalogProductPublishService::class)->publishResolvedRows($batch->fresh());

        $this->assertDatabaseHas('catalog_staging_products', [
            'catalog_import_batch_id' => $batch->id,
            'nombre_material' => 'Acero 10CrMo910',
            'mapped_catalog_grade_id' => $grade->id,
            'validation_status' => 'valid',
        ]);
        $this->assertDatabaseHas('catalog_product_variants', [
            'external_product_id' => '3320',
            'external_material_id' => '848',
            'is_public_visible' => true,
        ]);
    }

    public function test_stock_import_publishes_tubular_shape_when_grade_already_exists(): void
    {
        Storage::fake('local');

        [$family, $line, $series, , $shapeFamily, $shape] = $this->seedCatalog();

        $grade = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'Acero 10CrMo910',
            'short_title' => 'Acero 10CrMo910',
            'slug' => 'acero-10crmo910',
            'density_value' => 7.85,
            'density_unit' => 'g/cm3',
            'is_active' => true,
        ]);

        CatalogShapeMapping::query()->create([
            'external_shape_id' => 'TUB',
            'external_shape_family_id' => 'TUB',
            'raw_shape_name' => 'Tubo',
            'normalized_shape_name' => 'tubo',
            'catalog_shape_family_id' => $shapeFamily->id,
            'catalog_shape_id' => $shape->id,
            'is_active' => true,
        ]);

        $file = $this->makeWorkbookUpload(
            [
                [3320, 848, 'TUB', 'TUB', 'Tubular: Tubos, caños y sus accesorios', 'Acero 10CrMo910', 'Tubo', 'Øe', 33.7, 'mm', 'x3.6mm s/c', 'Acero 10CrMo910 Tubo Øe 0033.700 mm x3.6mm s/c', 'No', 'No'],
            ],
            ['IDproducto', 'CódigoMaterial', 'CódigoFamiliaForma', 'CódigoForma', 'FamiliaForma', 'Material', 'Forma', 'Dimensión Principal', 'ValorDimensionPrincipal', 'UnidadDimensionPrincipal', 'OtrasDimensiones', 'Descripción', 'NOPublicar', 'Discontinuo']
        );

        $batch = app(CatalogProductImportService::class)->uploadAndStage($file, type: 'product_stock_excel');
        app(CatalogProductPublishService::class)->publishResolvedRows($batch->fresh());

        $this->assertDatabaseHas('catalog_staging_products', [
            'catalog_import_batch_id' => $batch->id,
            'nombre_material' => 'Acero 10CrMo910',
            'mapped_catalog_grade_id' => $grade->id,
            'mapped_catalog_shape_id' => $shape->id,
            'validation_status' => 'valid',
        ]);
        $this->assertDatabaseHas('catalog_product_variants', [
            'external_product_id' => '3320',
            'external_material_id' => '848',
            'is_public_visible' => true,
            'is_active' => true,
        ]);
    }

    public function test_stock_import_prefers_newest_grade_when_exact_name_exists_twice(): void
    {
        Storage::fake('local');

        $family = CatalogFamily::query()->create([
            'name' => 'Metalicos',
            'slug' => 'metalicos',
        ]);

        $legacyLine = CatalogLine::query()->create([
            'catalog_family_id' => $family->id,
            'name' => 'Aceros',
            'slug' => 'aceros',
            'is_active' => true,
        ]);

        $legacySeries = CatalogSeries::query()->create([
            'catalog_line_id' => $legacyLine->id,
            'name' => 'ACEROS ALEADOS',
            'slug' => 'aceros-aleados',
            'is_active' => true,
        ]);

        $legacyGrade = CatalogGrade::query()->create([
            'catalog_series_id' => $legacySeries->id,
            'name' => 'Acero 10CrMo910',
            'short_title' => 'Acero 10CrMo910',
            'slug' => 'acero-10crmo910',
            'is_active' => true,
        ]);

        $currentLine = CatalogLine::query()->create([
            'catalog_family_id' => $family->id,
            'name' => 'Aceros aleados y especiales',
            'slug' => 'aceros-aleados-y-especiales',
            'is_active' => true,
        ]);

        $currentSeries = CatalogSeries::query()->create([
            'catalog_line_id' => $currentLine->id,
            'name' => 'ACEROS ALEADOS',
            'slug' => 'aceros-aleados',
            'is_active' => true,
        ]);

        $currentGrade = CatalogGrade::query()->create([
            'catalog_series_id' => $currentSeries->id,
            'name' => 'Acero 10CrMo910',
            'short_title' => 'Acero 10CrMo910',
            'slug' => 'acero-10crmo910',
            'is_active' => true,
        ]);

        $shapeFamily = ShapeFamily::query()->create([
            'name' => 'Tubular',
            'slug' => 'tubular',
        ]);

        $shape = Shape::query()->create([
            'catalog_shape_family_id' => $shapeFamily->id,
            'name' => 'Tubo',
            'slug' => 'tubo',
            'is_active' => true,
        ]);

        CatalogShapeMapping::query()->create([
            'external_shape_id' => 'TUB',
            'external_shape_family_id' => 'TUB',
            'raw_shape_name' => 'Tubo',
            'normalized_shape_name' => 'tubo',
            'catalog_shape_family_id' => $shapeFamily->id,
            'catalog_shape_id' => $shape->id,
            'is_active' => true,
        ]);

        $file = $this->makeWorkbookUpload(
            [
                [3320, 848, 'TUB', 'TUB', 'Tubular: Tubos, caños y sus accesorios', 'Acero 10CrMo910', 'Tubo', 'Øe', 33.7, 'mm', 'x3.6mm s/c', 'Acero 10CrMo910 Tubo Øe 0033.700 mm x3.6mm s/c', 'No', 'No'],
            ],
            ['IDproducto', 'CódigoMaterial', 'CódigoFamiliaForma', 'CódigoForma', 'FamiliaForma', 'Material', 'Forma', 'Dimensión Principal', 'ValorDimensionPrincipal', 'UnidadDimensionPrincipal', 'OtrasDimensiones', 'Descripción', 'NOPublicar', 'Discontinuo']
        );

        $batch = app(CatalogProductImportService::class)->uploadAndStage($file, type: 'product_stock_excel');
        app(CatalogProductPublishService::class)->publishResolvedRows($batch->fresh());

        $this->assertDatabaseHas('catalog_staging_products', [
            'catalog_import_batch_id' => $batch->id,
            'nombre_material' => 'Acero 10CrMo910',
            'mapped_catalog_grade_id' => $currentGrade->id,
            'validation_status' => 'valid',
        ]);

        $this->assertDatabaseMissing('catalog_staging_products', [
            'catalog_import_batch_id' => $batch->id,
            'nombre_material' => 'Acero 10CrMo910',
            'mapped_catalog_grade_id' => $legacyGrade->id,
        ]);
    }

    public function test_public_reset_deactivates_catalog_and_reuses_existing_shape_variant_and_offer_images_on_reimport(): void
    {
        Storage::fake('local');

        [$family, $line, $series, $grade, $shapeFamily, $shape] = $this->seedCatalog();

        $grade->update([
            'name' => 'Titanio Grado 2',
            'short_title' => 'Titanio Grado 2',
            'slug' => 'titanio-grado-2',
            'hero_media_id' => 901,
            'is_active' => true,
        ]);

        $line->update([
            'hero_media_id' => 900,
            'is_active' => true,
        ]);

        $shape->update([
            'name' => 'Tubo',
            'slug' => 'tubo',
            'is_active' => true,
        ]);

        $shapeFamily->update([
            'name' => 'Tubular',
            'slug' => 'tubular',
            'is_active' => true,
        ]);

        $gradeProduct = \App\Models\Catalog\GradeProduct::query()->create([
            'catalog_grade_id' => $grade->id,
            'catalog_shape_id' => $shape->id,
            'is_active' => true,
        ]);

        $variant = \App\Models\Catalog\ProductVariant::query()->create([
            'catalog_grade_product_id' => $gradeProduct->id,
            'external_product_id' => '1001',
            'external_material_id' => '44',
            'external_code' => 'SKU-44',
            'dimension_text' => 'Øe 33.7 mm x3.6mm s/c',
            'description' => 'Tubo titanio',
            'is_active' => true,
            'is_public_visible' => true,
            'is_offer' => true,
        ]);

        ProductVariantMedia::query()->create([
            'catalog_product_variant_id' => $variant->id,
            'media_asset_id' => 777,
            'is_primary' => true,
            'sort_order' => 1,
        ]);

        VariantOffer::query()->create([
            'catalog_product_variant_id' => $variant->id,
            'hero_media_id' => 888,
            'badge_text' => 'Oferta',
            'is_active' => true,
        ]);

        CatalogShapeMapping::query()->create([
            'external_shape_id' => 'TUB',
            'external_shape_family_id' => '10',
            'raw_shape_name' => 'Tubo',
            'normalized_shape_name' => 'tubo',
            'catalog_shape_family_id' => $shapeFamily->id,
            'catalog_shape_id' => $shape->id,
            'is_active' => true,
        ]);

        Storage::disk('local')->put('imports/catalog-stock/existing.xlsx', 'excel');

        $batch = \App\Models\Catalog\CatalogImportBatch::query()->create([
            'type' => 'product_stock_excel',
            'file_name' => 'existing.xlsx',
            'file_path' => 'imports/catalog-stock/existing.xlsx',
            'status' => 'published',
        ]);

        \App\Models\Catalog\CatalogStagingProduct::query()->create([
            'catalog_import_batch_id' => $batch->id,
            'row_number' => 2,
            'id_producto' => '1001',
            'id_material' => '44',
            'familia_forma' => 'Tubular',
            'forma' => 'Tubo',
            'nombre_material' => 'Titanio Grado 2',
            'normalized_material_name' => 'titanio grado 2',
            'normalized_shape_name' => 'tubo',
            'mapping_status' => 'published',
            'validation_status' => 'valid',
        ]);

        app(CatalogPublicResetService::class)->reset();

        $this->assertDatabaseHas('catalog_lines', [
            'id' => $line->id,
            'is_active' => false,
            'hero_media_id' => 900,
        ]);
        $this->assertDatabaseHas('catalog_grades', [
            'id' => $grade->id,
            'is_active' => false,
            'hero_media_id' => 901,
        ]);
        $this->assertDatabaseHas('catalog_shapes', [
            'id' => $shape->id,
            'is_active' => false,
        ]);
        $this->assertDatabaseHas('catalog_product_variants', [
            'id' => $variant->id,
            'is_active' => false,
            'is_public_visible' => false,
        ]);
        $this->assertDatabaseCount('catalog_import_batches', 0);
        Storage::disk('local')->assertMissing('imports/catalog-stock/existing.xlsx');

        $family->update(['is_active' => true]);
        $line->update(['is_active' => true]);
        $series->update(['is_active' => true]);
        $grade->update(['is_active' => true]);
        CatalogMaterialMapping::query()->updateOrCreate(
            ['external_material_id' => '44'],
            [
                'raw_material_name' => 'Titanio Grado 2',
                'normalized_material_name' => 'titanio grado 2',
                'catalog_family_id' => $family->id,
                'catalog_line_id' => $line->id,
                'catalog_series_id' => $series->id,
                'catalog_grade_id' => $grade->id,
                'is_active' => true,
            ]
        );

        $file = $this->makeWorkbookUpload(
            [
                ['1001', '44', 'SKU-44', '10', 'TUB', 'Tubular', '33.7', 'Titanio Grado 2', 'Tubo', 'Øe 33.7 mm x3.6mm s/c', 'No', 'Tubo titanio', 'Si', 'No', 'No'],
            ],
            ['IDProducto', 'IDMaterial', 'Cod_Num', 'IDFamiliaForma', 'IDForma', 'FamiliaForma', 'Dimension', 'NombreMaterial', 'Forma', 'Dimensiones', 'APedido', 'Descripcion', 'Oferta', 'NoPublicar', 'Discontinuo']
        );

        $newBatch = app(CatalogProductImportService::class)->uploadAndStage($file, type: 'product_stock_excel');
        $this->assertDatabaseHas('catalog_staging_products', [
            'catalog_import_batch_id' => $newBatch->id,
            'id_producto' => '1001',
            'mapped_catalog_shape_id' => $shape->id,
            'validation_status' => 'valid',
        ]);
        app(CatalogProductPublishService::class)->publishResolvedRows($newBatch->fresh());

        $shape->refresh();
        $variant->refresh();

        $this->assertSame('tubo', $shape->slug);
        $this->assertTrue($shape->is_active);
        $this->assertDatabaseCount('catalog_shapes', 1);
        $this->assertTrue($variant->is_active);
        $this->assertTrue($variant->is_public_visible);
        $this->assertTrue($variant->is_offer);
        $this->assertDatabaseHas('catalog_product_variant_media', [
            'catalog_product_variant_id' => $variant->id,
            'media_asset_id' => 777,
            'is_primary' => true,
        ]);
        $this->assertDatabaseHas('catalog_variant_offers', [
            'catalog_product_variant_id' => $variant->id,
            'hero_media_id' => 888,
            'is_active' => true,
        ]);
    }

    public function test_stock_import_cleans_binary_decimal_artifacts_and_limits_shape_dimensions_to_three_decimals(): void
    {
        Storage::fake('local');

        [$family, $line, $series, $grade, $shapeFamily, $shape] = $this->seedCatalog();

        $grade->update([
            'name' => 'Acero ASTM A333 Gr.3',
            'short_title' => 'Acero ASTM A333 Gr.3',
            'slug' => 'acero-astm-a333-gr3',
        ]);

        $shapeFamily->update([
            'name' => 'Largos',
            'slug' => 'largos',
        ]);

        $shape->update([
            'catalog_shape_family_id' => $shapeFamily->id,
            'name' => 'Barra Red. / Varilla',
            'slug' => 'barra-red-varilla',
            'formula_type' => null,
            'is_calculable' => false,
        ]);

        CatalogMaterialMapping::query()->create([
            'external_material_id' => '44',
            'raw_material_name' => 'Acero ASTM A333 Gr.3',
            'normalized_material_name' => 'acero astm a333 gr3',
            'catalog_family_id' => $family->id,
            'catalog_line_id' => $line->id,
            'catalog_series_id' => $series->id,
            'catalog_grade_id' => $grade->id,
            'is_active' => true,
        ]);

        CatalogShapeMapping::query()->create([
            'external_shape_id' => '20',
            'external_shape_family_id' => '10',
            'raw_shape_name' => 'Barra Red. / Varilla',
            'normalized_shape_name' => 'barra red varilla',
            'catalog_shape_family_id' => $shapeFamily->id,
            'catalog_shape_id' => $shape->id,
            'is_active' => true,
        ]);

        $file = $this->makeWorkbookUpload(
            [
                ['1001', '44', '10', '20', 'Largos', 'Acero ASTM A333 Gr.3', 'Barra Red. / Varilla', 'Ø', 139.7, 'mm', null, 'Barra acero', 'No', 'No'],
                ['1002', '44', '10', '20', 'Largos', 'Acero ASTM A333 Gr.3', 'Barra Red. / Varilla', 'Ø', 63.5554, 'mm', null, 'Barra acero 2', 'No', 'No'],
            ],
            ['IDproducto', 'CódigoMaterial', 'CódigoFamiliaForma', 'CódigoForma', 'FamiliaForma', 'Material', 'Forma', 'Dimensión Principal', 'ValorDimensionPrincipal', 'UnidadDimensionPrincipal', 'OtrasDimensiones', 'Descripción', 'NOPublicar', 'Discontinuo']
        );

        $batch = app(CatalogProductImportService::class)->uploadAndStage($file, type: 'product_stock_excel');

        $this->assertDatabaseHas('catalog_staging_products', [
            'catalog_import_batch_id' => $batch->id,
            'dimensiones' => 'Ø 139.7 mm',
            'validation_status' => 'valid',
        ]);
        $this->assertDatabaseHas('catalog_staging_products', [
            'catalog_import_batch_id' => $batch->id,
            'dimensiones' => 'Ø 63.555 mm',
            'validation_status' => 'valid',
        ]);

        app(CatalogProductPublishService::class)->publishResolvedRows($batch->fresh());

        $this->assertDatabaseHas('catalog_product_variants', [
            'external_product_id' => '1001',
            'dimension_text' => 'Ø 139.7 mm',
        ]);
        $this->assertDatabaseHas('catalog_product_variants', [
            'external_product_id' => '1002',
            'dimension_text' => 'Ø 63.555 mm',
        ]);
    }

    public function test_stock_preview_uses_import_history_to_avoid_false_new_rows(): void
    {
        Storage::fake('local');

        CatalogImportBatch::query()->create([
            'type' => 'product_stock_excel',
            'file_name' => 'stock-anterior.xlsx',
            'file_path' => 'imports/catalog-products/stock-anterior.xlsx',
            'status' => 'published',
        ])->stagingProducts()->create([
            'row_number' => 2,
            'id_producto' => '1001',
            'id_material' => '44',
            'cod_num' => 'SKU-44',
            'id_familia_forma' => '10',
            'id_forma' => '20',
            'familia_forma' => 'Tubular',
            'dimension' => '33.7',
            'nombre_material' => 'Titanio Grado 2',
            'forma' => 'Tubo',
            'dimensiones' => 'Øe 33.7 mm x3.6mm s/c',
            'normalized_material_name' => 'titanio grado 2',
            'normalized_shape_name' => 'tubo',
            'mapping_status' => CatalogStagingProduct::MAPPING_PUBLISHED,
            'validation_status' => CatalogStagingProduct::VALIDATION_VALID,
        ]);

        $file = $this->makeWorkbookUpload(
            [
                ['1001', '44', 'SKU-44', '10', '20', 'Tubular', '33.7', 'Titanio Grado 2', 'Tubo', 'Øe 33.7 mm x3.6mm s/c', 'No', 'Tubo titanio', 'No', 'No', 'No'],
                ['1002', '45', 'SKU-45', '10', '20', 'Tubular', '40', 'Titanio Grado 5', 'Tubo', 'Øe 40 mm x2mm s/c', 'No', 'Tubo titanio 5', 'No', 'No', 'No'],
            ],
            ['IDProducto', 'IDMaterial', 'Cod_Num', 'IDFamiliaForma', 'IDForma', 'FamiliaForma', 'Dimension', 'NombreMaterial', 'Forma', 'Dimensiones', 'APedido', 'Descripcion', 'Oferta', 'NoPublicar', 'Discontinuo']
        );

        $preview = app(CatalogProductImportService::class)->preview($file);

        $this->assertSame(2, $preview['processed_rows']);
        $this->assertSame(1, $preview['existing_rows_count']);
        $this->assertSame(1, $preview['new_rows_count']);
        $this->assertSame('1001', $preview['existing_rows'][0]['id_producto']);
        $this->assertSame('1002', $preview['new_rows'][0]['id_producto']);
    }

    private function seedCatalog(): array
    {
        $family = CatalogFamily::query()->create([
            'name' => 'Metalicos',
            'slug' => 'metalicos',
        ]);

        $line = CatalogLine::query()->create([
            'catalog_family_id' => $family->id,
            'name' => 'Titanio y sus aleaciones',
            'slug' => 'titanio-y-sus-aleaciones',
        ]);

        $series = CatalogSeries::query()->create([
            'catalog_line_id' => $line->id,
            'name' => 'Titanio',
            'slug' => 'titanio',
        ]);

        $grade = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'Grado 2',
            'slug' => 'grado-2',
            'density_value' => 4.51,
            'density_unit' => 'g/cm3',
        ]);

        $shapeFamily = ShapeFamily::query()->create([
            'name' => 'Tornilleria',
            'slug' => 'tornilleria',
        ]);

        $shape = Shape::query()->create([
            'catalog_shape_family_id' => $shapeFamily->id,
            'name' => 'Arandela',
            'slug' => 'arandela',
            'formula_type' => 'washer',
            'is_calculable' => true,
        ]);

        return [$family, $line, $series, $grade, $shapeFamily, $shape];
    }

    private function makeWorkbookUpload(array $dataRows, ?array $headers = null): UploadedFile
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->fromArray([
            $headers ?? ['IDProducto', 'IDMaterial', 'Cod_Num', 'IDFamiliaForma', 'IDForma', 'FamiliaForma', 'Dimension', 'NombreMaterial', 'Forma', 'Dimensiones', 'APedido', 'Descripcion', 'Oferta', 'Discontinuo'],
            ...$dataRows,
        ]);

        $tempPath = tempnam(sys_get_temp_dir(), 'catalog-import');
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);

        return new UploadedFile(
            $tempPath,
            'catalog-import.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );
    }
}

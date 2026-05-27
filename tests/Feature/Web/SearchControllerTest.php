<?php

namespace Tests\Feature\Web;

use App\Models\Catalog\CatalogFamily;
use App\Models\Catalog\CatalogGrade;
use App\Models\Catalog\CatalogLine;
use App\Models\Catalog\CatalogNorma;
use App\Models\Catalog\CatalogSeries;
use App\Models\Catalog\GradeProduct;
use App\Models\Catalog\GradeStandard;
use App\Models\Catalog\ProductVariant;
use App\Models\Catalog\Shape;
use App\Models\SectionItem;
use App\Models\SiteSection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_search_can_find_grade_by_related_norma_and_material_terms(): void
    {
        [$grade] = $this->seedTitaniumCatalog();

        $norma = CatalogNorma::query()->create([
            'nombre_emisor' => 'ASTM',
            'norma' => 'B265',
            'descripcion_corta' => 'Placas, laminas y flejes de titanio y aleaciones de titanio',
            'familia' => 'Titanio',
            'subfamilia' => 'Productos planos',
            'keywords_seo' => 'b265 titanio lamina grado 2',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $norma->grades()->attach([
            $grade->id => ['sort_order' => 1],
        ]);

        $response = $this->get(route('web.search.index', ['q' => 'titanio b265']));

        $response->assertOk();
        $response->assertSee('Resultados para');
        $response->assertSee('titanio b265');
        $response->assertSee('Grado 2');
        $response->assertSee('Titanio / Grados comerciales');
        $response->assertSee('Titanio Grado 2');
    }

    public function test_public_search_suggest_endpoint_returns_grade_suggestion_from_related_norma(): void
    {
        [$grade] = $this->seedTitaniumCatalog();

        $norma = CatalogNorma::query()->create([
            'nombre_emisor' => 'ASTM',
            'norma' => 'B265',
            'descripcion_corta' => 'Placas, laminas y flejes de titanio y aleaciones de titanio',
            'keywords_seo' => 'b265 titanio grado 2',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $norma->grades()->attach([
            $grade->id => ['sort_order' => 1],
        ]);

        $response = $this->getJson(route('web.search.suggest', ['q' => 'titanio b26']));

        $response->assertOk();
        $response->assertJsonPath('suggested_queries.0.label', 'Titanio Grado 2');
        $response->assertJsonFragment([
            'emisor' => 'ASTM',
            'norma' => 'B265',
        ]);
    }

    public function test_public_search_includes_grades_matched_from_standards_and_not_only_norma_links(): void
    {
        [$grade2, $series] = $this->seedTitaniumCatalog();

        $grade1 = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'Grado 1',
            'slug' => 'grado-1',
            'short_title' => 'Titanio Grado 1',
            'intro_text' => 'Titanio comercial puro grado 1.',
            'is_active' => true,
        ]);

        $grade5 = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'Grado 5',
            'slug' => 'grado-5',
            'short_title' => 'Titanio Grado 5',
            'intro_text' => 'Titanio aleado grado 5.',
            'is_active' => true,
        ]);

        foreach ([$grade1, $grade2, $grade5] as $index => $grade) {
            GradeStandard::query()->create([
                'catalog_grade_id' => $grade->id,
                'code' => 'ASTM B265',
                'title' => 'Planchas y láminas de titanio',
                'description' => 'Referencia comercial B265 para titanio',
                'sort_order' => $index + 1,
                'is_active' => true,
            ]);
        }

        $response = $this->get(route('web.search.index', ['q' => 'titanio b265']));

        $response->assertOk();
        $response->assertSee('Grado 1');
        $response->assertSee('Grado 2');
        $response->assertSee('Grado 5');
        $response->assertSee('ASTM');
        $response->assertSee('B265');
        $response->assertSee('Norma ASTM B265');
    }

    public function test_public_search_aligns_catalog_stock_and_applications_with_norma_aware_results(): void
    {
        [$grade2, $series] = $this->seedTitaniumCatalog();

        $grade1 = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'Grado 1',
            'slug' => 'grado-1',
            'short_title' => 'Titanio Grado 1',
            'intro_text' => 'Titanio comercial puro grado 1.',
            'is_active' => true,
        ]);

        $grade5 = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'Grado 5',
            'slug' => 'grado-5',
            'short_title' => 'Titanio Grado 5',
            'intro_text' => 'Titanio aleado grado 5.',
            'is_active' => true,
        ]);

        foreach ([$grade1, $grade2, $grade5] as $index => $grade) {
            GradeStandard::query()->create([
                'catalog_grade_id' => $grade->id,
                'code' => 'ASTM B265',
                'title' => 'Planchas y láminas de titanio',
                'description' => 'Referencia comercial B265 para titanio',
                'sort_order' => $index + 1,
                'is_active' => true,
            ]);
        }

        $shape = Shape::query()->create([
            'name' => 'Plancha',
            'slug' => 'plancha',
            'is_active' => true,
        ]);

        $gradeProduct = GradeProduct::query()->create([
            'catalog_grade_id' => $grade2->id,
            'catalog_shape_id' => $shape->id,
            'display_name' => 'Planchas de titanio',
            'description' => 'Producto laminado para titanio grado 2',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        ProductVariant::query()->create([
            'catalog_grade_product_id' => $gradeProduct->id,
            'external_code' => 'B265-PL-01',
            'dimension_text' => '2 mm x 1000 mm',
            'description' => 'Stock inmediato ASTM B265',
            'is_active' => true,
            'is_public_visible' => true,
        ]);

        $section = SiteSection::query()->create([
            'page_key' => 'home',
            'section_key' => 'applications',
            'title' => 'Aplicaciones',
            'is_active' => true,
        ]);

        SectionItem::query()->create([
            'site_section_id' => $section->id,
            'item_key' => 'intercambiadores-titanio',
            'title' => 'Intercambiadores de titanio',
            'subtitle' => 'Equipos para corrosión y temperatura',
            'description' => 'Aplicaciones industriales del titanio en ambientes severos.',
            'meta_json' => [
                'detail_title' => 'Titanio para intercambiadores',
                'detail_summary' => 'Uso industrial del titanio',
                'bullet_points' => ['Titanio comercial', 'Intercambiadores de calor'],
            ],
            'is_active' => true,
        ]);

        $response = $this->getJson(route('web.search.suggest', ['q' => 'titanio b265']));

        $response->assertOk();

        $groups = collect($response->json('groups'));

        $catalogTitles = collect($groups->firstWhere('title', 'Productos')['items'] ?? [])->pluck('title');
        $stockTitles = collect($groups->firstWhere('title', 'Stock')['items'] ?? [])->pluck('title');
        $applicationTitles = collect($groups->firstWhere('title', 'Aplicaciones')['items'] ?? [])->pluck('title');

        $this->assertTrue($catalogTitles->contains('Grado 1'));
        $this->assertTrue($catalogTitles->contains('Grado 2'));
        $this->assertTrue($catalogTitles->contains('Grado 5'));
        $this->assertTrue($stockTitles->contains(fn (string $title) => str_contains($title, 'Grado 2')));
        $this->assertTrue($applicationTitles->contains('Intercambiadores de titanio'));
    }

    public function test_public_search_can_find_dotted_norma_without_emitter_prefix(): void
    {
        [$grade] = $this->seedTitaniumCatalog();

        $norma = CatalogNorma::query()->create([
            'nombre_emisor' => 'WN',
            'norma' => '1.3401',
            'descripcion_corta' => 'Acero austenítico al manganeso',
            'familia' => 'Aceros antidesgaste',
            'subfamilia' => 'Manganeso',
            'keywords_seo' => 'wn 1.3401 x120mn12 acero manganeso',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $norma->grades()->attach([
            $grade->id => ['sort_order' => 1],
        ]);

        $response = $this->get(route('web.search.index', ['q' => '1.3401']));

        $response->assertOk();
        $response->assertSee('Resultados para');
        $response->assertSee('1.3401');
        $response->assertSee('Por normas');
        $response->assertSee('Grado 2');
        $response->assertSee('WN');
        $response->assertSee('Relacionado con la norma WN 1.3401');
    }

    public function test_public_search_can_find_hyphenated_norma_without_emitter_prefix(): void
    {
        [$grade] = $this->seedTitaniumCatalog();

        $norma = CatalogNorma::query()->create([
            'nombre_emisor' => 'EN',
            'norma' => '10088-3',
            'descripcion_corta' => 'Aceros inoxidables. Condiciones técnicas de suministro para barras y perfiles',
            'familia' => 'Aceros inoxidables',
            'subfamilia' => 'Barras y perfiles',
            'keywords_seo' => 'en 10088-3 inoxidable barras perfiles',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $norma->grades()->attach([
            $grade->id => ['sort_order' => 1],
        ]);

        $response = $this->get(route('web.search.index', ['q' => '10088-3']));

        $response->assertOk();
        $response->assertSee('Resultados para');
        $response->assertSee('10088-3');
        $response->assertSee('Por normas');
        $response->assertSee('Grado 2');
        $response->assertSee('EN');
        $response->assertSee('Relacionado con la norma EN 10088-3');
    }

    /**
     * @return array{0: CatalogGrade, 1: CatalogSeries}
     */
    private function seedTitaniumCatalog(): array
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

        $grade = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'Grado 2',
            'slug' => 'grado-2',
            'short_title' => 'Titanio Grado 2',
            'intro_text' => 'Titanio comercialmente puro para industria y procesos corrosivos.',
            'is_active' => true,
        ]);

        return [$grade, $series];
    }
}

<?php

namespace Tests\Feature\Web;

use App\Models\Catalog\CatalogFamily;
use App\Models\Catalog\CatalogGrade;
use App\Models\Catalog\CatalogLine;
use App\Models\Catalog\CatalogNorma;
use App\Models\Catalog\CatalogSeries;
use App\Models\Catalog\GradeStandard;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCatalogControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_product_catalog_can_find_grade_by_related_norma_and_material_terms(): void
    {
        [$grade] = $this->seedTitaniumCatalog();

        $norma = CatalogNorma::query()->create([
            'nombre_emisor' => 'ASTM',
            'norma' => 'B265',
            'descripcion_corta' => 'Placas, laminas y flejes de titanio y aleaciones de titanio',
            'familia' => 'Titanio',
            'keywords_seo' => 'b265 titanio grado 2',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $norma->grades()->attach([
            $grade->id => ['sort_order' => 1],
        ]);

        $response = $this->get(route('web.products.all', ['q' => 'titanio b265']));

        $response->assertOk();
        $response->assertSee('Resultados para &quot;titanio b265&quot;', false);
        $response->assertSee('Grado 2');
        $response->assertSee('ASTM');
        $response->assertSee('B265');
        $response->assertDontSee('No encontramos productos para esa b', false);
    }

    public function test_public_product_catalog_can_find_grade_by_norma_fragment(): void
    {
        [$grade] = $this->seedTitaniumCatalog();

        $norma = CatalogNorma::query()->create([
            'nombre_emisor' => 'ASTM',
            'norma' => 'B265',
            'descripcion_corta' => 'Placas, laminas y flejes de titanio y aleaciones de titanio',
            'familia' => 'Titanio',
            'keywords_seo' => 'b265 titanio grado 2',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $norma->grades()->attach([
            $grade->id => ['sort_order' => 1],
        ]);

        $response = $this->get(route('web.products.all', ['q' => 'titanio b26']));

        $response->assertOk();
        $response->assertSee('Grado 2');
        $response->assertDontSee('No encontramos productos para esa búsqueda todavía.');
    }

    public function test_public_product_catalog_can_find_grade_by_standard_reference(): void
    {
        [$grade, $series] = $this->seedTitaniumCatalog();

        $grade5 = CatalogGrade::query()->create([
            'catalog_series_id' => $series->id,
            'name' => 'Grado 5',
            'slug' => 'grado-5',
            'short_title' => 'Titanio Grado 5',
            'intro_text' => 'Titanio aleado para aplicaciones industriales.',
            'is_active' => true,
        ]);

        GradeStandard::query()->create([
            'catalog_grade_id' => $grade5->id,
            'code' => 'ASTM B265',
            'title' => 'Planchas de titanio',
            'description' => 'Referencia comercial de titanio B265',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response = $this->get(route('web.products.all', ['q' => 'titanio b265']));

        $response->assertOk();
        $response->assertSee('Grado 5');
        $response->assertSee('ASTM');
        $response->assertSee('B265');
    }

    public function test_public_product_catalog_can_find_grade_by_dotted_norma_without_emitter_prefix(): void
    {
        [$grade] = $this->seedTitaniumCatalog();

        $norma = CatalogNorma::query()->create([
            'nombre_emisor' => 'WN',
            'norma' => '1.3401',
            'descripcion_corta' => 'Acero austenítico al manganeso',
            'familia' => 'Aceros antidesgaste',
            'keywords_seo' => 'wn 1.3401 x120mn12 acero manganeso',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $norma->grades()->attach([
            $grade->id => ['sort_order' => 1],
        ]);

        $response = $this->get(route('web.products.all', ['q' => '1.3401']));

        $response->assertOk();
        $response->assertSee('Por normas');
        $response->assertSee('Grado 2');
        $response->assertSee('WN');
        $response->assertSee('1.3401');
        $response->assertDontSee('No encontramos productos para esa búsqueda todavía.');
    }

    public function test_public_product_catalog_can_find_grade_by_hyphenated_norma_without_emitter_prefix(): void
    {
        [$grade] = $this->seedTitaniumCatalog();

        $norma = CatalogNorma::query()->create([
            'nombre_emisor' => 'EN',
            'norma' => '10088-3',
            'descripcion_corta' => 'Aceros inoxidables. Condiciones técnicas de suministro para productos semiacabados, barras, alambrón, alambre, perfiles y productos calibrados',
            'familia' => 'Aceros inoxidables',
            'keywords_seo' => 'en 10088-3 inoxidable barras perfiles',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $norma->grades()->attach([
            $grade->id => ['sort_order' => 1],
        ]);

        $response = $this->get(route('web.products.all', ['q' => '10088-3']));

        $response->assertOk();
        $response->assertSee('Por normas');
        $response->assertSee('Grado 2');
        $response->assertSee('EN');
        $response->assertSee('10088-3');
        $response->assertDontSee('No encontramos productos para esa búsqueda todavía.');
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

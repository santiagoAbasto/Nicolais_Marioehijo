<?php

namespace Tests\Feature\Web;

use App\Models\Catalog\CatalogFamily;
use App\Models\Catalog\CatalogLine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomePageContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_renders_seeded_content_sections(): void
    {
        $this->seed(\Database\Seeders\HomeSeeder::class);

        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('Desde 1938 al servicio de la industria');
        $response->assertSee('Nuestros productos');
        $response->assertSee('Un equipo experto y calidad garantizada');
        $response->assertSee('Enterate de las últimas novedades');
        $response->assertSee('Metales, aleaciones especiales y biomateriales para la industria');
    }

    public function test_home_page_only_includes_lines_enabled_for_home_cards(): void
    {
        $family = CatalogFamily::query()->create([
            'name' => 'Familia test',
            'slug' => 'familia-test',
            'sort_order' => 'A',
            'is_active' => true,
        ]);

        $visibleLine = CatalogLine::query()->create([
            'catalog_family_id' => $family->id,
            'name' => 'Linea visible home',
            'slug' => 'linea-visible-home',
            'sort_order' => 'A',
            'is_active' => true,
            'show_on_home' => true,
        ]);

        CatalogLine::query()->create([
            'catalog_family_id' => $family->id,
            'name' => 'Linea oculta home',
            'slug' => 'linea-oculta-home',
            'sort_order' => 'B',
            'is_active' => true,
            'show_on_home' => false,
        ]);

        CatalogLine::query()->create([
            'catalog_family_id' => $family->id,
            'name' => 'Linea inactiva home',
            'slug' => 'linea-inactiva-home',
            'sort_order' => 'C',
            'is_active' => false,
            'show_on_home' => true,
        ]);

        $response = $this->get('/');

        $response->assertOk();
        $this->assertSame([$visibleLine->id], $response->viewData('product_lines')->pluck('id')->all());
    }
}

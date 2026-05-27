<?php

namespace Tests\Feature\Infrastructure;

use App\Models\Catalog\CatalogFamily;
use App\Models\Catalog\CatalogGrade;
use App\Models\Catalog\CatalogLine;
use App\Models\Catalog\CatalogSeries;
use App\Models\Post;
use App\Models\SectionItem;
use App\Models\SiteSection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SitemapAndRobotsTest extends TestCase
{
    use RefreshDatabase;

    public function test_robots_route_exposes_sitemap_and_crawl_rules(): void
    {
        $response = $this->get(route('web.robots'));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/plain; charset=UTF-8');
        $response->assertSee('Disallow: /admin');
        $response->assertSee('Disallow: /buscar');
        $response->assertSee('Sitemap: '.route('web.sitemap'));
    }

    public function test_sitemap_route_lists_static_and_dynamic_public_urls(): void
    {
        $family = CatalogFamily::query()->create([
            'name' => 'Metales',
            'slug' => 'metales',
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
            'is_active' => true,
        ]);

        $post = Post::query()->create([
            'title' => 'Nueva línea de titanio',
            'slug' => 'nueva-linea-de-titanio',
            'is_active' => true,
            'published_at' => now(),
        ]);

        $section = SiteSection::query()->create([
            'page_key' => 'home',
            'section_key' => 'applications',
            'title' => 'Aplicaciones',
            'is_active' => true,
        ]);

        SectionItem::query()->create([
            'site_section_id' => $section->id,
            'item_key' => 'intercambiadores-de-calor',
            'title' => 'Intercambiadores de calor',
            'is_active' => true,
        ]);

        $response = $this->get(route('web.sitemap'));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
        $response->assertSee(route('web.home'), false);
        $response->assertSee(route('web.calculator.index'), false);
        $response->assertSee(route('web.products.line', ['lineSlug' => $line->slug]), false);
        $response->assertSee(route('web.products.series', ['lineSlug' => $line->slug, 'seriesSlug' => $series->slug]), false);
        $response->assertSee(route('web.products.grade', ['lineSlug' => $line->slug, 'seriesSlug' => $series->slug, 'gradeSlug' => $grade->slug]), false);
        $response->assertSee(route('web.news.show', ['slug' => $post->slug]), false);
        $response->assertSee(route('web.applications.detail', ['applicationSlug' => 'intercambiadores-de-calor']), false);
    }
}

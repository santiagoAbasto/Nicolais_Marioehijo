<?php

namespace Tests\Feature\Web;

use App\Models\MediaAsset;
use App\Models\Post;
use App\Models\SeoMeta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoMetadataTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_page_is_noindex_and_uses_base_canonical(): void
    {
        $response = $this->get(route('web.search.index', ['q' => 'titanio b265']));

        $response->assertOk();
        $response->assertSee('<meta name="robots" content="noindex,follow">', false);
        $response->assertSee('<link rel="canonical" href="'.route('web.search.index').'">', false);
    }

    public function test_news_detail_uses_cover_media_for_open_graph_and_article_schema(): void
    {
        $cover = MediaAsset::query()->create([
            'path' => 'news/cover-titanio.jpg',
            'title' => 'Cover titanio',
            'mime_type' => 'image/jpeg',
        ]);

        $post = Post::query()->create([
            'title' => 'Titanio para industria critica',
            'slug' => 'titanio-para-industria-critica',
            'excerpt' => 'Resumen técnico del uso del titanio.',
            'cover_media_id' => $cover->id,
            'author_name' => 'Equipo Cordes',
            'published_at' => now(),
            'is_active' => true,
        ]);

        $response = $this->get(route('web.news.show', ['slug' => $post->slug]));

        $response->assertOk();
        $response->assertSee('<meta property="og:type" content="article">', false);
        $response->assertSee('<meta property="og:image" content="'.media_asset_url($cover).'">', false);
        $response->assertSee('"@type":"NewsArticle"', false);
    }

    public function test_calculator_page_can_use_admin_seo_metadata(): void
    {
        SeoMeta::query()->create([
            'page' => 'calculator',
            'title' => 'Calculadora SEO',
            'description' => 'Calculadora optimizada para SEO.',
            'keywords' => 'calculadora, seo, materiales',
        ]);

        $response = $this->get(route('web.calculator.index'));

        $response->assertOk();
        $response->assertSee('<title>Calculadora SEO</title>', false);
        $response->assertSee('<meta name="description" content="Calculadora optimizada para SEO.">', false);
    }

    public function test_public_layout_includes_expert_seo_and_pwa_metadata(): void
    {
        $response = $this->get(route('web.home'));

        $response->assertOk();
        $response->assertSee('<meta name="theme-color" content="#0b7cc1">', false);
        $response->assertSee('<meta name="application-name" content="'.config('app.name').'">', false);
        $response->assertSee('<meta name="apple-mobile-web-app-capable" content="yes">', false);
        $response->assertSee('<meta property="og:locale" content="es_AR">', false);
        $response->assertSee('"@type":"Organization"', false);
        $response->assertSee('"@type":"WebSite"', false);
    }
}

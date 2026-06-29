<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\HomeHeroSlide;
use App\Models\Post;
use App\Models\Product;
use App\Models\ProductFamily;
use App\Models\ProductSubfamily;
use App\Models\SiteSection;
use Illuminate\Contracts\View\View;

class HomeController extends Controller
{
    public function index(): View
    {
        try {
            $slide = HomeHeroSlide::query()
                ->with(['desktopMedia', 'mobileMedia', 'logoOneMedia', 'logoTwoMedia'])
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->first();
        } catch (\Throwable) {
            $slide = null;
        }

        try {
            $families = ProductFamily::query()
                ->where('is_active', true)
                ->where('show_on_home', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();
            $brands = Product::query()
                ->whereNotNull('brand')
                ->distinct()
                ->orderBy('brand')
                ->pluck('brand');
            $models = ProductSubfamily::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->limit(80)
                ->pluck('name');
            $rubros = Product::query()
                ->whereNotNull('rubro')
                ->where('rubro', '!=', '')
                ->distinct()
                ->orderBy('rubro')
                ->pluck('rubro');
        } catch (\Throwable) {
            $families = collect();
            $brands = collect();
            $models = collect();
            $rubros = collect();
        }

        try {
            $aboutSection = SiteSection::query()
                ->with('media')
                ->where('page_key', 'home')
                ->where('section_key', 'about_preview')
                ->where('is_active', true)
                ->first();
        } catch (\Throwable) {
            $aboutSection = null;
        }

        try {
            $featuredProducts = Product::query()
                ->with(['family', 'mainMedia', 'brandLogoMedia'])
                ->where('is_active', true)
                ->where('is_featured_home', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->limit(8)
                ->get();
        } catch (\Throwable) {
            $featuredProducts = collect();
        }

        try {
            $homePosts = Post::query()
                ->with(['category', 'coverMedia'])
                ->where('is_active', true)
                ->where('show_on_home', true)
                ->orderBy('sort_order')
                ->orderByDesc('published_at')
                ->limit(3)
                ->get();
        } catch (\Throwable) {
            $homePosts = collect();
        }

        return view('web.home', [
            'slide' => $slide,
            'hero' => [
                'title' => $slide?->title ?: 'Distribuidores de repuestos para transmisión',
                'background' => $slide?->desktop_media_url ?: '/storage/uploads/cms/2026/05/4f580ba9-37bd-4981-a949-09a920fbd876.png',
            ],
            'representadas' => [
                ['name' => 'MAHIRO', 'subtitle' => 'AUTOMOTIVE PARTS'],
                ['name' => 'tecnotrasmissioni'],
            ],
            'families' => $families,
            'brands' => $brands,
            'models' => $models,
            'rubros' => $rubros,
            'aboutSection' => $aboutSection,
            'featuredProducts' => $featuredProducts,
            'homePosts' => $homePosts,
        ]);
    }
}

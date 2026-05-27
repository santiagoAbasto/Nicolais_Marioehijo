<?php

namespace App\Http\Controllers\Admin;

use App\Models\HomeHeroSlide;
use App\Models\SiteSection;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class HomeAdminController extends AdminPlaceholderController
{
    public function index(): RedirectResponse
    {
        return redirect()->route('admin.home.sliders');
    }

    public function sliders(): Response
    {
        return Inertia::render('Admin/HomeHeroSlides/Index', [
            'slides' => HomeHeroSlide::query()
                ->with(['desktopMedia', 'mobileMedia', 'logoOneMedia', 'logoTwoMedia'])
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(),
            'publicHomeUrl' => route('web.home'),
        ]);
    }

    public function about(): Response
    {
        $section = SiteSection::query()
            ->with('media')
            ->firstOrCreate(
                ['page_key' => 'home', 'section_key' => 'about_preview'],
                [
                    'title' => 'Quiénes somos',
                    'description' => '<p>Somos una empresa dedicada a la comercialización de productos para la transmisión.</p><p>Nuestro esfuerzo está dedicado a abastecer el mercado de reposición con gran variedad de productos y un amplio stock, asegurando una rápida respuesta y distribución a todo el país.</p>',
                    'button_text' => 'Más Info',
                    'button_url' => '/nosotros',
                    'sort_order' => 'AD',
                    'is_active' => true,
                ],
            );

        return Inertia::render('Admin/HomeAbout/Index', [
            'section' => $this->serializeSection($section->fresh('media')),
            'publicHomeUrl' => route('web.home'),
        ]);
    }

    protected function serializeSection(SiteSection $section): array
    {
        return [
            'id' => $section->id,
            'page_key' => $section->page_key,
            'section_key' => $section->section_key,
            'title' => $section->title,
            'subtitle' => $section->subtitle,
            'description' => $section->description,
            'button_text' => $section->button_text,
            'button_url' => $section->button_url,
            'media_id' => $section->media_id,
            'media_url' => media_asset_url($section->media),
            'sort_order' => $section->sort_order,
            'is_active' => $section->is_active,
        ];
    }
}

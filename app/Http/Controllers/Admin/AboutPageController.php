<?php

namespace App\Http\Controllers\Admin;

use App\Models\SiteSection;
use Inertia\Inertia;
use Inertia\Response;

class AboutPageController extends AdminPlaceholderController
{
    public function index(): Response
    {
        $sections = [
            'intro' => $this->section(
                'intro',
                [
                    'title' => 'Quienes Somos',
                    'description' => '<p>Somos una empresa dedicada a la comercialización de productos para la transmisión.</p><p>Nuestro esfuerzo está dedicado a abastecer el mercado de reposición con gran variedad de productos y un amplio stock, asegurando una rápida respuesta y distribución a todo el país.</p>',
                    'sort_order' => 'B',
                    'is_active' => true,
                ],
            ),
            'missionVision' => $this->section(
                'mission_vision',
                [
                    'title' => 'Misión',
                    'subtitle' => 'Visión',
                    'description' => '<p>Brindar soluciones confiables para el mercado de reposición automotor.</p>',
                    'sort_order' => 'C',
                    'is_active' => true,
                ],
            ),
            'values' => $this->section(
                'values',
                [
                    'title' => 'Valores',
                    'description' => '<p>Compromiso, responsabilidad y atención cercana en cada operación.</p>',
                    'sort_order' => 'D',
                    'is_active' => true,
                ],
            ),
        ];

        return Inertia::render('Admin/About/Index', [
            'sections' => collect($sections)
                ->map(fn (SiteSection $section) => $this->payload($section))
                ->all(),
            'publicAboutUrl' => route('web.about'),
        ]);
    }

    protected function section(string $sectionKey, array $defaults): SiteSection
    {
        return SiteSection::query()
            ->with(['media', 'secondaryMedia', 'fieldValues', 'items.media'])
            ->firstOrCreate(
                ['page_key' => 'nosotros', 'section_key' => $sectionKey],
                $defaults,
            )
            ->fresh(['media', 'secondaryMedia', 'fieldValues', 'items.media']);
    }

    protected function payload(SiteSection $section): array
    {
        return [
            'id' => $section->id,
            'page_key' => $section->page_key,
            'section_key' => $section->section_key,
            'title' => $section->title,
            'subtitle' => $section->subtitle,
            'description' => $section->description,
            'media_id' => $section->media_id,
            'media_url' => media_asset_url($section->media),
            'secondary_media_id' => $section->secondary_media_id,
            'secondary_media_url' => media_asset_url($section->secondaryMedia),
            'button_text' => $section->button_text,
            'button_url' => $section->button_url,
            'sort_order' => $section->sort_order,
            'is_active' => $section->is_active,
            'field_values' => $section->fieldValues,
            'items' => $section->items,
        ];
    }
}

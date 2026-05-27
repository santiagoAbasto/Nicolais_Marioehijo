<?php

namespace App\Http\Controllers\Admin;

use App\Models\MediaAsset;
use App\Models\SiteSection;
use Inertia\Inertia;
use Inertia\Response;

class CatalogHubController extends AdminPlaceholderController
{
    public function index(): Response
    {
        $section = SiteSection::query()
            ->with(['media', 'secondaryMedia', 'fieldValues', 'items.media'])
            ->firstOrCreate(
                ['page_key' => 'catalogo', 'section_key' => 'catalog_files'],
                [
                    'title' => 'Catálogos',
                    'sort_order' => 'A',
                    'is_active' => true,
                ],
            );

        $this->ensureDefaultItems($section);

        return Inertia::render('Admin/Catalog/Index', [
            'catalogSection' => $this->payload(
                $section->fresh(['media', 'secondaryMedia', 'fieldValues', 'items.media']),
            ),
            'publicCatalogUrl' => route('web.catalog.show'),
        ]);
    }

    protected function ensureDefaultItems(SiteSection $section): void
    {
        $defaults = [
            [
                'item_key' => 'repuestos-transmision',
                'title' => 'Catálogo Repuestos para transmisión',
                'sort_order' => 'A',
            ],
            [
                'item_key' => 'tecnotransmissioni',
                'title' => 'Catálogo Tecnotransmissioni',
                'sort_order' => 'B',
            ],
        ];

        foreach ($defaults as $item) {
            $section->items()->firstOrCreate(
                ['item_key' => $item['item_key']],
                [
                    'title' => $item['title'],
                    'sort_order' => $item['sort_order'],
                    'is_active' => true,
                    'meta_json' => [],
                ],
            );
        }
    }

    protected function payload(SiteSection $section): array
    {
        $fileIds = $section->items
            ->map(fn ($item) => $item->meta_json['file_media_id'] ?? null)
            ->filter()
            ->unique()
            ->values();

        $files = $fileIds->isEmpty()
            ? collect()
            : MediaAsset::query()->whereIn('id', $fileIds)->get()->keyBy('id');

        return [
            'id' => $section->id,
            'page_key' => $section->page_key,
            'section_key' => $section->section_key,
            'title' => $section->title,
            'sort_order' => $section->sort_order,
            'is_active' => $section->is_active,
            'items' => $section->items->map(function ($item) use ($files) {
                $fileMediaId = $item->meta_json['file_media_id'] ?? null;
                $file = $fileMediaId ? $files->get($fileMediaId) : null;

                return [
                    'id' => $item->id,
                    'item_key' => $item->item_key,
                    'title' => $item->title,
                    'media_id' => $item->media_id,
                    'media_url' => media_asset_url($item->media),
                    'file_media_id' => $fileMediaId,
                    'file_media_url' => media_asset_url($file),
                    'file_media_title' => $file?->title,
                    'sort_order' => $item->sort_order,
                    'is_active' => $item->is_active,
                ];
            })->values(),
        ];
    }
}

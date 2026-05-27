<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use App\Models\SiteSection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\View\View;

class CatalogController extends Controller
{
    public function show(): View
    {
        $section = SiteSection::query()
            ->with(['items.media'])
            ->where('page_key', 'catalogo')
            ->where('section_key', 'catalog_files')
            ->where('is_active', true)
            ->first();

        $items = collect();

        if ($section) {
            $fileIds = $section->items
                ->map(fn ($item) => $item->meta_json['file_media_id'] ?? null)
                ->filter()
                ->unique()
                ->values();

            $files = $fileIds->isEmpty()
                ? collect()
                : MediaAsset::query()->whereIn('id', $fileIds)->get()->keyBy('id');

            $items = $section->items
                ->where('is_active', true)
                ->map(function ($item) use ($files) {
                    $fileMediaId = $item->meta_json['file_media_id'] ?? null;
                    $file = $fileMediaId ? $files->get($fileMediaId) : null;

                    return [
                        'title' => $item->title,
                        'cover_url' => media_asset_url($item->media),
                        'file_url' => media_asset_url($file),
                        'file_view_url' => $this->fileUrl($file),
                        'file_download_url' => $this->fileUrl($file, true),
                    ];
                })
                ->filter(fn ($item) => filled($item['title']) || filled($item['cover_url']) || filled($item['file_url']))
                ->values();
        }

        return view('web.catalog.show', [
            'catalogItems' => $items,
        ]);
    }

    public function store(): RedirectResponse
    {
        return redirect()->route('web.catalog.show');
    }

    protected function fileUrl(?MediaAsset $file, bool $download = false): ?string
    {
        if (! $file) {
            return null;
        }

        $extension = strtolower((string) ($file->extension ?: pathinfo($file->path, PATHINFO_EXTENSION)));
        $slug = Str::slug((string) ($file->title ?: pathinfo($file->path, PATHINFO_FILENAME))) ?: 'catalogo';

        if ($extension) {
            $slug .= '.'.$extension;
        }

        return route('media.assets.show', [
            'mediaAsset' => $file->id,
            'slug' => $slug,
            'download' => $download ? 1 : null,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeoMeta;
use App\Support\SeoPageResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SeoController extends Controller
{
    public function index(): Response
    {
        SeoMeta::seedProfessionalDefaults();

        $metas = SeoMeta::query()
            ->get()
            ->keyBy('page');

        $pages = collect(SeoPageResolver::pages())
            ->map(function (array $page, string $key) use ($metas) {
                $meta = $metas->get($key);

                return [
                    'key' => $key,
                    'label' => $page['label'],
                    'recommended_title' => $page['recommended_title'],
                    'recommended_description' => $page['recommended_description'],
                    'recommended_keywords' => $page['recommended_keywords'],
                    'title' => $meta?->title,
                    'description' => $meta?->description,
                    'keywords' => $meta?->keywords,
                    'og_image' => $meta?->og_image,
                    'og_image_url' => $meta?->og_image_url,
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Admin/Seo/Index', [
            'pages' => $pages,
            'summary' => [
                'public_base_url' => cms_public_app_url(),
                'default_share_image' => default_seo_image_url(),
                'social_ready_pages' => SeoMeta::query()
                    ->whereNotNull('og_image')
                    ->where('og_image', '!=', '')
                    ->count(),
            ],
        ]);
    }

    public function upsert(Request $request): RedirectResponse
    {
        $pageKeys = array_keys(SeoPageResolver::pages());

        $validated = $request->validate([
            'page' => ['required', 'string', 'in:'.implode(',', $pageKeys)],
            'title' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:500'],
            'keywords' => ['nullable', 'string', 'max:500'],
            'og_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_og_image' => ['nullable', 'boolean'],
        ]);

        $meta = SeoMeta::query()->firstOrNew(['page' => $validated['page']]);
        $oldImage = $meta->og_image;

        $meta->fill([
            'title' => $this->cleanText($validated['title'] ?? null),
            'description' => $this->cleanText($validated['description'] ?? null),
            'keywords' => $this->cleanText($validated['keywords'] ?? null),
        ]);

        if ($request->boolean('remove_og_image')) {
            $meta->og_image = null;
        }

        if ($request->hasFile('og_image')) {
            $file = $request->file('og_image');
            $extension = $file->getClientOriginalExtension() ?: $file->extension();
            $meta->og_image = $file->storeAs(
                'uploads/seo/'.now()->format('Y/m'),
                (string) Str::uuid().($extension ? '.'.$extension : ''),
                'public'
            );
        }

        $meta->save();

        if ($oldImage && $oldImage !== $meta->og_image) {
            Storage::disk('public')->delete($oldImage);
        }

        return back()->with('success', 'SEO actualizado correctamente.');
    }

    protected function cleanText(?string $value): ?string
    {
        $value = cms_plain_text($value);

        return filled($value) ? $value : null;
    }
}

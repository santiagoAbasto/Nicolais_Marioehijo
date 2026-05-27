<?php

namespace App\Http\Controllers\Admin;

use App\Models\SocialLink;
use App\Support\SortOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialLinksController extends AdminPlaceholderController
{
    public function index(): Response
    {
        $this->ensureFooterLinks();

        return Inertia::render('Admin/SocialLinks/Index', [
            'links' => SocialLink::query()
                ->where('location', 'footer')
                ->orderBy('sort_order')
                ->get(['id', 'platform', 'label', 'url', 'icon', 'is_active'])
                ->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'platform' => ['required', 'string', 'max:50'],
            'label' => ['nullable', 'string', 'max:80'],
            'url' => ['required', 'url', 'max:255'],
        ]);

        $platform = str($data['platform'])->lower()->slug('-')->toString();
        $sortOrder = SortOrder::next(
            SocialLink::query()
                ->where('location', 'footer')
                ->pluck('sort_order'),
        );

        $socialLink = SocialLink::query()->create([
            'platform' => $platform,
            'label' => $data['label'] ?: str($platform)->replace('-', ' ')->title()->toString(),
            'url' => $data['url'],
            'icon' => $platform,
            'location' => 'footer',
            'sort_order' => $sortOrder,
            'is_active' => true,
        ]);

        return response()->json([
            'ok' => true,
            'link' => $socialLink->only(['id', 'platform', 'label', 'url', 'icon', 'is_active']),
        ], 201);
    }

    public function update(Request $request, SocialLink $socialLink): JsonResponse
    {
        $data = $request->validate([
            'platform' => ['required', 'string', 'max:50'],
            'label' => ['nullable', 'string', 'max:80'],
            'url' => ['nullable', 'url', 'max:255'],
            'icon' => ['nullable', 'string', 'max:80'],
            'is_active' => ['boolean'],
        ]);

        $platform = str($data['platform'])->lower()->slug('-')->toString();

        $socialLink->fill([
            'platform' => $platform,
            'label' => $data['label'] ?? null,
            'url' => $data['url'] ?? '',
            'icon' => $data['icon'] ?? $platform,
            'location' => 'footer',
            'is_active' => (bool) ($data['is_active'] ?? true),
        ])->save();

        return response()->json([
            'ok' => true,
            'link' => $socialLink->fresh()->only(['id', 'platform', 'label', 'url', 'icon', 'is_active']),
        ]);
    }

    protected function ensureFooterLinks(): void
    {
        foreach ([
            ['platform' => 'instagram', 'label' => 'Instagram', 'url' => 'https://instagram.com/nicolaismarioehijo'],
            ['platform' => 'facebook', 'label' => 'Facebook', 'url' => 'https://www.facebook.com/'],
        ] as $index => $item) {
            SocialLink::query()->firstOrCreate(
                ['platform' => $item['platform'], 'location' => 'footer'],
                [
                    'label' => $item['label'],
                    'url' => $item['url'],
                    'icon' => $item['platform'],
                    'sort_order' => SortOrder::fromPosition($index + 1),
                    'is_active' => true,
                ],
            );
        }
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Models\HomeHeroSlide;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HomeHeroSlideController extends AdminPlaceholderController
{
    public function index(Request $request): JsonResponse
    {
        $slides = HomeHeroSlide::query()
            ->with(['desktopMedia', 'mobileMedia', 'logoOneMedia', 'logoTwoMedia'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate((int) $request->integer('per_page', 100));

        return response()->json($slides);
    }

    public function store(Request $request): JsonResponse
    {
        $slide = HomeHeroSlide::query()->create($this->validated($request));

        return response()->json(
            $slide->load(['desktopMedia', 'mobileMedia', 'logoOneMedia', 'logoTwoMedia']),
            201
        );
    }

    public function update(Request $request, HomeHeroSlide $homeHeroSlide): JsonResponse
    {
        $homeHeroSlide->update($this->validated($request));

        return response()->json(
            $homeHeroSlide->fresh()->load(['desktopMedia', 'mobileMedia', 'logoOneMedia', 'logoTwoMedia'])
        );
    }

    public function destroy(HomeHeroSlide $homeHeroSlide): JsonResponse
    {
        $homeHeroSlide->delete();

        return response()->json(['deleted' => true]);
    }

    protected function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['nullable', 'string'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'button_text' => ['nullable', 'string', 'max:255'],
            'button_url' => ['nullable', 'string', 'max:1000'],
            'media_type' => ['required', Rule::in(['image', 'video', 'youtube'])],
            'desktop_media_id' => ['nullable', 'exists:media_assets,id'],
            'mobile_media_id' => ['nullable', 'exists:media_assets,id'],
            'logo_one_media_id' => ['nullable', 'exists:media_assets,id'],
            'logo_two_media_id' => ['nullable', 'exists:media_assets,id'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'string', 'max:20'],
            'autoplay_override_seconds' => ['nullable', 'integer', 'min:1', 'max:120'],
            'is_active' => ['boolean'],
        ]);

        $data['sort_order'] = trim((string) ($data['sort_order'] ?? '')) ?: 'A';

        return $data;
    }
}

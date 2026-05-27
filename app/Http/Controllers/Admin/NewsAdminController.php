<?php

namespace App\Http\Controllers\Admin;

use App\Models\Post;
use App\Models\PostCategory;
use App\Models\SiteSection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NewsAdminController extends AdminPlaceholderController
{
    public function index(Request $request): Response
    {
        $hero = SiteSection::query()->firstOrCreate(
            ['page_key' => 'novedades', 'section_key' => 'hero'],
            ['title' => 'Novedades', 'sort_order' => 'A', 'is_active' => true],
        );

        return Inertia::render('Admin/Novedades/Index', [
            'hero' => [
                'id' => $hero->id,
                'title' => $hero->title,
                'media_id' => $hero->media_id,
                'media_url' => media_asset_url($hero->media),
                'sort_order' => $hero->sort_order,
                'is_active' => $hero->is_active,
            ],
            'categories' => PostCategory::query()
                ->withCount('posts')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->map(fn (PostCategory $category) => $this->categoryPayload($category)),
            'posts' => Post::query()
                ->with(['category', 'coverMedia'])
                ->orderBy('sort_order')
                ->orderByDesc('published_at')
                ->get()
                ->map(fn (Post $post) => $this->postPayload($post)),
            'initialTab' => $request->query('tab', 'novedades'),
            'publicNovedadesUrl' => route('web.news.index'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Novedades/Create', [
            'categories' => PostCategory::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
            'nextSortOrder' => $this->nextSortOrder(),
        ]);
    }

    public function edit(Post $post): Response
    {
        $post->load(['category', 'coverMedia']);

        return Inertia::render('Admin/Novedades/Edit', [
            'post' => $this->postPayload($post, true),
            'categories' => PostCategory::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        ]);
    }

    protected function categoryPayload(PostCategory $category): array
    {
        return [
            ...$category->toArray(),
            'posts_count' => $category->posts_count ?? 0,
        ];
    }

    protected function postPayload(Post $post, bool $includeContent = false): array
    {
        return [
            ...$post->toArray(),
            'published_at' => $post->published_at?->format('Y-m-d'),
            'category_id' => $post->post_category_id,
            'category_name' => $post->category?->name,
            'category_color' => $post->category?->color,
            'cover_url' => media_asset_url($post->coverMedia),
            ...($includeContent ? ['content' => $post->content] : []),
        ];
    }

    protected function nextSortOrder(): string
    {
        $count = Post::query()->count();

        return chr(65 + min($count, 25));
    }
}

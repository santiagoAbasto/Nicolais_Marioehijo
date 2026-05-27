<?php

namespace App\Http\Controllers\Admin;

use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PostController extends AdminPlaceholderController
{
    public function store(Request $request): JsonResponse
    {
        $post = Post::query()->create($this->validated($request));

        return response()->json($post->load(['category', 'coverMedia']), 201);
    }

    public function update(Request $request, Post $post): JsonResponse
    {
        $post->update($this->validated($request, $post));

        return response()->json($post->fresh()->load(['category', 'coverMedia']));
    }

    public function updateHomeVisibility(Request $request, Post $post): JsonResponse
    {
        $data = $request->validate([
            'show_on_home' => ['required', 'boolean'],
        ]);

        $post->update(['show_on_home' => $data['show_on_home']]);

        return response()->json([
            'id' => $post->id,
            'show_on_home' => $post->show_on_home,
        ]);
    }

    public function destroy(Post $post): JsonResponse
    {
        $post->delete();

        return response()->json(['deleted' => true]);
    }

    protected function validated(Request $request, ?Post $post = null): array
    {
        $data = $request->validate([
            'post_category_id' => ['nullable', 'exists:post_categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
            'cover_media_id' => ['nullable', 'exists:media_assets,id'],
            'author_name' => ['nullable', 'string', 'max:255'],
            'published_at' => ['nullable', 'date'],
            'sort_order' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
            'show_on_home' => ['boolean'],
            'is_featured' => ['boolean'],
        ]);

        $data['slug'] = $this->uniqueSlug($data['title'], $post);
        $data['sort_order'] = trim((string) ($data['sort_order'] ?? '')) ?: 'A';

        return $data;
    }

    protected function uniqueSlug(string $value, ?Post $post = null): string
    {
        $base = Str::slug($value) ?: 'novedad';
        $slug = $base;
        $counter = 2;

        while (Post::query()
            ->where('slug', $slug)
            ->when($post, fn ($query) => $query->whereKeyNot($post->getKey()))
            ->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}

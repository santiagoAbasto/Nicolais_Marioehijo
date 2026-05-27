<?php

namespace App\Http\Controllers\Admin;

use App\Models\PostCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PostCategoryController extends AdminPlaceholderController
{
    public function store(Request $request): JsonResponse
    {
        $category = PostCategory::query()->create($this->validated($request));

        return response()->json($category, 201);
    }

    public function update(Request $request, PostCategory $postCategory): JsonResponse
    {
        $postCategory->update($this->validated($request, $postCategory));

        return response()->json($postCategory->fresh());
    }

    public function destroy(PostCategory $postCategory): JsonResponse
    {
        $postCategory->delete();

        return response()->json(['deleted' => true]);
    }

    protected function validated(Request $request, ?PostCategory $category = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
        ]);

        $data['slug'] = $this->uniqueSlug($data['name'], $category);
        $data['sort_order'] = trim((string) ($data['sort_order'] ?? '')) ?: 'A';

        return $data;
    }

    protected function uniqueSlug(string $value, ?PostCategory $category = null): string
    {
        $base = Str::slug($value) ?: 'categoria';
        $slug = $base;
        $counter = 2;

        while (PostCategory::query()
            ->where('slug', $slug)
            ->when($category, fn ($query) => $query->whereKeyNot($category->getKey()))
            ->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}

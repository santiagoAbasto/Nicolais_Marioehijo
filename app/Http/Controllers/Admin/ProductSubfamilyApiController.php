<?php

namespace App\Http\Controllers\Admin;

use App\Models\ProductSubfamily;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductSubfamilyApiController extends AdminPlaceholderController
{
    public function store(Request $request): JsonResponse
    {
        $subfamily = ProductSubfamily::query()->create($this->validated($request));

        return response()->json($subfamily, 201);
    }

    public function update(Request $request, ProductSubfamily $productSubfamily): JsonResponse
    {
        $productSubfamily->update($this->validated($request, $productSubfamily));

        return response()->json($productSubfamily->fresh());
    }

    public function destroy(ProductSubfamily $productSubfamily): JsonResponse
    {
        $productSubfamily->delete();

        return response()->json(['deleted' => true]);
    }

    protected function validated(Request $request, ?ProductSubfamily $subfamily = null): array
    {
        $data = $request->validate([
            'product_family_id' => ['required', 'exists:product_families,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'short_description' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'cover_media_id' => ['nullable', 'exists:media_assets,id'],
            'accent_color' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
            'show_on_home' => ['boolean'],
            'show_on_family_page' => ['boolean'],
        ]);

        $data['slug'] = $this->uniqueSlug($data['name'], (int) $data['product_family_id'], $subfamily);
        $data['sort_order'] = trim((string) ($data['sort_order'] ?? '')) ?: 'A';

        return $data;
    }

    protected function uniqueSlug(string $value, int $familyId, ?ProductSubfamily $subfamily = null): string
    {
        $base = Str::slug($value) ?: 'subfamilia';
        $slug = $base;
        $counter = 2;

        while (ProductSubfamily::query()
            ->where('product_family_id', $familyId)
            ->where('slug', $slug)
            ->when($subfamily, fn ($query) => $query->whereKeyNot($subfamily->getKey()))
            ->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}

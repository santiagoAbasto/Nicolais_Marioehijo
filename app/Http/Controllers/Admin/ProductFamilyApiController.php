<?php

namespace App\Http\Controllers\Admin;

use App\Models\ProductFamily;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductFamilyApiController extends AdminPlaceholderController
{
    public function store(Request $request): JsonResponse
    {
        $family = ProductFamily::query()->create($this->validated($request));

        return response()->json($family, 201);
    }

    public function update(Request $request, ProductFamily $productFamily): JsonResponse
    {
        $productFamily->update($this->validated($request, $productFamily));

        return response()->json($productFamily->fresh());
    }

    public function destroy(ProductFamily $productFamily): JsonResponse
    {
        $productFamily->delete();

        return response()->json(['deleted' => true]);
    }

    protected function validated(Request $request, ?ProductFamily $family = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'cover_media_id' => ['nullable', 'exists:media_assets,id'],
            'banner_media_id' => ['nullable', 'exists:media_assets,id'],
            'accent_color' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
            'show_on_products_page' => ['boolean'],
            'show_on_home' => ['boolean'],
        ]);

        $data['slug'] = $this->uniqueSlug($data['name'], $family);
        $data['sort_order'] = trim((string) ($data['sort_order'] ?? '')) ?: 'A';

        if (($data['show_on_home'] ?? false) && ! ($family?->show_on_home ?? false)) {
            $data['sort_order'] = $this->nextHomeSortOrder($family);
        }

        return $data;
    }

    protected function nextHomeSortOrder(?ProductFamily $family = null): string
    {
        $lastOrder = ProductFamily::query()
            ->where('show_on_home', true)
            ->when($family, fn ($query) => $query->whereKeyNot($family->getKey()))
            ->pluck('sort_order')
            ->filter()
            ->sort(SORT_NATURAL | SORT_FLAG_CASE)
            ->last();

        if (! $lastOrder) {
            return 'A';
        }

        if (preg_match('/^[A-Z]+$/i', $lastOrder)) {
            return $this->incrementAlphaOrder(strtoupper($lastOrder));
        }

        if (preg_match('/^\d+$/', $lastOrder)) {
            return (string) ((int) $lastOrder + 1);
        }

        return $lastOrder.'z';
    }

    protected function incrementAlphaOrder(string $order): string
    {
        $letters = str_split($order);

        for ($index = count($letters) - 1; $index >= 0; $index--) {
            if ($letters[$index] !== 'Z') {
                $letters[$index] = chr(ord($letters[$index]) + 1);

                return implode('', $letters);
            }

            $letters[$index] = 'A';
        }

        array_unshift($letters, 'A');

        return implode('', $letters);
    }

    protected function uniqueSlug(string $value, ?ProductFamily $family = null): string
    {
        $base = Str::slug($value) ?: 'familia';
        $slug = $base;
        $counter = 2;

        while (ProductFamily::query()
            ->where('slug', $slug)
            ->when($family, fn ($query) => $query->whereKeyNot($family->getKey()))
            ->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}

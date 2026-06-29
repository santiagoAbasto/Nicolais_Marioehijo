<?php

namespace App\Http\Controllers\Admin;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductApiController extends AdminPlaceholderController
{
    public function show(Product $product): JsonResponse
    {
        return response()->json($product->load([
            'family',
            'subfamily',
            'mainMedia',
            'technicalSheet',
            'media.media',
            'relatedProducts',
            'specTables.columns',
            'specTables.rows.values',
        ]));
    }

    public function store(Request $request): JsonResponse
    {
        $product = DB::transaction(function () use ($request): Product {
            $product = Product::query()->create($this->validated($request));
            $this->syncRelations($product, $request);

            return $product;
        });

        return response()->json($product->load(['mainMedia']), 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        DB::transaction(function () use ($request, $product): void {
            $product->update($this->validated($request, $product));
            $this->syncRelations($product, $request);
        });

        return response()->json($product->fresh()->load(['mainMedia']));
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['deleted' => true]);
    }

    protected function validated(Request $request, ?Product $product = null): array
    {
        $data = $request->validate([
            'product_family_id' => ['required', 'exists:product_families,id'],
            'product_subfamily_id' => ['nullable', 'exists:product_subfamilies,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:80'],
            'brand_logo_media_id' => ['nullable', 'exists:media_assets,id'],
            'rubro' => ['nullable', 'string', 'max:255'],
            'original_code' => ['nullable', 'string', 'max:255'],
            'equivalence_code' => ['nullable', 'string', 'max:255'],
            'oem_code' => ['nullable', 'string', 'max:255'],
            'price' => ['nullable', 'numeric'],
            'discount_price' => ['nullable', 'numeric'],
            'short_description' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'applications' => ['nullable', 'string'],
            'material' => ['nullable', 'string'],
            'treatment' => ['nullable', 'string'],
            'observations' => ['nullable', 'string'],
            'main_media_id' => ['nullable', 'exists:media_assets,id'],
            'technical_sheet_media_id' => ['nullable', 'exists:media_assets,id'],
            'sort_order' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
            'is_featured_home' => ['boolean'],
            'is_featured_family' => ['boolean'],
        ]);

        $data['slug'] = $this->uniqueSlug($data['name'], $product);
        $data['sort_order'] = trim((string) ($data['sort_order'] ?? '')) ?: 'A';
        $data['main_media_id'] = $data['main_media_id']
            ?? $this->brandImageId($data['brand'] ?? null);

        return $data;
    }

    protected function brandImageId(?string $brand): ?int
    {
        if (! $brand) {
            return null;
        }

        return Product::query()
            ->where('brand', $brand)
            ->whereNotNull('main_media_id')
            ->value('main_media_id');
    }

    protected function syncRelations(Product $product, Request $request): void
    {
        $product->media()->delete();

        foreach ($request->input('media', []) as $index => $row) {
            if (! empty($row['media_id'])) {
                $product->media()->create([
                    'media_id' => $row['media_id'],
                    'sort_order' => $row['sort_order'] ?? chr(65 + $index),
                    'is_primary' => (bool) ($row['is_primary'] ?? false),
                ]);
            }
        }

        $product->relatedProducts()->sync(
            collect($request->input('related_product_ids', []))
                ->filter()
                ->mapWithKeys(fn ($id, $index) => [(int) $id => ['sort_order' => chr(65 + $index)]])
                ->all()
        );

        $product->specTables()->delete();

        foreach ($request->input('spec_tables', []) as $tableIndex => $tableData) {
            $table = $product->specTables()->create([
                'title' => $tableData['title'] ?? null,
                'sort_order' => $tableData['sort_order'] ?? chr(65 + $tableIndex),
            ]);

            $columns = [];
            foreach ($tableData['columns'] ?? [] as $columnIndex => $columnData) {
                $columns[] = $table->columns()->create([
                    'label' => $columnData['label'] ?? '',
                    'unit' => $columnData['unit'] ?? null,
                    'sort_order' => $columnData['sort_order'] ?? chr(65 + $columnIndex),
                ]);
            }

            foreach ($tableData['rows'] ?? [] as $rowIndex => $rowData) {
                $row = $table->rows()->create([
                    'sort_order' => $rowData['sort_order'] ?? chr(65 + $rowIndex),
                ]);

                foreach (($rowData['values'] ?? []) as $columnIndex => $value) {
                    if (! isset($columns[$columnIndex])) {
                        continue;
                    }

                    $row->values()->create([
                        'product_spec_column_id' => $columns[$columnIndex]->id,
                        'value' => $value,
                    ]);
                }
            }
        }
    }

    protected function uniqueSlug(string $value, ?Product $product = null): string
    {
        $base = Str::slug($value) ?: 'producto';
        $slug = $base;
        $counter = 2;

        while (Product::query()
            ->where('slug', $slug)
            ->when($product, fn ($query) => $query->whereKeyNot($product->getKey()))
            ->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Models\Product;
use App\Models\ProductFamily;
use App\Models\ProductSubfamily;
use App\Models\SiteSection;
use App\Models\MediaAsset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductCatalogAdminController extends AdminPlaceholderController
{
    public function index(Request $request): Response
    {
        $hero = SiteSection::query()->firstOrCreate(
            ['page_key' => 'productos', 'section_key' => 'hero'],
            ['title' => 'Productos', 'sort_order' => 'A', 'is_active' => true]
        );

        return Inertia::render('Admin/Products/Index', [
            'hero' => [
                'id' => $hero->id,
                'title' => $hero->title,
                'media_id' => $hero->media_id,
                'media_url' => media_asset_url($hero->media),
                'sort_order' => $hero->sort_order,
                'is_active' => $hero->is_active,
            ],
            'families' => ProductFamily::query()
                ->withCount(['subfamilies', 'products'])
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->map(fn (ProductFamily $family) => $this->familyPayload($family)),
            'subfamilies' => ProductSubfamily::query()
                ->with(['family'])
                ->withCount('products')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->map(fn (ProductSubfamily $subfamily) => $this->subfamilyPayload($subfamily)),
            'products' => Product::query()
                ->with(['family', 'subfamily', 'mainMedia'])
                ->withCount(['media as gallery_count', 'specTables as spec_tables_count', 'relatedProducts as related_count'])
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->map(fn (Product $product) => $this->productListPayload($product)),
            'brands' => $this->brandPayloads(),
            'stats' => [
                'families' => ProductFamily::query()->count(),
                'subfamilies' => ProductSubfamily::query()->count(),
                'products' => Product::query()->count(),
                'brands' => Product::query()
                    ->whereNotNull('brand')
                    ->where('brand', '!=', '')
                    ->distinct()
                    ->count('brand'),
            ],
            'initialTab' => $request->query('tab', 'products'),
            'publicProductsUrl' => route('web.products.index'),
            'importTemplateUrl' => route('admin.products.import-template'),
        ]);
    }

    public function updateBrandImage(Request $request): JsonResponse
    {
        $data = $request->validate([
            'brand' => ['required', 'string', 'max:80'],
            'media_id' => ['required', 'exists:media_assets,id'],
        ]);

        $updated = Product::query()
            ->where('brand', $data['brand'])
            ->update(['main_media_id' => $data['media_id']]);

        $media = MediaAsset::query()->find($data['media_id']);

        return response()->json([
            'brand' => $data['brand'],
            'media_id' => (int) $data['media_id'],
            'media_url' => media_asset_url($media),
            'products_count' => $updated,
        ]);
    }

    public function template()
    {
        return response()->streamDownload(function (): void {
            echo "familia,rubro,subfamilia,codigo,descripcion,tipo,precio_lista,precio_con_descuento,precio_venta,cantidad,subtotal,vista_publico,marca,modelo,codigo_original,equivalencia,codigo_oem,descripcion_corta,aplicaciones,observaciones\n";
            echo "Engranajes,01 CAJA FIAT MLGU,Toyota Hilux,04011-001,Sincronizado de 5° (camisa y maza),Importado,20000,19000,20900,100,1900000,SI,Importado,Toyota Hilux,33301-35080,33301-35080,33301-35080,Repuestos automotores,Caja de cambios,Importado desde lista inicial\n";
        }, 'template-productos.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    protected function familyPayload(ProductFamily $family): array
    {
        return [
            ...$family->toArray(),
            'cover_media_url' => media_asset_url($family->coverMedia),
            'banner_media_url' => media_asset_url($family->bannerMedia),
            'subfamilies_count' => $family->subfamilies_count ?? 0,
            'products_count' => $family->products_count ?? 0,
        ];
    }

    protected function subfamilyPayload(ProductSubfamily $subfamily): array
    {
        return [
            ...$subfamily->toArray(),
            'family_name' => $subfamily->family?->name,
            'products_count' => $subfamily->products_count ?? 0,
        ];
    }

    protected function productListPayload(Product $product): array
    {
        $listPrice = (float) ($product->price ?? 0);
        $discountPrice = $product->discount_price === null ? null : (float) $product->discount_price;

        return [
            ...$product->toArray(),
            'family_name' => $product->family?->name,
            'subfamily_name' => $product->subfamily?->name,
            'main_media_url' => media_asset_url($product->mainMedia),
            'discount_percent' => $listPrice > 0 && $discountPrice !== null
                ? max(0, (1 - ($discountPrice / $listPrice)) * 100)
                : null,
            'gallery_count' => $product->gallery_count ?? 0,
            'spec_tables_count' => $product->spec_tables_count ?? 0,
            'related_count' => $product->related_count ?? 0,
        ];
    }

    protected function brandPayloads()
    {
        return Product::query()
            ->with('mainMedia')
            ->whereNotNull('brand')
            ->where('brand', '!=', '')
            ->orderBy('brand')
            ->get()
            ->groupBy('brand')
            ->map(function ($items, string $brand): array {
                $source = $items->first(fn (Product $product) => $product->main_media_id);

                return [
                    'brand' => $brand,
                    'products_count' => $items->count(),
                    'media_id' => $source?->main_media_id,
                    'media_url' => media_asset_url($source?->mainMedia),
                ];
            })
            ->values();
    }
}

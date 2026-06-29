<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductFamily;
use App\Models\ProductSubfamily;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProductCatalogController extends Controller
{
    public function index(Request $request): View
    {
        return $this->listing($request);
    }

    public function all(Request $request): View
    {
        return $this->listing($request, null, true);
    }

    public function line(Request $request, string $lineSlug): View
    {
        $product = Product::query()
            ->where('slug', $lineSlug)
            ->where('is_active', true)
            ->first();

        if ($product) {
            return $this->showProduct($product);
        }

        $privateProduct = Product::query()
            ->where('slug', $lineSlug)
            ->where('is_active', false)
            ->first();

        if ($privateProduct) {
            $publicProduct = Product::query()
                ->where('is_active', true)
                ->whereHas('relatedProducts', fn ($query) => $query->whereKey($privateProduct->id))
                ->first();

            if ($publicProduct) {
                return $this->showProduct($publicProduct);
            }
        }

        $family = ProductFamily::query()
            ->where('slug', $lineSlug)
            ->where('is_active', true)
            ->firstOrFail();

        return $this->listing($request, $family, true);
    }

    public function series(string $lineSlug, string $seriesSlug): View
    {
        $product = Product::query()
            ->where('slug', $seriesSlug)
            ->where('is_active', true)
            ->firstOrFail();

        return $this->showProduct($product);
    }

    public function grade(string $lineSlug, string $seriesSlug, string $gradeSlug): View
    {
        $product = Product::query()
            ->where('slug', $gradeSlug)
            ->where('is_active', true)
            ->firstOrFail();

        return $this->showProduct($product);
    }

    public function technicalSheet(string $lineSlug, string $seriesSlug, string $gradeSlug): BinaryFileResponse|RedirectResponse
    {
        $product = Product::query()->where('slug', $gradeSlug)->firstOrFail();

        if (! $product->technicalSheet?->path) {
            return redirect()->route('web.products.line', $product->slug);
        }

        return response()->file(storage_path('app/public/'.$product->technicalSheet->path));
    }

    protected function listing(Request $request, ?ProductFamily $selectedFamily = null, bool $showAll = false): View
    {
        $families = ProductFamily::query()
            ->with(['coverMedia'])
            ->where('is_active', true)
            ->where('show_on_products_page', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $query = Product::query()
            ->with(['family', 'subfamily', 'mainMedia', 'brandLogoMedia'])
            ->where('is_active', true);

        if ($selectedFamily) {
            $query->where('product_family_id', $selectedFamily->id);
        }

        if ($request->filled('q')) {
            $needle = '%'.$request->string('q')->trim().'%';
            $query->where(function ($inner) use ($needle): void {
                $inner->where('name', 'like', $needle)
                    ->orWhere('sku', 'like', $needle)
                    ->orWhere('original_code', 'like', $needle)
                    ->orWhere('equivalence_code', 'like', $needle)
                    ->orWhere('oem_code', 'like', $needle)
                    ->orWhere('rubro', 'like', $needle);
            });
        }

        if ($request->filled('codigo')) {
            $query->where('sku', 'like', '%'.$request->string('codigo')->trim().'%');
        }

        if ($request->filled('equivalencia')) {
            $needle = '%'.$request->string('equivalencia')->trim().'%';
            $query->where(function ($inner) use ($needle): void {
                $inner->where('original_code', 'like', $needle)
                    ->orWhere('equivalence_code', 'like', $needle)
                    ->orWhere('oem_code', 'like', $needle);
            });
        }

        if ($request->filled('oem')) {
            $query->where('oem_code', 'like', '%'.$request->string('oem')->trim().'%');
        }

        if ($request->filled('rubro')) {
            $query->where('rubro', $request->query('rubro'));
        }

        if ($request->filled('model')) {
            $query->whereHas('subfamily', function ($inner) use ($request): void {
                $inner->where('name', $request->query('model'));
            });
        }

        foreach (['family' => 'product_family_id', 'brand' => 'brand'] as $param => $column) {
            if ($request->filled($param)) {
                $query->where($column, $request->query($param));
            }
        }

        $products = $query
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($showAll ? 24 : 12)
            ->withQueryString();

        $featured = Product::query()
            ->with(['family', 'mainMedia', 'brandLogoMedia'])
            ->where('is_active', true)
            ->where('is_featured_home', true)
            ->orderBy('sort_order')
            ->limit(8)
            ->get();

        return view('web.products.index', [
            'families' => $families,
            'products' => $products,
            'featured' => $featured,
            'selectedFamily' => $selectedFamily,
            'brands' => Product::query()->whereNotNull('brand')->distinct()->orderBy('brand')->pluck('brand'),
            'rubros' => Product::query()
                ->whereNotNull('rubro')
                ->where('rubro', '!=', '')
                ->distinct()
                ->orderBy('rubro')
                ->pluck('rubro'),
            'models' => ProductSubfamily::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->limit(120)
                ->pluck('name'),
            'showAll' => $showAll,
        ]);
    }

    protected function showProduct(Product $product): View
    {
        $product->load([
            'family',
            'subfamily',
            'mainMedia',
            'brandLogoMedia',
            'media.media',
            'relatedProducts.family',
            'relatedProducts.mainMedia',
            'relatedProducts.brandLogoMedia',
        ]);

        $equivalences = $product->relatedProducts
            ->sortBy(fn (Product $related) => $related->pivot?->sort_order ?? $related->sku ?? $related->id)
            ->values();

        if ($equivalences->isEmpty()) {
            $equivalences = Product::query()
                ->with(['brandLogoMedia'])
                ->where('is_active', true)
                ->where(function ($query) use ($product): void {
                    if ($product->sku) {
                        $query->orWhere('sku', $product->sku);
                    }

                    $query->orWhere(function ($inner) use ($product): void {
                        $inner->where('name', $product->name);

                        if ($product->rubro) {
                            $inner->where('rubro', $product->rubro);
                        }
                    });
                })
                ->orderByRaw('CASE WHEN id = ? THEN 0 ELSE 1 END', [$product->id])
                ->orderBy('brand')
                ->orderBy('sku')
                ->get();
        }

        $related = Product::query()
            ->with(['family', 'mainMedia', 'brandLogoMedia'])
            ->where('is_active', true)
            ->whereKeyNot($product->id)
            ->where(function ($query) use ($product): void {
                if ($product->product_subfamily_id) {
                    $query->where('product_subfamily_id', $product->product_subfamily_id);
                }

                $query->orWhere('product_family_id', $product->product_family_id);
            })
            ->orderByRaw('CASE WHEN product_subfamily_id = ? THEN 0 ELSE 1 END', [$product->product_subfamily_id])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->limit(4)
            ->get();

        return view('web.products.show', [
            'product' => $product,
            'equivalences' => $equivalences,
            'related' => $related,
        ]);
    }
}

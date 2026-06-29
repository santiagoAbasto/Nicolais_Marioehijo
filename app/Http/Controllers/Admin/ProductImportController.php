<?php

namespace App\Http\Controllers\Admin;

use App\Models\MediaAsset;
use App\Models\Product;
use App\Models\ProductFamily;
use App\Models\ProductSubfamily;
use App\Support\CmsSecurity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ProductImportController extends AdminPlaceholderController
{
    protected array $imagePool = [];

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:xlsx,xls,csv',
                'mimetypes:'.implode(',', CmsSecurity::safeOfficeMimeTypes()),
                'max:51200',
            ],
        ]);

        $summary = $this->importFilePath(
            $validated['file']->getRealPath(),
            $validated['file']->getClientOriginalName()
        );

        return response()->json(['summary' => $summary]);
    }

    public function images(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:300'],
            'images.*' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp,gif',
                'mimetypes:'.implode(',', CmsSecurity::safeImageMimeTypes()),
                'max:10240',
            ],
        ]);

        $summary = [
            'uploaded' => 0,
            'matched_products' => 0,
            'matched_files' => [],
            'unmatched' => [],
            'errors' => [],
        ];
        $placeholderMediaIds = $this->brandPlaceholderMediaIds();

        foreach ($validated['images'] as $file) {
            if (! $file instanceof UploadedFile) {
                $summary['errors'][] = [
                    'file' => 'Archivo desconocido',
                    'reason' => 'El archivo no llegó como una imagen válida.',
                ];

                continue;
            }

            $rawName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $imageKey = $this->productImageKey($rawName);

            if ($imageKey === '') {
                $summary['errors'][] = [
                    'file' => $file->getClientOriginalName(),
                    'reason' => 'El nombre del archivo no contiene un código usable para matchear.',
                ];

                continue;
            }

            $extension = strtolower($file->extension() ?: $file->getClientOriginalExtension() ?: 'jpg');
            $storedName = $imageKey.'-'.Str::lower(Str::random(6)).'.'.$extension;
            $path = $file->storeAs('uploads/product-images/'.now()->format('Y/m'), $storedName, 'public');

            $media = MediaAsset::query()->create([
                'type' => 'image',
                'disk' => 'public',
                'path' => $path,
                'title' => $rawName,
                'alt_text' => 'Imagen producto '.$rawName,
                'mime_type' => Storage::disk('public')->mimeType($path),
                'extension' => $extension,
                'size_bytes' => Storage::disk('public')->size($path),
            ]);

            $products = Product::query()
                ->whereRaw("LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(sku, ''), '.', ''), '-', ''), ' ', ''), '/', ''), '_', '')) = ?", [$imageKey])
                ->get();

            if ($products->isEmpty()) {
                $summary['unmatched'][] = [
                    'file' => $file->getClientOriginalName(),
                    'normalized_code' => $imageKey,
                    'reason' => 'No existe ningún producto con ese código/SKU normalizado.',
                ];
                $summary['uploaded']++;
                continue;
            }

            foreach ($products as $product) {
                $shouldUseAsMain = ! $product->main_media_id
                    || in_array((int) $product->main_media_id, $placeholderMediaIds, true);

                if ($shouldUseAsMain) {
                    $product->update(['main_media_id' => $media->id]);
                }

                $product->media()->firstOrCreate(
                    ['media_id' => $media->id],
                    [
                        'sort_order' => $this->sortLetter($product->media()->count()),
                        'is_primary' => $shouldUseAsMain,
                    ]
                );

                if ($shouldUseAsMain) {
                    $product->media()
                        ->where('media_id', '!=', $media->id)
                        ->update(['is_primary' => false]);
                }
            }

            $summary['uploaded']++;
            $summary['matched_products'] += $products->count();
            $summary['matched_files'][] = [
                'file' => $file->getClientOriginalName(),
                'normalized_code' => $imageKey,
                'products_count' => $products->count(),
                'products' => $products
                    ->take(5)
                    ->map(fn (Product $product) => [
                        'sku' => $product->sku,
                        'name' => $product->name,
                    ])
                    ->values()
                    ->all(),
            ];
        }

        return response()->json(['summary' => $summary]);
    }

    public function importFilePath(string $path, string $name): array
    {
        $brand = $this->brandFromFilename($name);
        $brandLogoId = $this->brandLogoId($brand);
        $brandImageId = $this->brandImageId($brand);
        $this->imagePool = $this->catalogImagePool();

        $spreadsheet = IOFactory::load($path);
        $rows = $spreadsheet->getActiveSheet()->toArray(null, true, true, false);
        $headings = $this->resolveHeadings($rows[0] ?? []);
        $currentSection = $brand;
        $currentRubro = null;
        $created = ['families' => 0, 'subfamilies' => 0, 'products' => 0];

        foreach ($rows as $index => $row) {
            $values = $this->compactRow($row);

            if ($values === []) {
                continue;
            }

            if ($this->isHeaderRow($values) || $this->isNoiseRow($values)) {
                continue;
            }

            if ($headings !== []) {
                $parsed = $this->parseMappedProductRow($row, $headings, $brand, $currentSection, $currentRubro);
                if (! $parsed) {
                    continue;
                }
                $currentSection = $parsed['subfamily'];
                $currentRubro = $parsed['rubro'] ?: $currentRubro;
            } elseif ($this->isFurconRubroRow($values)) {
                $currentRubro = $this->cleanRubro($values);
                $currentSection = $currentRubro ?: $currentSection;
                continue;
            } elseif ($this->isSectionRow($values)) {
                $currentSection = $this->cleanSection($values[0]);
                continue;
            } else {
                if (! $this->looksLikeProduct($values)) {
                    continue;
                }

                $parsed = $this->parseProductRow($values, $brand, $currentSection, $currentRubro);
                if (! $parsed) {
                    continue;
                }
            }

            $familyName = $this->familyForDescription($parsed['description']);
            $familyName = $parsed['family'] ?: $familyName;
            $family = ProductFamily::query()->firstOrCreate(
                ['slug' => Str::slug($familyName)],
                [
                    'name' => $familyName,
                    'description' => 'Repuestos automotores para transmisión.',
                    'sort_order' => $this->sortLetter(ProductFamily::query()->count()),
                    'is_active' => true,
                    'show_on_products_page' => true,
                    'show_on_home' => true,
                    'cover_media_id' => $this->nextImageId(),
                ]
            );

            if ($family->wasRecentlyCreated) {
                $created['families']++;
            }

            $subfamily = ProductSubfamily::query()->firstOrCreate(
                ['product_family_id' => $family->id, 'slug' => Str::slug($parsed['subfamily']) ?: 'general'],
                [
                    'name' => $parsed['subfamily'],
                    'short_description' => $parsed['brand'],
                    'description' => $parsed['subfamily'],
                    'sort_order' => $this->sortLetter(ProductSubfamily::query()->where('product_family_id', $family->id)->count()),
                    'is_active' => true,
                    'show_on_home' => false,
                    'show_on_family_page' => true,
                    'cover_media_id' => $this->nextImageId(),
                ]
            );

            if ($subfamily->wasRecentlyCreated) {
                $created['subfamilies']++;
            }

            $parsedBrandLogoId = $this->brandLogoId($parsed['brand']);
            $parsedBrandImageId = $this->brandImageId($parsed['brand']);
            $existingProduct = $this->existingProductForImport($parsed);
            $productData = [
                'product_family_id' => $family->id,
                'product_subfamily_id' => $subfamily->id,
                'name' => $parsed['description'],
                'slug' => $existingProduct?->slug ?: $this->uniqueProductSlug(implode(' ', array_filter([$parsed['code'], $parsed['brand'], $parsed['rubro'], $parsed['description']]))),
                'sku' => $parsed['code'],
                'brand' => $parsed['brand'],
                'brand_logo_media_id' => $parsedBrandLogoId ?: $brandLogoId ?: $existingProduct?->brand_logo_media_id,
                'rubro' => $parsed['rubro'],
                'original_code' => $parsed['original_code'],
                'equivalence_code' => $parsed['equivalence_code'],
                'oem_code' => $parsed['oem_code'],
                'price' => $parsed['price'],
                'discount_price' => $parsed['discount_price'],
                'short_description' => $parsed['short_description'],
                'description' => $parsed['long_description'],
                'applications' => $parsed['applications'],
                'observations' => $parsed['price_label'],
                'main_media_id' => $existingProduct?->main_media_id ?: ($parsedBrandImageId ?: $brandImageId ?: $this->nextImageId()),
                'sort_order' => $existingProduct?->sort_order ?: $this->sortLetter($index),
                'is_active' => $parsed['is_active'] && $parsed['price'] === null && $parsed['discount_price'] === null,
                'is_featured_home' => $existingProduct?->is_featured_home ?? $created['products'] < 12,
                'is_featured_family' => $existingProduct?->is_featured_family ?? true,
            ];

            if ($existingProduct) {
                $existingProduct->update($productData);
                $product = $existingProduct;
            } else {
                $product = Product::query()->create($productData);
            }

            $this->linkRelatedProduct($product, $parsed['related_code'] ?? null);

            if ($product->wasRecentlyCreated) {
                $created['products']++;
            }
        }

        return [
            ...$created,
            'brand' => $brand,
        ];
    }

    protected function existingProductForImport(array $parsed): ?Product
    {
        $hasPrice = $parsed['price'] !== null || $parsed['discount_price'] !== null;

        return Product::query()
            ->where('sku', $parsed['code'])
            ->where('brand', $parsed['brand'])
            ->when($hasPrice, function ($query): void {
                $query->where('is_active', false);
            }, function ($query): void {
                $query->where('is_active', true)
                    ->whereNull('price')
                    ->whereNull('discount_price');
            })
            ->orderBy('id')
            ->first();
    }

    protected function compactRow(array $row): array
    {
        return array_values(array_filter(array_map(
            fn ($value) => trim((string) $value),
            $row
        ), fn ($value) => $value !== ''));
    }

    protected function resolveHeadings(array $row): array
    {
        $normalized = array_map(fn ($value) => $this->normalizeHeading((string) $value), $row);
        $known = [
            'familia', 'subfamilia', 'codigo', 'descripcion', 'tipo', 'precio_lista',
            'precio_con_descuento', 'precio_venta', 'cantidad', 'subtotal', 'vista_publico',
            'marca', 'modelo', 'codigo_original', 'equivalencia', 'codigo_oem',
            'descripcion_corta', 'aplicaciones', 'observaciones', 'rubro',
        ];

        $matched = array_intersect($known, $normalized);
        if (count($matched) < 4) {
            return [];
        }

        return array_filter($normalized, fn ($value) => $value !== '');
    }

    protected function normalizeHeading(string $value): string
    {
        $value = Str::of($value)->ascii()->lower()->replaceMatches('/[^a-z0-9]+/', '_')->trim('_')->toString();

        return match ($value) {
            'cod', 'codigo_nm', 'sku', 'n_nicolais', 'numero_nicolais', 'n_nicolais_' => 'codigo',
            'nombre', 'producto', 'detalle' => 'descripcion',
            'modelo' => 'modelo',
            'precio', 'lista' => 'precio_lista',
            'precio_descuento' => 'precio_con_descuento',
            'venta' => 'precio_venta',
            'cant', 'qty' => 'cantidad',
            'publico', 'vista_publica', 'visible_publico' => 'vista_publico',
            'oem', 'codigo_oem' => 'codigo_oem',
            'original', 'codigo_original' => 'codigo_original',
            default => $value,
        };
    }

    protected function isHeaderRow(array $values): bool
    {
        $line = Str::upper(implode(' ', $values));

        return Str::contains($line, ['Nº NICOLAIS', 'N° NICOLAIS', 'PRECIO']);
    }

    protected function isNoiseRow(array $values): bool
    {
        $line = Str::upper(implode(' ', $values));

        return count($values) === 1 && (
            Str::contains($line, ['JOSE MELIAN', 'TELÉFONOS', 'TELEFONOS', 'WHATSAPP', 'MAIL', 'WEB', 'MAYO 2026', 'IVA', 'NETO'])
        );
    }

    protected function isSectionRow(array $values): bool
    {
        if (count($values) !== 1) {
            return false;
        }

        $value = Str::upper($values[0]);

        return ! preg_match('/^[A-Z]{0,4}[- ]?\d/i', $value)
            && ! Str::contains($value, ['JOSE MELIAN', 'TELEFONO', 'TELÉFONO', 'WHATSAPP', 'MAIL', 'WEB', 'MAYO']);
    }

    protected function looksLikeProduct(array $values): bool
    {
        return count($values) >= 3 && preg_match('/[0-9]/', $values[0]);
    }

    protected function isFurconRubroRow(array $values): bool
    {
        return Str::upper($values[0] ?? '') === 'RUBRO:';
    }

    protected function parseProductRow(array $values, string $brand, string $currentSection, ?string $currentRubro): ?array
    {
        $priceLabel = end($values);
        $price = null;

        $relatedCode = null;

        if (Str::startsWith(Str::upper($values[0]), 'NM') && count($values) >= 4) {
            $code = $values[0];
            $original = $values[1] ?? null;
            $description = $values[2] ?? null;
            $relatedCode = $values[count($values) - 1] ?? null;
        } elseif (Str::startsWith(Str::upper($values[0]), 'NM') && count($values) === 3) {
            $code = $values[0];
            $original = null;
            $description = $values[1] ?? null;
            $relatedCode = $values[2] ?? null;
        } else {
            $code = $values[0];
            $original = null;
            $description = $values[1] ?? null;
            $price = $this->decimalValue($priceLabel);
        }

        if (! $code || ! $description) {
            return null;
        }

        return [
            'code' => Str::limit($code, 250, ''),
            'family' => null,
            'rubro' => $currentRubro,
            'subfamily' => $this->cleanSection($currentSection ?: $description),
            'brand' => $brand,
            'original_code' => $original ? Str::limit($original, 250, '') : null,
            'equivalence_code' => $original ? Str::limit($original, 250, '') : null,
            'oem_code' => $original ? Str::limit($original, 250, '') : null,
            'description' => Str::limit($description, 250, ''),
            'short_description' => Str::limit($description, 250, ''),
            'long_description' => 'Descripción de producto',
            'applications' => $description,
            'price' => $price,
            'discount_price' => null,
            'price_label' => $priceLabel,
            'related_code' => $relatedCode ? Str::limit($relatedCode, 250, '') : null,
            'is_active' => true,
        ];
    }

    protected function parseMappedProductRow(array $row, array $headings, string $defaultBrand, string $currentSection, ?string $currentRubro): ?array
    {
        $get = function (string $key) use ($row, $headings): ?string {
            $index = array_search($key, $headings, true);
            $value = $index !== false ? trim((string) ($row[$index] ?? '')) : '';

            return $value !== '' ? $value : null;
        };

        $code = $get('codigo');
        $description = $get('descripcion') ?? $get('nombre');

        if (! $code || ! $description) {
            return null;
        }

        $priceLabel = $get('precio_lista') ?? $get('precio_venta') ?? $get('precio_con_descuento');
        $price = $this->decimalValue($priceLabel);
        $discountPrice = $this->decimalValue($get('precio_con_descuento'));
        $type = $get('tipo');
        $brand = $get('marca') ?? $type ?? $defaultBrand;
        $subfamily = $get('modelo') ?? $get('subfamilia') ?? $currentSection;
        $isPublic = $get('vista_publico');

        return [
            'code' => Str::limit($code, 250, ''),
            'family' => $get('familia'),
            'rubro' => $get('rubro') ?? $currentRubro,
            'subfamily' => $subfamily ?: 'General',
            'brand' => $brand ?: 'Importado',
            'original_code' => Str::limit((string) ($get('codigo_original') ?? $get('equivalencia') ?? $get('codigo_oem') ?? ''), 250, ''),
            'equivalence_code' => Str::limit((string) ($get('equivalencia') ?? $get('codigo_original') ?? ''), 250, ''),
            'oem_code' => Str::limit((string) ($get('codigo_oem') ?? $get('codigo_original') ?? ''), 250, ''),
            'description' => Str::limit($description, 250, ''),
            'short_description' => Str::limit((string) ($get('descripcion_corta') ?? $subfamily ?? $description), 250, ''),
            'long_description' => $description,
            'applications' => $get('aplicaciones') ?? $subfamily ?? $description,
            'price' => $price,
            'discount_price' => $discountPrice,
            'price_label' => $this->buildPriceObservation($type, $priceLabel, $get('precio_con_descuento'), $get('precio_venta'), $get('cantidad'), $get('subtotal')),
            'related_code' => null,
            'is_active' => ! in_array(Str::lower((string) $isPublic), ['no', '0', 'false', 'n'], true),
        ];
    }

    protected function linkRelatedProduct(Product $product, ?string $relatedCode): void
    {
        $relatedCode = trim((string) $relatedCode);

        if ($relatedCode === '') {
            return;
        }

        $codes = preg_split('/\s*(?:\+|\/)\s*/', $relatedCode) ?: [];

        foreach ($codes as $code) {
            $code = trim($code);

            if ($code === '') {
                continue;
            }

            $related = Product::query()
                ->where('sku', $code)
                ->orderByRaw('price IS NULL')
                ->orderBy('id')
                ->first();

            if (! $related || $related->is($product)) {
                continue;
            }

            $product->relatedProducts()->syncWithoutDetaching([
                $related->id => ['sort_order' => $this->sortLetter($product->relatedProducts()->count())],
            ]);
        }
    }

    protected function decimalValue(?string $value): ?float
    {
        if ($value === null) {
            return null;
        }

        $clean = preg_replace('/[^\d,.\-]/', '', $value);

        if ($clean === null || $clean === '' || $clean === '-' || $clean === ',' || $clean === '.') {
            return null;
        }

        $lastComma = strrpos($clean, ',');
        $lastDot = strrpos($clean, '.');

        if ($lastComma !== false && $lastDot !== false) {
            if ($lastComma > $lastDot) {
                $clean = str_replace('.', '', $clean);
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($lastComma !== false) {
            $clean = preg_match('/,\d{1,2}$/', $clean)
                ? str_replace(',', '.', $clean)
                : str_replace(',', '', $clean);
        } elseif ($lastDot !== false && ! preg_match('/\.\d{1,2}$/', $clean)) {
            $clean = str_replace('.', '', $clean);
        }

        return is_numeric($clean) ? (float) $clean : null;
    }

    protected function buildPriceObservation(?string ...$parts): string
    {
        return collect($parts)
            ->filter(fn (?string $value) => $value !== null && trim($value) !== '')
            ->implode(' | ');
    }

    protected function familyForDescription(string $description): string
    {
        $value = Str::upper($description);

        return match (true) {
            Str::contains($value, ['RELACION', 'CORONA', 'PIÑON', 'PINON']) => 'CORONA Y PIÑON',
            Str::contains($value, ['RODAMIENTO', 'RODILLO', 'AGUJA', 'TORRINTON']) => 'RODAMIENTOS A AGUJAS Y RODAMIENTOS TIPO AGUJAS',
            Str::contains($value, ['ARANDELA', 'SEGURO', 'TRABA', 'RETEN', 'SUPLEMENTO']) => 'ARANDELAS - SEGUROS',
            Str::contains($value, ['HORQUILLA']) => 'HORQUILLAS PARA CAJA',
            Str::contains($value, ['CADENA']) => 'CADENAS PARA REDUCTORA',
            default => 'ENGRANAJES',
        };
    }

    protected function cleanSection(string $value): string
    {
        return trim(str_replace(['…. Continuación', '... Continuacion'], '', $value));
    }

    protected function cleanRubro(array $values): ?string
    {
        $value = trim(implode(' ', array_slice($values, 1)));
        $value = preg_replace('/\s+/', ' ', (string) $value);

        return $value !== '' ? $value : null;
    }

    protected function productImageKey(string $value): string
    {
        return Str::of($value)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '')
            ->toString();
    }

    protected function brandFromFilename(string $name): string
    {
        $upper = Str::upper($name);

        return match (true) {
            Str::contains($upper, 'TECNO') => 'Tecnotrasmissioni',
            Str::contains($upper, 'MAHIRO') => 'Mahiro',
            default => 'Importado',
        };
    }

    protected function brandLogoId(string $brand): ?int
    {
        if ($brand === 'Importado') {
            return MediaAsset::query()->where('path', 'brand/logo.svg')->value('id');
        }

        $title = $brand === 'Mahiro' ? 'Logo 1' : 'Logo 2';

        return MediaAsset::query()
            ->where('title', 'like', '%'.$title.'%')
            ->latest('id')
            ->value('id');
    }

    protected function brandPlaceholderMediaIds(): array
    {
        return MediaAsset::query()
            ->where(function ($query) {
                $query
                    ->whereIn('path', ['brand/logo.svg', 'brand/logofo.svg'])
                    ->orWhere('title', 'like', '%Logo 1%')
                    ->orWhere('title', 'like', '%Logo 2%');
            })
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    protected function brandImageId(string $brand): ?int
    {
        return Product::query()
            ->where('brand', $brand)
            ->whereNotNull('main_media_id')
            ->value('main_media_id');
    }

    protected function catalogImagePool(): array
    {
        $paths = collect(Storage::disk('public')->files('uploads/catalog/2026/04'))
            ->filter(fn ($path) => preg_match('/\.(png|jpe?g|webp|svg)$/i', $path))
            ->values();

        return $paths->map(function (string $path): int {
            return MediaAsset::query()->firstOrCreate(
                ['disk' => 'public', 'path' => $path],
                [
                    'type' => 'image',
                    'title' => pathinfo($path, PATHINFO_FILENAME),
                    'alt_text' => 'Producto Nicolais Mario e Hijo',
                    'mime_type' => Storage::disk('public')->mimeType($path),
                    'extension' => pathinfo($path, PATHINFO_EXTENSION),
                    'size_bytes' => Storage::disk('public')->size($path),
                ]
            )->id;
        })->all();
    }

    protected function nextImageId(): ?int
    {
        if ($this->imagePool === []) {
            return null;
        }

        $id = array_shift($this->imagePool);
        $this->imagePool[] = $id;

        return $id;
    }

    protected function uniqueProductSlug(string $value): string
    {
        $base = Str::slug($value) ?: 'producto';
        $slug = $base;
        $counter = 2;

        while (Product::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }

    protected function sortLetter(int $index): string
    {
        return str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT);
    }
}

<?php

use App\Http\Controllers\Admin\ProductImportController;
use App\Models\Product;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$sourceDirectory = $argv[1] ?? null;
$shouldImport = in_array('--import', $argv, true);

if (! $sourceDirectory || ! is_dir($sourceDirectory)) {
    fwrite(STDERR, "Uso: php scripts/match_product_images.php '/ruta/a/imagenes' [--import]\n");
    exit(1);
}

$normalize = static fn (?string $value): string => Str::of((string) $value)
    ->ascii()
    ->lower()
    ->replaceMatches('/[^a-z0-9]+/', '')
    ->toString();

$files = collect(scandir($sourceDirectory) ?: [])
    ->filter(fn (string $file): bool => preg_match('/\.(?:jpe?g|png|webp|gif)$/i', $file) === 1)
    ->sort()
    ->values()
    ->map(fn (string $file): array => [
        'file' => $file,
        'path' => rtrim($sourceDirectory, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$file,
        'code' => $normalize(pathinfo($file, PATHINFO_FILENAME)),
    ]);

$productsByCode = Product::query()
    ->with(['media.media:id,title'])
    ->get(['id', 'sku', 'name', 'brand', 'main_media_id'])
    ->groupBy(fn (Product $product): string => $normalize($product->sku));
$productsByNumericCode = $productsByCode
    ->flatten(1)
    ->groupBy(fn (Product $product): string => preg_replace('/[^0-9]+/', '', (string) $product->sku) ?: '');

$duplicateFileCodes = $files
    ->groupBy('code')
    ->filter(fn ($group): bool => $group->count() > 1);
$matched = [];
$unmatched = [];
$ambiguous = [];
$multipleMatches = [];
$alreadyAttached = [];
$importCandidates = [];

foreach ($files as $file) {
    if ($file['code'] === '') {
        $unmatched[] = [
            'file' => $file['file'],
            'normalized_code' => '',
            'reason' => 'El nombre no contiene un código utilizable.',
        ];
        continue;
    }

    if ($duplicateFileCodes->has($file['code'])) {
        $ambiguous[] = [
            'file' => $file['file'],
            'normalized_code' => $file['code'],
            'reason' => 'Hay más de una imagen con el mismo nombre normalizado.',
        ];
        continue;
    }

    $products = $productsByCode->get($file['code'], collect());
    $matchStrategy = 'sku_exact';

    if ($products->isEmpty()) {
        $numericCode = preg_replace('/[^0-9]+/', '', $file['code']) ?: '';
        $numericMatches = $numericCode !== ''
            ? $productsByNumericCode->get($numericCode, collect())
            : collect();

        if ($numericMatches->count() === 1) {
            $products = $numericMatches;
            $matchStrategy = 'unique_numeric_code';
        } elseif ($numericMatches->count() > 1) {
            $ambiguous[] = [
                'file' => $file['file'],
                'normalized_code' => $file['code'],
                'reason' => 'La parte numérica coincide con más de un SKU.',
                'products' => $numericMatches->map(fn (Product $product): array => [
                    'id' => $product->id,
                    'sku' => $product->sku,
                    'brand' => $product->brand,
                    'name' => $product->name,
                ])->values()->all(),
            ];
            continue;
        }
    }

    if ($products->isEmpty() && preg_match('/^G3([0-9]+)-([0-9]+)$/i', pathinfo($file['file'], PATHINFO_FILENAME), $furconParts)) {
        $furconNumericCode = $furconParts[1].$furconParts[2];
        $furconMatches = $productsByNumericCode->get($furconNumericCode, collect());

        if ($furconMatches->count() === 1) {
            $products = $furconMatches;
            $matchStrategy = 'furcon_slash_code';
        } elseif ($furconMatches->count() > 1) {
            $ambiguous[] = [
                'file' => $file['file'],
                'normalized_code' => $file['code'],
                'reason' => 'El alias Furcon con barra coincide con más de un SKU.',
                'products' => $furconMatches->map(fn (Product $product): array => [
                    'id' => $product->id,
                    'sku' => $product->sku,
                    'brand' => $product->brand,
                    'name' => $product->name,
                ])->values()->all(),
            ];
            continue;
        }
    }

    if ($products->isEmpty()) {
        $unmatched[] = [
            'file' => $file['file'],
            'normalized_code' => $file['code'],
            'reason' => 'No existe un producto con ese SKU normalizado.',
        ];
        continue;
    }

    if ($products->count() > 1) {
        $detail = [
            'file' => $file['file'],
            'normalized_code' => $file['code'],
            'reason' => 'La imagen se asignará a todos los productos que comparten este SKU exacto.',
            'products' => $products->map(fn (Product $product): array => [
                'id' => $product->id,
                'sku' => $product->sku,
                'brand' => $product->brand,
                'name' => $product->name,
            ])->values()->all(),
        ];
        $allAttached = $products->every(fn (Product $product): bool => $product->media->contains(
            fn ($relation): bool => $normalize($relation->media?->title) === $file['code']
        ));

        if ($allAttached) {
            $alreadyAttached[] = $detail;
            continue;
        }

        $multipleMatches[] = $detail;
        $importCandidates[] = $file;
        continue;
    }

    /** @var Product $product */
    $product = $products->first();
    $isAttached = $product->media->contains(
        fn ($relation): bool => $normalize($relation->media?->title) === $file['code']
    );
    $detail = [
        'file' => $file['file'],
        'normalized_code' => $file['code'],
        'match_strategy' => $matchStrategy,
        'product_id' => $product->id,
        'sku' => $product->sku,
        'brand' => $product->brand,
        'name' => $product->name,
    ];

    if ($isAttached) {
        $alreadyAttached[] = $detail;
        continue;
    }

    $matched[] = $detail;
    $importCandidates[] = $file;
}

$importSummary = null;

if ($shouldImport && $importCandidates !== []) {
    $uploadedFiles = array_map(
        fn (array $file): UploadedFile => new UploadedFile(
            $file['path'],
            $file['file'],
            mime_content_type($file['path']) ?: null,
            null,
            true
        ),
        $importCandidates
    );
    $request = Request::create('/admin/api/products/import/images', 'POST');
    $request->files->set('images', $uploadedFiles);
    $response = app(ProductImportController::class)->images($request);
    $importSummary = $response->getData(true)['summary'] ?? null;
}

$report = [
    'mode' => $shouldImport ? 'import' : 'audit',
    'source_directory' => realpath($sourceDirectory),
    'files' => $files->count(),
    'unique_matches_ready' => count($matched),
    'already_attached' => count($alreadyAttached),
    'unmatched' => count($unmatched),
    'ambiguous' => count($ambiguous),
    'multiple_exact_matches' => count($multipleMatches),
    'matched_details' => $matched,
    'already_attached_details' => $alreadyAttached,
    'unmatched_details' => $unmatched,
    'ambiguous_details' => $ambiguous,
    'multiple_exact_match_details' => $multipleMatches,
    'import_summary' => $importSummary,
];

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE).PHP_EOL;

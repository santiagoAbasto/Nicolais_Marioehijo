<?php

use App\Http\Controllers\Admin\ProductImportController;
use App\Models\Product;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$sourceDirectory = $argv[1] ?? null;

if (! $sourceDirectory || ! is_dir($sourceDirectory)) {
    fwrite(STDERR, "Uso: php scripts/audit_product_imports.php '/ruta/a/los/excel'\n");
    exit(1);
}

$controller = app(ProductImportController::class);
$call = static function (string $method, mixed ...$arguments) use ($controller): mixed {
    $reflection = new ReflectionMethod($controller, $method);
    $reflection->setAccessible(true);

    return $reflection->invoke($controller, ...$arguments);
};

$files = collect(scandir($sourceDirectory) ?: [])
    ->filter(fn (string $file): bool => preg_match('/\.(?:xlsx?|csv)$/i', $file) === 1)
    ->sort()
    ->values();

$sourceRows = collect();
$fileErrors = [];

foreach ($files as $file) {
    $path = rtrim($sourceDirectory, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$file;

    try {
        $spreadsheet = IOFactory::load($path);
        $rows = $spreadsheet->getActiveSheet()->toArray(null, true, true, false);
        [$headings, $headingRowIndex] = $call('resolveHeadingsFromRows', $rows);
        [$workbookRubro, $workbookRubroRowIndex] = $call('resolveWorkbookRubro', $rows, $headingRowIndex);
        $brand = $call('brandForWorkbook', $file, $rows, $headings);
        $currentSection = 'General';
        $currentRubro = $workbookRubro;

        foreach ($rows as $index => $row) {
            if ($index === $workbookRubroRowIndex || ($headingRowIndex !== null && $index <= $headingRowIndex)) {
                continue;
            }

            $values = $call('compactRow', $row);

            if ($values === [] || $call('isHeaderRow', $values) || $call('isNoiseRow', $values)) {
                continue;
            }

            $parsed = null;

            if ($headings !== []) {
                $parsed = $call('parseMappedProductRow', $row, $headings, $brand, $currentSection, $currentRubro);

                if ($parsed) {
                    $currentSection = $parsed['subfamily'];
                    $currentRubro = $parsed['rubro'] ?: $currentRubro;
                }
            } elseif ($call('isFurconRubroRow', $values)) {
                $label = $call('cleanRubro', $values);

                if ($workbookRubro) {
                    $currentSection = $label ?: $currentSection;
                } else {
                    $currentRubro = $label;
                    $currentSection = $currentRubro ?: $currentSection;
                }

                continue;
            } elseif ($call('isSectionRow', $values)) {
                $currentSection = $call('cleanSection', $values[0]);
                continue;
            } elseif ($call('looksLikeProduct', $values)) {
                $parsed = $call('parseProductRow', $values, $brand, $currentSection, $currentRubro);
            }

            if (! $parsed) {
                continue;
            }

            $sourceRows->push([
                'file' => $file,
                'row' => $index + 1,
                'sku' => trim((string) $parsed['code']),
                'brand' => trim((string) $parsed['brand']),
                'name' => trim((string) $parsed['description']),
                'rubro' => trim((string) ($parsed['rubro'] ?? '')),
                'subfamily' => trim((string) ($parsed['subfamily'] ?? '')),
                'original_code' => trim((string) ($parsed['original_code'] ?? '')),
                'equivalence_code' => trim((string) ($parsed['equivalence_code'] ?? '')),
                'oem_code' => trim((string) ($parsed['oem_code'] ?? '')),
                'price' => $parsed['price'],
            ]);
        }

        $spreadsheet->disconnectWorksheets();
    } catch (Throwable $exception) {
        $fileErrors[] = ['file' => $file, 'reason' => $exception->getMessage()];
    }
}

$normalize = static fn (?string $value): string => Str::of((string) $value)
    ->ascii()
    ->lower()
    ->replaceMatches('/[^a-z0-9]+/', '')
    ->toString();
$identity = static fn (array $row): string => implode('|', [
    $normalize($row['sku']),
    $normalize($row['brand']),
    $normalize($row['name']),
]);
$codeBrand = static fn (array $row): string => implode('|', [
    $normalize($row['sku']),
    $normalize($row['brand']),
]);

$sourceIdentityGroups = $sourceRows->groupBy($identity);
$sourceDuplicateGroups = $sourceIdentityGroups->filter(fn ($group) => $group->count() > 1);
$sourceCodeBrandConflicts = $sourceRows
    ->groupBy($codeBrand)
    ->filter(fn ($group) => $group->pluck('name')->map($normalize)->unique()->count() > 1);

$databaseRows = Product::query()
    ->with('subfamily:id,name')
    ->get([
        'id', 'product_subfamily_id', 'sku', 'brand', 'name', 'rubro', 'original_code',
        'equivalence_code', 'oem_code', 'price', 'applications', 'is_active',
    ])
    ->map(fn (Product $product): array => [
        'id' => $product->id,
        'sku' => trim((string) $product->sku),
        'brand' => trim((string) $product->brand),
        'name' => trim((string) $product->name),
        'rubro' => trim((string) $product->rubro),
        'subfamily' => trim((string) $product->subfamily?->name),
        'original_code' => trim((string) $product->original_code),
        'equivalence_code' => trim((string) $product->equivalence_code),
        'oem_code' => trim((string) $product->oem_code),
        'price' => $product->price !== null ? (float) $product->price : null,
        'applications' => trim((string) $product->applications),
        'is_active' => (bool) $product->is_active,
    ]);
$databaseIdentityGroups = $databaseRows->groupBy($identity);
$databaseDuplicateGroups = $databaseIdentityGroups->filter(fn ($group) => $group->count() > 1);
$databaseCodeBrandGroups = $databaseRows->groupBy($codeBrand);
$databaseCodeBrandConflictGroups = $databaseCodeBrandGroups
    ->filter(fn ($group) => $group->pluck('name')->map($normalize)->unique()->count() > 1);
$databaseSkuGroups = $databaseRows->groupBy(fn (array $row): string => $normalize($row['sku']));

$exactDatabaseMatches = $sourceIdentityGroups
    ->keys()
    ->filter(fn (string $key): bool => $databaseIdentityGroups->has($key));
$ambiguousDatabaseMatches = $sourceIdentityGroups
    ->map(function ($group) use ($codeBrand, $databaseCodeBrandGroups, $normalize) {
        $source = $group->first();
        $databaseMatches = $databaseCodeBrandGroups->get($codeBrand($source), collect());

        return $databaseMatches
            ->filter(fn (array $database) => $normalize($database['name']) !== $normalize($source['name']))
            ->values();
    })
    ->filter(fn ($matches) => $matches->isNotEmpty());
$sourceSkuDatabaseMatches = $sourceIdentityGroups
    ->map(function ($group) use ($databaseSkuGroups, $normalize) {
        $source = $group->first();

        return $databaseSkuGroups->get($normalize($source['sku']), collect())->values();
    })
    ->filter(fn ($matches) => $matches->isNotEmpty());
$sourceSkuDifferentBrandMatches = $sourceIdentityGroups
    ->map(function ($group) use ($databaseSkuGroups, $normalize) {
        $source = $group->first();

        return $databaseSkuGroups
            ->get($normalize($source['sku']), collect())
            ->filter(fn (array $database) => $normalize($database['brand']) !== $normalize($source['brand']))
            ->values();
    })
    ->filter(fn ($matches) => $matches->isNotEmpty());
$sourceCanonicalRows = $sourceIdentityGroups->map(fn ($group) => $group->first());
$reconciledRows = $sourceCanonicalRows
    ->map(function (array $source, string $key) use ($databaseIdentityGroups): ?array {
        $database = $databaseIdentityGroups->get($key)?->first();

        return $database ? ['source' => $source, 'database' => $database] : null;
    })
    ->filter();
$priceMismatches = $reconciledRows->filter(function (array $pair): bool {
    $sourcePrice = $pair['source']['price'];
    $databasePrice = $pair['database']['price'];

    if ($sourcePrice === null && $databasePrice === null) {
        return false;
    }

    return $sourcePrice === null
        || $databasePrice === null
        || abs((float) $sourcePrice - (float) $databasePrice) > 0.01;
});
$rubroMismatches = $reconciledRows->filter(fn (array $pair): bool =>
    $normalize($pair['source']['rubro']) !== $normalize($pair['database']['rubro'])
);
$subfamilyMismatches = $reconciledRows->filter(fn (array $pair): bool =>
    $normalize($pair['source']['subfamily']) !== $normalize($pair['database']['subfamily'])
);

$samples = static function ($groups, int $limit = 100): array {
    return $groups->take($limit)->map(function ($group, $key): array {
        return [
            'key' => $key,
            'count' => $group->count(),
            'records' => $group->take(10)->values()->all(),
        ];
    })->values()->all();
};

$report = [
    'generated_at' => now()->toIso8601String(),
    'source_directory' => realpath($sourceDirectory),
    'files_count' => $files->count(),
    'source_rows' => $sourceRows->count(),
    'source_unique_products' => $sourceIdentityGroups->count(),
    'source_duplicate_groups' => $sourceDuplicateGroups->count(),
    'source_duplicate_rows_excess' => $sourceDuplicateGroups->sum(fn ($group) => $group->count() - 1),
    'source_code_brand_conflicts' => $sourceCodeBrandConflicts->count(),
    'database_products' => $databaseRows->count(),
    'database_duplicate_groups' => $databaseDuplicateGroups->count(),
    'database_code_brand_conflict_groups' => $databaseCodeBrandConflictGroups->count(),
    'exact_products_already_in_database' => $exactDatabaseMatches->count(),
    'source_products_with_same_code_brand_but_different_database_name' => $ambiguousDatabaseMatches->count(),
    'source_products_with_sku_already_in_database_any_brand' => $sourceSkuDatabaseMatches->count(),
    'source_products_with_same_sku_but_different_database_brand' => $sourceSkuDifferentBrandMatches->count(),
    'source_field_population' => [
        'with_rubro' => $sourceCanonicalRows->filter(fn (array $row) => $row['rubro'] !== '')->count(),
        'with_subfamily' => $sourceCanonicalRows->filter(fn (array $row) => $row['subfamily'] !== '')->count(),
        'with_price' => $sourceCanonicalRows->filter(fn (array $row) => $row['price'] !== null)->count(),
        'with_positive_price' => $sourceCanonicalRows->filter(fn (array $row) => (float) ($row['price'] ?? 0) > 0)->count(),
        'with_zero_price' => $sourceCanonicalRows->filter(fn (array $row) => $row['price'] !== null && (float) $row['price'] === 0.0)->count(),
        'with_original_code' => $sourceCanonicalRows->filter(fn (array $row) => $row['original_code'] !== '')->count(),
        'with_equivalence_code' => $sourceCanonicalRows->filter(fn (array $row) => $row['equivalence_code'] !== '')->count(),
        'with_oem_code' => $sourceCanonicalRows->filter(fn (array $row) => $row['oem_code'] !== '')->count(),
    ],
    'reconciliation' => [
        'matched_products' => $reconciledRows->count(),
        'active_products' => $reconciledRows->filter(fn (array $pair) => $pair['database']['is_active'])->count(),
        'price_mismatches' => $priceMismatches->count(),
        'rubro_mismatches' => $rubroMismatches->count(),
        'subfamily_mismatches' => $subfamilyMismatches->count(),
    ],
    'file_errors' => $fileErrors,
    'source_duplicates' => $samples($sourceDuplicateGroups),
    'source_code_brand_conflict_details' => $samples($sourceCodeBrandConflicts),
    'database_duplicates' => $samples($databaseDuplicateGroups),
    'database_code_brand_conflicts' => $samples($databaseCodeBrandConflictGroups),
    'exact_database_match_details' => $exactDatabaseMatches->take(200)->map(function (string $key) use ($sourceIdentityGroups, $databaseIdentityGroups): array {
        return [
            'key' => $key,
            'source' => $sourceIdentityGroups->get($key)->values()->all(),
            'database' => $databaseIdentityGroups->get($key)->values()->all(),
        ];
    })->values()->all(),
    'ambiguous_database_match_details' => $ambiguousDatabaseMatches->take(200)->map(function ($matches, string $key) use ($sourceIdentityGroups): array {
        return [
            'key' => $key,
            'source' => $sourceIdentityGroups->get($key)->values()->all(),
            'database_same_code_brand_different_name' => $matches->all(),
        ];
    })->values()->all(),
    'source_sku_database_match_details' => $sourceSkuDatabaseMatches->take(300)->map(function ($matches, string $key) use ($sourceIdentityGroups): array {
        return [
            'key' => $key,
            'source' => $sourceIdentityGroups->get($key)->values()->all(),
            'database_same_sku' => $matches->all(),
        ];
    })->values()->all(),
    'source_sku_different_brand_details' => $sourceSkuDifferentBrandMatches->take(300)->map(function ($matches, string $key) use ($sourceIdentityGroups): array {
        return [
            'key' => $key,
            'source' => $sourceIdentityGroups->get($key)->values()->all(),
            'database_same_sku_different_brand' => $matches->all(),
        ];
    })->values()->all(),
    'price_mismatch_details' => $priceMismatches->take(200)->values()->all(),
    'rubro_mismatch_details' => $rubroMismatches->take(200)->values()->all(),
    'subfamily_mismatch_details' => $subfamilyMismatches->take(200)->values()->all(),
];

if (in_array('--simulate', $argv, true)) {
    DB::beginTransaction();

    try {
        $simulation = [
            'families' => 0,
            'subfamilies' => 0,
            'products' => 0,
            'updated' => 0,
            'duplicate_rows' => 0,
            'skipped' => 0,
            'files' => [],
        ];

        foreach ($files as $file) {
            $path = rtrim($sourceDirectory, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$file;
            $result = $controller->importFilePath($path, $file);

            foreach (['families', 'subfamilies', 'products', 'updated', 'duplicate_rows', 'skipped'] as $key) {
                $simulation[$key] += (int) ($result[$key] ?? 0);
            }

            $simulation['files'][] = ['file' => $file, ...$result];
        }

        $simulatedRows = Product::query()
            ->get(['id', 'sku', 'brand', 'name'])
            ->map(fn (Product $product): array => [
                'id' => $product->id,
                'sku' => trim((string) $product->sku),
                'brand' => trim((string) $product->brand),
                'name' => trim((string) $product->name),
            ]);
        $simulation['final_products'] = $simulatedRows->count();
        $simulation['final_duplicate_groups'] = $simulatedRows
            ->groupBy($identity)
            ->filter(fn ($group) => $group->count() > 1)
            ->count();
        $report['simulation'] = $simulation;
    } finally {
        DB::rollBack();
    }
}

$outputPath = storage_path('app/product-import-audit.json');
file_put_contents($outputPath, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

$consoleReport = collect($report)->except([
    'source_duplicates',
    'source_code_brand_conflict_details',
    'database_duplicates',
    'database_code_brand_conflicts',
    'exact_database_match_details',
    'ambiguous_database_match_details',
    'source_sku_database_match_details',
    'source_sku_different_brand_details',
    'price_mismatch_details',
    'rubro_mismatch_details',
    'subfamily_mismatch_details',
])->all();
unset($consoleReport['simulation']['files']);

echo json_encode($consoleReport, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES).PHP_EOL;
echo "Reporte detallado: {$outputPath}\n";

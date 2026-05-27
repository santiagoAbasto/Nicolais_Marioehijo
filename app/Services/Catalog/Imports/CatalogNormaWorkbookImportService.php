<?php

namespace App\Services\Catalog\Imports;

use App\Models\Catalog\CatalogNorma;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CatalogNormaWorkbookImportService
{
    private const SHEET_NAME = 'normas';

    private const TARGET_FIELDS = [
        'emisor',
        'norma',
        'titulo',
        'familia',
        'subfamilia',
        'tipo',
        'aplicacion_web_comercial',
        'keywords_seo',
        'fuente',
    ];

    private const REQUIRED_FIELDS = [
        'emisor',
        'norma',
    ];

    private const HEADER_ALIASES = [
        'emisor' => ['emisor'],
        'norma' => ['norma'],
        'titulo' => ['titulo', 't_tulo', 'title'],
        'familia' => ['familia'],
        'subfamilia' => ['subfamilia', 'sub_familia'],
        'tipo' => ['tipo'],
        'aplicacion_web_comercial' => ['aplicacion_web_comercial', 'aplicacion_web', 'aplicacion_comercial'],
        'keywords_seo' => ['keywords_seo', 'keywords', 'seo_keywords'],
        'fuente' => ['fuente', 'source'],
    ];

    private const EXPORT_HEADINGS = [
        'Emisor',
        'Norma',
        'Título',
        'Familia',
        'Subfamilia',
        'Tipo',
        'Aplicación web/comercial',
        'Keywords SEO',
        'Fuente',
    ];

    public function __construct(
        private readonly CatalogImportNormalizer $normalizer,
        private readonly CatalogReferenceWorkbookImportService $referenceWorkbookImportService,
    ) {
    }

    public function import(UploadedFile $file, array $gradeIds = []): array
    {
        $rows = $this->extractRows($file->getRealPath() ?: $file->path());

        if ($rows === []) {
            throw ValidationException::withMessages([
                'file' => 'El Excel no contiene filas de normas para importar.',
            ]);
        }

        $normalizedGradeIds = Validator::make(
            ['grade_ids' => $gradeIds],
            ['grade_ids' => 'array', 'grade_ids.*' => 'integer|exists:catalog_grades,id']
        )->validated()['grade_ids'] ?? [];

        return DB::transaction(function () use ($rows, $normalizedGradeIds): array {
            $existingNormas = CatalogNorma::query()
                ->get()
                ->keyBy(fn (CatalogNorma $norma) => $this->buildNormaKey($norma->nombre_emisor, $norma->norma));

            $nextSortOrderByGrade = $this->nextSortOrderByGrade($normalizedGradeIds);

            $summary = [
                'processed_rows' => count($rows),
                'created_normas' => 0,
                'updated_normas' => 0,
                'unchanged_normas' => 0,
                'assigned_grades' => 0,
                'duplicate_rows_in_file' => 0,
            ];
            $seenKeys = [];

            foreach ($rows as $index => $row) {
                $attributes = $this->buildNormaAttributes($row, $index);

                $key = $this->buildNormaKey($attributes['nombre_emisor'], $attributes['norma']);

                if (isset($seenKeys[$key])) {
                    $summary['duplicate_rows_in_file']++;

                    continue;
                }

                $seenKeys[$key] = true;
                $norma = $existingNormas->get($key);

                if ($norma) {
                    $norma->fill($attributes);

                    if ($norma->isDirty()) {
                        $norma->save();
                        $summary['updated_normas']++;
                    } else {
                        $summary['unchanged_normas']++;
                    }
                } else {
                    $norma = CatalogNorma::query()->create([
                        ...$attributes,
                        'is_imported' => true,
                    ]);
                    $existingNormas->put($key, $norma);
                    $summary['created_normas']++;
                }

                if ($normalizedGradeIds !== []) {
                    $summary['assigned_grades'] += $this->attachGrades($norma, $normalizedGradeIds, $nextSortOrderByGrade);
                }
            }

            $summary['relinked_grade_normas'] = $this->referenceWorkbookImportService->relinkNormasFromActiveImports();

            return $summary;
        });
    }

    public function preview(UploadedFile $file, array $gradeIds = []): array
    {
        $rows = $this->extractRows($file->getRealPath() ?: $file->path());

        if ($rows === []) {
            throw ValidationException::withMessages([
                'file' => 'El Excel no contiene filas de normas para previsualizar.',
            ]);
        }

        Validator::make(
            ['grade_ids' => $gradeIds],
            ['grade_ids' => 'array', 'grade_ids.*' => 'integer|exists:catalog_grades,id']
        )->validate();

        $existingNormas = CatalogNorma::query()
            ->get()
            ->keyBy(fn (CatalogNorma $norma) => $this->buildNormaKey($norma->nombre_emisor, $norma->norma));

        $seenKeys = [];
        $newNormas = [];
        $updatedNormas = [];
        $unchangedNormas = [];
        $duplicateRows = [];
        $newNormasCount = 0;
        $updatedNormasCount = 0;
        $unchangedNormasCount = 0;
        $duplicateRowsCount = 0;

        foreach ($rows as $index => $row) {
            $attributes = $this->buildNormaAttributes($row, $index);
            $key = $this->buildNormaKey($attributes['nombre_emisor'], $attributes['norma']);

            if (isset($seenKeys[$key])) {
                $duplicateRowsCount++;
                $this->pushSample($duplicateRows, [
                    'row_number' => $index + 2,
                    'emisor' => $attributes['nombre_emisor'],
                    'norma' => $attributes['norma'],
                    'titulo' => $attributes['descripcion_corta'],
                    'reason' => 'La misma combinación Emisor + Norma ya aparece antes en este archivo.',
                ]);

                continue;
            }

            $seenKeys[$key] = true;
            $existing = $existingNormas->get($key);
            $item = [
                'row_number' => $index + 2,
                'emisor' => $attributes['nombre_emisor'],
                'norma' => $attributes['norma'],
                'titulo' => $attributes['descripcion_corta'],
                'familia' => $attributes['familia'],
                'subfamilia' => $attributes['subfamilia'],
                'tipo' => $attributes['tipo'],
            ];

            if (! $existing) {
                $newNormasCount++;
                $this->pushSample($newNormas, $item);

                continue;
            }

            if ($this->normaMatchesImportAttributes($existing, $attributes)) {
                $unchangedNormasCount++;
                $this->pushSample($unchangedNormas, $item);

                continue;
            }

            $updatedNormasCount++;
            $this->pushSample($updatedNormas, $item);
        }

        return [
            'processed_rows' => count($rows),
            'grade_assignments_selected' => count($gradeIds),
            'new_normas_count' => $newNormasCount,
            'updated_normas_count' => $updatedNormasCount,
            'unchanged_normas_count' => $unchangedNormasCount,
            'duplicate_rows_in_file_count' => $duplicateRowsCount,
            'new_normas' => $newNormas,
            'updated_normas' => $updatedNormas,
            'unchanged_normas' => $unchangedNormas,
            'duplicate_rows_in_file' => $duplicateRows,
        ];
    }

    public function buildExportSpreadsheet(): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Normas');
        $sheet->fromArray(self::EXPORT_HEADINGS, null, 'A1');

        $rowNumber = 2;

        CatalogNorma::query()
            ->orderBy('nombre_emisor')
            ->orderBy('norma')
            ->get()
            ->each(function (CatalogNorma $norma) use ($sheet, &$rowNumber): void {
                $sheet->fromArray([
                    $norma->nombre_emisor,
                    $norma->norma,
                    $norma->descripcion_corta,
                    $norma->familia,
                    $norma->subfamilia,
                    $norma->tipo,
                    $norma->aplicacion_web_comercial,
                    $norma->keywords_seo,
                    $norma->fuente,
                ], null, 'A'.$rowNumber);

                $rowNumber++;
            });

        return $spreadsheet;
    }

    private function extractRows(string $path): array
    {
        $spreadsheet = IOFactory::load($path);
        $sheet = $this->resolveSheet($spreadsheet->getAllSheets());
        $rows = $sheet->toArray(null, true, true, false);

        if ($rows === []) {
            return [];
        }

        $headingRow = array_shift($rows) ?? [];
        $mappedHeadings = $this->resolveHeadings($headingRow);

        foreach (self::REQUIRED_FIELDS as $field) {
            if (! array_key_exists($field, $mappedHeadings)) {
                throw ValidationException::withMessages([
                    'file' => "El Excel debe incluir la columna \"{$field}\".",
                ]);
            }
        }

        $payload = [];

        foreach ($rows as $index => $row) {
            $mappedRow = $this->mapRow($row, $mappedHeadings);

            if ($this->rowIsEmpty($mappedRow)) {
                continue;
            }

            if (! $mappedRow['emisor'] || ! $mappedRow['norma']) {
                throw ValidationException::withMessages([
                    'file' => 'Todas las filas importadas deben tener emisor y norma.',
                ]);
            }

            $payload[] = $mappedRow;
        }

        return $payload;
    }

    /**
     * @param  array<int, Worksheet>  $sheets
     */
    private function resolveSheet(array $sheets): Worksheet
    {
        foreach ($sheets as $sheet) {
            if ($this->normalizer->normalizeText($sheet->getTitle()) === self::SHEET_NAME) {
                return $sheet;
            }
        }

        return $sheets[0];
    }

    private function resolveHeadings(array $headingRow): array
    {
        $normalizedHeadings = array_map(
            fn ($heading) => $this->normalizer->normalizeHeading((string) $heading),
            $headingRow
        );

        $resolved = [];

        foreach (self::TARGET_FIELDS as $targetField) {
            foreach (self::HEADER_ALIASES[$targetField] ?? [$targetField] as $alias) {
                $position = array_search($alias, $normalizedHeadings, true);

                if ($position !== false) {
                    $resolved[$targetField] = $position;
                    break;
                }
            }
        }

        return $resolved;
    }

    private function mapRow(array $row, array $mappedHeadings): array
    {
        $payload = [];

        foreach (self::TARGET_FIELDS as $field) {
            $payload[$field] = $this->cleanString($row[$mappedHeadings[$field] ?? -1] ?? null);
        }

        return $payload;
    }

    private function rowIsEmpty(array $row): bool
    {
        foreach ($row as $value) {
            if ($value !== null && $value !== '') {
                return false;
            }
        }

        return true;
    }

    private function cleanString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $string = trim((string) $value);

        return $string !== '' ? $string : null;
    }

    private function limitString(?string $value, int $length): ?string
    {
        if ($value === null) {
            return null;
        }

        return Str::limit($value, $length, '');
    }

    private function buildLongDescription(array $row): ?string
    {
        $lines = [];

        foreach ([
            'familia' => 'Familia',
            'subfamilia' => 'Subfamilia',
            'tipo' => 'Tipo',
            'aplicacion_web_comercial' => 'Aplicación web/comercial',
            'keywords_seo' => 'Keywords SEO',
            'fuente' => 'Fuente',
        ] as $field => $label) {
            if (! empty($row[$field])) {
                $lines[] = "{$label}: {$row[$field]}";
            }
        }

        return $lines !== [] ? implode("\n", $lines) : null;
    }

    private function buildNormaAttributes(array $row, int $index): array
    {
        return [
            'nombre_emisor' => $row['emisor'],
            'norma' => $row['norma'],
            'descripcion_corta' => $this->limitString($row['titulo'] ?? null, 255),
            'descripcion_larga' => $this->buildLongDescription($row),
            'familia' => $row['familia'] ?? null,
            'subfamilia' => $row['subfamilia'] ?? null,
            'tipo' => $row['tipo'] ?? null,
            'aplicacion_web_comercial' => $row['aplicacion_web_comercial'] ?? null,
            'keywords_seo' => $row['keywords_seo'] ?? null,
            'fuente' => $row['fuente'] ?? null,
            'sort_order' => $index + 1,
            'is_active' => true,
        ];
    }

    private function normaMatchesImportAttributes(CatalogNorma $norma, array $attributes): bool
    {
        return $this->cleanString($norma->nombre_emisor) === $this->cleanString($attributes['nombre_emisor'])
            && $this->cleanString($norma->norma) === $this->cleanString($attributes['norma'])
            && $this->cleanString($norma->descripcion_corta) === $this->cleanString($attributes['descripcion_corta'])
            && $this->cleanString($norma->familia) === $this->cleanString($attributes['familia'])
            && $this->cleanString($norma->subfamilia) === $this->cleanString($attributes['subfamilia'])
            && $this->cleanString($norma->tipo) === $this->cleanString($attributes['tipo'])
            && $this->cleanString($norma->aplicacion_web_comercial) === $this->cleanString($attributes['aplicacion_web_comercial'])
            && $this->cleanString($norma->keywords_seo) === $this->cleanString($attributes['keywords_seo'])
            && $this->cleanString($norma->fuente) === $this->cleanString($attributes['fuente']);
    }

    private function buildNormaKey(?string $emisor, ?string $norma): string
    {
        return ($this->normalizer->normalizeText($emisor) ?? '').'|'.($this->normalizer->normalizeText($norma) ?? '');
    }

    private function nextSortOrderByGrade(array $gradeIds): array
    {
        if ($gradeIds === []) {
            return [];
        }

        $existing = DB::table('catalog_grade_norma')
            ->selectRaw('catalog_grade_id, MAX(sort_order) as max_sort_order')
            ->whereIn('catalog_grade_id', $gradeIds)
            ->groupBy('catalog_grade_id')
            ->pluck('max_sort_order', 'catalog_grade_id');

        $next = [];

        foreach ($gradeIds as $gradeId) {
            $next[$gradeId] = ((int) ($existing[$gradeId] ?? 0)) + 1;
        }

        return $next;
    }

    private function attachGrades(CatalogNorma $norma, array $gradeIds, array &$nextSortOrderByGrade): int
    {
        $existingGradeIds = $norma->grades()
            ->whereIn('catalog_grades.id', $gradeIds)
            ->pluck('catalog_grades.id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $existingLookup = array_fill_keys($existingGradeIds, true);
        $attach = [];

        foreach ($gradeIds as $gradeId) {
            if (isset($existingLookup[$gradeId])) {
                continue;
            }

            $attach[$gradeId] = [
                'sort_order' => $nextSortOrderByGrade[$gradeId] ?? 1,
            ];
            $nextSortOrderByGrade[$gradeId] = ($nextSortOrderByGrade[$gradeId] ?? 1) + 1;
        }

        if ($attach !== []) {
            $norma->grades()->attach($attach);
        }

        return count($attach);
    }

    private function pushSample(array &$items, array $item, int $limit = 12): void
    {
        if (count($items) >= $limit) {
            return;
        }

        $items[] = $item;
    }
}

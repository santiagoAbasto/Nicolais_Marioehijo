<?php

namespace App\Services\Catalog\Imports;

use App\Models\Catalog\CatalogImportBatch;
use App\Models\Catalog\CatalogGrade;
use App\Models\Catalog\CatalogMaterialMapping;
use App\Models\Catalog\CatalogShapeMapping;
use App\Models\Catalog\CatalogStagingProduct;
use App\Models\Catalog\Shape;
use App\Models\Catalog\ShapeFamily;
use Illuminate\Support\Str;

class CatalogProductMappingResolver
{
    private const MATERIAL_PREFIXES = [
        'acero',
        'aluminio',
        'alloy',
        'bronze',
        'bronce',
        'cobalto',
        'cobre',
        'cuproniquel',
        'hastelloy',
        'incoloy',
        'inconel',
        'monel',
        'niquel',
        'tantalio',
        'titanio',
        'tungsteno',
        'zirconio',
    ];

    public function __construct(
        private readonly CatalogImportNormalizer $normalizer,
    ) {
    }

    public function resolveBatch(CatalogImportBatch $batch): void
    {
        $materialByExternalId = CatalogMaterialMapping::query()
            ->with('grade.series.line')
            ->where('is_active', true)
            ->whereNotNull('external_material_id')
            ->get()
            ->keyBy('external_material_id');

        $materialByNormalizedName = CatalogMaterialMapping::query()
            ->with('grade.series.line')
            ->where('is_active', true)
            ->whereNotNull('normalized_material_name')
            ->get()
            ->keyBy('normalized_material_name');

        $shapeByExternalId = CatalogShapeMapping::query()
            ->with('shape')
            ->where('is_active', true)
            ->whereNotNull('external_shape_id')
            ->get()
            ->keyBy('external_shape_id');

        $shapeByNormalizedName = CatalogShapeMapping::query()
            ->with('shape')
            ->where('is_active', true)
            ->whereNotNull('normalized_shape_name')
            ->get()
            ->keyBy('normalized_shape_name');

        $grades = CatalogGrade::query()
            ->where('is_active', true)
            ->with('series.line.family')
            ->get();

        $gradesByNormalizedName = [];
        $gradesByCompactAlias = [];
        $gradesByCodeAlias = [];
        $gradesByExactNormalizedName = [];

        foreach ($grades as $grade) {
            foreach ($this->gradeLookupAliases($grade) as $alias) {
                $this->storeUniqueGradeAlias($gradesByNormalizedName, $alias, $grade);
                $this->storeUniqueGradeAlias($gradesByCompactAlias, $this->compactAlias($alias), $grade);
            }

            foreach ($this->gradeCodeAliases($grade) as $alias) {
                $this->storeUniqueGradeAlias($gradesByCodeAlias, $alias, $grade);
            }

            foreach ($this->gradeExactNormalizedNames($grade) as $alias) {
                $gradesByExactNormalizedName[$alias] ??= [];
                $gradesByExactNormalizedName[$alias][$grade->id] = $grade;
            }
        }

        $shapeByDirectNormalizedName = Shape::query()
            ->where('is_active', true)
            ->with('family')
            ->get()
            ->keyBy(fn (Shape $shape) => $this->normalizer->normalizeText($shape->name));

        $batch->stagingProducts()
            ->orderBy('id')
            ->chunkById(250, function ($rows) use (
                $materialByExternalId,
                $materialByNormalizedName,
                $shapeByExternalId,
                $shapeByNormalizedName,
                $gradesByNormalizedName,
                $gradesByCompactAlias,
                $gradesByCodeAlias,
                $gradesByExactNormalizedName,
                &$shapeByDirectNormalizedName
            ): void {
                foreach ($rows as $row) {
                    $grade = $this->resolveGradeByMaterialName(
                        $row->nombre_material,
                        $gradesByNormalizedName,
                        $gradesByCompactAlias,
                        $gradesByCodeAlias,
                        $gradesByExactNormalizedName,
                    );

                    $materialMap = null;

                    if (! $grade && $row->normalized_material_name) {
                        $materialMap = $materialByNormalizedName->get($row->normalized_material_name);
                    }

                    if (! $grade && ! $materialMap && $row->id_material) {
                        $materialMap = $materialByExternalId->get($row->id_material);
                    }

                    $shapeMap = $row->id_forma
                        ? $shapeByExternalId->get($row->id_forma)
                        : null;

                    if (! $shapeMap && $row->normalized_shape_name) {
                        $shapeMap = $shapeByNormalizedName->get($row->normalized_shape_name);
                    }

                    $shape = null;

                    if (! $shapeMap?->catalog_shape_id && $row->normalized_shape_name) {
                        $shape = $shapeByDirectNormalizedName->get($row->normalized_shape_name)
                            ?? $this->resolveOrCreateShape($row);

                        if ($shape) {
                            $shapeByDirectNormalizedName[$row->normalized_shape_name] = $shape;
                        }
                    }

                    $mappedGrade = $materialMap?->grade ?? $grade;
                    $mappedShape = $shapeMap?->shape ?? $shape;

                    $row->forceFill([
                        'mapped_catalog_family_id' => $materialMap?->catalog_family_id ?? $mappedGrade?->series?->line?->catalog_family_id,
                        'mapped_catalog_line_id' => $materialMap?->catalog_line_id ?? $mappedGrade?->series?->line?->id,
                        'mapped_catalog_series_id' => $materialMap?->catalog_series_id ?? $mappedGrade?->series?->id,
                        'mapped_catalog_grade_id' => $materialMap?->catalog_grade_id ?? $mappedGrade?->id,
                        'mapped_catalog_shape_family_id' => $shapeMap?->catalog_shape_family_id ?? $mappedShape?->catalog_shape_family_id,
                        'mapped_catalog_shape_id' => $shapeMap?->catalog_shape_id ?? $mappedShape?->id,
                        'mapping_status' => $this->resolveStatus($mappedGrade, $mappedShape),
                        'mapping_notes' => $this->resolveNotes($mappedGrade, $mappedShape),
                    ])->save();
                }
            });
    }

    private function resolveGradeByMaterialName(
        ?string $materialName,
        array $gradesByNormalizedName,
        array $gradesByCompactAlias,
        array $gradesByCodeAlias,
        array $gradesByExactNormalizedName,
    ): ?CatalogGrade {
        $normalizedMaterialName = $this->normalizer->normalizeText($materialName);

        if ($normalizedMaterialName && isset($gradesByExactNormalizedName[$normalizedMaterialName])) {
            $exactCandidates = array_values(array_filter(
                $gradesByExactNormalizedName[$normalizedMaterialName],
                fn ($candidate) => $candidate instanceof CatalogGrade
            ));

            if ($exactCandidates !== []) {
                return $this->pickPreferredDuplicateGrade($exactCandidates);
            }
        }

        foreach ($this->materialLookupAliases($materialName) as $alias) {
            $grade = $gradesByNormalizedName[$alias] ?? null;

            if ($grade instanceof CatalogGrade) {
                return $grade;
            }
        }

        foreach ($this->materialLookupAliases($materialName) as $alias) {
            $compactAlias = $this->compactAlias($alias);

            if ($compactAlias === '') {
                continue;
            }

            $grade = $gradesByCompactAlias[$compactAlias] ?? null;

            if ($grade instanceof CatalogGrade) {
                return $grade;
            }
        }

        foreach ($this->materialCodeAliases($materialName) as $alias) {
            $grade = $gradesByCodeAlias[$alias] ?? null;

            if ($grade instanceof CatalogGrade) {
                return $grade;
            }
        }

        return null;
    }

    private function resolveStatus(?CatalogGrade $grade, ?Shape $shape): string
    {
        $hasMaterial = $grade !== null;
        $hasShape = $shape !== null;

        if ($hasMaterial && $hasShape) {
            return CatalogStagingProduct::MAPPING_RESOLVED;
        }

        if ($grade || $shape) {
            return CatalogStagingProduct::MAPPING_PARTIAL;
        }

        return CatalogStagingProduct::MAPPING_UNMAPPED;
    }

    private function resolveNotes(?CatalogGrade $grade, ?Shape $shape): ?string
    {
        $notes = [];

        if (! $grade) {
            $notes[] = 'Nombre Material no coincide con un grado activo.';
        }

        if (! $shape) {
            $notes[] = 'Forma sin mapeo o nombre válido.';
        }

        return $notes !== [] ? implode(' ', $notes) : null;
    }

    private function gradeLookupAliases(CatalogGrade $grade): array
    {
        return collect([$grade->name, $grade->short_title, $grade->uns, $grade->wk_nr])
            ->filter()
            ->flatMap(fn (?string $value) => $this->materialLookupAliases($value))
            ->unique()
            ->values()
            ->all();
    }

    private function gradeCodeAliases(CatalogGrade $grade): array
    {
        return collect([$grade->uns, $grade->wk_nr, $grade->name, $grade->short_title])
            ->filter()
            ->flatMap(fn (?string $value) => $this->materialCodeAliases($value))
            ->unique()
            ->values()
            ->all();
    }

    private function gradeExactNormalizedNames(CatalogGrade $grade): array
    {
        return collect([$grade->name, $grade->short_title])
            ->filter()
            ->map(fn (?string $value) => $this->normalizer->normalizeText($value))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function materialLookupAliases(?string $value): array
    {
        $raw = trim((string) $value);

        if ($raw === '') {
            return [];
        }

        $variants = [
            $raw,
            preg_replace('/\([^)]*\)/u', ' ', $raw),
        ];

        foreach ([...$variants] as $variant) {
            if (! is_string($variant)) {
                continue;
            }

            $variants[] = preg_replace('/\s+\b(?:astm|ams|uns|din|en|f)\s*[-\/]?\s*[a-z0-9.-]+\b$/iu', ' ', $variant);
            $variants[] = preg_replace('/\s+\b(?:w\.?\s*n(?:r)?|werkstoff(?:\s*nr)?)\b\.?\s*\d+(?:\.\d+)+/iu', ' ', $variant);
            $variants = [...$variants, ...$this->expandSlashVariants($variant)];
        }

        $normalizedVariants = collect($variants)
            ->filter(fn ($variant) => is_string($variant) && trim($variant) !== '')
            ->map(fn (string $variant) => $this->normalizer->normalizeText($variant))
            ->filter()
            ->unique()
            ->values();

        $expandedVariants = $normalizedVariants
            ->flatMap(fn (string $variant) => $this->expandNormalizedAliases($variant))
            ->filter()
            ->unique()
            ->values()
            ->all();

        return $expandedVariants;
    }

    private function materialCodeAliases(?string $value): array
    {
        $normalized = $this->normalizer->normalizeText($value);

        if (! $normalized) {
            return [];
        }

        preg_match_all('/\b[a-z]\d{5}\b/u', $normalized, $unsMatches);
        preg_match_all('/\b\d+\.\d+\b/u', $normalized, $wkMatches);

        return collect([
            ...($unsMatches[0] ?? []),
            ...($wkMatches[0] ?? []),
        ])
            ->map(fn (string $alias) => $this->normalizer->normalizeText($alias))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function compactAlias(string $value): string
    {
        return preg_replace('/[^a-z0-9]+/', '', $this->normalizer->normalizeText($value) ?? '') ?? '';
    }

    private function expandSlashVariants(string $value): array
    {
        if (! preg_match('/\b([A-Za-z0-9.+-]+)\/([A-Za-z0-9.+-]+)\b/u', $value, $matches)) {
            return [];
        }

        $sharedPrefix = '';

        if (preg_match('/^(.*?)(\d+)([A-Za-z]*)$/u', $matches[1], $leftParts)) {
            $sharedPrefix = ($leftParts[1] ?? '').($leftParts[2] ?? '');
        }

        return array_values(array_filter([
            str_replace($matches[0], $matches[1], $value),
            $sharedPrefix !== ''
                ? str_replace($matches[0], $sharedPrefix.($matches[2] ?? ''), $value)
                : str_replace($matches[0], $matches[2], $value),
        ]));
    }

    private function expandNormalizedAliases(string $value): array
    {
        $variants = [$value];

        if (Str::contains($value, 'cobre niquel')) {
            $variants[] = str_replace('cobre niquel', 'cuproniquel', $value);
        }

        if (Str::contains($value, 'cuproniquel')) {
            $variants[] = str_replace('cuproniquel', 'cobre niquel', $value);
        }

        $variants[] = preg_replace('/\balloy\s+(\d{1,4})[a-z]{1,6}\d*\b/u', 'alloy $1', $value);

        foreach ([...$variants] as $variant) {
            $variants[] = $this->stripMaterialPrefix($variant);
        }

        return collect($variants)
            ->map(fn (?string $variant) => $this->normalizer->normalizeText($variant))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function stripMaterialPrefix(?string $value): ?string
    {
        $normalized = $this->normalizer->normalizeText($value);

        if (! $normalized) {
            return null;
        }

        foreach (self::MATERIAL_PREFIXES as $prefix) {
            if (Str::startsWith($normalized, $prefix.' ')) {
                return trim(substr($normalized, strlen($prefix)));
            }
        }

        return $normalized;
    }

    private function storeUniqueGradeAlias(array &$map, string $alias, CatalogGrade $grade): void
    {
        if ($alias === '') {
            return;
        }

        if (! array_key_exists($alias, $map)) {
            $map[$alias] = $grade;

            return;
        }

        if ($map[$alias] instanceof CatalogGrade && $map[$alias]->id === $grade->id) {
            return;
        }

        $map[$alias] = null;
    }

    /**
     * @param  array<int, CatalogGrade>  $candidates
     */
    private function pickPreferredDuplicateGrade(array $candidates): ?CatalogGrade
    {
        if ($candidates === []) {
            return null;
        }

        usort($candidates, function (CatalogGrade $left, CatalogGrade $right): int {
            return $right->id <=> $left->id;
        });

        return $candidates[0] ?? null;
    }

    private function resolveOrCreateShape(CatalogStagingProduct $row): ?Shape
    {
        $shapeName = trim((string) $row->forma);

        if ($shapeName === '') {
            return null;
        }

        $shapeSlug = Str::slug($shapeName) ?: 'forma';
        $familyName = trim((string) $row->familia_forma);
        $family = null;

        if ($familyName !== '') {
            $familySlug = Str::slug($familyName) ?: 'familia-forma';
            $family = ShapeFamily::query()->where('slug', $familySlug)->first();

            if (! $family) {
                $family = ShapeFamily::query()->create([
                    'slug' => $this->uniqueSlugFor(ShapeFamily::class, $familyName),
                    'name' => $familyName,
                    'sort_order' => 999,
                    'is_active' => true,
                ]);
            } else {
                $family->fill([
                    'name' => $familyName,
                    'is_active' => true,
                ])->save();
            }
        }

        $shape = Shape::query()->where('slug', $shapeSlug)->first();

        if (! $shape && $row->normalized_shape_name) {
            $shape = Shape::query()->get()->first(function (Shape $candidate) use ($row): bool {
                return $this->normalizer->normalizeText($candidate->name) === $row->normalized_shape_name;
            });
        }

        if ($shape) {
            $shape->fill([
                'catalog_shape_family_id' => $family?->id,
                'name' => $shapeName,
                'is_active' => true,
            ])->save();

            return $shape;
        }

        return Shape::query()->create([
            'slug' => $this->uniqueSlugFor(Shape::class, $shapeName),
            'catalog_shape_family_id' => $family?->id,
            'name' => $shapeName,
            'sort_order' => 999,
            'is_active' => true,
        ]);
    }

    private function uniqueSlugFor(string $modelClass, string $value): string
    {
        $base = Str::slug($value) ?: 'item';

        if (! $modelClass::query()->where('slug', $base)->exists()) {
            return $base;
        }

        return $base.'-'.substr(md5($value), 0, 8);
    }
}

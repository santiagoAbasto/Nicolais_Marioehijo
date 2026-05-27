<?php

namespace App\Services\Catalog\Imports;

use App\Models\Catalog\CatalogImportBatch;
use App\Models\Catalog\CatalogStagingProduct;
use App\Models\Catalog\ProductVariant;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use Throwable;

class CatalogProductImportService
{
    private const EXPORT_HEADINGS = [
        'IDProducto',
        'IDMaterial',
        'Cod_Num',
        'ID_Familia_Forma',
        'ID_Forma',
        'Familia_Forma',
        'Dimension',
        'Nombre_Material',
        'Forma',
        'Dimensiones',
        'A_Pedido',
        'Descripcion',
        'Oferta',
        'No_Publicar',
        'Discontinuo',
        'Tipo',
        'Precio_Lista',
        'Precio_Con_Descuento',
        'Precio_Venta',
        'Cantidad',
        'Subtotal',
        'Vista_Publico',
    ];

    private const TARGET_FIELDS = [
        'id_producto',
        'id_material',
        'cod_num',
        'id_familia_forma',
        'id_forma',
        'familia_forma',
        'dimension',
        'nombre_material',
        'forma',
        'dimensiones',
        'a_pedido',
        'descripcion',
        'oferta',
        'no_publicar',
        'discontinuo',
        'tipo',
        'precio_lista',
        'precio_con_descuento',
        'precio_venta',
        'cantidad',
        'subtotal',
        'vista_publico',
    ];

    private const LEGACY_COLUMN_FALLBACK_MAP = [
        0 => 'id_producto',
        1 => 'id_material',
        2 => 'cod_num',
        3 => 'id_familia_forma',
        4 => 'id_forma',
        5 => 'familia_forma',
        6 => 'dimension',
        7 => 'nombre_material',
        8 => 'forma',
        9 => 'dimensiones',
        10 => 'a_pedido',
        11 => 'descripcion',
        12 => 'oferta',
        13 => 'discontinuo',
    ];

    private const COLUMN_FALLBACK_MAP = [
        0 => 'id_producto',
        1 => 'id_material',
        2 => 'cod_num',
        3 => 'id_familia_forma',
        4 => 'id_forma',
        5 => 'familia_forma',
        6 => 'dimension',
        7 => 'nombre_material',
        8 => 'forma',
        9 => 'dimensiones',
        10 => 'a_pedido',
        11 => 'descripcion',
        12 => 'oferta',
        13 => 'no_publicar',
        14 => 'discontinuo',
        15 => 'tipo',
        16 => 'precio_lista',
        17 => 'precio_con_descuento',
        18 => 'precio_venta',
        19 => 'cantidad',
        20 => 'subtotal',
        21 => 'vista_publico',
    ];

    private const HEADER_ALIASES = [
        'id_producto' => ['id_producto', 'idproduct', 'idproducto', 'producto_id', 'id_producto_codigo'],
        'id_material' => ['id_material', 'idmaterial', 'material_id', 'codigo_material', 'codigomaterial'],
        'cod_num' => ['cod_num', 'codigo', 'codigo_num', 'codnum', 'codigo_numerico'],
        'id_familia_forma' => ['id_familia_forma', 'idfamiliaforma', 'familia_forma_id', 'codigo_familia_forma', 'codigofamiliaforma'],
        'id_forma' => ['id_forma', 'idforma', 'forma_id', 'codigo_forma', 'codigoforma'],
        'familia_forma' => ['familia_forma', 'familiaforma'],
        'dimension' => ['dimension', 'valor_dimension_principal', 'valordimensionprincipal'],
        'nombre_material' => ['nombre_material', 'material', 'nombrematerial'],
        'forma' => ['forma'],
        'dimensiones' => ['dimensiones'],
        'a_pedido' => ['a_pedido', 'apedido', 'a_pedido_si_no'],
        'descripcion' => ['descripcion', 'descrip', 'detalle'],
        'oferta' => ['oferta', 'en_oferta'],
        'no_publicar' => ['no_publicar', 'nopublicar', 'no_publicar_web'],
        'discontinuo' => ['discontinuo', 'descontinuado'],
        'tipo' => ['tipo', 'type'],
        'precio_lista' => ['precio_lista', 'preciolista', 'lista'],
        'precio_con_descuento' => ['precio_con_descuento', 'preciocondescuento', 'precio_descuento', 'preciodescuento'],
        'precio_venta' => ['precio_venta', 'precioventa', 'venta'],
        'cantidad' => ['cantidad', 'cant', 'qty'],
        'subtotal' => ['subtotal'],
        'vista_publico' => ['vista_publico', 'vistapublico', 'vista_publica', 'vistapublica'],
    ];

    private const DERIVED_FIELD_ALIASES = [
        '_dimension_label' => ['dimension_principal', 'dimensionprincipal'],
        '_dimension_value' => ['valor_dimension_principal', 'valordimensionprincipal'],
        '_dimension_unit' => ['unidad_dimension_principal', 'unidaddimensionprincipal'],
        '_dimension_other' => ['otras_dimensiones', 'otrasdimensiones'],
    ];

    public function __construct(
        private readonly CatalogImportNormalizer $normalizer,
        private readonly CatalogProductMappingResolver $mappingResolver,
        private readonly CatalogProductImportValidator $validator,
    ) {
    }

    public function uploadAndStage(UploadedFile $file, ?int $userId = null, string $type = 'products_excel'): CatalogImportBatch
    {
        $storedPath = $file->store('imports/catalog-products');

        $batch = CatalogImportBatch::query()->create([
            'type' => $type,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $storedPath,
            'status' => CatalogImportBatch::STATUS_UPLOADED,
            'created_by' => $userId,
            'started_at' => now(),
        ]);

        try {
            $analysis = $this->analyzeRows($this->extractRows(Storage::path($storedPath)));
            $rows = $analysis['deduped_rows'];

            DB::transaction(function () use ($batch, $rows): void {
                $batch->update([
                    'status' => CatalogImportBatch::STATUS_STAGED,
                    'total_rows' => count($rows),
                    'processed_rows' => count($rows),
                    'success_rows' => 0,
                    'failed_rows' => 0,
                ]);

                foreach (array_chunk($rows, 500) as $chunk) {
                    $chunk = array_map(function (array $row) use ($batch): array {
                        $row['catalog_import_batch_id'] = $batch->id;

                        return $row;
                    }, $chunk);

                    DB::table('catalog_staging_products')->insert($chunk);
                }
            });

            $batch = $batch->fresh();
            $this->mappingResolver->resolveBatch($batch);
            $this->validator->validateBatch($batch->fresh());

            $batch->update([
                'summary_json' => [
                    ...($batch->summary_json ?? []),
                    'duplicate_rows_in_file' => $analysis['duplicate_rows_in_file_count'],
                ],
            ]);
        } catch (Throwable $exception) {
            $batch->update([
                'status' => CatalogImportBatch::STATUS_FAILED,
                'finished_at' => now(),
                'summary_json' => [
                    'exception' => $exception->getMessage(),
                ],
            ]);

            throw $exception;
        }

        return $batch->fresh();
    }

    public function preview(UploadedFile $file): array
    {
        $analysis = $this->analyzeRows($this->extractRows($file->getRealPath() ?: $file->path()));

        return [
            'processed_rows' => count($analysis['all_rows']),
            'new_rows_count' => $analysis['new_rows_count'],
            'existing_rows_count' => $analysis['existing_rows_count'],
            'duplicate_rows_in_file_count' => $analysis['duplicate_rows_in_file_count'],
            'new_rows' => $analysis['new_rows'],
            'existing_rows' => $analysis['existing_rows'],
            'duplicate_rows_in_file' => $analysis['duplicate_rows_in_file'],
        ];
    }

    public function buildExportSpreadsheet(string $type = 'product_stock_excel'): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Stock');
        $sheet->fromArray(self::EXPORT_HEADINGS, null, 'A1');

        $rowNumber = 2;
        $latestBatch = CatalogImportBatch::query()
            ->where('type', $type)
            ->latest('id')
            ->first();

        if ($latestBatch) {
            $latestBatch->stagingProducts()
                ->orderBy('row_number')
                ->get()
                ->each(function ($row) use ($sheet, &$rowNumber): void {
                    $sheet->fromArray($this->exportRowValues([
                        'id_producto' => $row->id_producto,
                        'id_material' => $row->id_material,
                        'cod_num' => $row->cod_num,
                        'id_familia_forma' => $row->id_familia_forma,
                        'id_forma' => $row->id_forma,
                        'familia_forma' => $row->familia_forma,
                        'dimension' => $row->dimension,
                        'nombre_material' => $row->nombre_material,
                        'forma' => $row->forma,
                        'dimensiones' => $row->dimensiones,
                        'a_pedido' => $row->a_pedido,
                        'descripcion' => $row->descripcion,
                        'oferta' => $row->oferta,
                        'no_publicar' => $row->no_publicar,
                        'discontinuo' => $row->discontinuo,
                        'tipo' => $row->tipo,
                        'precio_lista' => $row->precio_lista,
                        'precio_con_descuento' => $row->precio_con_descuento,
                        'precio_venta' => $row->precio_venta,
                        'cantidad' => $row->cantidad,
                        'subtotal' => $row->subtotal,
                        'vista_publico' => $row->vista_publico,
                    ]), null, 'A'.$rowNumber);
                    $rowNumber++;
                });

            return $spreadsheet;
        }

        ProductVariant::query()
            ->with(['gradeProduct.grade.series.line.family', 'gradeProduct.shape.family'])
            ->whereNotNull('external_product_id')
            ->orderBy('external_product_id')
            ->get()
            ->each(function (ProductVariant $variant) use ($sheet, &$rowNumber): void {
                $gradeProduct = $variant->gradeProduct;
                $grade = $gradeProduct?->grade;
                $shape = $gradeProduct?->shape;
                $shapeFamily = $shape?->family;

                $sheet->fromArray($this->exportRowValues([
                    'id_producto' => $variant->external_product_id,
                    'id_material' => $variant->external_material_id,
                    'cod_num' => $variant->external_code,
                    'id_familia_forma' => null,
                    'id_forma' => null,
                    'familia_forma' => $shapeFamily?->name,
                    'dimension' => $variant->dimension_numeric !== null ? (string) $variant->dimension_numeric : null,
                    'nombre_material' => $grade?->name,
                    'forma' => $shape?->name,
                    'dimensiones' => $variant->dimension_text,
                    'a_pedido' => $variant->is_custom_order ? 'SI' : null,
                    'descripcion' => $variant->description,
                    'oferta' => $variant->is_offer ? 'SI' : null,
                    'no_publicar' => $variant->is_public_visible ? null : 'SI',
                    'discontinuo' => $variant->is_discontinued ? 'SI' : null,
                    'tipo' => null,
                    'precio_lista' => null,
                    'precio_con_descuento' => null,
                    'precio_venta' => null,
                    'cantidad' => null,
                    'subtotal' => null,
                    'vista_publico' => $variant->is_public_visible ? 'SI' : 'NO',
                ]), null, 'A'.$rowNumber);
                $rowNumber++;
            });

        return $spreadsheet;
    }

    private function extractRows(string $path): array
    {
        $spreadsheet = IOFactory::load($path);
        $rows = $spreadsheet->getActiveSheet()->toArray(null, true, false, false);

        if ($rows === []) {
            return [];
        }

        $headingRow = array_shift($rows) ?? [];
        $mappedHeadings = $this->resolveHeadings($headingRow);

        $timestamp = now();
        $payload = [];

        foreach ($rows as $index => $row) {
            $mappedRow = $this->mapRow($row, $mappedHeadings);

            if ($this->rowIsEmpty($mappedRow)) {
                continue;
            }

            $rawPayload = array_filter($mappedRow, static fn ($value) => $value !== null && $value !== '');

            $payload[] = [
                'catalog_import_batch_id' => null,
                'row_number' => $index + 2,
                ...$mappedRow,
                'normalized_material_name' => $this->normalizer->normalizeText($mappedRow['nombre_material'] ?? null),
                'normalized_shape_name' => $this->normalizer->normalizeText($mappedRow['forma'] ?? null),
                'mapping_status' => 'pending',
                'validation_status' => 'pending',
                'raw_payload' => json_encode($rawPayload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        return $payload;
    }

    private function analyzeRows(array $rows): array
    {
        $seen = [];
        $dedupedRows = [];
        $duplicateRows = [];
        $duplicateRowsCount = 0;

        foreach ($rows as $row) {
            $identity = $this->buildRowIdentity($row);

            if (isset($seen[$identity])) {
                $duplicateRowsCount++;
                $this->pushPreviewSample($duplicateRows, $this->previewRowPayload($row, 'La fila repite la misma clave técnica dentro de este archivo.'));

                continue;
            }

            $seen[$identity] = true;
            $dedupedRows[] = $row;
        }

        $externalIds = collect($dedupedRows)
            ->pluck('id_producto')
            ->filter()
            ->unique()
            ->values();

        $materialIds = collect($dedupedRows)
            ->pluck('id_material')
            ->filter()
            ->unique()
            ->values();

        $codes = collect($dedupedRows)
            ->pluck('cod_num')
            ->filter()
            ->unique()
            ->values();

        $existingByExternalId = $externalIds->isNotEmpty()
            ? ProductVariant::query()
                ->where('is_active', true)
                ->where('is_public_visible', true)
                ->whereIn('external_product_id', $externalIds)
                ->pluck('id', 'external_product_id')
            : collect();

        $hasVariantTechnicalFilters = $materialIds->isNotEmpty() || $codes->isNotEmpty();

        $existingVariantTechnicalLookup = $hasVariantTechnicalFilters
            ? ProductVariant::query()
                ->where('is_active', true)
                ->where('is_public_visible', true)
                ->where(function ($query) use ($materialIds, $codes): void {
                    $hasCondition = false;

                    if ($materialIds->isNotEmpty()) {
                        $query->whereIn('external_material_id', $materialIds);
                        $hasCondition = true;
                    }

                    if ($codes->isNotEmpty()) {
                        $method = $hasCondition ? 'orWhereIn' : 'whereIn';
                        $query->{$method}('external_code', $codes);
                    }
                })
                ->get(['external_material_id', 'external_code', 'dimension_text'])
                ->mapWithKeys(fn (ProductVariant $variant) => [
                    $this->buildVariantTechnicalIdentity(
                        $variant->external_material_id,
                        $variant->external_code,
                        $variant->dimension_text,
                    ) => true,
                ])
            : collect();

        $newRows = [];
        $existingRows = [];
        $newRowsCount = 0;
        $existingRowsCount = 0;

        foreach ($dedupedRows as $row) {
            $exists = false;

            if (
                $row['id_producto']
                && (
                    isset($existingByExternalId[$row['id_producto']])
                )
            ) {
                $exists = true;
            } elseif (
                isset($existingVariantTechnicalLookup[$this->buildVariantTechnicalIdentity(
                    $row['id_material'] ?? null,
                    $row['cod_num'] ?? null,
                    $row['dimensiones'] ?? $row['dimension'] ?? null,
                )])
            ) {
                $exists = true;
            }

            if ($exists) {
                $existingRowsCount++;
                $this->pushPreviewSample($existingRows, $this->previewRowPayload($row, 'Ya existe publicado en la web y se tomará como actualización, no como alta nueva.'));

                continue;
            }

            $newRowsCount++;
            $this->pushPreviewSample($newRows, $this->previewRowPayload($row, 'Entrará como producto/variante nueva al catálogo de stock.'));
        }

        return [
            'all_rows' => $rows,
            'deduped_rows' => $dedupedRows,
            'new_rows' => $newRows,
            'existing_rows' => $existingRows,
            'duplicate_rows_in_file' => $duplicateRows,
            'new_rows_count' => $newRowsCount,
            'existing_rows_count' => $existingRowsCount,
            'duplicate_rows_in_file_count' => $duplicateRowsCount,
        ];
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

        foreach (self::DERIVED_FIELD_ALIASES as $targetField => $aliases) {
            foreach ($aliases as $alias) {
                $position = array_search($alias, $normalizedHeadings, true);

                if ($position !== false) {
                    $resolved[$targetField] = $position;
                    break;
                }
            }
        }

        if (count($resolved) < 4) {
            return count($headingRow) >= 15
                ? self::COLUMN_FALLBACK_MAP
                : self::LEGACY_COLUMN_FALLBACK_MAP;
        }

        return $resolved;
    }

    private function mapRow(array $row, array $mappedHeadings): array
    {
        $mapped = [];

        foreach (self::TARGET_FIELDS as $field) {
            $index = $mappedHeadings[$field] ?? null;
            $value = $index !== null ? ($row[$index] ?? null) : null;
            $mapped[$field] = $this->nullableString($value);
        }

        $dimensionLabel = $this->nullableString($this->sourceValue($row, $mappedHeadings, '_dimension_label'));
        $dimensionValue = $this->nullableString($this->sourceValue($row, $mappedHeadings, '_dimension_value'));
        $dimensionUnit = $this->nullableString($this->sourceValue($row, $mappedHeadings, '_dimension_unit'));
        $otherDimensions = $this->nullableString($this->sourceValue($row, $mappedHeadings, '_dimension_other'));

        $mapped['dimension'] = $mapped['dimension'] ?? $dimensionValue;
        $mapped['dimensiones'] = $mapped['dimensiones'] ?: $this->buildDimensionText(
            $dimensionLabel,
            $dimensionValue,
            $dimensionUnit,
            $otherDimensions,
        );

        return $mapped;
    }

    private function sourceValue(array $row, array $mappedHeadings, string $field): mixed
    {
        $index = $mappedHeadings[$field] ?? null;

        return $index !== null ? ($row[$index] ?? null) : null;
    }

    private function buildDimensionText(
        ?string $dimensionLabel,
        ?string $dimensionValue,
        ?string $dimensionUnit,
        ?string $otherDimensions,
    ): ?string {
        $parts = array_filter([
            $dimensionLabel,
            $dimensionValue,
            $dimensionUnit,
        ], fn (?string $value) => $value !== null && $value !== '');

        $base = trim(implode(' ', $parts));

        if ($otherDimensions) {
            $separator = $base !== '' ? ' ' : '';
            $base .= $separator.$otherDimensions;
        }

        return $base !== '' ? trim($base) : null;
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_float($value)) {
            $string = $this->formatExcelDecimal($value);
        } else {
            $string = trim((string) $value);
        }

        return $string !== '' ? $string : null;
    }

    private function formatExcelDecimal(float $value): string
    {
        $rounded = round($value, 3);
        $string = number_format($rounded, 3, '.', '');
        $string = rtrim(rtrim($string, '0'), '.');

        return $string === '-0' ? '0' : $string;
    }

    private function rowIsEmpty(array $row): bool
    {
        foreach ($row as $value) {
            if ($value !== null && trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function buildRowIdentity(array $row): string
    {
        if (! empty($row['id_producto'])) {
            return 'product:'.$this->normalizer->normalizeText($row['id_producto']);
        }

        return $this->buildTechnicalIdentity($row);
    }

    private function buildTechnicalIdentity(array $row): string
    {
        return implode('|', [
            'technical',
            $this->normalizer->normalizeText($row['id_material'] ?? null) ?? '',
            $this->normalizer->normalizeText($row['cod_num'] ?? null) ?? '',
            $this->normalizer->normalizeText($row['id_familia_forma'] ?? null) ?? '',
            $this->normalizer->normalizeText($row['id_forma'] ?? null) ?? '',
            $this->normalizer->normalizeText($row['familia_forma'] ?? null) ?? '',
            $row['normalized_material_name'] ?? $this->normalizer->normalizeText($row['nombre_material'] ?? null) ?? '',
            $row['normalized_shape_name'] ?? $this->normalizer->normalizeText($row['forma'] ?? null) ?? '',
            $this->normalizer->normalizeText($row['dimensiones'] ?? $row['dimension'] ?? null) ?? '',
        ]);
    }

    private function buildVariantTechnicalIdentity(?string $externalMaterialId, ?string $externalCode, ?string $dimensionText): string
    {
        return implode('|', [
            'technical',
            $this->normalizer->normalizeText($externalMaterialId) ?? '',
            $this->normalizer->normalizeText($externalCode) ?? '',
            '',
            '',
            '',
            '',
            '',
            $this->normalizer->normalizeText($dimensionText) ?? '',
        ]);
    }

    private function previewRowPayload(array $row, string $reason): array
    {
        return [
            'row_number' => $row['row_number'] ?? null,
            'id_producto' => $row['id_producto'] ?? null,
            'material' => $row['nombre_material'] ?? null,
            'family' => $row['familia_forma'] ?? null,
            'shape' => $row['forma'] ?? null,
            'dimensions' => $row['dimensiones'] ?? $row['dimension'] ?? null,
            'tipo' => $row['tipo'] ?? null,
            'precio_lista' => $row['precio_lista'] ?? null,
            'precio_venta' => $row['precio_venta'] ?? null,
            'cantidad' => $row['cantidad'] ?? null,
            'reason' => $reason,
        ];
    }

    private function pushPreviewSample(array &$items, array $item, int $limit = 12): void
    {
        if (count($items) >= $limit) {
            return;
        }

        $items[] = $item;
    }

    private function exportRowValues(array $row): array
    {
        return [
            $row['id_producto'] ?? null,
            $row['id_material'] ?? null,
            $row['cod_num'] ?? null,
            $row['id_familia_forma'] ?? null,
            $row['id_forma'] ?? null,
            $row['familia_forma'] ?? null,
            $row['dimension'] ?? null,
            $row['nombre_material'] ?? null,
            $row['forma'] ?? null,
            $row['dimensiones'] ?? null,
            $row['a_pedido'] ?? null,
            $row['descripcion'] ?? null,
            $row['oferta'] ?? null,
            $row['no_publicar'] ?? null,
            $row['discontinuo'] ?? null,
            $row['tipo'] ?? null,
            $row['precio_lista'] ?? null,
            $row['precio_con_descuento'] ?? null,
            $row['precio_venta'] ?? null,
            $row['cantidad'] ?? null,
            $row['subtotal'] ?? null,
            $row['vista_publico'] ?? null,
        ];
    }
}

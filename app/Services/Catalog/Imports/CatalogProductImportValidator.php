<?php

namespace App\Services\Catalog\Imports;

use App\Models\Catalog\CatalogImportBatch;
use App\Models\Catalog\CatalogImportBatchError;
use App\Models\Catalog\CatalogStagingProduct;
use Illuminate\Support\Facades\DB;

class CatalogProductImportValidator
{
    public function validateBatch(CatalogImportBatch $batch): void
    {
        $batch->errors()->delete();

        $duplicateExternalProductIds = DB::table('catalog_staging_products')
            ->select('id_producto')
            ->where('catalog_import_batch_id', $batch->id)
            ->whereNotNull('id_producto')
            ->where('id_producto', '!=', '')
            ->groupBy('id_producto')
            ->havingRaw('count(*) > 1')
            ->pluck('id_producto')
            ->flip();

        $errorRows = [];
        $invalidRows = 0;

        $batch->stagingProducts()
            ->orderBy('id')
            ->chunkById(250, function ($rows) use (&$errorRows, &$invalidRows, $duplicateExternalProductIds): void {
                foreach ($rows as $row) {
                    $errors = [];

                    if (! $row->mapped_catalog_grade_id) {
                        $errors[] = ['field' => 'id_material', 'message' => 'La fila no tiene material mapeado a un grado del catálogo.'];
                    }

                    if (! $row->mapped_catalog_shape_id) {
                        $errors[] = ['field' => 'id_forma', 'message' => 'La fila no tiene forma mapeada a una forma comercial válida.'];
                    }

                    if (! $row->id_producto && ! $row->cod_num) {
                        $errors[] = ['field' => 'id_producto', 'message' => 'La fila necesita al menos id_producto o cod_num para publicar sin ambigüedad.'];
                    }

                    if ($row->id_producto && $duplicateExternalProductIds->has($row->id_producto)) {
                        $errors[] = ['field' => 'id_producto', 'message' => 'El id_producto está duplicado dentro del mismo lote.'];
                    }

                    $row->validation_status = $errors === []
                        ? CatalogStagingProduct::VALIDATION_VALID
                        : CatalogStagingProduct::VALIDATION_INVALID;
                    $row->validation_notes = $errors === []
                        ? null
                        : collect($errors)->pluck('message')->implode(' ');
                    $row->save();

                    if ($errors !== []) {
                        $invalidRows++;

                        foreach ($errors as $error) {
                            $errorRows[] = [
                                'catalog_import_batch_id' => $row->catalog_import_batch_id,
                                'row_number' => $row->row_number,
                                'field_name' => $error['field'],
                                'error_message' => $error['message'],
                                'raw_payload' => json_encode($row->raw_payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }
                }
            });

        foreach (array_chunk($errorRows, 500) as $chunk) {
            CatalogImportBatchError::query()->insert($chunk);
        }

        $resolvedCount = $batch->stagingProducts()->where('mapping_status', CatalogStagingProduct::MAPPING_RESOLVED)->count();
        $unresolvedCount = $batch->stagingProducts()->where('mapping_status', '!=', CatalogStagingProduct::MAPPING_RESOLVED)->count();

        $batch->update([
            'status' => $invalidRows === 0
                ? CatalogImportBatch::STATUS_READY_TO_PUBLISH
                : ($unresolvedCount > 0 ? CatalogImportBatch::STATUS_NEEDS_MAPPING : CatalogImportBatch::STATUS_NEEDS_REVIEW),
            'failed_rows' => $invalidRows,
            'success_rows' => max(0, $batch->total_rows - $invalidRows),
            'summary_json' => [
                'resolved_rows' => $resolvedCount,
                'unresolved_rows' => $unresolvedCount,
                'invalid_rows' => $invalidRows,
            ],
        ]);
    }
}

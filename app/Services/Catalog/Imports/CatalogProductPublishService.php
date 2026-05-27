<?php

namespace App\Services\Catalog\Imports;

use App\Models\Catalog\CatalogImportBatch;
use App\Models\Catalog\CatalogStagingProduct;
use App\Models\Catalog\GradeProduct;
use App\Models\Catalog\ProductVariant;
use App\Models\Catalog\VariantOffer;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CatalogProductPublishService
{
    public function __construct(
        private readonly CatalogImportNormalizer $normalizer,
    ) {
    }

    public function publish(CatalogImportBatch $batch): void
    {
        if ($batch->status !== CatalogImportBatch::STATUS_READY_TO_PUBLISH) {
            throw new RuntimeException('El lote no está listo para publicar.');
        }

        $this->publishValidRows($batch, true);
    }

    public function publishResolvedRows(CatalogImportBatch $batch): void
    {
        $this->publishValidRows($batch, false);
    }

    private function publishValidRows(CatalogImportBatch $batch, bool $markAllRowsAsPublished): void
    {
        DB::transaction(function () use ($batch): void {
            $publishedCount = 0;
            $publicVisibleCount = 0;
            $hiddenFromWebCount = 0;
            $offerFlagCount = 0;
            $publishedExternalProductIds = [];

            $batch->stagingProducts()
                ->where('validation_status', CatalogStagingProduct::VALIDATION_VALID)
                ->orderBy('id')
                ->chunkById(250, function ($rows) use (&$publishedCount, &$publishedExternalProductIds, &$publicVisibleCount, &$hiddenFromWebCount, &$offerFlagCount): void {
                    foreach ($rows as $row) {
                        $gradeProduct = $this->resolveGradeProduct($row);

                        $variant = ProductVariant::query()->updateOrCreate(
                            $this->matchAttributes($row, $gradeProduct->id),
                            [
                                'catalog_grade_product_id' => $gradeProduct->id,
                                'external_product_id' => $row->id_producto,
                                'external_material_id' => $row->id_material,
                                'external_code' => $row->cod_num,
                                'dimension_numeric' => $this->resolveDimensionNumeric($row),
                                'dimension_text' => $row->dimensiones ?: $row->dimension,
                                'description' => $row->descripcion,
                                'is_custom_order' => $this->normalizer->toBool($row->a_pedido),
                                'is_offer' => $this->normalizer->toBool($row->oferta),
                                'is_discontinued' => $this->normalizer->toBool($row->discontinuo),
                                'is_active' => ! $this->normalizer->toBool($row->discontinuo),
                                'is_public_visible' => ! $this->normalizer->toBool($row->no_publicar) && ! $this->normalizer->toBool($row->discontinuo),
                                'last_imported_at' => now(),
                            ]
                        );

                        if ($variant->is_public_visible) {
                            $publicVisibleCount++;
                        } else {
                            $hiddenFromWebCount++;
                        }

                        if ($variant->is_offer) {
                            $offerFlagCount++;
                        }

                        if ($row->id_producto) {
                            $publishedExternalProductIds[$row->id_producto] = $row->id_producto;
                        }

                        if ($variant->is_offer) {
                            $offer = VariantOffer::query()->firstOrNew([
                                'catalog_product_variant_id' => $variant->id,
                            ]);
                            $offer->is_active = true;
                            $offer->badge_text ??= 'Oferta';
                            $offer->sort_order ??= 1;
                            $offer->save();
                        } elseif ($variant->offer) {
                            $variant->offer()->update(['is_active' => false]);
                        }

                        $row->update([
                            'mapping_status' => CatalogStagingProduct::MAPPING_PUBLISHED,
                            'published_at' => now(),
                        ]);

                        $publishedCount++;
                    }
                });

            $deactivatedRows = $publishedExternalProductIds !== []
                ? $this->deactivateVariantsMissingFromBatch($publishedExternalProductIds)
                : 0;
            $deactivatedGradeProducts = $publishedExternalProductIds !== []
                ? $this->deactivateGradeProductsWithoutActiveVariants()
                : 0;

            $failedRows = $batch->stagingProducts()
                ->where('validation_status', '!=', CatalogStagingProduct::VALIDATION_VALID)
                ->count();

            $batch->update([
                'status' => CatalogImportBatch::STATUS_PUBLISHED,
                'success_rows' => $publishedCount,
                'failed_rows' => $failedRows,
                'finished_at' => now(),
                'summary_json' => [
                    ...($batch->summary_json ?? []),
                    'published_rows' => $publishedCount,
                    'public_visible_rows' => $publicVisibleCount,
                    'hidden_from_web_rows' => $hiddenFromWebCount,
                    'offer_flag_rows' => $offerFlagCount,
                    'skipped_rows' => $failedRows,
                    'deactivated_rows' => $deactivatedRows,
                    'deactivated_grade_products' => $deactivatedGradeProducts,
                ],
            ]);
        });
    }

    private function resolveGradeProduct(CatalogStagingProduct $row): GradeProduct
    {
        $gradeProduct = GradeProduct::query()->firstOrNew([
            'catalog_grade_id' => $row->mapped_catalog_grade_id,
            'catalog_shape_id' => $row->mapped_catalog_shape_id,
        ]);

        $gradeProduct->fill([
            'is_custom_order' => $this->normalizer->toBool($row->a_pedido),
            'is_discontinued' => $this->normalizer->toBool($row->discontinuo),
            'is_active' => true,
            'sort_order' => $gradeProduct->sort_order ?: 1,
        ]);
        $gradeProduct->save();

        return $gradeProduct;
    }

    private function deactivateVariantsMissingFromBatch(array $publishedExternalProductIds): int
    {
        $query = ProductVariant::query()
            ->whereNotNull('external_product_id')
            ->where('is_active', true);

        $query->whereNotIn('external_product_id', array_values($publishedExternalProductIds));

        $variantIds = $query->pluck('id');

        if ($variantIds->isEmpty()) {
            return 0;
        }

        VariantOffer::query()
            ->whereIn('catalog_product_variant_id', $variantIds)
            ->update(['is_active' => false]);

        return ProductVariant::query()
            ->whereKey($variantIds)
            ->update([
                'is_active' => false,
                'is_public_visible' => false,
                'is_offer' => false,
            ]);
    }

    private function deactivateGradeProductsWithoutActiveVariants(): int
    {
        return GradeProduct::query()
            ->where('is_active', true)
            ->whereHas('variants', fn ($query) => $query->whereNotNull('external_product_id'))
            ->whereDoesntHave('variants', fn ($query) => $query->where('is_active', true))
            ->update(['is_active' => false]);
    }

    private function matchAttributes(CatalogStagingProduct $row, int $gradeProductId): array
    {
        if ($row->id_producto) {
            return ['external_product_id' => $row->id_producto];
        }

        return [
            'catalog_grade_product_id' => $gradeProductId,
            'external_code' => $row->cod_num,
            'dimension_text' => $row->dimensiones ?: $row->dimension,
        ];
    }

    private function resolveDimensionNumeric(CatalogStagingProduct $row): ?float
    {
        return $this->normalizer->toDecimal($row->dimension)
            ?? $this->normalizer->toDecimal($row->dimensiones);
    }
}

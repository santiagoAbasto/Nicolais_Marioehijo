<?php

namespace App\Services\Catalog;

use App\Models\Catalog\CatalogFamily;
use App\Models\Catalog\CatalogGrade;
use App\Models\Catalog\CatalogImportBatch;
use App\Models\Catalog\CatalogLine;
use App\Models\Catalog\CatalogMaterialMapping;
use App\Models\Catalog\CatalogNorma;
use App\Models\Catalog\CatalogReferenceImportRun;
use App\Models\Catalog\CatalogReferenceImportRow;
use App\Models\Catalog\CatalogSeries;
use App\Models\Catalog\CatalogShapeMapping;
use App\Models\Catalog\CatalogStagingProduct;
use App\Models\Catalog\CompositionProfile;
use App\Models\Catalog\CompositionStandard;
use App\Models\Catalog\CompositionStandardItem;
use App\Models\Catalog\GradeContentSection;
use App\Models\Catalog\GradeFeatureItem;
use App\Models\Catalog\GradeProperty;
use App\Models\Catalog\GradeStandard;
use App\Models\Catalog\GradeProduct;
use App\Models\Catalog\ProductVariant;
use App\Models\Catalog\SeriesContentSection;
use App\Models\Catalog\Shape;
use App\Models\Catalog\ShapeFamily;
use App\Models\Catalog\VariantOffer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class CatalogPublicResetService
{
    private const STOCK_IMPORT_TYPE = 'product_stock_excel';

    public function reset(): array
    {
        return $this->resetAll();
    }

    public function resetAll(): array
    {
        $stockBatches = CatalogImportBatch::query()
            ->where('type', self::STOCK_IMPORT_TYPE)
            ->get(['id', 'file_path']);
        $referenceRuns = CatalogReferenceImportRun::query()->get(['id', 'file_path']);

        $deletedStockFiles = 0;
        $deletedReferenceFiles = 0;

        foreach ($stockBatches as $batch) {
            $path = trim((string) $batch->file_path);

            if ($path !== '' && Storage::disk('local')->exists($path)) {
                Storage::disk('local')->delete($path);
                $deletedStockFiles++;
            }
        }

        foreach ($referenceRuns as $run) {
            if ($this->deleteStoredFile((string) $run->file_path)) {
                $deletedReferenceFiles++;
            }
        }

        return DB::transaction(function () use ($stockBatches, $referenceRuns, $deletedStockFiles, $deletedReferenceFiles): array {
            $stockRows = $stockBatches->isEmpty()
                ? 0
                : CatalogStagingProduct::query()
                    ->whereIn('catalog_import_batch_id', $stockBatches->pluck('id'))
                    ->count();
            $referenceRows = CatalogReferenceImportRow::query()->count();

            $activeFamilies = CatalogFamily::query()->where('is_active', true)->count();
            $activeLines = CatalogLine::query()->where('is_active', true)->count();
            $activeSeries = CatalogSeries::query()->where('is_active', true)->count();
            $activeGrades = CatalogGrade::query()->where('is_active', true)->count();
            $gradeNormaLinks = Schema::hasTable('catalog_grade_norma')
                ? DB::table('catalog_grade_norma')->count()
                : 0;
            $gradeApplicationLinks = Schema::hasTable('catalog_grade_applications')
                ? DB::table('catalog_grade_applications')->count()
                : 0;

            $summary = [
                'family_content_cleared' => CatalogFamily::query()->update([
                    'intro_title' => null,
                    'intro_text' => null,
                    'is_active' => false,
                ]),
                'line_content_cleared' => CatalogLine::query()->update([
                    'intro_title' => null,
                    'intro_text' => null,
                    'search_keywords' => null,
                    'is_active' => false,
                ]),
                'series_content_cleared' => CatalogSeries::query()->update([
                    'intro_title' => null,
                    'intro_text' => null,
                    'search_keywords' => null,
                    'is_active' => false,
                ]),
                'grade_content_cleared' => CatalogGrade::query()->update([
                    'short_title' => null,
                    'intro_title' => null,
                    'intro_text' => null,
                    'density_value' => null,
                    'density_unit' => null,
                    'specific_weight_value' => null,
                    'specific_weight_unit' => null,
                    'uns' => null,
                    'wk_nr' => null,
                    'is_active' => false,
                ]),
                'families' => $activeFamilies,
                'lines' => $activeLines,
                'series' => $activeSeries,
                'grades' => $activeGrades,
                'material_mappings' => CatalogMaterialMapping::query()->where('is_active', true)->update(['is_active' => false]),
                'shape_families' => ShapeFamily::query()->where('is_active', true)->update(['is_active' => false]),
                'shapes' => Shape::query()->where('is_active', true)->update(['is_active' => false]),
                'shape_mappings' => CatalogShapeMapping::query()->where('is_active', true)->update(['is_active' => false]),
                'grade_products' => GradeProduct::query()->where('is_active', true)->update(['is_active' => false]),
                'series_sections' => SeriesContentSection::query()->count(),
                'grade_sections' => GradeContentSection::query()->count(),
                'grade_features' => GradeFeatureItem::query()->count(),
                'grade_properties' => GradeProperty::query()->count(),
                'grade_standards' => GradeStandard::query()->count(),
                'grade_norma_links' => $gradeNormaLinks,
                'grade_application_links' => $gradeApplicationLinks,
                'normas' => CatalogNorma::query()->count(),
                'composition_profiles' => CompositionProfile::query()->count(),
                'composition_standards' => CompositionStandard::query()->count(),
                'composition_items' => CompositionStandardItem::query()->count(),
                'variants' => ProductVariant::query()
                    ->where(function ($query): void {
                        $query->where('is_active', true)
                            ->orWhere('is_public_visible', true)
                            ->orWhere('is_offer', true);
                    })
                    ->update([
                        'is_active' => false,
                        'is_public_visible' => false,
                        'is_offer' => false,
                    ]),
                'variant_offers' => VariantOffer::query()->where('is_active', true)->update(['is_active' => false]),
                'stock_batches' => $stockBatches->count(),
                'stock_rows' => $stockRows,
                'stock_files' => $deletedStockFiles,
                'reference_runs' => $referenceRuns->count(),
                'reference_rows' => $referenceRows,
                'reference_files' => $deletedReferenceFiles,
            ];

            SeriesContentSection::query()->delete();
            GradeContentSection::query()->delete();
            GradeFeatureItem::query()->delete();
            GradeProperty::query()->delete();
            GradeStandard::query()->delete();
            if (Schema::hasTable('catalog_grade_norma')) {
                DB::table('catalog_grade_norma')->delete();
            }

            if (Schema::hasTable('catalog_grade_applications')) {
                DB::table('catalog_grade_applications')->delete();
            }
            CatalogNorma::query()->delete();
            CompositionStandardItem::query()->delete();
            CompositionStandard::query()->delete();
            CompositionProfile::query()->delete();

            if ($stockBatches->isNotEmpty()) {
                CatalogImportBatch::query()
                    ->whereKey($stockBatches->pluck('id'))
                    ->delete();
            }

            if ($referenceRows > 0) {
                CatalogReferenceImportRow::query()->delete();
            }

            if ($referenceRuns->isNotEmpty()) {
                CatalogReferenceImportRun::query()
                    ->whereKey($referenceRuns->pluck('id'))
                    ->delete();
            }

            return $summary;
        });
    }

    public function resetStockOnly(): array
    {
        $stockBatches = CatalogImportBatch::query()
            ->where('type', self::STOCK_IMPORT_TYPE)
            ->get(['id', 'file_path']);

        $deletedStockFiles = 0;

        foreach ($stockBatches as $batch) {
            $path = trim((string) $batch->file_path);

            if ($path !== '' && Storage::disk('local')->exists($path)) {
                Storage::disk('local')->delete($path);
                $deletedStockFiles++;
            }
        }

        return DB::transaction(function () use ($stockBatches, $deletedStockFiles): array {
            $stockRows = $stockBatches->isEmpty()
                ? 0
                : CatalogStagingProduct::query()
                    ->whereIn('catalog_import_batch_id', $stockBatches->pluck('id'))
                    ->count();

            $summary = [
                'families' => 0,
                'lines' => 0,
                'series' => 0,
                'grades' => 0,
                'material_mappings' => 0,
                'shape_families' => ShapeFamily::query()->where('is_active', true)->update(['is_active' => false]),
                'shapes' => Shape::query()->where('is_active', true)->update(['is_active' => false]),
                'shape_mappings' => CatalogShapeMapping::query()->where('is_active', true)->update(['is_active' => false]),
                'grade_products' => GradeProduct::query()->where('is_active', true)->update(['is_active' => false]),
                'variants' => ProductVariant::query()
                    ->where(function ($query): void {
                        $query->where('is_active', true)
                            ->orWhere('is_public_visible', true)
                            ->orWhere('is_offer', true);
                    })
                    ->update([
                        'is_active' => false,
                        'is_public_visible' => false,
                        'is_offer' => false,
                    ]),
                'variant_offers' => VariantOffer::query()->where('is_active', true)->update(['is_active' => false]),
                'stock_batches' => $stockBatches->count(),
                'stock_rows' => $stockRows,
                'stock_files' => $deletedStockFiles,
                'reference_runs' => 0,
            ];

            if ($stockBatches->isNotEmpty()) {
                CatalogImportBatch::query()
                    ->whereKey($stockBatches->pluck('id'))
                    ->delete();
            }

            return $summary;
        });
    }

    private function deleteStoredFile(string $path): bool
    {
        if ($path === '') {
            return false;
        }

        if (Storage::disk('local')->exists($path)) {
            Storage::disk('local')->delete($path);

            return true;
        }

        if (is_file($path)) {
            return @unlink($path);
        }

        return false;
    }
}

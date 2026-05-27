<?php

namespace App\Services\Catalog;

use App\Models\Catalog\CatalogGrade;
use App\Models\SectionItem;
use Illuminate\Support\Collection;

class CatalogApplicationResolver
{
    private ?Collection $availableApplications = null;

    public function forGrade(CatalogGrade $grade): Collection
    {
        $grade->loadMissing([
            'series.line',
            'applications' => fn ($query) => $query
                ->where('is_active', true)
                ->with('media')
                ->orderBy('catalog_grade_applications.sort_order'),
        ]);

        $lineId = (int) ($grade->series?->line?->id ?? 0);
        $seriesId = (int) ($grade->series?->id ?? $grade->catalog_series_id ?? 0);
        $gradeId = (int) $grade->id;

        $matchedApplications = $this->availableApplications()
            ->filter(fn (SectionItem $application): bool => $this->matchesGrade($application, $lineId, $seriesId, $gradeId));

        return $matchedApplications
            ->concat(
                $grade->applications->filter(
                    fn (SectionItem $application): bool => (bool) $application->is_active
                )
            )
            ->unique('id')
            ->values();
    }

    private function availableApplications(): Collection
    {
        if ($this->availableApplications !== null) {
            return $this->availableApplications;
        }

        $this->availableApplications = SectionItem::query()
            ->with('media')
            ->where('is_active', true)
            ->whereHas('section', fn ($query) => $query
                ->where('page_key', 'home')
                ->where('section_key', 'applications')
                ->where('is_active', true))
            ->orderBy('sort_order')
            ->get();

        return $this->availableApplications;
    }

    private function matchesGrade(SectionItem $application, int $lineId, int $seriesId, int $gradeId): bool
    {
        $meta = collect($application->meta_json ?? []);

        $relatedLineIds = collect($meta->get('related_line_ids', $meta->get('related_catalog_line_ids', [])))
            ->map(fn ($id) => (int) $id)
            ->filter();

        $relatedSeriesIds = collect($meta->get('related_series_ids', []))
            ->map(fn ($id) => (int) $id)
            ->filter();

        $relatedGradeIds = collect($meta->get('related_grade_ids', []))
            ->map(fn ($id) => (int) $id)
            ->filter();

        $excludedSeriesIds = collect($meta->get('excluded_series_ids', []))
            ->map(fn ($id) => (int) $id)
            ->filter();

        $excludedGradeIds = collect($meta->get('excluded_grade_ids', []))
            ->map(fn ($id) => (int) $id)
            ->filter();

        if ($relatedGradeIds->contains($gradeId)) {
            return true;
        }

        if ($relatedSeriesIds->contains($seriesId)) {
            return ! $excludedGradeIds->contains($gradeId);
        }

        if ($relatedLineIds->contains($lineId)) {
            if ($excludedSeriesIds->contains($seriesId)) {
                return false;
            }

            return ! $excludedGradeIds->contains($gradeId);
        }

        return false;
    }
}

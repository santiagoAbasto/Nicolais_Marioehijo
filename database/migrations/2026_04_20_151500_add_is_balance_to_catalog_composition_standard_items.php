<?php

use App\Models\Catalog\CatalogGrade;
use App\Models\Catalog\CatalogReferenceImportRow;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catalog_composition_standard_items', function (Blueprint $table) {
            $table->boolean('is_balance')->default(false)->after('display_row');
        });

        $latestRows = CatalogReferenceImportRow::query()
            ->orderByDesc('id')
            ->get()
            ->unique(fn (CatalogReferenceImportRow $row) => mb_strtolower(trim((string) $row->product_name)));

        foreach ($latestRows as $row) {
            $balanceSymbol = collect($row->row_payload ?? [])
                ->firstWhere('normalized_heading', 'resto_del_material')['value'] ?? null;

            $balanceSymbol = is_string($balanceSymbol) ? trim($balanceSymbol) : null;

            if (! $balanceSymbol || ! $row->product_name) {
                continue;
            }

            $grade = CatalogGrade::query()
                ->where('name', $row->product_name)
                ->whereHas('series', fn ($query) => $query->where('name', $row->subfamily_name))
                ->with([
                    'compositionProfiles' => fn ($query) => $query
                        ->where('subtitle', 'Importada desde Excel de referencia')
                        ->with('standards.items'),
                ])
                ->first();

            if (! $grade) {
                continue;
            }

            foreach ($grade->compositionProfiles as $profile) {
                foreach ($profile->standards as $standard) {
                    $items = $standard->items;
                    $balanceItem = $items->first(function ($item) use ($balanceSymbol) {
                        return strcasecmp((string) $item->display_label, $balanceSymbol) === 0;
                    });

                    if (! $balanceItem) {
                        continue;
                    }

                    $otherSum = $items
                        ->where('id', '!=', $balanceItem->id)
                        ->sum(fn ($item) => (float) ($item->display_percent ?? 0));

                    $remainder = round(max(0, 100 - $otherSum), 4);

                    $balanceItem->is_balance = true;

                    $hasExplicitValue = $balanceItem->min_percent !== null
                        || $balanceItem->max_percent !== null
                        || $balanceItem->nominal_percent !== null;

                    if (! $hasExplicitValue && $remainder > 0) {
                        $balanceItem->display_percent = $remainder;
                    }

                    $balanceItem->save();
                }
            }
        }
    }

    public function down(): void
    {
        Schema::table('catalog_composition_standard_items', function (Blueprint $table) {
            $table->dropColumn('is_balance');
        });
    }
};

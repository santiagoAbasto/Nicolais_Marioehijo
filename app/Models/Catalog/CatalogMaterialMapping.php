<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogMaterialMapping extends Model
{
    use HasFactory;

    protected $table = 'catalog_material_mappings';

    protected $fillable = [
        'external_material_id',
        'raw_material_name',
        'normalized_material_name',
        'catalog_family_id',
        'catalog_line_id',
        'catalog_series_id',
        'catalog_grade_id',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(CatalogFamily::class, 'catalog_family_id');
    }

    public function line(): BelongsTo
    {
        return $this->belongsTo(CatalogLine::class, 'catalog_line_id');
    }

    public function series(): BelongsTo
    {
        return $this->belongsTo(CatalogSeries::class, 'catalog_series_id');
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(CatalogGrade::class, 'catalog_grade_id');
    }
}

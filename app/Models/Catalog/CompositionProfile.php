<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompositionProfile extends Model
{
    use HasFactory;

    protected $table = 'catalog_composition_profiles';

    protected $fillable = [
        'catalog_line_id',
        'catalog_series_id',
        'catalog_grade_id',
        'title',
        'subtitle',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
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

    public function standards(): HasMany
    {
        return $this->hasMany(CompositionStandard::class, 'catalog_composition_profile_id')->orderBy('sort_order');
    }
}

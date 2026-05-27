<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CatalogSeries extends Model
{
    use HasFactory;

    protected $table = 'catalog_series';

    protected $fillable = [
        'catalog_line_id',
        'name',
        'slug',
        'intro_title',
        'intro_text',
        'search_keywords',
        'hero_media_id',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'search_keywords' => 'array',
            'sort_order' => 'string',
            'is_active' => 'boolean',
        ];
    }

    public function line(): BelongsTo
    {
        return $this->belongsTo(CatalogLine::class, 'catalog_line_id');
    }

    public function grades(): HasMany
    {
        return $this->hasMany(CatalogGrade::class)->orderBy('sort_order');
    }

    public function contentSections(): HasMany
    {
        return $this->hasMany(SeriesContentSection::class, 'catalog_series_id')->orderBy('sort_order');
    }

    public function compositionProfiles(): HasMany
    {
        return $this->hasMany(CompositionProfile::class, 'catalog_series_id')->orderBy('sort_order');
    }

    public function heroMedia(): BelongsTo
    {
        return $this->belongsTo(\App\Models\MediaAsset::class, 'hero_media_id');
    }
}

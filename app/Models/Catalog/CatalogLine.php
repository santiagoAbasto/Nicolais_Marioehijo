<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CatalogLine extends Model
{
    use HasFactory;

    protected $table = 'catalog_lines';

    protected $fillable = [
        'catalog_family_id',
        'name',
        'slug',
        'intro_title',
        'intro_text',
        'search_keywords',
        'hero_media_id',
        'sort_order',
        'is_active',
        'show_on_home',
    ];

    protected function casts(): array
    {
        return [
            'search_keywords' => 'array',
            'sort_order' => 'string',
            'is_active' => 'boolean',
            'show_on_home' => 'boolean',
        ];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(CatalogFamily::class, 'catalog_family_id');
    }

    public function series(): HasMany
    {
        return $this->hasMany(CatalogSeries::class)->orderBy('sort_order');
    }

    public function compositionProfiles(): HasMany
    {
        return $this->hasMany(\App\Models\Catalog\CompositionProfile::class, 'catalog_line_id')->orderBy('sort_order');
    }

    public function heroMedia(): BelongsTo
    {
        return $this->belongsTo(\App\Models\MediaAsset::class, 'hero_media_id');
    }
}

<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CatalogFamily extends Model
{
    use HasFactory;

    protected $table = 'catalog_families';

    protected $fillable = [
        'name',
        'slug',
        'intro_title',
        'intro_text',
        'hero_media_id',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'string',
            'is_active' => 'boolean',
        ];
    }

    public function lines(): HasMany
    {
        return $this->hasMany(CatalogLine::class)->orderBy('sort_order');
    }

    public function heroMedia(): BelongsTo
    {
        return $this->belongsTo(\App\Models\MediaAsset::class, 'hero_media_id');
    }
}

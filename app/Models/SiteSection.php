<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SiteSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_key',
        'section_key',
        'title',
        'subtitle',
        'description',
        'media_id',
        'secondary_media_id',
        'button_text',
        'button_url',
        'meta_json',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'meta_json' => 'array',
            'sort_order' => 'string',
            'is_active' => 'boolean',
        ];
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'media_id');
    }

    public function secondaryMedia(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'secondary_media_id');
    }

    public function fieldValues(): HasMany
    {
        return $this->hasMany(SectionFieldValue::class)->orderBy('sort_order');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SectionItem::class)->orderBy('sort_order');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SectionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_section_id',
        'item_key',
        'title',
        'subtitle',
        'description',
        'media_id',
        'link_url',
        'accent_color',
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

    public function section(): BelongsTo
    {
        return $this->belongsTo(SiteSection::class, 'site_section_id');
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class);
    }
}

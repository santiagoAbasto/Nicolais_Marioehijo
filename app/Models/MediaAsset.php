<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MediaAsset extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'disk',
        'path',
        'title',
        'alt_text',
        'mime_type',
        'extension',
        'size_bytes',
        'width',
        'height',
        'duration_seconds',
        'meta_json',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'duration_seconds' => 'integer',
            'meta_json' => 'array',
        ];
    }

    public function siteSections(): HasMany
    {
        return $this->hasMany(SiteSection::class, 'media_id');
    }

    public function secondarySiteSections(): HasMany
    {
        return $this->hasMany(SiteSection::class, 'secondary_media_id');
    }

    public function productMedia(): HasMany
    {
        return $this->hasMany(ProductMedia::class);
    }
}

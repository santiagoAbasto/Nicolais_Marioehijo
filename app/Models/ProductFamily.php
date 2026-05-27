<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductFamily extends Model
{
    use HasFactory;

    protected const ACCENT_PALETTE = [
        '#093C62',
        '#8BCFDE',
        '#A46DA9',
        '#E85556',
        '#FBC640',
        '#52B6AC',
    ];

    protected $fillable = [
        'name',
        'slug',
        'description',
        'cover_media_id',
        'banner_media_id',
        'accent_color',
        'sort_order',
        'is_active',
        'show_on_products_page',
        'show_on_home',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'string',
            'is_active' => 'boolean',
            'show_on_products_page' => 'boolean',
            'show_on_home' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (self $family): void {
            if (! filled($family->accent_color)) {
                $family->accent_color = static::nextAccentColor($family);
            }
        });
    }

    protected static function nextAccentColor(self $family): string
    {
        $palette = static::ACCENT_PALETTE;

        $count = static::query()
            ->when($family->exists, fn ($query) => $query->whereKeyNot($family->getKey()))
            ->whereIn('accent_color', $palette)
            ->count();

        return $palette[$count % count($palette)];
    }

    public function coverMedia(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'cover_media_id');
    }

    public function bannerMedia(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'banner_media_id');
    }

    public function subfamilies(): HasMany
    {
        return $this->hasMany(ProductSubfamily::class)->orderBy('sort_order');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class)->orderBy('sort_order');
    }
}

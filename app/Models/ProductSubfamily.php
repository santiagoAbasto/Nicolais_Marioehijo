<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductSubfamily extends Model
{
    use HasFactory;

    protected const ACCENT_PALETTE = [
        '#8BCFDE',
        '#A46DA9',
        '#E85556',
        '#FBC640',
        '#52B6AC',
        '#E86428',
        '#9DC66C',
        '#E75A9A',
    ];

    protected $fillable = [
        'product_family_id',
        'name',
        'short_description',
        'slug',
        'description',
        'cover_media_id',
        'accent_color',
        'sort_order',
        'is_active',
        'show_on_home',
        'show_on_family_page',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'string',
            'is_active' => 'boolean',
            'show_on_home' => 'boolean',
            'show_on_family_page' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (self $subfamily): void {
            if (! filled($subfamily->accent_color)) {
                $subfamily->accent_color = static::nextAccentColor($subfamily);
            }
        });
    }

    protected static function nextAccentColor(self $subfamily): string
    {
        $palette = static::ACCENT_PALETTE;

        $count = static::query()
            ->where('product_family_id', $subfamily->product_family_id)
            ->when($subfamily->exists, fn ($query) => $query->whereKeyNot($subfamily->getKey()))
            ->whereIn('accent_color', $palette)
            ->count();

        return $palette[$count % count($palette)];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(ProductFamily::class, 'product_family_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class)->orderBy('sort_order');
    }

    public function coverMedia(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'cover_media_id');
    }
}

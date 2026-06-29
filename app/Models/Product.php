<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_family_id',
        'product_subfamily_id',
        'name',
        'slug',
        'sku',
        'brand',
        'brand_logo_media_id',
        'rubro',
        'original_code',
        'equivalence_code',
        'oem_code',
        'price',
        'discount_price',
        'short_description',
        'description',
        'applications',
        'material',
        'treatment',
        'observations',
        'main_media_id',
        'technical_sheet_media_id',
        'sort_order',
        'is_active',
        'is_featured_home',
        'is_featured_family',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'string',
            'price' => 'decimal:2',
            'discount_price' => 'decimal:2',
            'is_active' => 'boolean',
            'is_featured_home' => 'boolean',
            'is_featured_family' => 'boolean',
        ];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(ProductFamily::class, 'product_family_id');
    }

    public function subfamily(): BelongsTo
    {
        return $this->belongsTo(ProductSubfamily::class, 'product_subfamily_id');
    }

    public function mainMedia(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'main_media_id');
    }

    public function brandLogoMedia(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'brand_logo_media_id');
    }

    public function technicalSheet(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'technical_sheet_media_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(ProductMedia::class)->orderBy('sort_order');
    }

    public function specTables(): HasMany
    {
        return $this->hasMany(ProductSpecTable::class)->orderBy('sort_order');
    }

    public function relatedProducts(): BelongsToMany
    {
        return $this->belongsToMany(
            Product::class,
            'product_related',
            'product_id',
            'related_product_id'
        )->withPivot('sort_order')->withTimestamps();
    }

    public function relatedEntries(): HasMany
    {
        return $this->hasMany(ProductRelated::class)->orderBy('sort_order');
    }

}

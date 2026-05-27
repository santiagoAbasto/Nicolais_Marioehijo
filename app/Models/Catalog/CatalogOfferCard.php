<?php

namespace App\Models\Catalog;

use App\Models\MediaAsset;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CatalogOfferCard extends Model
{
    use HasFactory;

    protected $table = 'catalog_offer_cards';

    protected $fillable = [
        'title',
        'slug',
        'description',
        'badge_text',
        'media_id',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'media_id');
    }

    public function gradeProducts(): BelongsToMany
    {
        return $this->belongsToMany(
            GradeProduct::class,
            'catalog_offer_card_grade_product',
            'catalog_offer_card_id',
            'catalog_grade_product_id'
        )
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderBy('catalog_offer_card_grade_product.sort_order');
    }

    public function productVariants(): BelongsToMany
    {
        return $this->belongsToMany(
            ProductVariant::class,
            'catalog_offer_card_product_variant',
            'catalog_offer_card_id',
            'catalog_product_variant_id'
        )
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderBy('catalog_offer_card_product_variant.sort_order');
    }
}

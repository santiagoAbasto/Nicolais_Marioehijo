<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VariantOffer extends Model
{
    use HasFactory;

    protected $table = 'catalog_variant_offers';

    protected $fillable = [
        'catalog_product_variant_id',
        'title_override',
        'subtitle_override',
        'badge_text',
        'discount_percent',
        'offer_price',
        'original_price',
        'hero_media_id',
        'starts_at',
        'ends_at',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'discount_percent' => 'decimal:2',
            'offer_price' => 'decimal:2',
            'original_price' => 'decimal:2',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'catalog_product_variant_id');
    }
}

<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ProductVariant extends Model
{
    use HasFactory;

    protected $table = 'catalog_product_variants';

    protected $fillable = [
        'catalog_grade_product_id',
        'external_product_id',
        'external_material_id',
        'external_code',
        'dimension_numeric',
        'dimension_text',
        'description',
        'stock_status',
        'is_custom_order',
        'is_offer',
        'is_discontinued',
        'is_active',
        'is_public_visible',
        'last_imported_at',
    ];

    protected function casts(): array
    {
        return [
            'dimension_numeric' => 'decimal:4',
            'is_custom_order' => 'boolean',
            'is_offer' => 'boolean',
            'is_discontinued' => 'boolean',
            'is_active' => 'boolean',
            'is_public_visible' => 'boolean',
            'last_imported_at' => 'datetime',
        ];
    }

    public function gradeProduct(): BelongsTo
    {
        return $this->belongsTo(GradeProduct::class, 'catalog_grade_product_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(ProductVariantMedia::class, 'catalog_product_variant_id')->orderBy('sort_order');
    }

    public function offer(): HasOne
    {
        return $this->hasOne(VariantOffer::class, 'catalog_product_variant_id');
    }
}

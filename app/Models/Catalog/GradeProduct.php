<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GradeProduct extends Model
{
    use HasFactory;

    protected $table = 'catalog_grade_products';

    protected $fillable = [
        'catalog_grade_id',
        'catalog_shape_id',
        'display_name',
        'description',
        'is_custom_order',
        'is_discontinued',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_custom_order' => 'boolean',
            'is_discontinued' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(CatalogGrade::class, 'catalog_grade_id');
    }

    public function shape(): BelongsTo
    {
        return $this->belongsTo(Shape::class, 'catalog_shape_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'catalog_grade_product_id');
    }
}

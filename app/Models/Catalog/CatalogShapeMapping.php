<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogShapeMapping extends Model
{
    use HasFactory;

    protected $table = 'catalog_shape_mappings';

    protected $fillable = [
        'external_shape_id',
        'external_shape_family_id',
        'raw_shape_name',
        'normalized_shape_name',
        'catalog_shape_family_id',
        'catalog_shape_id',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(ShapeFamily::class, 'catalog_shape_family_id');
    }

    public function shape(): BelongsTo
    {
        return $this->belongsTo(Shape::class, 'catalog_shape_id');
    }
}

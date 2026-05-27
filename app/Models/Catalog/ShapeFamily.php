<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShapeFamily extends Model
{
    use HasFactory;

    protected $table = 'catalog_shape_families';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function shapes(): HasMany
    {
        return $this->hasMany(Shape::class, 'catalog_shape_family_id')->orderBy('sort_order');
    }
}

<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShapeFormulaField extends Model
{
    use HasFactory;

    protected $table = 'catalog_shape_formula_fields';

    protected $fillable = [
        'catalog_shape_id',
        'field_key',
        'label',
        'input_type',
        'unit_group',
        'default_unit',
        'is_required',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function shape(): BelongsTo
    {
        return $this->belongsTo(Shape::class, 'catalog_shape_id');
    }
}

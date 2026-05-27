<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShapeFormulaRule extends Model
{
    use HasFactory;

    protected $table = 'catalog_shape_formula_rules';

    protected $fillable = [
        'catalog_shape_id',
        'formula_code',
        'formula_description',
        'result_unit',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function shape(): BelongsTo
    {
        return $this->belongsTo(Shape::class, 'catalog_shape_id');
    }
}

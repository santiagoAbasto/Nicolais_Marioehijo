<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalculatorLog extends Model
{
    use HasFactory;

    protected $table = 'catalog_calculator_logs';

    protected $fillable = [
        'catalog_grade_id',
        'catalog_shape_id',
        'input_payload',
        'density_value',
        'volume_value',
        'result_weight',
        'result_unit',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'input_payload' => 'array',
            'density_value' => 'decimal:6',
            'volume_value' => 'decimal:6',
            'result_weight' => 'decimal:6',
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
}

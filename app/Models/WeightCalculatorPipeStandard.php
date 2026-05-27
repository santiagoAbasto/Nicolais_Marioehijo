<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeightCalculatorPipeStandard extends Model
{
    protected $fillable = [
        'order_index',
        'name',
        'diameter_in',
        'diameter_mm',
        'schedule_label',
        'schedule_aliases',
        'wall_in',
        'wall_mm',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'order_index' => 'integer',
            'diameter_in' => 'decimal:6',
            'diameter_mm' => 'decimal:6',
            'schedule_aliases' => 'array',
            'wall_in' => 'decimal:6',
            'wall_mm' => 'decimal:6',
            'is_active' => 'boolean',
        ];
    }
}

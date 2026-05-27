<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeightCalculatorMaterial extends Model
{
    protected $fillable = [
        'name',
        'density_kg_m3',
        'density_g_cm3',
        'uns',
        'w_nr',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'density_kg_m3' => 'decimal:4',
            'density_g_cm3' => 'decimal:6',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeightCalculatorShape extends Model
{
    protected $fillable = [
        'key',
        'name',
        'fields_json',
        'formula_expression',
        'formula_label',
        'uses_pipe',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'fields_json' => 'array',
            'uses_pipe' => 'boolean',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}

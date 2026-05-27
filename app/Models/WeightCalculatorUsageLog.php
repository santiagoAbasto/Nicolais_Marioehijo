<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeightCalculatorUsageLog extends Model
{
    protected $fillable = [
        'ip_address',
        'browser',
        'platform',
        'device_type',
        'user_agent',
        'accept_language',
        'material_name',
        'shape_name',
        'shape_key',
        'pipe_standard_name',
        'pieces',
        'density_g_cm3',
        'volume_cm3',
        'result_value',
        'result_unit',
        'page_url',
        'referrer',
        'fields_json',
    ];

    protected function casts(): array
    {
        return [
            'fields_json' => 'array',
            'pieces' => 'integer',
            'density_g_cm3' => 'decimal:6',
            'volume_cm3' => 'decimal:6',
            'result_value' => 'decimal:6',
        ];
    }
}

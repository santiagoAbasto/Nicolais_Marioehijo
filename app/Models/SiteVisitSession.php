<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteVisitSession extends Model
{
    protected $fillable = [
        'session_id',
        'visitor_key',
        'status',
        'first_seen_at',
        'last_seen_at',
        'left_at',
        'route_name',
        'page_key',
        'section_key',
        'section_label',
        'page_label',
        'path',
        'country_code',
        'country_name',
        'browser',
        'platform',
        'device_type',
        'ip_address',
        'route_params_json',
    ];

    protected function casts(): array
    {
        return [
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'left_at' => 'datetime',
            'route_params_json' => 'array',
        ];
    }
}

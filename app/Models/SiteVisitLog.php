<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteVisitLog extends Model
{
    protected $fillable = [
        'route_name',
        'page_key',
        'section_key',
        'section_label',
        'page_label',
        'path',
        'full_url',
        'session_id',
        'visitor_key',
        'ip_address',
        'country_code',
        'country_name',
        'browser',
        'platform',
        'device_type',
        'user_agent',
        'accept_language',
        'referrer',
        'route_params_json',
    ];

    protected function casts(): array
    {
        return [
            'route_params_json' => 'array',
        ];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SecurityEvent extends Model
{
    protected $fillable = [
        'user_id',
        'ip_fingerprint',
        'user_agent',
        'route',
        'path',
        'method',
        'type',
        'severity',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }
}

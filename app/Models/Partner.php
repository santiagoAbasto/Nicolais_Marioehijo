<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Partner extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'logo_media_id',
        'website_url',
        'partner_type',
        'sort_order',
        'is_active',
        'show_on_home',
        'show_on_page',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'string',
            'is_active' => 'boolean',
            'show_on_home' => 'boolean',
            'show_on_page' => 'boolean',
        ];
    }

    public function logo(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'logo_media_id');
    }
}

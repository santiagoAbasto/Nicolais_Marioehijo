<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_category_id',
        'primary_category_id',
        'name',
        'slug',
        'logo_media_id',
        'website_url',
        'sort_order',
        'is_active',
        'show_on_home',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'string',
            'is_active' => 'boolean',
            'show_on_home' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ClientCategory::class, 'client_category_id');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(ClientCategory::class, 'client_category_client', 'client_id', 'client_category_id')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderByPivot('sort_order')
            ->orderBy('client_categories.sort_order');
    }

    public function logo(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'logo_media_id');
    }
}

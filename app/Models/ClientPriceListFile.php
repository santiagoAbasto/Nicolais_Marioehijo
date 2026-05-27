<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ClientPriceListFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'format',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size_bytes',
        'sort_order',
        'sort_code',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function clients(): BelongsToMany
    {
        return $this->belongsToMany(
            ClientAccessRequest::class,
            'client_price_list_file_clients',
            'client_price_list_file_id',
            'client_access_request_id',
        )->withTimestamps();
    }
}

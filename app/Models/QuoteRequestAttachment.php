<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuoteRequestAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'quote_request_id',
        'media_id',
        'file_name_snapshot',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'string',
        ];
    }

    public function quoteRequest(): BelongsTo
    {
        return $this->belongsTo(QuoteRequest::class);
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class);
    }
}

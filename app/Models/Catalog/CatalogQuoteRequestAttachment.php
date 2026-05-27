<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogQuoteRequestAttachment extends Model
{
    use HasFactory;

    protected $table = 'catalog_quote_request_attachments';

    protected $fillable = [
        'catalog_quote_request_id',
        'media_asset_id',
        'file_name_snapshot',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function quoteRequest(): BelongsTo
    {
        return $this->belongsTo(CatalogQuoteRequest::class, 'catalog_quote_request_id');
    }
}

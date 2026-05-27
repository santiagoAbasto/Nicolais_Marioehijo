<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogQuoteRequestItem extends Model
{
    use HasFactory;

    protected $table = 'catalog_quote_request_items';

    protected $fillable = [
        'catalog_quote_request_id',
        'catalog_grade_id',
        'catalog_shape_id',
        'catalog_product_variant_id',
        'dimensions_text',
        'quantity',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
        ];
    }

    public function quoteRequest(): BelongsTo
    {
        return $this->belongsTo(CatalogQuoteRequest::class, 'catalog_quote_request_id');
    }
}

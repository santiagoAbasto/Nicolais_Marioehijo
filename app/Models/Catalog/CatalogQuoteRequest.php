<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CatalogQuoteRequest extends Model
{
    use HasFactory;

    protected $table = 'catalog_quote_requests';

    protected $fillable = [
        'full_name',
        'email',
        'country',
        'phone',
        'company',
        'catalog_family_id',
        'catalog_line_id',
        'catalog_series_id',
        'catalog_grade_id',
        'catalog_shape_id',
        'catalog_product_variant_id',
        'dimensions_text',
        'quantity',
        'notes',
        'calculated_weight',
        'calculated_weight_unit',
        'source',
        'status',
        'is_read',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'calculated_weight' => 'decimal:6',
            'is_read' => 'boolean',
        ];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(CatalogFamily::class, 'catalog_family_id');
    }

    public function line(): BelongsTo
    {
        return $this->belongsTo(CatalogLine::class, 'catalog_line_id');
    }

    public function series(): BelongsTo
    {
        return $this->belongsTo(CatalogSeries::class, 'catalog_series_id');
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(CatalogGrade::class, 'catalog_grade_id');
    }

    public function shape(): BelongsTo
    {
        return $this->belongsTo(Shape::class, 'catalog_shape_id');
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'catalog_product_variant_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(CatalogQuoteRequestItem::class, 'catalog_quote_request_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(CatalogQuoteRequestAttachment::class, 'catalog_quote_request_id')->orderBy('sort_order');
    }
}

<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeriesContentSection extends Model
{
    use HasFactory;

    protected $table = 'catalog_series_content_sections';

    protected $fillable = [
        'catalog_series_id',
        'section_key',
        'title',
        'content',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function series(): BelongsTo
    {
        return $this->belongsTo(CatalogSeries::class, 'catalog_series_id');
    }
}

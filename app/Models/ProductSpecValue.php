<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductSpecValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_spec_row_id',
        'product_spec_column_id',
        'value',
    ];

    public function row(): BelongsTo
    {
        return $this->belongsTo(ProductSpecRow::class, 'product_spec_row_id');
    }

    public function column(): BelongsTo
    {
        return $this->belongsTo(ProductSpecColumn::class, 'product_spec_column_id');
    }
}

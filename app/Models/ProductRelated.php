<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductRelated extends Model
{
    use HasFactory;

    protected $table = 'product_related';

    protected $fillable = [
        'product_id',
        'related_product_id',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'string',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function relatedProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'related_product_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductSpecTable extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'title',
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

    public function columns(): HasMany
    {
        return $this->hasMany(ProductSpecColumn::class)->orderBy('sort_order');
    }

    public function rows(): HasMany
    {
        return $this->hasMany(ProductSpecRow::class)->orderBy('sort_order');
    }
}

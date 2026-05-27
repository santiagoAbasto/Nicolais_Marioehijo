<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductSpecColumn extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_spec_table_id',
        'label',
        'unit',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'string',
        ];
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(ProductSpecTable::class, 'product_spec_table_id');
    }

    public function values(): HasMany
    {
        return $this->hasMany(ProductSpecValue::class);
    }
}

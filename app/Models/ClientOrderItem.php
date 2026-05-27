<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_order_id',
        'product_id',
        'family',
        'code',
        'description',
        'type',
        'quantity',
        'list_price',
        'discounted_price',
        'discount_percent',
        'sale_price',
        'margin_percent',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'list_price' => 'float',
            'discounted_price' => 'float',
            'discount_percent' => 'float',
            'sale_price' => 'float',
            'margin_percent' => 'float',
            'subtotal' => 'float',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(ClientOrder::class, 'client_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

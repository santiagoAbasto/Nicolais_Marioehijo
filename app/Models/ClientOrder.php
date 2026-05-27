<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClientOrder extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_INVOICED = 'invoiced';
    public const STATUS_DISPATCHED = 'dispatched';
    public const STATUS_DELIVERED = 'delivered';
    public const TYPE_ORDER = 'order';
    public const TYPE_BUDGET = 'budget';

    protected $fillable = [
        'client_access_request_id',
        'user_id',
        'order_number',
        'document_type',
        'draft_key',
        'status',
        'delivery_method',
        'message',
        'attachment_path',
        'attachment_name',
        'subtotal_list',
        'discount_total',
        'subtotal_discount',
        'iva',
        'total',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal_list' => 'float',
            'discount_total' => 'float',
            'subtotal_discount' => 'float',
            'iva' => 'float',
            'total' => 'float',
            'delivered_at' => 'datetime',
        ];
    }

    public function clientRequest(): BelongsTo
    {
        return $this->belongsTo(ClientAccessRequest::class, 'client_access_request_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ClientOrderItem::class);
    }
}

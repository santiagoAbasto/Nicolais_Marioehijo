<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientPaymentReceipt extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_VERIFIED = 'verified';
    public const STATUS_PAID = 'paid';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'client_access_request_id',
        'paid_at',
        'amount',
        'bank',
        'branch',
        'invoices',
        'observations',
        'disk',
        'attachment_path',
        'attachment_original_name',
        'attachment_mime',
        'attachment_size',
        'status',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'date',
            'amount' => 'decimal:2',
            'attachment_size' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING => 'Pendiente',
            self::STATUS_VERIFIED => 'Verificado',
            self::STATUS_PAID => 'Pagado',
            self::STATUS_REJECTED => 'Rechazado',
        ];
    }

    public function clientRequest(): BelongsTo
    {
        return $this->belongsTo(ClientAccessRequest::class, 'client_access_request_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}

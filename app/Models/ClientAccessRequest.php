<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientAccessRequest extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_DEACTIVATED = 'deactivated';

    protected $fillable = [
        'user_id',
        'status',
        'first_name',
        'last_name',
        'company',
        'tax_id',
        'email',
        'phone',
        'address',
        'city',
        'province',
        'postal_code',
        'business_type',
        'message',
        'payment_info',
        'margins',
        'approved_at',
        'rejected_at',
        'deactivated_at',
        'last_credentials_sent_at',
        'last_plain_password',
        'reviewed_by',
        'admin_notes',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'payment_info' => 'array',
            'margins' => 'array',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'deactivated_at' => 'datetime',
            'last_credentials_sent_at' => 'datetime',
            'last_plain_password' => 'encrypted',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }
}

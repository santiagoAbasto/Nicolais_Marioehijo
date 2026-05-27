<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FooterSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'logo_media_id',
        'brand_name',
        'newsletter_title',
        'newsletter_placeholder',
        'contact_title',
        'contact_address',
        'contact_hours',
        'phone_primary',
        'phone_secondary',
        'phone_tertiary',
        'email_primary',
        'email_secondary',
        'whatsapp_url',
        'copyright_text',
    ];

    public function logo(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'logo_media_id');
    }
}

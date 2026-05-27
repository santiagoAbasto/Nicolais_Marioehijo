<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NewsletterCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject',
        'title',
        'description',
        'body',
        'image_url',
        'recipient_count',
        'sent_count',
        'failed_count',
        'sent_at',
        'meta_json',
    ];

    protected function casts(): array
    {
        return [
            'recipient_count' => 'integer',
            'sent_count' => 'integer',
            'failed_count' => 'integer',
            'sent_at' => 'datetime',
            'meta_json' => 'array',
        ];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuotePageSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'notification_email_primary',
        'notification_email_secondary',
        'map_iframe',
    ];
}

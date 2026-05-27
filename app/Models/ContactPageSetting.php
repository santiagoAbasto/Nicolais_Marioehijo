<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactPageSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'address',
        'phone_primary',
        'phone_secondary',
        'phone_tertiary',
        'email_primary',
        'email_secondary',
        'map_iframe',
        'map_link',
    ];
}

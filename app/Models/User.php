<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'avatar',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_seen_at'      => 'datetime',
            'can_access_admin'  => 'boolean',
            'password'          => 'hashed',
        ];
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (! $this->avatar) {
            return null;
        }

        return app('router')->has('media.show')
            ? cms_media_url($this->avatar)
            : null;
    }

    public function isSuperAdmin(): bool
    {
        $principalId = static::query()->orderBy('id')->value('id');

        return (int) $this->id === (int) $principalId;
    }
}

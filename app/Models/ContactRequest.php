<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class ContactRequest extends Model
{
    use HasFactory;

    protected $appends = [
        'reply_email',
        'reply_url',
    ];

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'message',
        'is_read',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
        ];
    }

    public function getReplyEmailAttribute(): ?string
    {
        return $this->email ?: null;
    }

    public function getReplyUrlAttribute(): ?string
    {
        if (! $this->email) {
            return null;
        }

        $name = trim($this->first_name.' '.$this->last_name);
        $subject = 'Re: Consulta - Nicolais Mario e Hijo';
        $lines = array_filter([
            'Hola'.($name ? ' '.$name : '').',',
            '',
            'Gracias por comunicarte con Nicolais Mario e Hijo.',
            'Quedamos a disposición para responder tu consulta.',
            '',
            'Saludos,',
            'Equipo comercial Nicolais Mario e Hijo.',
        ]);

        $query = Arr::query([
            'subject' => $subject,
            'body'    => implode("\n", $lines),
        ]);

        return 'mailto:'.$this->email.'?'.$query;
    }
}

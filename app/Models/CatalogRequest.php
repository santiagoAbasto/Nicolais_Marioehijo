<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class CatalogRequest extends Model
{
    use HasFactory;

    protected $appends = [
        'reply_email',
        'reply_url',
    ];

    protected $fillable = [
        'name',
        'email',
        'company',
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

        $subject = 'Re: Solicitud de catalogo - Nicolais Mario e Hijo';
        $lines = array_filter([
            'Hola'.($this->name ? ' '.$this->name : '').',',
            '',
            'Gracias por comunicarte con Nicolais Mario e Hijo.',
            'Te enviamos en adjunto nuestro catalogo para que puedas revisarlo.',
            '',
            'Quedamos a disposicion por cualquier consulta adicional.',
            '',
            'Saludos,',
            'Equipo comercial Nicolais Mario e Hijo.',
        ]);

        $query = Arr::query([
            'subject' => $subject,
            'body' => implode("\n", $lines),
        ]);

        return 'mailto:'.$this->email.'?'.$query;
    }
}

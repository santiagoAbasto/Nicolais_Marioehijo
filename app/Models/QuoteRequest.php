<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Arr;

class QuoteRequest extends Model
{
    use HasFactory;

    protected $appends = [
        'reply_email',
        'reply_url',
    ];

    protected $fillable = [
        'name',
        'email',
        'country',
        'country_code',
        'company',
        'phone',
        'material',
        'shape',
        'dimensions',
        'quantity',
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

        $subject = 'Re: Solicitud de presupuesto - Nicolais Mario e Hijo';
        $lines = array_filter([
            'Hola'.($this->name ? ' '.$this->name : '').',',
            '',
            'Gracias por tu solicitud de presupuesto.',
            'Quedamos a disposición para continuar la consulta.',
            '',
            'Saludos,',
            'Equipo comercial Nicolais Mario e Hijo',
        ]);

        $query = Arr::query([
            'subject' => $subject,
            'body' => implode("\n", $lines),
        ]);

        return 'mailto:'.$this->email.'?'.$query;
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(QuoteRequestAttachment::class)->orderBy('sort_order');
    }
}

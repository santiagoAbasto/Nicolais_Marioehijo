<?php

namespace App\Mail;

use App\Models\ClientAccessRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClientAccessRejected extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(public ClientAccessRequest $clientRequest)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Actualización de tu solicitud de Zona Cliente',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.client-access-rejected',
            with: ['clientRequest' => $this->clientRequest],
        );
    }
}

<?php

namespace App\Mail;

use App\Models\ClientAccessRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClientPasswordResetByAdmin extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public ClientAccessRequest $clientRequest,
        public string $temporaryPassword,
        public string $loginUrl,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Nueva contraseña para Zona Cliente',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.client-password-reset-by-admin',
            with: [
                'clientRequest' => $this->clientRequest,
                'temporaryPassword' => $this->temporaryPassword,
                'loginUrl' => $this->loginUrl,
            ],
        );
    }
}

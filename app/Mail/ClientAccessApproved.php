<?php

namespace App\Mail;

use App\Models\ClientAccessRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClientAccessApproved extends Mailable
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
            subject: 'Tu acceso a Zona Cliente fue aprobado',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.client-access-approved',
            with: [
                'clientRequest' => $this->clientRequest,
                'temporaryPassword' => $this->temporaryPassword,
                'loginUrl' => $this->loginUrl,
            ],
        );
    }
}

<?php

namespace App\Mail;

use App\Models\CatalogRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CatalogRequestNotification extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public CatalogRequest $catalogRequest,
        public ?string $adminUrl = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Nueva solicitud de catálogo #'.$this->catalogRequest->id,
            replyTo: $this->catalogRequest->email
                ? [new Address($this->catalogRequest->email, $this->catalogRequest->name)]
                : [],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.catalog-request-notification',
            with: [
                'catalogRequest' => $this->catalogRequest,
                'adminUrl' => $this->adminUrl,
            ],
        );
    }
}

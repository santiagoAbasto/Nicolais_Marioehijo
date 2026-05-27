<?php

namespace App\Mail;

use App\Models\ContactRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactRequestNotification extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public ContactRequest $contactRequest,
        public ?string $adminUrl = null,
    ) {
    }

    public function envelope(): Envelope
    {
        $contactName = trim(implode(' ', array_filter([
            $this->contactRequest->first_name,
            $this->contactRequest->last_name,
        ])));

        return new Envelope(
            subject: 'Nuevo mensaje de contacto #'.$this->contactRequest->id,
            replyTo: $this->contactRequest->email
                ? [new Address($this->contactRequest->email, $contactName !== '' ? $contactName : null)]
                : [],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-request-notification',
            with: [
                'contactRequest' => $this->contactRequest,
                'adminUrl' => $this->adminUrl,
            ],
        );
    }
}

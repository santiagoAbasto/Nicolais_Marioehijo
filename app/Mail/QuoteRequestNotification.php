<?php

namespace App\Mail;

use App\Models\QuoteRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class QuoteRequestNotification extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public QuoteRequest $quoteRequest,
        public ?string $adminUrl = null,
        public ?string $mailSubject = null,
        public ?string $mailContextLabel = null,
        public ?string $mailHeading = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->mailSubject ?: 'Nueva solicitud de presupuesto #'.$this->quoteRequest->id,
            replyTo: $this->quoteRequest->email
                ? [new Address($this->quoteRequest->email, $this->quoteRequest->name)]
                : [],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.quote-request-notification',
            with: [
                'quoteRequest' => $this->quoteRequest,
                'adminUrl' => $this->adminUrl,
                'mailContextLabel' => $this->mailContextLabel,
                'mailHeading' => $this->mailHeading,
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return $this->quoteRequest->attachments
            ->map(function ($attachment) {
                $media = $attachment->media;

                if (! $media || ! $media->path) {
                    return null;
                }

                return Attachment::fromStorageDisk($media->disk ?? 'public', $media->path)
                    ->as($attachment->file_name_snapshot ?: basename($media->path))
                    ->withMime($media->mime_type ?: 'application/octet-stream');
            })
            ->filter()
            ->values()
            ->all();
    }
}

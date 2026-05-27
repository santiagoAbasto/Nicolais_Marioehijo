<?php

namespace App\Mail;

use App\Models\NewsletterSubscriber;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;

class NewsletterCampaign extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public string $campaignSubject,
        public string $campaignTitle,
        public string $campaignDescription,
        public string $campaignBody,
        public ?string $campaignImageUrl,
        public NewsletterSubscriber $subscriber,
        public string $unsubscribeUrl,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->campaignSubject,
        );
    }

    public function headers(): Headers
    {
        return new Headers(
            text: [
                'List-Unsubscribe' => '<'.$this->unsubscribeUrl.'>',
                'List-Unsubscribe-Post' => 'List-Unsubscribe=One-Click',
            ],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.newsletter-campaign',
            with: [
                'campaignSubject' => $this->campaignSubject,
                'campaignTitle' => $this->campaignTitle,
                'campaignDescription' => $this->campaignDescription,
                'campaignBody' => $this->campaignBody,
                'campaignImageUrl' => $this->campaignImageUrl,
                'subscriber' => $this->subscriber,
                'unsubscribeUrl' => $this->unsubscribeUrl,
            ],
        );
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Mail\NewsletterCampaign as NewsletterCampaignMail;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class NewsletterAdminController extends AdminPlaceholderController
{
    public function index(): Response
    {
        $subscribers = NewsletterSubscriber::query()
            ->latest()
            ->get()
            ->map(fn (NewsletterSubscriber $subscriber) => $this->serializeSubscriber($subscriber));

        $campaigns = NewsletterCampaign::query()
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (NewsletterCampaign $campaign) => [
                'id' => $campaign->id,
                'subject' => $campaign->subject,
                'sent_count' => $campaign->sent_count,
                'failed_count' => $campaign->failed_count,
                'recipient_count' => $campaign->recipient_count,
                'sent_at' => $campaign->sent_at?->format('d/m/Y H:i'),
            ]);

        return Inertia::render('Admin/Newsletter/Index', [
            'subscribers' => $subscribers,
            'campaigns' => $campaigns,
            'stats' => [
                'total' => NewsletterSubscriber::query()->count(),
                'active' => NewsletterSubscriber::query()->where('is_active', true)->count(),
                'inactive' => NewsletterSubscriber::query()->where('is_active', false)->count(),
                'mail_unsubscribed' => NewsletterSubscriber::query()
                    ->where('unsubscribe_source', 'mail_header')
                    ->count(),
            ],
        ]);
    }

    public function storeSubscriber(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:180'],
        ]);

        $subscriber = NewsletterSubscriber::query()->updateOrCreate(
            ['email' => Str::lower($data['email'])],
            [
                'is_active' => true,
                'subscribed_at' => now(),
                'unsubscribed_at' => null,
                'unsubscribe_source' => null,
                'unsubscribe_token' => Str::random(48),
            ],
        );

        return response()->json([
            'message' => 'Suscriptor dado de alta correctamente.',
            'subscriber' => $this->serializeSubscriber($subscriber->fresh()),
        ]);
    }

    public function updateSubscriber(Request $request, NewsletterSubscriber $newsletterSubscriber): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:180'],
            'is_active' => ['required', 'boolean'],
        ]);

        $newsletterSubscriber->fill([
            'email' => Str::lower($data['email']),
            'is_active' => (bool) $data['is_active'],
        ]);

        if ((bool) $data['is_active']) {
            $newsletterSubscriber->subscribed_at ??= now();
            $newsletterSubscriber->unsubscribed_at = null;
            $newsletterSubscriber->unsubscribe_source = null;
        } else {
            $newsletterSubscriber->unsubscribed_at ??= now();
            $newsletterSubscriber->unsubscribe_source = 'admin';
        }

        if (! $newsletterSubscriber->unsubscribe_token) {
            $newsletterSubscriber->unsubscribe_token = Str::random(48);
        }

        $newsletterSubscriber->save();

        return response()->json([
            'message' => 'Suscriptor actualizado correctamente.',
            'subscriber' => $this->serializeSubscriber($newsletterSubscriber->fresh()),
        ]);
    }

    public function destroySubscriber(NewsletterSubscriber $newsletterSubscriber): JsonResponse
    {
        $newsletterSubscriber->delete();

        return response()->json(['message' => 'Suscriptor eliminado correctamente.']);
    }

    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:180'],
            'title' => ['nullable', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:600'],
            'body' => ['required', 'string', 'max:12000'],
            'image' => ['nullable', 'file', 'image', 'max:5120'],
        ]);

        $subscribers = NewsletterSubscriber::query()
            ->where('is_active', true)
            ->get();

        if ($subscribers->isEmpty()) {
            return response()->json(['message' => 'No hay suscriptores activos para enviar.'], 422);
        }

        $imageUrl = null;

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $path = $file->storeAs(
                'uploads/newsletter/'.now()->format('Y/m'),
                (string) Str::uuid().'.'.($file->extension() ?: 'jpg'),
                'public'
            );

            $imageUrl = Storage::disk('public')->url($path);
        }

        $campaign = NewsletterCampaign::query()->create([
            'subject' => $data['subject'],
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? null,
            'body' => $data['body'],
            'image_url' => $imageUrl,
            'recipient_count' => $subscribers->count(),
            'sent_at' => now(),
        ]);

        $sent = 0;
        $failed = 0;

        foreach ($subscribers as $subscriber) {
            if (! $subscriber->unsubscribe_token) {
                $subscriber->forceFill(['unsubscribe_token' => Str::random(48)])->save();
            }

            try {
                Mail::to($subscriber->email)->send(new NewsletterCampaignMail(
                    campaignSubject: $data['subject'],
                    campaignTitle: (string) ($data['title'] ?? ''),
                    campaignDescription: (string) ($data['description'] ?? ''),
                    campaignBody: $data['body'],
                    campaignImageUrl: $imageUrl,
                    subscriber: $subscriber,
                    unsubscribeUrl: route('web.newsletter.unsubscribe', [
                        'subscriber' => $subscriber->id,
                        'token' => $subscriber->unsubscribe_token,
                    ]),
                ));

                $subscriber->forceFill(['last_sent_at' => now()])->save();
                $sent++;
            } catch (\Throwable $exception) {
                $failed++;

                Log::warning('Newsletter campaign email could not be sent.', [
                    'campaign_id' => $campaign->id,
                    'subscriber_id' => $subscriber->id,
                    'email' => $subscriber->email,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        $campaign->forceFill([
            'sent_count' => $sent,
            'failed_count' => $failed,
        ])->save();

        $status = $failed > 0 ? 207 : 200;

        return response()->json([
            'message' => $failed > 0
                ? "Campaña enviada a {$sent} suscriptores. Fallaron {$failed} envíos."
                : "Campaña enviada a {$sent} suscriptores.",
            'campaign' => $campaign->fresh(),
        ], $status);
    }

    private function serializeSubscriber(?NewsletterSubscriber $subscriber): ?array
    {
        if (! $subscriber) {
            return null;
        }

        return [
            'id' => $subscriber->id,
            'email' => $subscriber->email,
            'is_active' => $subscriber->is_active,
            'subscribed_at' => $subscriber->subscribed_at?->format('d/m/Y H:i'),
            'unsubscribed_at' => $subscriber->unsubscribed_at?->format('d/m/Y H:i'),
            'unsubscribe_source' => $subscriber->unsubscribe_source,
            'last_sent_at' => $subscriber->last_sent_at?->format('d/m/Y H:i'),
        ];
    }
}

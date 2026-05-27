<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NewsletterController extends Controller
{
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:180'],
        ]);

        $email = Str::lower($data['email']);
        $subscriber = NewsletterSubscriber::query()->where('email', $email)->first();

        if (! $subscriber) {
            $subscriber = NewsletterSubscriber::query()->create([
                'email' => $email,
                'is_active' => true,
                'subscribed_at' => now(),
                'unsubscribe_token' => Str::random(48),
            ]);

            $message = 'Te suscribiste correctamente.';
        } elseif ($subscriber->is_active) {
            $message = 'Ya estabas suscripto.';
        } else {
            $subscriber->forceFill([
                'is_active' => true,
                'subscribed_at' => now(),
                'unsubscribed_at' => null,
                'unsubscribe_source' => null,
                'unsubscribe_token' => $subscriber->unsubscribe_token ?: Str::random(48),
            ])->save();

            $message = 'Te dimos de alta nuevamente.';
        }

        if ($request->expectsJson()) {
            return response()->json(['message' => $message]);
        }

        return back()->with('status', $message);
    }

    public function unsubscribe(Request $request, NewsletterSubscriber $subscriber, string $token): RedirectResponse
    {
        $this->unsubscribeSubscriber($subscriber, $token, 'mail_link');

        return redirect()
            ->route('web.home')
            ->with('status', 'Te desuscribimos del newsletter correctamente.');
    }

    public function unsubscribeOneClick(Request $request, NewsletterSubscriber $subscriber, string $token): JsonResponse
    {
        $this->unsubscribeSubscriber($subscriber, $token, 'mail_header');

        return response()->json(['message' => 'Desuscripción registrada.']);
    }

    private function unsubscribeSubscriber(NewsletterSubscriber $subscriber, string $token, string $source): void
    {
        abort_unless(hash_equals((string) $subscriber->unsubscribe_token, $token), 404);

        $subscriber->forceFill([
            'is_active' => false,
            'unsubscribed_at' => now(),
            'unsubscribe_source' => $source,
        ])->save();
    }
}

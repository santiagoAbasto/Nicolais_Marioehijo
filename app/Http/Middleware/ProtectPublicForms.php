<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class ProtectPublicForms
{
    public function handle(Request $request, Closure $next): Response
    {
        $honeypotField = (string) config('security.forms.honeypot_field', 'nm_form_check');
        $honeypotValue = trim((string) $request->input($honeypotField));

        if ($honeypotValue !== '') {
            cms_security_log('warning', 'Blocked public form submission by honeypot.', [
                'type' => 'honeypot_triggered',
                'route' => $request->route()?->getName(),
                'attempted_email' => cms_email(Str::lower(trim((string) $request->input('email')))),
            ], $request);

            return $this->fakeSuccessResponse($request);
        }

        $minimumSeconds = $this->minimumSecondsForRequest($request);
        $startedAt = (int) $request->input('_form_started_at', 0);

        if ($minimumSeconds > 0 && $startedAt > 0 && (time() - $startedAt) < $minimumSeconds) {
            cms_security_log('warning', 'Blocked public form submission by suspicious speed.', [
                'type' => 'suspicious_form_speed',
                'route' => $request->route()?->getName(),
                'elapsed_seconds' => max(0, time() - $startedAt),
                'minimum_seconds' => $minimumSeconds,
                'attempted_email' => cms_email(Str::lower(trim((string) $request->input('email')))),
            ], $request);

            return $this->genericBlockResponse($request);
        }

        $email = Str::lower(trim((string) $request->input('email')));
        $key = sprintf(
            'public-form:%s:%s:%s',
            $request->route()?->getName() ?? $request->path(),
            $email !== '' ? $email : 'guest',
            $request->ip()
        );

        $maxAttempts = (int) config('security.forms.max_attempts', 5);
        $decaySeconds = (int) config('security.forms.decay_seconds', 60);

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            cms_security_log('warning', 'Blocked public form submission by form rate limiter.', [
                'type' => 'rate_limit_exceeded',
                'route' => $request->route()?->getName(),
                'attempted_email' => cms_email($email),
            ], $request);

            return $this->genericBlockResponse($request);
        }

        RateLimiter::hit($key, $decaySeconds);

        return $next($request);
    }

    protected function minimumSecondsForRequest(Request $request): int
    {
        $minimums = (array) config('security.forms.minimum_seconds', []);
        $routeName = (string) $request->route()?->getName();

        if ($routeName !== '' && array_key_exists($routeName, $minimums)) {
            return (int) $minimums[$routeName];
        }

        return (int) ($minimums[$request->path()] ?? 0);
    }

    protected function genericBlockResponse(Request $request): Response
    {
        $message = 'No pudimos procesar tu solicitud en este momento. Intenta nuevamente mas tarde.';

        if ($request->expectsJson()) {
            return response()->json(['message' => $message], 429);
        }

        throw ValidationException::withMessages([
            'email' => $message,
        ]);
    }

    protected function fakeSuccessResponse(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'ok' => true,
                'message' => 'Tu solicitud fue enviada correctamente. Te contactaremos a la brevedad.',
            ]);
        }

        return redirect()
            ->back()
            ->with('status', 'Tu solicitud fue enviada correctamente. Te contactaremos a la brevedad.')
            ->with('success', 'Tu solicitud fue enviada correctamente. Te contactaremos a la brevedad.');
    }
}

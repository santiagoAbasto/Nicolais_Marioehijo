<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

$trustedProxies = array_values(array_filter(array_map(
    static fn (string $proxy): string => trim($proxy),
    explode(',', (string) env('TRUSTED_PROXIES', ''))
)));

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) use ($trustedProxies): void {
        $middleware->trustProxies(at: $trustedProxies);
        $middleware->validateCsrfTokens(except: [
            'newsletter/desuscribirse/*',
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\ForceHttps::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\SanitizePlainTextInput::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\TrackAuthenticatedActivity::class,
            \App\Http\Middleware\TrackSiteVisits::class,
        ]);

        $middleware->alias([
            'admin.access' => \App\Http\Middleware\EnsureAdminAccess::class,
            'client.zone.access' => \App\Http\Middleware\EnsureClientZoneAccess::class,
            'public.form.protection' => \App\Http\Middleware\ProtectPublicForms::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (\Illuminate\Session\TokenMismatchException $exception): void {
            cms_security_log('warning', 'CSRF token mismatch.', [
                'type' => 'csrf_failure',
                'severity' => 'warning',
            ]);
        });

        $exceptions->report(function (\Illuminate\Auth\Access\AuthorizationException $exception): void {
            cms_security_log('warning', 'Unauthorized action blocked.', [
                'type' => 'unauthorized_access',
                'severity' => 'warning',
            ]);
        });
    })->create();

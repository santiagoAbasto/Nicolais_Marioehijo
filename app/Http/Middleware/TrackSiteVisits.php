<?php

namespace App\Http\Middleware;

use App\Models\SiteVisitLog;
use App\Models\SiteVisitSession;
use App\Support\SiteVisitAnalytics;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class TrackSiteVisits
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $this->shouldTrack($request, $response)) {
            return $response;
        }

        try {
            if (! Schema::hasTable((new SiteVisitLog())->getTable())) {
                return $response;
            }

            $context = SiteVisitAnalytics::resolveRouteContext($request);
            $country = SiteVisitAnalytics::resolveCountry($request);
            $client = SiteVisitAnalytics::parseClient($request->userAgent());

            if (Schema::hasTable((new SiteVisitSession())->getTable())) {
                $now = now();
                $existingSession = SiteVisitSession::query()
                    ->where('session_id', $request->session()->getId())
                    ->first();

                SiteVisitSession::query()->updateOrCreate(
                    ['session_id' => $request->session()->getId()],
                    [
                        ...$context,
                        ...$country,
                        ...$client,
                        'visitor_key' => SiteVisitAnalytics::visitorKey($request),
                        'status' => 'active',
                        'first_seen_at' => $existingSession?->first_seen_at ?: $now,
                        'last_seen_at' => $now,
                        'left_at' => null,
                        'path' => '/'.ltrim($request->path(), '/'),
                        'ip_address' => $request->ip(),
                    ]
                );
            }

            $dedupeKey = 'site_visit:'.sha1(implode('|', [
                $context['page_key'] ?? $request->path(),
                $request->session()->getId(),
            ]));
            $lastTrackedAt = (int) $request->session()->get($dedupeKey, 0);

            if ($lastTrackedAt > 0 && now()->timestamp - $lastTrackedAt < 600) {
                return $response;
            }

            $request->session()->put($dedupeKey, now()->timestamp);

            SiteVisitLog::query()->create([
                ...$context,
                ...$country,
                ...$client,
                'path' => '/'.ltrim($request->path(), '/'),
                'full_url' => $request->fullUrl(),
                'session_id' => $request->session()->getId(),
                'visitor_key' => SiteVisitAnalytics::visitorKey($request),
                'ip_address' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 2000) ?: null,
                'accept_language' => substr((string) $request->header('Accept-Language'), 0, 255) ?: null,
                'referrer' => substr((string) $request->headers->get('referer'), 0, 1000) ?: null,
            ]);
        } catch (\Throwable) {
            // La analítica no debe romper la experiencia pública.
        }

        return $response;
    }

    protected function shouldTrack(Request $request, Response $response): bool
    {
        $routeName = $request->route()?->getName();
        $contentType = (string) $response->headers->get('Content-Type', '');

        if (! in_array($request->method(), ['GET', 'HEAD'], true)) {
            return false;
        }

        if (! is_string($routeName) || ! str_starts_with($routeName, 'web.')) {
            return false;
        }

        if (in_array($routeName, ['web.search.suggest'], true)) {
            return false;
        }

        if ($request->expectsJson() || $request->ajax()) {
            return false;
        }

        if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 400) {
            return false;
        }

        if ($contentType !== '' && ! str_contains($contentType, 'text/html')) {
            return false;
        }

        if (SiteVisitAnalytics::isBot($request->userAgent())) {
            return false;
        }

        return true;
    }
}

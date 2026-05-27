<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\SiteVisitSession;
use App\Support\SiteVisitAnalytics;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class SitePresenceController extends Controller
{
    public function heartbeat(Request $request): JsonResponse
    {
        $this->touch($request, 'active');

        return response()->json(['ok' => true]);
    }

    public function leave(Request $request): JsonResponse
    {
        $this->touch($request, 'left');

        return response()->json(['ok' => true]);
    }

    protected function touch(Request $request, string $status): void
    {
        if (! Schema::hasTable((new SiteVisitSession())->getTable())) {
            return;
        }

        $context = SiteVisitAnalytics::resolveRouteContext($request);
        $country = SiteVisitAnalytics::resolveCountry($request);
        $client = SiteVisitAnalytics::parseClient($request->userAgent());
        $now = now();

        $existing = SiteVisitSession::query()
            ->where('session_id', $request->session()->getId())
            ->first();

        SiteVisitSession::query()->updateOrCreate(
            ['session_id' => $request->session()->getId()],
            [
                ...($existing ? [
                    'route_name' => $existing->route_name ?? $context['route_name'],
                    'page_key' => $existing->page_key ?? $context['page_key'],
                    'section_key' => $existing->section_key ?? $context['section_key'],
                    'section_label' => $existing->section_label ?? $context['section_label'],
                    'page_label' => $existing->page_label ?? $context['page_label'],
                    'route_params_json' => $existing->route_params_json ?? $context['route_params_json'],
                ] : $context),
                ...$country,
                ...$client,
                'visitor_key' => SiteVisitAnalytics::visitorKey($request),
                'status' => $status,
                'first_seen_at' => $existing?->first_seen_at ?: $now,
                'last_seen_at' => $now,
                'left_at' => $status === 'left' ? $now : null,
                'path' => '/'.ltrim((string) $request->input('path', $request->path()), '/'),
                'ip_address' => $request->ip(),
            ]
        );
    }
}

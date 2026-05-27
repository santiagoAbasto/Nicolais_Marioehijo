<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class TrackAuthenticatedActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        $this->touchUser($request->user());
        $this->touchUser($request->user('admin'));

        return $next($request);
    }

    private function touchUser(mixed $user): void
    {
        if (! $user || ! method_exists($user, 'forceFill')) {
            return;
        }

        if (! Schema::hasColumn($user->getTable(), 'last_seen_at')) {
            return;
        }

        $cacheKey = 'user-last-seen:'.$user->getKey();

        if (Cache::has($cacheKey)) {
            return;
        }

        Cache::put($cacheKey, true, now()->addMinute());

        $user->forceFill(['last_seen_at' => now()])->saveQuietly();
    }
}

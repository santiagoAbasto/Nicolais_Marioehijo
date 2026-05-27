<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceHttps
{
    /**
     * Redirect HTTP requests to HTTPS in production.
     *
     * In local/testing environments this middleware is a no-op so that
     * development servers without TLS continue to work normally.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->isSecure() && app()->environment('production')) {
            return redirect()->secure($request->getRequestUri(), 301);
        }

        return $next($request);
    }
}

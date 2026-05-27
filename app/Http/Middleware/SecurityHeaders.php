<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        // Generate a cryptographic nonce per request for CSP.
        $nonce = base64_encode(random_bytes(16));
        $request->attributes->set('csp-nonce', $nonce);
        Vite::useCspNonce($nonce);

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('Content-Security-Policy', $this->contentSecurityPolicy($nonce));
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-XSS-Protection', '0');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-origin');
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');
        $response->headers->set('Origin-Agent-Cluster', '?1');

        if ($request->isSecure() && app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        return $response;
    }

    protected function contentSecurityPolicy(string $nonce): string
    {
        $viteOrigins = $this->viteOrigins();
        $isProduction = app()->environment('production');

        // -------------------------------------------------------------------
        // In production we use the per-request nonce for both scripts and
        // styles — only elements we explicitly mark can execute.
        //
        // In development Vite + @vitejs/plugin-react injects inline scripts
        // (React Fast Refresh preamble) and inline <style> tags that cannot
        // carry a nonce, so we fall back to 'unsafe-inline' in dev only.
        // -------------------------------------------------------------------
        if ($isProduction) {
            $scriptSrc = array_merge(["'self'", "'nonce-{$nonce}'"], $viteOrigins);
            $styleSrc  = array_merge(["'self'", "'nonce-{$nonce}'", 'https:'], $viteOrigins);
        } else {
            $scriptSrc = array_merge(["'self'", "'unsafe-inline'"], $viteOrigins);
            $styleSrc  = array_merge(["'self'", "'unsafe-inline'", 'https:'], $viteOrigins);
        }

        $connectSrc = array_merge(["'self'", 'https:'], $viteOrigins, ['ws:', 'wss:']);
        $imgSrc = array_merge(["'self'", 'data:', 'blob:', 'https:'], $viteOrigins);

        $directives = [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "script-src-attr 'none'",
            'img-src ' . implode(' ', array_unique($imgSrc)),
            'font-src \'self\' data: https:',
            'media-src \'self\' data: blob: https:',
            'frame-src \'self\' https://view.officeapps.live.com https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://www.google.com/maps https://maps.google.com',
            'script-src ' . implode(' ', array_unique($scriptSrc)),
            'style-src ' . implode(' ', array_unique($styleSrc)),
            'connect-src ' . implode(' ', array_unique($connectSrc)),
        ];

        return implode('; ', $directives);
    }

    /**
     * @return array<int, string>
     */
    protected function viteOrigins(): array
    {
        $hotFile = public_path('hot');

        if (! is_file($hotFile)) {
            return [];
        }

        $origin = trim((string) file_get_contents($hotFile));

        return $origin === '' ? [] : [$origin];
    }
}

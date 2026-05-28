<?php

use App\Support\CmsSecurity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

if (! function_exists('cms_sanitize_string')) {
    function cms_sanitize_string(?string $value, array $allowedTags = []): ?string
    {
        return CmsSecurity::sanitizeString($value, $allowedTags);
    }
}

if (! function_exists('cms_sanitize_array')) {
    function cms_sanitize_array(mixed $value, array $allowedTags = []): mixed
    {
        return CmsSecurity::sanitizeArray($value, $allowedTags);
    }
}

if (! function_exists('cms_plain_text')) {
    function cms_plain_text(?string $value): ?string
    {
        return CmsSecurity::plainText($value);
    }
}

if (! function_exists('cms_rich_text')) {
    function cms_rich_text(?string $value): ?string
    {
        return CmsSecurity::richText($value);
    }
}

if (! function_exists('cms_email')) {
    function cms_email(?string $value): ?string
    {
        return CmsSecurity::normalizeEmail($value);
    }
}

if (! function_exists('cms_phone')) {
    function cms_phone(?string $value): ?string
    {
        return CmsSecurity::normalizePhone($value);
    }
}

if (! function_exists('cms_ip_fingerprint')) {
    function cms_ip_fingerprint(?string $value): ?string
    {
        return CmsSecurity::ipFingerprint($value);
    }
}

if (! function_exists('cms_media_url')) {
    function cms_media_url(?string $path, ?string $baseUrl = null): ?string
    {
        $path = trim((string) $path);

        if ($path === '') {
            return null;
        }

        if (preg_match('~^https?://~i', $path) === 1) {
            return $path;
        }

        $relativePath = route('media.show', ['path' => $path], false);

        if (! $baseUrl) {
            return $relativePath;
        }

        return rtrim($baseUrl, '/').$relativePath;
    }
}

if (! function_exists('media_asset_url')) {
    function media_asset_url(mixed $asset, ?string $baseUrl = null): ?string
    {
        if (! $asset) {
            return null;
        }

        if (is_string($asset)) {
            return cms_media_url($asset, $baseUrl);
        }

        $path = $asset->path ?? null;
        $isExternalUrl = is_string($path) && preg_match('~^https?://~i', $path) === 1;
        $disk = $asset->disk ?? 'public';

        if ($disk === 'public' && is_string($path) && $path !== '' && ! $isExternalUrl) {
            $relativePath = '/storage/'.ltrim($path, '/');
            $url = $baseUrl ? rtrim($baseUrl, '/').$relativePath : asset(ltrim($relativePath, '/'));
        } else {
            $url = cms_media_url($path, $baseUrl);
        }

        if (! $url || ! $path) {
            return $url;
        }

        $version = null;

        try {
            if (\Illuminate\Support\Facades\Storage::disk($disk)->exists($path)) {
                $version = \Illuminate\Support\Facades\Storage::disk($disk)->lastModified($path);
            }
        } catch (\Throwable) {
            $version = null;
        }

        if (! $version && isset($asset->updated_at) && $asset->updated_at) {
            $version = $asset->updated_at->timestamp;
        }

        if (! $version) {
            return $url;
        }

        if ($isExternalUrl) {
            $separator = str_contains($url, '?') ? '&' : '?';

            return $url.$separator.'v='.$version;
        }

        return $url.'?v='.$version;
    }
}

if (! function_exists('cms_media_asset_by_path')) {
    function cms_media_asset_by_path(string $path): ?\App\Models\MediaAsset
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('media_assets')) {
            return null;
        }

        return \App\Models\MediaAsset::query()->where('path', $path)->first();
    }
}

if (! function_exists('cms_branding_logo_path')) {
    function cms_branding_logo_path(string $slot): string
    {
        return match ($slot) {
            'home_header' => 'uploads/branding/logo-header-home.svg',
            'footer' => 'uploads/branding/logo-footer.svg',
            default => 'uploads/branding/logo-secciones.svg',
        };
    }
}

if (! function_exists('cms_branding_logo_asset')) {
    function cms_branding_logo_asset(string $slot = 'sections_header'): ?\App\Models\MediaAsset
    {
        return cms_media_asset_by_path(cms_branding_logo_path($slot));
    }
}

if (! function_exists('cms_public_app_url')) {
    function cms_public_app_url(): string
    {
        $configuredUrl = trim((string) config('app.public_url', config('app.url')));

        if ($configuredUrl !== '') {
            return rtrim($configuredUrl, '/');
        }

        return 'http://localhost';
    }
}

if (! function_exists('cms_admin_login_url')) {
    function cms_admin_login_url(): string
    {
        return cms_public_app_url().'/admin/login';
    }
}

if (! function_exists('media_asset_email_src')) {
    function media_asset_email_src(mixed $asset, int $maxInlineBytes = 5242880): ?string
    {
        if (! $asset) {
            return null;
        }

        if (is_string($asset)) {
            return cms_media_url($asset, cms_public_app_url());
        }

        $path = $asset->path ?? null;
        $disk = $asset->disk ?? 'public';
        $mimeType = $asset->mime_type ?? null;

        if (! $path) {
            return null;
        }

        try {
            $storage = \Illuminate\Support\Facades\Storage::disk($disk);

            if ($mimeType && str_starts_with($mimeType, 'image/') && $storage->exists($path)) {
                $size = (int) ($storage->size($path) ?? 0);

                if ($size > 0 && $size <= $maxInlineBytes) {
                    $contents = $storage->get($path);

                    if ($contents !== '') {
                        return 'data:'.$mimeType.';base64,'.base64_encode($contents);
                    }
                }
            }
        } catch (\Throwable) {
            // Fallback below to externally reachable URL.
        }

        return media_asset_url($asset, cms_public_app_url());
    }
}

if (! function_exists('default_seo_image_url')) {
    function default_seo_image_url(): ?string
    {
        foreach ([
            'favicon/web-app-manifest-512x512.png',
            'favicon/web-app-manifest-192x192.png',
            'favicon/apple-touch-icon.png',
        ] as $relativePath) {
            if (file_exists(public_path($relativePath))) {
                return cms_public_app_url().'/'.$relativePath;
            }
        }

        foreach ([
            cms_branding_logo_path('home_header'),
            cms_branding_logo_path('sections_header'),
            cms_branding_logo_path('footer'),
            'brand/logo.svg',
            'brand/logofo.svg',
        ] as $brandingPath) {
            $asset = cms_media_asset_by_path($brandingPath);

            if ($asset) {
                return media_asset_url($asset, cms_public_app_url());
            }
        }

        foreach ([
            'storage/brand/logo.svg',
            'storage/brand/logofo.svg',
        ] as $relativePath) {
            if (file_exists(public_path($relativePath))) {
                return cms_public_app_url().'/'.$relativePath;
            }
        }

        $relativePath = 'images/admin/logo.png';

        if (! file_exists(public_path($relativePath))) {
            return null;
        }

        return cms_public_app_url().'/'.$relativePath;
    }
}

if (! function_exists('cms_map_iframe')) {
    function cms_map_iframe(?string $value): ?string
    {
        return CmsSecurity::sanitizeGoogleMapsIframe($value);
    }
}

if (! function_exists('cms_security_context')) {
    function cms_security_context(?Request $request = null, array $context = []): array
    {
        $request ??= request();

        if (! $request instanceof Request) {
            return $context;
        }

        $user = $request->user();

        return array_filter(array_merge([
            'user_id' => $user?->id,
            'user_email' => $user?->email ? cms_email((string) $user->email) : null,
            'ip_fingerprint' => cms_ip_fingerprint($request->ip()),
            'method' => $request->method(),
            'path' => $request->path(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255) ?: null,
        ], $context), static fn ($value) => $value !== null && $value !== '');
    }
}

if (! function_exists('cms_security_log')) {
    function cms_security_log(string $level, string $message, array $context = [], ?Request $request = null): void
    {
        $payload = cms_security_context($request, $context);
        $allowedLevels = ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug'];

        if (! in_array($level, $allowedLevels, true)) {
            $level = 'info';
        }

        Log::{$level}($message, $payload);

        try {
            if (Schema::hasTable('security_events')) {
                \App\Models\SecurityEvent::query()->create([
                    'user_id' => $payload['user_id'] ?? null,
                    'ip_fingerprint' => $payload['ip_fingerprint'] ?? null,
                    'user_agent' => $payload['user_agent'] ?? null,
                    'route' => $payload['route'] ?? null,
                    'path' => $payload['path'] ?? null,
                    'method' => $payload['method'] ?? null,
                    'type' => $context['type'] ?? str($message)->lower()->replaceMatches('/[^a-z0-9]+/', '_')->trim('_')->limit(80, '')->toString(),
                    'severity' => $level,
                    'payload' => collect($payload)
                        ->except(['user_id', 'ip_fingerprint', 'user_agent', 'route', 'path', 'method'])
                        ->all(),
                ]);
            }
        } catch (\Throwable $exception) {
            Log::debug('Security event could not be persisted.', [
                'error' => $exception->getMessage(),
            ]);
        }
    }
}

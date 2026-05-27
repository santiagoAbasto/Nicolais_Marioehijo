<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class CmsSecurity
{
    /**
     * Tags permitidas para rich text del CMS.
     *
     * @var array<int, string>
     */
    protected const ALLOWED_RICH_TEXT_TAGS = [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li',
        'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'span',
    ];

    /**
     * Hosts permitidos para mapas embebidos.
     *
     * @var array<int, string>
     */
    protected const ALLOWED_MAP_HOSTS = [
        'www.google.com',
        'google.com',
        'maps.google.com',
        'www.google.com.ar',
        'google.com.ar',
    ];

    /**
     * @return array<int, string>
     */
    public static function safeImageExtensions(): array
    {
        return array_values(array_unique(
            config('security.uploads.page_media.image_mimes', ['jpg', 'jpeg', 'png', 'webp', 'gif'])
        ));
    }

    /**
     * @return array<int, string>
     */
    public static function safeImageMimeTypes(): array
    {
        return array_values(array_unique(
            config('security.uploads.page_media.image_mimetypes', ['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
        ));
    }

    /**
     * @return array<int, string>
     */
    public static function safeDocumentExtensions(): array
    {
        return array_values(array_unique(
            config('security.uploads.page_media.document_mimes', ['pdf'])
        ));
    }

    /**
     * @return array<int, string>
     */
    public static function safeDocumentMimeTypes(): array
    {
        return array_values(array_unique(
            config('security.uploads.page_media.document_mimetypes', ['application/pdf'])
        ));
    }

    /**
     * @return array<int, string>
     */
    public static function safeVideoExtensions(): array
    {
        return array_values(array_unique(
            config('security.uploads.page_media.video_extensions', ['mp4', 'webm', 'ogg', 'mov'])
        ));
    }

    /**
     * @return array<int, string>
     */
    public static function safeVideoMimeTypes(): array
    {
        return array_values(array_unique(
            config('security.uploads.page_media.video_mimetypes', ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'])
        ));
    }

    /**
     * @return array<int, string>
     */
    public static function safeOfficeExtensions(): array
    {
        return array_values(array_unique(
            config('security.uploads.page_media.office_mimes', ['doc', 'docx', 'xls', 'xlsx', 'csv'])
        ));
    }

    /**
     * @return array<int, string>
     */
    public static function safeOfficeMimeTypes(): array
    {
        return array_values(array_unique(
            config('security.uploads.page_media.office_mimetypes', [
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/csv',
                'text/plain',
            ])
        ));
    }

    /**
     * @return array<int, string>
     */
    public static function publicAttachmentExtensions(): array
    {
        return array_values(array_unique(array_merge(
            self::safeDocumentExtensions(),
            self::safeImageExtensions(),
            self::safeOfficeExtensions(),
        )));
    }

    /**
     * @return array<int, string>
     */
    public static function publicAttachmentMimeTypes(): array
    {
        return array_values(array_unique(array_merge(
            self::safeDocumentMimeTypes(),
            self::safeImageMimeTypes(),
            self::safeOfficeMimeTypes(),
            self::safeVideoMimeTypes(),
        )));
    }

    /**
     * @return array<int, string>
     */
    public static function priceListExtensions(): array
    {
        return ['pdf', 'xlsx', 'xls', 'csv'];
    }

    /**
     * @return array<int, string>
     */
    public static function priceListMimeTypes(): array
    {
        return array_values(array_unique(array_merge(
            self::safeDocumentMimeTypes(),
            self::safeOfficeMimeTypes(),
        )));
    }

    /**
     * @return array<int, string>
     */
    public static function mediaLibraryExtensions(): array
    {
        return array_values(array_unique(array_merge(
            self::safeImageExtensions(),
            self::safeDocumentExtensions(),
            self::safeVideoExtensions(),
        )));
    }

    /**
     * @return array<int, string>
     */
    public static function mediaLibraryMimeTypes(): array
    {
        return array_values(array_unique(array_merge(
            self::safeImageMimeTypes(),
            self::safeDocumentMimeTypes(),
            self::safeVideoMimeTypes(),
        )));
    }

    public static function safeStoredFilename(UploadedFile $file): string
    {
        $extension = strtolower((string) ($file->extension() ?: $file->getClientOriginalExtension()));
        $extension = preg_replace('/[^a-z0-9]/', '', $extension) ?: 'bin';

        return (string) Str::uuid().'.'.$extension;
    }

    public static function sanitizeString(?string $value, array $allowedTags = []): ?string
    {
        if ($value === null) {
            return null;
        }

        $allowed = '';
        foreach ($allowedTags as $tag) {
            $allowed .= '<' . trim($tag, '<> ') . '>';
        }

        $clean = strip_tags($value, $allowed);
        $clean = preg_replace('/\s+on\w+="[^"]*"/i', '', $clean);
        $clean = preg_replace("/\s+on\w+='[^']*'/i", '', $clean);
        $clean = preg_replace('/javascript\s*:/i', '', $clean);

        return trim((string) $clean);
    }

    public static function sanitizeArray(mixed $value, array $allowedTags = []): mixed
    {
        if (is_array($value)) {
            $sanitized = [];

            foreach ($value as $key => $item) {
                $sanitized[$key] = self::sanitizeArray($item, $allowedTags);
            }

            return $sanitized;
        }

        if (is_string($value)) {
            return self::sanitizeString($value, $allowedTags);
        }

        return $value;
    }

    public static function plainText(?string $value): ?string
    {
        return self::sanitizeString($value, []);
    }

    public static function richText(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        $html = trim($html);

        if ($html === '') {
            return '';
        }

        $html = preg_replace('#<(script|style|iframe|object|embed|form|input|button|textarea|select|option|link|meta)[^>]*>.*?</\1>#is', '', $html);
        $html = preg_replace('#<(script|style|iframe|object|embed|form|input|button|textarea|select|option|link|meta)[^>]*/?>#is', '', $html);

        $allowed = '<' . implode('><', self::ALLOWED_RICH_TEXT_TAGS) . '>';
        $html = strip_tags($html, $allowed);

        $html = preg_replace_callback('/<([a-z0-9]+)([^>]*)>/i', static function (array $matches): string {
            $tag = strtolower($matches[1]);
            $attrs = $matches[2] ?? '';

            if ($tag !== 'a') {
                return "<{$tag}>";
            }

            preg_match_all('/([a-z0-9_:-]+)\s*=\s*("|\')(.*?)\2/i', $attrs, $attrMatches, PREG_SET_ORDER);

            $safeAttrs = [];

            foreach ($attrMatches as $attrMatch) {
                $name = strtolower($attrMatch[1]);
                $value = trim($attrMatch[3]);

                if (str_starts_with($name, 'on') || str_starts_with($name, 'data-') || $name === 'style') {
                    continue;
                }

                if ($name === 'href') {
                    $href = self::sanitizeUrl($value, allowRelative: true);

                    if ($href !== null) {
                        $safeAttrs[] = 'href="' . e($href) . '"';
                    }

                    continue;
                }

                if ($name === 'target' && in_array($value, ['_blank', '_self'], true)) {
                    $safeAttrs[] = 'target="' . e($value) . '"';
                    continue;
                }

                if ($name === 'rel') {
                    $safeAttrs[] = 'rel="noopener noreferrer"';
                }
            }

            $hasBlankTarget = str_contains(implode(' ', $safeAttrs), 'target="_blank"');
            $hasRel = str_contains(implode(' ', $safeAttrs), 'rel=');

            if ($hasBlankTarget && ! $hasRel) {
                $safeAttrs[] = 'rel="noopener noreferrer"';
            }

            return '<a' . (empty($safeAttrs) ? '' : ' ' . implode(' ', $safeAttrs)) . '>';
        }, $html);

        $html = preg_replace('/(<[^>]+?)  +/s', '$1 ', $html);

        return trim((string) $html);
    }

    public static function normalizeEmail(?string $email): ?string
    {
        $email = trim((string) $email);

        return $email === '' ? null : strtolower($email);
    }

    public static function normalizePhone(?string $phone): ?string
    {
        $phone = preg_replace('/[^\d\+\-\(\)\s]/', '', trim((string) $phone));
        $phone = preg_replace('/\s+/', ' ', (string) $phone);
        $phone = trim((string) $phone);

        return $phone === '' ? null : $phone;
    }

    public static function ipFingerprint(?string $ip): ?string
    {
        $ip = trim((string) $ip);

        if ($ip === '') {
            return null;
        }

        return hash_hmac('sha256', $ip, (string) config('app.key', 'nicolais-mario-e-hijo'));
    }

    public static function sanitizeUrl(?string $url, bool $allowRelative = false): ?string
    {
        $url = trim((string) $url);

        if ($url === '') {
            return null;
        }

        if ($allowRelative && preg_match('~^(?:/|#)~', $url)) {
            return $url;
        }

        if (! filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https', 'mailto', 'tel'], true) ? $url : null;
    }

    public static function sanitizeGoogleMapsIframe(?string $html): ?string
    {
        $html = trim((string) $html);

        if ($html === '') {
            return null;
        }

        if (! preg_match('/<iframe\b([^>]*)>/i', $html, $matches)) {
            return null;
        }

        $attributes = $matches[1] ?? '';

        preg_match_all('/([a-z0-9_:-]+)\s*=\s*("|\')(.*?)\2/i', $attributes, $attrMatches, PREG_SET_ORDER);

        $parsed = [];

        foreach ($attrMatches as $attribute) {
            $parsed[strtolower($attribute[1])] = trim($attribute[3]);
        }

        $src = self::sanitizeUrl($parsed['src'] ?? null);

        if ($src === null || ! self::isAllowedGoogleMapsUrl($src)) {
            return null;
        }

        $width = preg_match('/^\d{2,4}$/', (string) ($parsed['width'] ?? '')) ? $parsed['width'] : '600';
        $height = preg_match('/^\d{2,4}$/', (string) ($parsed['height'] ?? '')) ? $parsed['height'] : '450';
        $loading = in_array(($parsed['loading'] ?? 'lazy'), ['lazy', 'eager'], true) ? ($parsed['loading'] ?? 'lazy') : 'lazy';
        $referrerPolicy = in_array(($parsed['referrerpolicy'] ?? 'no-referrer-when-downgrade'), [
            'no-referrer',
            'no-referrer-when-downgrade',
            'origin',
            'origin-when-cross-origin',
            'same-origin',
            'strict-origin',
            'strict-origin-when-cross-origin',
            'unsafe-url',
        ], true) ? ($parsed['referrerpolicy'] ?? 'no-referrer-when-downgrade') : 'no-referrer-when-downgrade';

        return sprintf(
            '<iframe src="%s" width="%s" height="%s" style="border:0;" allowfullscreen="" loading="%s" referrerpolicy="%s"></iframe>',
            e($src),
            e((string) $width),
            e((string) $height),
            e((string) $loading),
            e((string) $referrerPolicy)
        );
    }

    protected static function isAllowedGoogleMapsUrl(string $url): bool
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        $path = strtolower((string) parse_url($url, PHP_URL_PATH));

        if (! in_array($host, self::ALLOWED_MAP_HOSTS, true)) {
            return false;
        }

        return str_contains($path, '/maps');
    }

    public static function isSafeInlineMime(?string $mimeType): bool
    {
        $mimeType = strtolower(trim((string) $mimeType));

        if ($mimeType === '') {
            return false;
        }

        return in_array($mimeType, array_map('strtolower', self::publicAttachmentMimeTypes()), true);
    }

    public static function mediaAssetTypeForMime(?string $mimeType): string
    {
        $mimeType = strtolower(trim((string) $mimeType));

        if (in_array($mimeType, array_map('strtolower', self::safeVideoMimeTypes()), true)) {
            return 'video';
        }

        if (in_array($mimeType, array_map('strtolower', self::safeDocumentMimeTypes()), true)) {
            return 'file';
        }

        return 'image';
    }
}

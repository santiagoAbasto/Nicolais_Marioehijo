<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizePlainTextInput
{
    /**
     * @var array<int, string>
     */
    private array $sensitiveKeys = [
        '_token',
        '_method',
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'remember',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->shouldSkip($request)) {
            return $next($request);
        }

        $input = $request->request->all();

        if ($input !== []) {
            $request->merge($this->sanitizeArray($input, $request));
        }

        return $next($request);
    }

    private function shouldSkip(Request $request): bool
    {
        return $request->is('admin/*');
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    private function sanitizeArray(array $input, Request $request, string $prefix = ''): array
    {
        $sanitized = [];

        foreach ($input as $key => $value) {
            $fullKey = $prefix === '' ? (string) $key : $prefix.'.'.$key;

            if (in_array((string) $key, $this->sensitiveKeys, true)) {
                $sanitized[$key] = $value;
                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeArray($value, $request, $fullKey);
                continue;
            }

            if (! is_string($value)) {
                $sanitized[$key] = $value;
                continue;
            }

            $clean = cms_plain_text($value);

            if ($this->looksSuspicious($value, (string) $clean)) {
                cms_security_log('warning', 'Sanitized suspicious plain text input.', [
                    'type' => 'xss_attempt',
                    'field' => $fullKey,
                ], $request);
            }

            $sanitized[$key] = $clean;
        }

        return $sanitized;
    }

    private function looksSuspicious(string $original, string $clean): bool
    {
        if ($original !== $clean && preg_match('/<[^>]+>|javascript\s*:|on\w+\s*=|data\s*:/i', $original)) {
            return true;
        }

        return preg_match('/<(script|iframe|object|embed|svg)\b|javascript\s*:|on(error|load|click)\s*=/i', $original) === 1;
    }
}

<?php

namespace App\Services\Catalog\Imports;

use Illuminate\Support\Str;

class CatalogImportNormalizer
{
    public function normalizeHeading(string $value): string
    {
        $normalized = Str::of($value)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->toString();

        return $normalized;
    }

    public function normalizeText(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = Str::of($value)
            ->ascii()
            ->lower()
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->toString();

        return $normalized !== '' ? $normalized : null;
    }

    public function toBool(mixed $value): bool
    {
        $normalized = $this->normalizeText((string) $value);

        return in_array($normalized, ['1', 'true', 'si', 'yes', 'y', 'x', 'verdadero'], true);
    }

    public function toDecimal(mixed $value): ?float
    {
        if ($value === null) {
            return null;
        }

        $string = trim((string) $value);

        if ($string === '') {
            return null;
        }

        $normalized = str_replace(',', '.', preg_replace('/[^0-9,.\-]/', '', $string) ?? '');

        return is_numeric($normalized) ? (float) $normalized : null;
    }
}

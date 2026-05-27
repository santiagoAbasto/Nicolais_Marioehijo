<?php

namespace App\Support;

class SortOrder
{
    public static function normalize(mixed $value, int $fallbackPosition = 1): string
    {
        if (is_int($value) || (is_string($value) && preg_match('/^\d+$/', trim($value)) === 1)) {
            return self::fromPosition(max(1, (int) $value));
        }

        if (is_string($value)) {
            $normalized = strtoupper(trim($value));

            if ($normalized !== '' && preg_match('/^[A-Z]{1,16}$/', $normalized) === 1) {
                return $normalized;
            }
        }

        return self::fromPosition($fallbackPosition);
    }

    public static function fromPosition(int $position): string
    {
        $position = max(1, $position);
        $group = intdiv($position - 1, 27);
        $offset = ($position - 1) % 27;

        if ($group < 26) {
            $prefix = chr(65 + $group);

            return $offset === 0 ? $prefix : $prefix.chr(64 + $offset);
        }

        $prefix = self::excelLetters($group + 1);

        return $offset === 0 ? $prefix : $prefix.chr(64 + $offset);
    }

    public static function next(iterable $values): string
    {
        $maxPosition = 0;

        foreach ($values as $value) {
            $position = self::toPosition($value);

            if ($position !== null) {
                $maxPosition = max($maxPosition, $position);
            }
        }

        return self::fromPosition($maxPosition + 1);
    }

    public static function toPosition(mixed $value): ?int
    {
        if (is_int($value) || (is_string($value) && preg_match('/^\d+$/', trim($value)) === 1)) {
            return max(1, (int) $value);
        }

        if (! is_string($value)) {
            return null;
        }

        $normalized = strtoupper(trim($value));

        if ($normalized === '' || preg_match('/^[A-Z]+$/', $normalized) !== 1) {
            return null;
        }

        if (strlen($normalized) === 1) {
            return ((ord($normalized) - 65) * 27) + 1;
        }

        if (strlen($normalized) === 2) {
            return ((ord($normalized[0]) - 65) * 27) + (ord($normalized[1]) - 64) + 1;
        }

        return null;
    }

    protected static function excelLetters(int $index): string
    {
        $letters = '';

        while ($index > 0) {
            $index--;
            $letters = chr(65 + ($index % 26)).$letters;
            $index = intdiv($index, 26);
        }

        return $letters;
    }
}

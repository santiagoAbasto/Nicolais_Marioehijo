<?php

namespace App\Support;

class CmsOrder
{
    public static function labelForIndex(int $index): string
    {
        if ($index <= 0) {
            return 'A';
        }

        $block = intdiv($index, 27);
        $offset = $index % 27;

        $prefix = chr(65 + $block);

        if ($offset === 0) {
            return $prefix;
        }

        return $prefix . chr(64 + $offset);
    }

    public static function compare(?string $left, ?string $right): int
    {
        $leftSegments = self::segments($left);
        $rightSegments = self::segments($right);
        $max = max(count($leftSegments), count($rightSegments));

        for ($index = 0; $index < $max; $index++) {
            $leftValue = $leftSegments[$index] ?? 0;
            $rightValue = $rightSegments[$index] ?? 0;

            if ($leftValue === $rightValue) {
                continue;
            }

            return $leftValue <=> $rightValue;
        }

        return 0;
    }

    public static function next(?string $value): string
    {
        $letters = preg_replace('/[^A-Z]/', '', strtoupper(trim((string) $value)));

        if ($letters === '') {
            return 'A';
        }

        if (strlen($letters) === 1) {
            return $letters . 'A';
        }

        $prefix = substr($letters, 0, -1);
        $last = substr($letters, -1);

        if ($last !== 'Z') {
            return $prefix . chr(ord($last) + 1);
        }

        $nextPrefix = strlen($prefix) === 1 ? $prefix : self::next($prefix);

        return strlen($nextPrefix) === 1 ? $nextPrefix : $nextPrefix . 'A';
    }

    public static function segments(?string $value): array
    {
        $value = strtoupper(trim((string) $value));

        if ($value === '') {
            return [0];
        }

        $letters = preg_replace('/[^A-Z]/', '', $value);

        if ($letters === '') {
            return [0];
        }

        return array_map(
            static fn (string $char): int => ord($char) - 64,
            str_split($letters)
        );
    }
}

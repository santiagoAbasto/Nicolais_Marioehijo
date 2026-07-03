<?php

namespace App\Support;

use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ProductVehicleOptions
{
    protected const KNOWN_BRANDS = [
        'Alfa Romeo',
        'Audi',
        'BMW',
        'Chevrolet',
        'Citroen',
        'Citroën',
        'Citoen',
        'Dodge',
        'Fiat',
        'Ford',
        'Honda',
        'Hyundai',
        'Iveco',
        'Kia',
        'Land Rover',
        'Mercedes Benz',
        'Mercedes-Benz',
        'Mini',
        'Mitsubishi',
        'Nissan',
        'Peugeot',
        'Renault',
        'Scania',
        'Seat',
        'Suzuki',
        'Toyota',
        'Volkswagen',
        'Volvo',
        'VW',
    ];

    public static function brands(): Collection
    {
        return self::entries()
            ->pluck('brand')
            ->unique(fn (string $brand): string => Str::lower($brand))
            ->sort(SORT_NATURAL | SORT_FLAG_CASE)
            ->values();
    }

    public static function models(?string $brand = null): Collection
    {
        $entries = self::entries();

        if ($brand) {
            $entries = $entries->filter(
                fn (array $entry): bool => Str::lower($entry['brand']) === Str::lower($brand)
            );
        }

        return $entries
            ->pluck('model')
            ->filter()
            ->unique(fn (string $model): string => Str::lower($model))
            ->sort(SORT_NATURAL | SORT_FLAG_CASE)
            ->values();
    }

    /**
     * @return array{brand: string|null, model: string|null}
     */
    public static function firstFromApplications(?string $applications): array
    {
        $entry = collect(self::entriesFromApplications($applications))->first();

        return [
            'brand' => $entry['brand'] ?? null,
            'model' => $entry['model'] ?? null,
        ];
    }

    protected static function entries(): Collection
    {
        return Product::query()
            ->whereNotNull('applications')
            ->where('applications', '!=', '')
            ->pluck('applications')
            ->flatMap(fn (?string $applications): array => self::entriesFromApplications($applications))
            ->filter(fn (array $entry): bool => $entry['brand'] !== '' && $entry['model'] !== '')
            ->values();
    }

    protected static function entriesFromApplications(?string $applications): array
    {
        $items = preg_split('/[,;\\/]+/', (string) $applications) ?: [];
        $entries = [];

        foreach ($items as $item) {
            $application = trim(preg_replace('/\s+/', ' ', $item));

            if ($application === '') {
                continue;
            }

            $brand = self::detectBrand($application);

            if ($brand === null) {
                continue;
            }

            $model = trim((string) preg_replace(
                '/^'.preg_quote($brand, '/').'\b[\s\-–—]*/iu',
                '',
                $application
            ));

            $entries[] = [
                'brand' => $brand,
                'model' => $model !== '' ? $model : $application,
            ];
        }

        return $entries;
    }

    protected static function detectBrand(string $application): ?string
    {
        foreach (self::KNOWN_BRANDS as $brand) {
            if (preg_match('/^'.preg_quote($brand, '/').'\b/iu', $application) === 1) {
                return $brand;
            }
        }

        return null;
    }
}

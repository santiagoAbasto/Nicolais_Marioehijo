<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SiteVisitAnalytics
{
    public static function parseClient(?string $userAgent): array
    {
        $userAgent = (string) $userAgent;

        $browser = match (true) {
            str_contains($userAgent, 'Edg/') => 'Edge',
            str_contains($userAgent, 'Chrome/') && ! str_contains($userAgent, 'Chromium') => 'Chrome',
            str_contains($userAgent, 'Safari/') && str_contains($userAgent, 'Version/') => 'Safari',
            str_contains($userAgent, 'Firefox/') => 'Firefox',
            str_contains($userAgent, 'OPR/') || str_contains($userAgent, 'Opera') => 'Opera',
            default => 'Desconocido',
        };

        $platform = match (true) {
            str_contains($userAgent, 'Windows') => 'Windows',
            str_contains($userAgent, 'Macintosh') || str_contains($userAgent, 'Mac OS') => 'macOS',
            str_contains($userAgent, 'Android') => 'Android',
            str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad') => 'iOS',
            str_contains($userAgent, 'Linux') => 'Linux',
            default => 'Desconocido',
        };

        $deviceType = match (true) {
            str_contains($userAgent, 'Tablet') || str_contains($userAgent, 'iPad') => 'Tablet',
            str_contains($userAgent, 'Mobile') || str_contains($userAgent, 'iPhone') => 'Mobile',
            default => 'Desktop',
        };

        return [
            'browser' => $browser,
            'platform' => $platform,
            'device_type' => $deviceType,
        ];
    }

    public static function isBot(?string $userAgent): bool
    {
        $userAgent = Str::lower((string) $userAgent);

        if ($userAgent === '') {
            return false;
        }

        foreach ([
            'bot',
            'crawler',
            'spider',
            'preview',
            'slackbot',
            'facebookexternalhit',
            'whatsapp',
            'telegrambot',
            'discordbot',
            'linkedinbot',
            'skypeuripreview',
        ] as $needle) {
            if (str_contains($userAgent, $needle)) {
                return true;
            }
        }

        return false;
    }

    public static function resolveCountry(Request $request): array
    {
        $countryCode = strtoupper(trim((string) (
            $request->header('CF-IPCountry')
            ?: $request->header('CloudFront-Viewer-Country')
            ?: $request->header('X-Vercel-IP-Country')
            ?: $request->header('X-Appengine-Country')
            ?: $request->header('X-Country-Code')
        )));

        if (in_array($countryCode, ['', 'XX', 'T1'], true)) {
            $countryCode = null;
        }

        $countryName = trim((string) (
            $request->header('CloudFront-Viewer-Country-Name')
            ?: $request->header('X-Country-Name')
        ));

        if ($countryName === '' && $countryCode) {
            $countryName = self::countryNameFromCode($countryCode) ?? '';
        }

        return [
            'country_code' => $countryCode,
            'country_name' => $countryName !== '' ? $countryName : null,
        ];
    }

    public static function resolveRouteContext(Request $request): array
    {
        $routeName = $request->route()?->getName();
        $params = collect($request->route()?->parametersWithoutNulls() ?? [])
            ->filter(static fn ($value) => is_scalar($value))
            ->map(static fn ($value) => (string) $value)
            ->all();

        $sectionKey = self::sectionKeyFromRoute($routeName);
        $sectionLabel = self::sectionLabel($sectionKey);
        $pageKey = self::pageKeyFromRoute($routeName);
        $pageLabel = self::pageLabelFromRoute($routeName, $params);

        return [
            'route_name' => $routeName,
            'section_key' => $sectionKey,
            'section_label' => $sectionLabel,
            'page_key' => $pageKey,
            'page_label' => $pageLabel,
            'route_params_json' => $params,
        ];
    }

    public static function visitorKey(Request $request): ?string
    {
        $fingerprint = implode('|', [
            (string) $request->ip(),
            (string) $request->userAgent(),
            (string) $request->header('Accept-Language'),
        ]);

        return trim($fingerprint, '|') !== '' ? hash('sha256', $fingerprint) : null;
    }

    protected static function sectionKeyFromRoute(?string $routeName): string
    {
        return match (true) {
            $routeName === 'web.home' => 'inicio',
            str_starts_with((string) $routeName, 'web.products.') => 'productos',
            str_starts_with((string) $routeName, 'web.applications') => 'aplicaciones',
            $routeName === 'web.about' => 'nosotros',
            $routeName === 'web.quality' => 'calidad',
            str_starts_with((string) $routeName, 'web.offers') => 'ofertas',
            str_starts_with((string) $routeName, 'web.news') => 'novedades',
            str_starts_with((string) $routeName, 'web.quote') => 'presupuesto',
            str_starts_with((string) $routeName, 'web.contact') => 'contacto',
            str_starts_with((string) $routeName, 'web.catalog') => 'catalogo',
            str_starts_with((string) $routeName, 'web.search') => 'busqueda',
            str_starts_with((string) $routeName, 'web.calculator') => 'calculadora',
            str_starts_with((string) $routeName, 'web.partners') => 'representadas',
            str_starts_with((string) $routeName, 'web.clients') => 'clientes',
            default => 'sitio',
        };
    }

    protected static function sectionLabel(string $sectionKey): string
    {
        return match ($sectionKey) {
            'inicio' => 'Inicio',
            'productos' => 'Productos',
            'aplicaciones' => 'Aplicaciones',
            'nosotros' => 'Nosotros',
            'calidad' => 'Calidad',
            'ofertas' => 'Ofertas',
            'novedades' => 'Novedades',
            'presupuesto' => 'Presupuesto',
            'contacto' => 'Contacto',
            'catalogo' => 'Catálogo',
            'busqueda' => 'Búsqueda',
            'calculadora' => 'Calculadora',
            'representadas' => 'Representadas',
            'clientes' => 'Clientes',
            default => 'Sitio',
        };
    }

    protected static function pageKeyFromRoute(?string $routeName): string
    {
        return match ($routeName) {
            'web.home' => 'home',
            'web.about' => 'about',
            'web.applications' => 'applications',
            'web.applications.detail' => 'application_detail',
            'web.calculator.index' => 'calculator',
            'web.products.index' => 'products_index',
            'web.products.all' => 'products_all',
            'web.products.line' => 'product_line',
            'web.products.series' => 'product_series',
            'web.products.grade' => 'product_grade',
            'web.products.technical-sheet' => 'technical_sheet',
            'web.quality' => 'quality',
            'web.offers.index' => 'offers',
            'web.news.index' => 'news',
            'web.news.show' => 'news_detail',
            'web.catalog.show' => 'catalog',
            'web.quote.show' => 'quote',
            'web.contact.show' => 'contact',
            'web.search.index' => 'search',
            'web.partners.index' => 'partners',
            'web.clients.index' => 'clients',
            default => 'page',
        };
    }

    protected static function pageLabelFromRoute(?string $routeName, array $params): string
    {
        return match ($routeName) {
            'web.home' => 'Inicio',
            'web.about' => 'Nosotros',
            'web.applications' => 'Aplicaciones',
            'web.applications.detail' => 'Aplicación: '.self::humanizeSlug($params['applicationSlug'] ?? null),
            'web.calculator.index' => 'Calculadora de pesos',
            'web.products.index' => 'Productos',
            'web.products.all' => 'Todos los productos',
            'web.products.line' => 'Línea: '.self::humanizeSlug($params['lineSlug'] ?? null),
            'web.products.series' => 'Serie: '.self::humanizeSlug($params['seriesSlug'] ?? null),
            'web.products.grade' => 'Grado: '.self::humanizeSlug($params['gradeSlug'] ?? null),
            'web.products.technical-sheet' => 'Ficha técnica: '.self::humanizeSlug($params['gradeSlug'] ?? null),
            'web.quality' => 'Calidad',
            'web.offers.index' => 'Ofertas',
            'web.news.index' => 'Novedades',
            'web.news.show' => 'Novedad: '.self::humanizeSlug($params['slug'] ?? null),
            'web.catalog.show' => 'Catálogo',
            'web.quote.show' => 'Presupuesto',
            'web.contact.show' => 'Contacto',
            'web.search.index' => 'Resultados de búsqueda',
            'web.partners.index' => 'Representadas',
            'web.clients.index' => 'Clientes',
            default => 'Página',
        };
    }

    protected static function humanizeSlug(?string $value): string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return 'Sin nombre';
        }

        return Str::of($value)
            ->replace(['-', '_'], ' ')
            ->lower()
            ->title()
            ->replace(' Y ', ' y ')
            ->replace(' De ', ' de ')
            ->replace(' Del ', ' del ')
            ->replace(' Sus ', ' sus ')
            ->toString();
    }

    protected static function countryNameFromCode(string $countryCode): ?string
    {
        if (class_exists(\Locale::class)) {
            $region = \Locale::getDisplayRegion('-'.$countryCode, 'es_AR');

            if (is_string($region) && trim($region) !== '') {
                return trim($region);
            }
        }

        return match ($countryCode) {
            'AR' => 'Argentina',
            'BR' => 'Brasil',
            'CL' => 'Chile',
            'CO' => 'Colombia',
            'DE' => 'Alemania',
            'ES' => 'España',
            'IT' => 'Italia',
            'MX' => 'México',
            'PE' => 'Perú',
            'PY' => 'Paraguay',
            'US' => 'Estados Unidos',
            'UY' => 'Uruguay',
            default => $countryCode,
        };
    }
}

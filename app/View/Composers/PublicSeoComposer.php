<?php

namespace App\View\Composers;

use App\Models\FooterContactItem;
use App\Models\FooterSetting;
use App\Models\SeoMeta;
use App\Models\SocialLink;
use App\Support\SeoPageResolver;
use Illuminate\Support\Facades\Schema;
use Illuminate\View\Factory as ViewFactory;
use Illuminate\View\View;

class PublicSeoComposer
{
    protected const DEFAULT_DESCRIPTION = 'Repuestos automotores y componentes para sistemas de transmision.';

    protected const DEFAULT_KEYWORDS = 'Nicolais Mario e Hijo, repuestos automotores, transmision, autopartes';

    protected const DEFAULT_THEME_COLOR = '#0b7cc1';

    protected const DEFAULT_OG_LOCALE = 'es_AR';

    protected static array $resolvedSeoMeta = [];

    public function __construct(protected ViewFactory $views) {}

    public function compose(View $view): void
    {
        $seo = $this->resolveSeoMeta();

        $view->with('seo', $seo);

        if ($view->name() !== 'web.layouts.app') {
            return;
        }

        $appName = config('app.name', 'Nicolais Mario e Hijo');
        $metaTitle = $this->section('title') ?: ($seo?->title ?: $appName);
        $metaDescription = $this->section('meta_description') ?: ($seo?->description ?: self::DEFAULT_DESCRIPTION);
        $metaKeywords = $this->section('meta_keywords') ?: ($seo?->keywords ?: self::DEFAULT_KEYWORDS);
        $metaOgType = $this->section('meta_og_type') ?: 'website';
        $metaOgImage = $this->section('meta_og_image') ?: ($seo?->og_image_url ?: $this->defaultSeoImageUrl());
        $metaOgImageAlt = $this->section('meta_og_image_alt') ?: ($metaTitle ? 'Vista previa de '.$metaTitle : $appName);
        $canonicalUrl = $this->section('canonical_url') ?: url()->current();
        $metaRobots = $this->section('meta_robots') ?: 'index,follow';
        $themeColor = $this->section('meta_theme_color') ?: self::DEFAULT_THEME_COLOR;
        $ogLocale = $this->section('meta_og_locale') ?: self::DEFAULT_OG_LOCALE;
        $footerSettings = $this->resolveFooterSettings();
        $footerLogoUrl = media_asset_url($footerSettings?->logo) ?: asset('images/brand/nicolais-logo.svg');
        $footerContactItems = $this->resolveFooterContactItems();
        $footerSocialLinks = $this->resolveFooterSocialLinks();

        $structuredDataSchemas = [
            $this->organizationSchema($appName),
            $this->websiteSchema($appName),
        ];

        $view->with([
            'appName' => $appName,
            'metaTitle' => $metaTitle,
            'metaDescription' => $metaDescription,
            'metaKeywords' => $metaKeywords,
            'metaOgType' => $metaOgType,
            'metaOgImage' => $metaOgImage,
            'metaOgImageAlt' => $metaOgImageAlt,
            'canonicalUrl' => $canonicalUrl,
            'metaRobots' => $metaRobots,
            'themeColor' => $themeColor,
            'ogLocale' => $ogLocale,
            'twitterCard' => $metaOgImage ? 'summary_large_image' : 'summary',
            'faviconVersion' => $this->faviconVersion(),
            'structuredDataSchemas' => $structuredDataSchemas,
            'footerSettings' => $footerSettings,
            'footerLogoUrl' => $footerLogoUrl,
            'footerContactItems' => $footerContactItems,
            'footerSocialLinks' => $footerSocialLinks,
        ]);
    }

    protected function resolveFooterSettings(): ?FooterSetting
    {
        try {
            if (! Schema::hasTable((new FooterSetting)->getTable())) {
                return null;
            }

            return FooterSetting::query()
                ->with('logo')
                ->first();
        } catch (\Throwable) {
            return null;
        }
    }

    protected function resolveFooterSocialLinks()
    {
        try {
            if (! Schema::hasTable((new SocialLink)->getTable())) {
                return collect();
            }

            return SocialLink::query()
                ->where('location', 'footer')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get();
        } catch (\Throwable) {
            return collect();
        }
    }

    protected function resolveFooterContactItems()
    {
        try {
            if (! Schema::hasTable((new FooterContactItem)->getTable())) {
                return collect();
            }

            return FooterContactItem::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get();
        } catch (\Throwable) {
            return collect();
        }
    }

    protected function resolveSeoMeta(): ?SeoMeta
    {
        $page = SeoPageResolver::resolvePageKey(request());

        if (! $page) {
            return null;
        }

        try {
            if (! Schema::hasTable((new SeoMeta)->getTable())) {
                return null;
            }

            return self::$resolvedSeoMeta[$page] ??= SeoMeta::query()
                ->where('page', $page)
                ->first();
        } catch (\Throwable) {
            return null;
        }
    }

    protected function defaultSeoImageUrl(): ?string
    {
        try {
            return default_seo_image_url();
        } catch (\Throwable) {
            return null;
        }
    }

    protected function section(string $name): string
    {
        return trim((string) $this->views->yieldContent($name));
    }

    protected function organizationSchema(string $appName): array
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => $appName,
            'url' => cms_public_app_url(),
        ];

        if ($defaultShareImage = $this->defaultSeoImageUrl()) {
            $schema['logo'] = $defaultShareImage;
            $schema['image'] = $defaultShareImage;
        }

        return $schema;
    }

    protected function websiteSchema(string $appName): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => $appName,
            'url' => cms_public_app_url(),
            'potentialAction' => [
                '@type' => 'SearchAction',
                'target' => route('web.search.index').'?q={search_term_string}',
                'query-input' => 'required name=search_term_string',
            ],
        ];
    }

    protected function faviconVersion(): int|string
    {
        return max(array_map(
            static fn (string $path): int => @filemtime(public_path($path)) ?: 0,
            [
                'favicon.ico',
                'favicon.svg',
                'favicon-96x96.png',
                'favicon-192x192.png',
                'favicon-512x512.png',
                'apple-touch-icon.png',
                'apple-touch-icon-precomposed.png',
                'site.webmanifest',
            ],
        )) ?: '1';
    }
}

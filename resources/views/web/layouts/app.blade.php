<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    @php
        $appName = $appName ?? config('app.name', 'Nicolais Mario e Hijo');
        $isClientZone = request()->routeIs('web.client-zone.*');
        $pageTitle = trim((string) ($metaTitle ?? $__env->yieldContent('title', $appName)));
        $titleTag = str_contains($pageTitle, $appName) ? $pageTitle : $pageTitle.' | '.$appName;
        $metaDescription = trim((string) ($metaDescription ?? $__env->yieldContent('meta_description', 'Repuestos automotores y componentes para sistemas de transmisión.')));
        $metaKeywords = trim((string) ($metaKeywords ?? $__env->yieldContent('meta_keywords', 'Nicolais Mario e Hijo, repuestos automotores, transmisión, autopartes')));
        $canonicalUrl = $canonicalUrl ?? url()->current();
        $metaRobots = $isClientZone ? 'noindex,nofollow' : ($metaRobots ?? 'index,follow');
        $metaOgType = $metaOgType ?? 'website';
        $metaOgImage = $metaOgImage ?? null;
        $metaOgImageAlt = $metaOgImageAlt ?? ('Vista previa de '.$titleTag);
        $twitterCard = $twitterCard ?? ($metaOgImage ? 'summary_large_image' : 'summary');
        $siteAuthor = 'Nicolais Mario e Hijo';
        $themeColor = $themeColor ?? '#0072bb';
        $ogLocale = $ogLocale ?? 'es_AR';
        $structuredDataSchemas = $structuredDataSchemas ?? [];
        $faviconVersion = $faviconVersion ?? (max(array_map(
            static fn (string $path) => @filemtime(public_path($path)) ?: 0,
            [
                'favicon/favicon.ico',
                'favicon/favicon.svg',
                'favicon/favicon-96x96.png',
                'favicon/web-app-manifest-192x192.png',
                'favicon/web-app-manifest-512x512.png',
                'favicon/apple-touch-icon.png',
                'favicon/site.webmanifest',
            ]
        )) ?: '1');
    @endphp

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $titleTag }}</title>
    <meta name="application-name" content="{{ $appName }}">
    <meta name="author" content="{{ $siteAuthor }}">
    <meta name="publisher" content="{{ $siteAuthor }}">
    <meta name="description" content="{{ $metaDescription }}">
    @if ($metaKeywords !== '')
        <meta name="keywords" content="{{ $metaKeywords }}">
    @endif
    <meta name="robots" content="{{ $metaRobots }}">
    <meta name="googlebot" content="{{ $metaRobots }}">
    <meta name="bingbot" content="{{ $metaRobots }}">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <link rel="canonical" href="{{ $canonicalUrl }}">
    <meta property="og:locale" content="{{ $ogLocale }}">
    <meta property="og:type" content="{{ $metaOgType }}">
    <meta property="og:site_name" content="{{ $appName }}">
    <meta property="og:title" content="{{ $titleTag }}">
    <meta property="og:description" content="{{ $metaDescription }}">
    <meta property="og:url" content="{{ $canonicalUrl }}">
    @if ($metaOgImage)
        <meta property="og:image" content="{{ $metaOgImage }}">
        <meta property="og:image:secure_url" content="{{ $metaOgImage }}">
        <meta property="og:image:alt" content="{{ $metaOgImageAlt }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
    @endif
    <meta name="twitter:card" content="{{ $twitterCard }}">
    <meta name="twitter:title" content="{{ $titleTag }}">
    <meta name="twitter:description" content="{{ $metaDescription }}">
    @if ($metaOgImage)
        <meta name="twitter:image" content="{{ $metaOgImage }}">
        <meta name="twitter:image:alt" content="{{ $metaOgImageAlt }}">
    @endif
    <script nonce="{{ request()->attributes->get('csp-nonce') }}">
        (() => {
            if (window.__nmSkippedTransitionGuard) return;
            window.__nmSkippedTransitionGuard = true;

            const isSkippedTransitionError = (error) => {
                const name = error?.name ?? "";
                const message = error?.message ?? String(error ?? "");

                return name === "AbortError" && message.includes("Transition was skipped");
            };

            window.addEventListener("unhandledrejection", (event) => {
                if (isSkippedTransitionError(event.reason)) {
                    event.preventDefault();
                }
            });

            window.addEventListener("error", (event) => {
                if (isSkippedTransitionError(event.error)) {
                    event.preventDefault();
                }
            });
        })();
    </script>

    <link rel="shortcut icon" href="{{ asset('favicon/favicon.ico') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon/favicon.ico') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/svg+xml" href="{{ asset('favicon/favicon.svg') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/png" sizes="96x96" href="{{ asset('favicon/favicon-96x96.png') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/png" sizes="192x192" href="{{ asset('favicon/web-app-manifest-192x192.png') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/png" sizes="512x512" href="{{ asset('favicon/web-app-manifest-512x512.png') }}?v={{ $faviconVersion }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('favicon/apple-touch-icon.png') }}?v={{ $faviconVersion }}">
    <link rel="manifest" href="{{ route('web.manifest') }}?v={{ $faviconVersion }}">
    <meta name="theme-color" content="{{ $themeColor }}">

    @foreach ($structuredDataSchemas as $schema)
        <script type="application/ld+json" nonce="{{ request()->attributes->get('csp-nonce') }}">@json($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)</script>
    @endforeach

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">

    @stack('styles')
</head>
<body>
    <div class="nm-page-transition" data-page-transition aria-hidden="true">
        <div class="nm-page-transition__panel">
            <span class="nm-page-transition__ring"></span>
            <span class="nm-page-transition__card">
                <svg class="nm-page-transition__gear" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" stroke-width="1.8"/>
                    <path d="M19.4 13.2c.1-.4.1-.8.1-1.2s0-.8-.1-1.2l2-1.5-2-3.4-2.4 1a8 8 0 0 0-2.1-1.2L14.6 3h-5.2l-.4 2.7c-.8.3-1.5.7-2.1 1.2l-2.4-1-2 3.4 2 1.5c-.1.4-.1.8-.1 1.2s0 .8.1 1.2l-2 1.5 2 3.4 2.4-1c.6.5 1.3.9 2.1 1.2l.4 2.7h5.2l.4-2.7c.8-.3 1.5-.7 2.1-1.2l2.4 1 2-3.4-2.1-1.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                </svg>
            </span>
            <span class="nm-page-transition__bar"><span></span></span>
        </div>
    </div>
    @yield('content')

    <div
        class="client-access-modal"
        data-client-modal
        data-open-on-load="{{ session('client_modal') ? 'true' : 'false' }}"
        hidden
    >
        <button class="client-access-modal__backdrop" type="button" data-client-modal-close aria-label="Cerrar"></button>

        <section class="client-access-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="client-access-title">
            <button class="client-access-modal__close" type="button" data-client-modal-close aria-label="Cerrar">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>

            <div class="client-access-modal__panel is-active" data-client-panel="login">
                <h2 id="client-access-title">Iniciar sesión</h2>

                <form class="client-access-form" action="{{ route('web.clients.login') }}" method="POST" data-client-login-form>
                    @csrf
                    <div class="client-access-form__field">
                        <label for="client-login-email">Usuario</label>
                        <input id="client-login-email" type="email" name="email" placeholder="usuario@empresa.com" autocomplete="username" required>
                    </div>

                    <div class="client-access-form__field">
                        <label for="client-login-password">Contraseña</label>
                        <input id="client-login-password" type="password" name="password" placeholder="*****" autocomplete="current-password" required>
                    </div>

                    <p class="client-access-modal__message" data-client-login-message aria-live="polite"></p>

                    <button class="client-access-form__submit" type="submit">Iniciar sesión</button>
                </form>

                <hr>

                <p class="client-access-modal__question">¿No tenés usuario?</p>
                <button class="client-access-modal__register-link" type="button" data-client-panel-open="register">Registrate</button>
            </div>

            <div class="client-access-modal__panel" data-client-panel="register">
                <h2>Registrate</h2>

                <form class="client-register-form" action="{{ route('web.clients.store') }}" method="POST" data-client-register-form>
                    @csrf
                    <input type="text" name="{{ config('security.forms.honeypot_field', 'website') }}" tabindex="-1" autocomplete="off" class="client-access-modal__honeypot">
                    <input type="hidden" name="_form_started_at" value="{{ time() }}">

                    <div class="client-register-form__grid">
                        <label>Nombre<input type="text" name="first_name" required></label>
                        <label>Apellido<input type="text" name="last_name" required></label>
                        <label>Correo<input type="email" name="email" required></label>
                        <label>Teléfono<input type="tel" name="phone" required></label>
                        <label>Empresa<input type="text" name="company"></label>
                        <label>CUIT / DNI (opcional)<input type="text" name="tax_id"></label>
                        <label class="client-register-form__wide">Mensaje<textarea name="message" rows="3"></textarea></label>
                    </div>

                    <p class="client-access-modal__message" data-client-register-message aria-live="polite"></p>

                    <div class="client-register-form__actions">
                        <button class="client-access-modal__register-link" type="button" data-client-panel-open="login">Volver</button>
                        <button class="client-access-form__submit" type="submit">Enviar solicitud</button>
                    </div>
                </form>
            </div>
        </section>
    </div>

    <div
        class="global-search"
        data-global-search
        data-suggest-url="{{ $isClientZone ? route('web.client-zone.suggest') : route('web.search.suggest') }}"
        data-search-url="{{ $isClientZone ? route('web.client-zone.index') : route('web.search.index') }}"
        data-featured-status="{{ $isClientZone ? 'Buscá únicamente dentro de Zona Clientes. Este buscador no consulta la web pública.' : 'Elegí una sugerencia o empezá a escribir para buscar en toda la web.' }}"
        hidden
    >
        <button class="global-search__backdrop" type="button" data-global-search-close aria-label="Cerrar búsqueda"></button>

        <section class="global-search__dialog" role="dialog" aria-modal="true" aria-labelledby="global-search-title">
            <div class="global-search__header">
                <div class="global-search__ai-mark" aria-hidden="true">
                    <span class="global-search__ai-orb">
                        <span></span>
                    </span>
                </div>
                <div>
                    <p class="global-search__eyebrow">Asistente IA</p>
                    <h2 id="global-search-title">{{ $isClientZone ? 'Buscador Zona Clientes' : 'Buscador inteligente' }}</h2>
                </div>
                <button class="global-search__close" type="button" data-global-search-close aria-label="Cerrar">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>

            <form class="global-search__form" data-global-search-form action="{{ $isClientZone ? route('web.client-zone.index') : route('web.search.index') }}" method="GET">
                <label class="sr-only" for="global-search-input">Buscar</label>
                <input
                    id="global-search-input"
                    data-global-search-input
                    type="search"
                    name="q"
                    placeholder="{{ $isClientZone ? 'Buscá productos o secciones de Zona Clientes...' : 'Preguntá o buscá por producto, código, sección...' }}"
                    autocomplete="off"
                >
                <button type="submit" aria-label="Buscar">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                        <path d="M9.75 17.5C14.0302 17.5 17.5 14.0302 17.5 9.75C17.5 5.46979 14.0302 2 9.75 2C5.46979 2 2 5.46979 2 9.75C2 14.0302 5.46979 17.5 9.75 17.5Z" stroke="currentColor" stroke-width="2"/>
                        <path d="M15.25 15.25L20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </form>

            <p class="global-search__status" data-global-search-status aria-live="polite"></p>

            <div class="global-search__results" data-global-search-results></div>

            <template data-global-search-featured-template>
                <div class="ai-halo-shell">
                    <section class="global-search__group global-search__group--insight">
                        <div class="global-search__assistant-head">
                            <div class="global-search__assistant-title">
                                <span class="global-search__ai-orb global-search__ai-orb--small" aria-hidden="true"><span></span></span>
                                <h3>Asistente IA</h3>
                            </div>
                            <span class="global-search__assistant-badge">IA asistida</span>
                        </div>
                        <div class="global-search__assistant-body">
                            <span class="global-search__assistant-label">Interpretación</span>
                            <strong>{{ $isClientZone ? 'Buscador exclusivo de Zona Clientes.' : 'Encontré coincidencias útiles para tu búsqueda.' }}</strong>
                            <p>{{ $isClientZone ? 'Este buscador se alimenta únicamente de la Zona Clientes y no consulta la web pública.' : 'Busco en secciones, productos, códigos, novedades y consultas frecuentes.' }}</p>
                            <div class="global-search__assistant-suggestion-group">
                                <span class="global-search__assistant-suggestion-title">{{ $isClientZone ? 'Coincidencias dentro de Zona Clientes' : 'Coincidencias con toda la web' }}</span>
                            </div>
                            <div class="global-search__assistant-actions">
                                @if ($isClientZone)
                                    <a class="global-search__quick-chip" href="{{ route('web.client-zone.index') }}">Productos</a>
                                    <a class="global-search__quick-chip" href="{{ route('web.client-zone.section', 'mis-pedidos') }}">Mis pedidos</a>
                                    <a class="global-search__quick-chip" href="{{ route('web.client-zone.section', 'lista-de-precios') }}">Lista de precios</a>
                                @else
                                    <a class="global-search__quick-chip" href="{{ route('web.products.index') }}">Productos</a>
                                    <a class="global-search__quick-chip" href="{{ route('web.contact.show') }}">Contacto</a>
                                    <a class="global-search__quick-chip" href="{{ route('web.quote.show') }}">Presupuesto</a>
                                @endif
                            </div>
                        </div>
                    </section>
                </div>
            </template>
        </section>
    </div>

    @php
        $footerAddress = $footerSettings?->contact_address ?: 'José Melián 2137 (B1852) Burzaco Provincia de Buenos Aires';
        $footerEmailPrimary = $footerSettings?->email_primary ?: 'nicolaismario@yahoo.com.ar';
        $footerEmailSecondary = $footerSettings?->email_secondary;
        $footerWhatsapp = $footerSettings?->phone_secondary ?: '+54 (911) 6094 - 8992';
        $footerPhonePrimary = $footerSettings?->phone_primary ?: '(011) 6072 - 6008';
        $footerPhoneSecondary = $footerSettings?->phone_tertiary ?: '(011) 6062 - 1347';
        $footerCopyright = $footerSettings?->copyright_text ?: '© Copyright 2026 Nicolais Mario e Hijo. Todos los derechos reservados';
        $footerWhatsappHref = 'https://wa.me/'.preg_replace('/\D+/', '', $footerWhatsapp);
        $footerPhonePrimaryHref = 'tel:'.preg_replace('/\D+/', '', $footerPhonePrimary);
        $footerPhoneSecondaryHref = 'tel:'.preg_replace('/\D+/', '', $footerPhoneSecondary);
        $footerContactItems = collect($footerContactItems ?? [])->filter(fn ($item) => filled($item->value ?? null));
        $footerSocialLinks = collect($footerSocialLinks ?? [])->filter(fn ($link) => filled($link->url ?? null));

        if ($footerSocialLinks->isEmpty()) {
            $footerSocialLinks = collect([
                (object) ['platform' => 'instagram', 'label' => 'Instagram', 'url' => 'https://instagram.com/nicolaismarioehijo'],
                (object) ['platform' => 'facebook', 'label' => 'Facebook', 'url' => 'https://www.facebook.com/'],
            ]);
        }
    @endphp

    <footer class="nm-site-footer" aria-label="Footer">
        <div class="nm-site-footer__brand">
            @if ($isClientZone)
                <span class="nm-site-footer__logo" aria-label="{{ config('app.name', 'Nicolais Mario e Hijo') }}">
                    <img src="{{ $footerLogoUrl ?? asset('images/brand/nicolais-logo.svg') }}" alt="{{ $footerSettings?->logo?->alt_text ?? 'Nicolais Mario e Hijo' }}">
                </span>
            @else
                <a href="{{ route('web.home') }}" class="nm-site-footer__logo" aria-label="{{ config('app.name', 'Nicolais Mario e Hijo') }}">
                    <img src="{{ $footerLogoUrl ?? asset('images/brand/nicolais-logo.svg') }}" alt="{{ $footerSettings?->logo?->alt_text ?? 'Nicolais Mario e Hijo' }}">
                </a>
            @endif

            <div class="nm-site-footer__social" aria-label="Redes sociales">
                @foreach ($footerSocialLinks as $socialLink)
                    @if ($isClientZone)
                        <span class="nm-site-footer__social-link" aria-label="{{ $socialLink->label ?: ucfirst($socialLink->platform) }}">
                    @else
                        <a class="nm-site-footer__social-link" href="{{ $socialLink->url }}" target="_blank" rel="noopener noreferrer" aria-label="{{ $socialLink->label ?: ucfirst($socialLink->platform) }}">
                    @endif
                        @switch($socialLink->platform)
                            @case('instagram')
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                                    <path d="M16.5 5.5H16.51M6 1H16C18.7614 1 21 3.23858 21 6V16C21 18.7614 18.7614 21 16 21H6C3.23858 21 1 18.7614 1 16V6C1 3.23858 3.23858 1 6 1ZM15 10.37C15.1234 11.2022 14.9813 12.0522 14.5938 12.799C14.2063 13.5458 13.5931 14.1514 12.8416 14.5297C12.0901 14.9079 11.2384 15.0396 10.4078 14.9059C9.57713 14.7723 8.80976 14.3801 8.21484 13.7852C7.61992 13.1902 7.22773 12.4229 7.09407 11.5922C6.9604 10.7616 7.09207 9.90989 7.47033 9.15837C7.84859 8.40685 8.45419 7.79374 9.20098 7.40624C9.94778 7.01874 10.7978 6.87659 11.63 7C12.4789 7.12588 13.2649 7.52146 13.8717 8.12831C14.4785 8.73515 14.8741 9.52108 15 10.37Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                @break

                            @case('facebook')
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="20" viewBox="37 1 13 20" fill="none" aria-hidden="true">
                                    <path d="M49 1H46C44.6739 1 43.4021 1.52678 42.4645 2.46447C41.5268 3.40215 41 4.67392 41 6V9H38V13H41V21H45V13H48L49 9H45V6C45 5.73478 45.1054 5.48043 45.2929 5.29289C45.4804 5.10536 45.7348 5 46 5H49V1Z" fill="white"/>
                                </svg>
                                @break

                            @case('youtube')
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden="true">
                                    <path d="M23.5 3.1C23.2 1.9 22.2 1 21 0.7C19.1 0.2 12 0.2 12 0.2C12 0.2 4.9 0.2 3 0.7C1.8 1 0.8 1.9 0.5 3.1C0 5 0 9 0 9C0 9 0 13 0.5 14.9C0.8 16.1 1.8 17 3 17.3C4.9 17.8 12 17.8 12 17.8C12 17.8 19.1 17.8 21 17.3C22.2 17 23.2 16.1 23.5 14.9C24 13 24 9 24 9C24 9 24 5 23.5 3.1ZM9.6 12.7V5.3L15.9 9L9.6 12.7Z" fill="white"/>
                                </svg>
                                @break

                            @case('linkedin')
                                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none" aria-hidden="true">
                                    <path d="M4.7 6.8H1.1V20H4.7V6.8ZM2.9 5C4.1 5 5 4.1 5 2.9C5 1.7 4.1 0.8 2.9 0.8C1.7 0.8 0.8 1.7 0.8 2.9C0.8 4.1 1.7 5 2.9 5ZM20.2 12.6C20.2 8.6 18.1 6.5 15.2 6.5C12.9 6.5 11.9 7.8 11.3 8.6V6.8H7.7C7.8 8 7.7 20 7.7 20H11.3V12.6C11.3 12.2 11.3 11.8 11.4 11.5C11.7 10.7 12.4 9.9 13.6 9.9C15.1 9.9 15.8 11.1 15.8 12.9V20H19.4V12.9C19.4 12.8 20.2 12.7 20.2 12.6Z" fill="white"/>
                                </svg>
                                @break

                            @default
                                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none" aria-hidden="true">
                                    <path d="M8.8 12.2C9.2 12.6 9.8 12.6 10.2 12.2L13.8 8.6C15.1 7.3 17.2 7.3 18.5 8.6C19.8 9.9 19.8 12 18.5 13.3L15.4 16.4C14.3 17.5 12.6 17.7 11.3 16.8C10.8 16.5 10.2 16.6 9.9 17.1C9.6 17.6 9.7 18.2 10.2 18.5C12.3 19.9 15.1 19.6 16.8 17.8L19.9 14.7C22 12.6 22 9.3 19.9 7.2C17.8 5.1 14.5 5.1 12.4 7.2L8.8 10.8C8.4 11.2 8.4 11.8 8.8 12.2ZM12.2 8.8C11.8 8.4 11.2 8.4 10.8 8.8L7.2 12.4C5.9 13.7 3.8 13.7 2.5 12.4C1.2 11.1 1.2 9 2.5 7.7L5.6 4.6C6.7 3.5 8.4 3.3 9.7 4.2C10.2 4.5 10.8 4.4 11.1 3.9C11.4 3.4 11.3 2.8 10.8 2.5C8.7 1.1 5.9 1.4 4.2 3.2L1.1 6.3C-1 8.4 -1 11.7 1.1 13.8C3.2 15.9 6.5 15.9 8.6 13.8L12.2 10.2C12.6 9.8 12.6 9.2 12.2 8.8Z" fill="white"/>
                                </svg>
                        @endswitch
                    @if ($isClientZone)
                        </span>
                    @else
                        </a>
                    @endif
                @endforeach
            </div>
        </div>

        <div class="nm-site-footer__main">
            <section class="nm-site-footer__section nm-site-footer__section--links" aria-labelledby="footer-secciones-title">
                <h2 id="footer-secciones-title" class="nm-site-footer__title">Secciones</h2>
                <nav class="nm-site-footer__nav" aria-label="Secciones del sitio">
                    <div class="nm-site-footer__nav-column">
                        @if ($isClientZone)
                            <a href="{{ route('web.client-zone.index') }}">Productos</a>
                            <a href="{{ route('web.client-zone.section', 'carrito') }}">Carrito</a>
                            <a href="{{ route('web.client-zone.section', 'presupuesto') }}">Presupuesto</a>
                            <a href="{{ route('web.client-zone.section', 'mis-pedidos') }}">Mis pedidos</a>
                        @else
                            <a href="{{ route('web.home') }}">Inicio</a>
                            <a href="{{ route('web.about') }}">Nosotros</a>
                            <a href="{{ route('web.products.index') }}">Productos</a>
                        @endif
                    </div>
                    <div class="nm-site-footer__nav-column">
                        @if ($isClientZone)
                            <a href="{{ route('web.client-zone.section', 'lista-de-precios') }}">Lista de precios</a>
                            <a href="{{ route('web.client-zone.section', 'info-de-pagos') }}">Info de pagos</a>
                            <a href="{{ route('web.client-zone.section', 'margenes') }}">Márgenes</a>
                        @else
                            <a href="{{ route('web.catalog.show') }}">Catálogo</a>
                            <a href="{{ route('web.news.index') }}">Novedades</a>
                            <a href="{{ route('web.contact.show') }}">Contacto</a>
                        @endif
                    </div>
                </nav>
            </section>

            <section class="nm-site-footer__section nm-site-footer__section--newsletter" aria-labelledby="footer-newsletter-title">
                <h2 id="footer-newsletter-title" class="nm-site-footer__title">Suscribite al Newsletter</h2>
                <form id="newsletterForm" class="nm-site-footer__newsletter-form" action="{{ route('web.newsletter.store') }}" method="POST">
                    @csrf
                    <input type="text" name="{{ config('security.forms.honeypot_field', 'website') }}" value="" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;opacity:0;height:0;width:0;">
                    <input type="hidden" name="_form_started_at" value="{{ time() }}">
                    <label class="sr-only" for="footer-newsletter-email">Email</label>
                    <input id="footer-newsletter-email" type="email" name="email" placeholder="Email" autocomplete="email" required>
                    <button type="submit" aria-label="Enviar email">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M5 12H19M12 19L19 12L12 5" stroke="#0072BB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </form>
                <p id="newsletterMsg" class="nm-site-footer__newsletter-message" aria-live="polite"></p>
            </section>

            <section class="nm-site-footer__section nm-site-footer__section--contact" aria-labelledby="footer-contact-title">
                <h2 id="footer-contact-title" class="nm-site-footer__title">Información de Contacto</h2>
                <address class="nm-site-footer__contact-list">
                    <a class="nm-site-footer__contact-item nm-site-footer__contact-item--address" href="https://maps.app.goo.gl/w6zFeoJnA8cKMvrZ9" target="_blank" rel="noopener noreferrer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M16.6663 8.33317C16.6663 13.3332 9.99967 18.3332 9.99967 18.3332C9.99967 18.3332 3.33301 13.3332 3.33301 8.33317C3.33301 6.56506 4.03539 4.86937 5.28563 3.61913C6.53587 2.36888 8.23156 1.6665 9.99967 1.6665C11.7678 1.6665 13.4635 2.36888 14.7137 3.61913C15.964 4.86937 16.6663 6.56506 16.6663 8.33317Z" stroke="#0072BB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M9.99967 10.8332C11.3804 10.8332 12.4997 9.71388 12.4997 8.33317C12.4997 6.95246 11.3804 5.83317 9.99967 5.83317C8.61896 5.83317 7.49967 6.95246 7.49967 8.33317C7.49967 9.71388 8.61896 10.8332 9.99967 10.8332Z" stroke="#0072BB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>{{ $footerAddress }}</span>
                    </a>
                    <a class="nm-site-footer__contact-item nm-site-footer__contact-item--email" href="mailto:{{ $footerEmailPrimary }}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M18.3337 5.8335L10.8587 10.5835C10.6014 10.7447 10.3039 10.8302 10.0003 10.8302C9.69673 10.8302 9.39926 10.7447 9.14199 10.5835L1.66699 5.8335M3.33366 3.3335H16.667C17.5875 3.3335 18.3337 4.07969 18.3337 5.00016V15.0002C18.3337 15.9206 17.5875 16.6668 16.667 16.6668H3.33366C2.41318 16.6668 1.66699 15.9206 1.66699 15.0002V5.00016C1.66699 4.07969 2.41318 3.3335 3.33366 3.3335Z" stroke="#0072BB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>{{ $footerEmailPrimary }}</span>
                    </a>
                    @if ($footerEmailSecondary)
                        <a class="nm-site-footer__contact-item nm-site-footer__contact-item--email" href="mailto:{{ $footerEmailSecondary }}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <path d="M18.3337 5.8335L10.8587 10.5835C10.6014 10.7447 10.3039 10.8302 10.0003 10.8302C9.69673 10.8302 9.39926 10.7447 9.14199 10.5835L1.66699 5.8335M3.33366 3.3335H16.667C17.5875 3.3335 18.3337 4.07969 18.3337 5.00016V15.0002C18.3337 15.9206 17.5875 16.6668 16.667 16.6668H3.33366C2.41318 16.6668 1.66699 15.9206 1.66699 15.0002V5.00016C1.66699 4.07969 2.41318 3.3335 3.33366 3.3335Z" stroke="#0072BB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>{{ $footerEmailSecondary }}</span>
                        </a>
                    @endif
                    <a class="nm-site-footer__contact-item nm-site-footer__contact-item--whatsapp" href="{{ $footerWhatsappHref }}" target="_blank" rel="noopener noreferrer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M14.5823 11.985C14.3328 11.8608 13.1095 11.2625 12.8817 11.1792C12.6539 11.0967 12.4881 11.0558 12.3215 11.3042C12.1557 11.5508 11.6793 12.1092 11.5344 12.2742C11.3887 12.44 11.2438 12.46 10.9952 12.3367C10.7465 12.2117 9.94429 11.9508 8.99391 11.1075C8.25453 10.4509 7.75464 9.64002 7.60978 9.39169C7.46492 9.14419 7.59387 9.01002 7.71863 8.88669C7.83084 8.77585 7.96732 8.59752 8.09209 8.45335C8.21685 8.30835 8.25788 8.20502 8.34078 8.03919C8.42451 7.87419 8.38265 7.73002 8.31985 7.60585C8.25788 7.48169 7.7605 6.26252 7.55284 5.76669C7.35104 5.28419 7.14589 5.35003 6.99349 5.34169C6.8478 5.33503 6.682 5.33336 6.51621 5.33336C6.35041 5.33336 6.08079 5.39503 5.85303 5.64336C5.62444 5.89086 4.98219 6.49002 4.98219 7.70919C4.98219 8.92752 5.87313 10.105 5.99789 10.2709C6.12266 10.4359 7.75213 12.9375 10.2482 14.01C10.8428 14.265 11.3058 14.4175 11.6667 14.5308C12.2629 14.72 12.8055 14.6933 13.2342 14.6292C13.7115 14.5583 14.7063 14.03 14.9139 13.4517C15.1208 12.8733 15.1208 12.3775 15.0588 12.2742C14.9968 12.1708 14.831 12.1092 14.5815 11.985H14.5823ZM10.0423 18.1542H10.0389C8.55634 18.1544 7.10099 17.7578 5.8254 17.0058L5.52396 16.8275L2.39062 17.6458L3.22712 14.6058L3.03035 14.2942C2.20149 12.9811 1.76286 11.4615 1.76512 9.91085C1.7668 5.36919 5.47958 1.6742 10.0456 1.6742C12.2562 1.6742 14.3345 2.53253 15.897 4.08919C16.6676 4.85301 17.2785 5.76133 17.6941 6.7616C18.1098 7.76188 18.322 8.83425 18.3186 9.91668C18.3169 14.4583 14.6041 18.1542 10.0423 18.1542ZM17.086 2.9067C16.1634 1.98247 15.0657 1.24965 13.8564 0.7507C12.6472 0.251754 11.3505 -0.00339687 10.0414 3.41479e-05C4.55347 3.41479e-05 0.0854091 4.44586 0.0837344 9.91002C0.0811914 11.649 0.539563 13.3578 1.4126 14.8642L0 20L5.27861 18.6217C6.73884 19.4134 8.37519 19.8283 10.0381 19.8283H10.0423C15.5302 19.8283 19.9983 15.3825 20 9.91752C20.004 8.61525 19.7485 7.32511 19.2484 6.12172C18.7482 4.91833 18.0132 3.82559 17.086 2.9067Z" fill="#0072BB"/>
                        </svg>
                        <span>{{ $footerWhatsapp }}</span>
                    </a>
                    <a class="nm-site-footer__contact-item nm-site-footer__contact-item--phone" href="{{ $footerPhonePrimaryHref }}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                            <path d="M17 12.5C15.8 12.5 14.5 12.3 13.4 11.9H13.1C12.8 11.9 12.6 12 12.4 12.2L10.2 14.4C7.4 12.9 5 10.6 3.6 7.8L5.8 5.6C6.1 5.3 6.2 4.9 6 4.6C5.7 3.5 5.5 2.2 5.5 1C5.5 0.5 5 0 4.5 0H1C0.5 0 0 0.5 0 1C0 10.4 7.6 18 17 18C17.5 18 18 17.5 18 17V13.5C18 13 17.5 12.5 17 12.5ZM2 2H3.5C3.6 2.9 3.8 3.8 4 4.6L2.8 5.8C2.4 4.6 2.1 3.3 2 2ZM16 16C14.7 15.9 13.4 15.6 12.2 15.2L13.4 14C14.2 14.2 15.1 14.4 16 14.4V16Z" fill="#0072BB"/>
                        </svg>
                        <span>{{ $footerPhonePrimary }}</span>
                    </a>
                    <a class="nm-site-footer__contact-item nm-site-footer__contact-item--phone" href="{{ $footerPhoneSecondaryHref }}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                            <path d="M17 12.5C15.8 12.5 14.5 12.3 13.4 11.9H13.1C12.8 11.9 12.6 12 12.4 12.2L10.2 14.4C7.4 12.9 5 10.6 3.6 7.8L5.8 5.6C6.1 5.3 6.2 4.9 6 4.6C5.7 3.5 5.5 2.2 5.5 1C5.5 0.5 5 0 4.5 0H1C0.5 0 0 0.5 0 1C0 10.4 7.6 18 17 18C17.5 18 18 17.5 18 17V13.5C18 13 17.5 12.5 17 12.5ZM2 2H3.5C3.6 2.9 3.8 3.8 4 4.6L2.8 5.8C2.4 4.6 2.1 3.3 2 2ZM16 16C14.7 15.9 13.4 15.6 12.2 15.2L13.4 14C14.2 14.2 15.1 14.4 16 14.4V16Z" fill="#0072BB"/>
                        </svg>
                        <span>{{ $footerPhoneSecondary }}</span>
                    </a>
                    @foreach ($footerContactItems as $contactItem)
                        @php
                            $contactHref = match ($contactItem->type) {
                                'email' => 'mailto:'.$contactItem->value,
                                'whatsapp' => 'https://wa.me/'.preg_replace('/\D+/', '', $contactItem->value),
                                default => 'tel:'.preg_replace('/\D+/', '', $contactItem->value),
                            };
                            $contactClass = match ($contactItem->type) {
                                'email' => 'nm-site-footer__contact-item--email',
                                'whatsapp' => 'nm-site-footer__contact-item--whatsapp',
                                default => 'nm-site-footer__contact-item--phone',
                            };
                        @endphp
                        <a class="nm-site-footer__contact-item {{ $contactClass }}" href="{{ $contactHref }}" @if ($contactItem->type === 'whatsapp') target="_blank" rel="noopener noreferrer" @endif>
                            @if ($contactItem->type === 'email')
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                    <path d="M18.3337 5.8335L10.8587 10.5835C10.6014 10.7447 10.3039 10.8302 10.0003 10.8302C9.69673 10.8302 9.39926 10.7447 9.14199 10.5835L1.66699 5.8335M3.33366 3.3335H16.667C17.5875 3.3335 18.3337 4.07969 18.3337 5.00016V15.0002C18.3337 15.9206 17.5875 16.6668 16.667 16.6668H3.33366C2.41318 16.6668 1.66699 15.9206 1.66699 15.0002V5.00016C1.66699 4.07969 2.41318 3.3335 3.33366 3.3335Z" stroke="#0072BB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            @elseif ($contactItem->type === 'whatsapp')
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M14.5823 11.985C14.3328 11.8608 13.1095 11.2625 12.8817 11.1792C12.6539 11.0967 12.4881 11.0558 12.3215 11.3042C12.1557 11.5508 11.6793 12.1092 11.5344 12.2742C11.3887 12.44 11.2438 12.46 10.9952 12.3367C10.7465 12.2117 9.94429 11.9508 8.99391 11.1075C8.25453 10.4509 7.75464 9.64002 7.60978 9.39169C7.46492 9.14419 7.59387 9.01002 7.71863 8.88669C7.83084 8.77585 7.96732 8.59752 8.09209 8.45335C8.21685 8.30835 8.25788 8.20502 8.34078 8.03919C8.42451 7.87419 8.38265 7.73002 8.31985 7.60585C8.25788 7.48169 7.7605 6.26252 7.55284 5.76669C7.35104 5.28419 7.14589 5.35003 6.99349 5.34169C6.8478 5.33503 6.682 5.33336 6.51621 5.33336C6.35041 5.33336 6.08079 5.39503 5.85303 5.64336C5.62444 5.89086 4.98219 6.49002 4.98219 7.70919C4.98219 8.92752 5.87313 10.105 5.99789 10.2709C6.12266 10.4359 7.75213 12.9375 10.2482 14.01C10.8428 14.265 11.3058 14.4175 11.6667 14.5308C12.2629 14.72 12.8055 14.6933 13.2342 14.6292C13.7115 14.5583 14.7063 14.03 14.9139 13.4517C15.1208 12.8733 15.1208 12.3775 15.0588 12.2742C14.9968 12.1708 14.831 12.1092 14.5815 11.985H14.5823ZM10.0423 18.1542H10.0389C8.55634 18.1544 7.10099 17.7578 5.8254 17.0058L5.52396 16.8275L2.39062 17.6458L3.22712 14.6058L3.03035 14.2942C2.20149 12.9811 1.76286 11.4615 1.76512 9.91085C1.7668 5.36919 5.47958 1.6742 10.0456 1.6742C12.2562 1.6742 14.3345 2.53253 15.897 4.08919C16.6676 4.85301 17.2785 5.76133 17.6941 6.7616C18.1098 7.76188 18.322 8.83425 18.3186 9.91668C18.3169 14.4583 14.6041 18.1542 10.0423 18.1542ZM17.086 2.9067C16.1634 1.98247 15.0657 1.24965 13.8564 0.7507C12.6472 0.251754 11.3505 -0.00339687 10.0414 3.41479e-05C4.55347 3.41479e-05 0.0854091 4.44586 0.0837344 9.91002C0.0811914 11.649 0.539563 13.3578 1.4126 14.8642L0 20L5.27861 18.6217C6.73884 19.4134 8.37519 19.8283 10.0381 19.8283H10.0423C15.5302 19.8283 19.9983 15.3825 20 9.91752C20.004 8.61525 19.7485 7.32511 19.2484 6.12172C18.7482 4.91833 18.0132 3.82559 17.086 2.9067Z" fill="#0072BB"/>
                                </svg>
                            @else
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                                    <path d="M17 12.5C15.8 12.5 14.5 12.3 13.4 11.9H13.1C12.8 11.9 12.6 12 12.4 12.2L10.2 14.4C7.4 12.9 5 10.6 3.6 7.8L5.8 5.6C6.1 5.3 6.2 4.9 6 4.6C5.7 3.5 5.5 2.2 5.5 1C5.5 0.5 5 0 4.5 0H1C0.5 0 0 0.5 0 1C0 10.4 7.6 18 17 18C17.5 18 18 17.5 18 17V13.5C18 13 17.5 12.5 17 12.5ZM2 2H3.5C3.6 2.9 3.8 3.8 4 4.6L2.8 5.8C2.4 4.6 2.1 3.3 2 2ZM16 16C14.7 15.9 13.4 15.6 12.2 15.2L13.4 14C14.2 14.2 15.1 14.4 16 14.4V16Z" fill="#0072BB"/>
                                </svg>
                            @endif
                            <span>{{ $contactItem->value }}</span>
                        </a>
                    @endforeach
                </address>
            </section>
        </div>

        <div class="nm-site-footer__copyright">
            <div class="nm-site-footer__copyright-inner">
                <p class="nm-site-footer__copy">
                    {!! preg_replace('/(Nicolais Mario e Hijo)/', '<strong>$1</strong>', e($footerCopyright), 1) !!}
                </p>
                @if ($isClientZone)
                    <span class="nm-site-footer__by">By&nbsp;<strong>Osole</strong></span>
                @else
                    <a class="nm-site-footer__by" href="https://osole.com.ar/" target="_blank" rel="noopener noreferrer">
                        By&nbsp;<strong>Osole</strong>
                    </a>
                @endif
            </div>
        </div>
    </footer>

    @php
        $floatingWhatsappUrl = $footerSettings?->whatsapp_url ?: 'https://wa.me/5491160948992';
    @endphp

    @if ($floatingWhatsappUrl)
        <a
            class="floating-whatsapp"
            href="{{ $floatingWhatsappUrl }}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Enviar mensaje por WhatsApp"
        >
            <span class="floating-whatsapp__icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M23.3317 19.176C22.9325 18.9774 20.9751 18.02 20.6107 17.8867C20.2463 17.7547 19.981 17.6894 19.7144 18.0867C19.4491 18.4814 18.6868 19.3747 18.4551 19.6387C18.2219 19.904 17.9902 19.936 17.5923 19.7387C17.1943 19.5387 15.9109 19.1214 14.3903 17.772C13.2073 16.7214 12.4074 15.424 12.1756 15.0267C11.9439 14.6307 12.1502 14.416 12.3498 14.2187C12.5293 14.0414 12.7477 13.756 12.9473 13.5254C13.147 13.2934 13.2126 13.128 13.3452 12.8627C13.4792 12.5987 13.4122 12.368 13.3118 12.1694C13.2126 11.9707 12.4168 10.02 12.0845 9.22671C11.7617 8.45471 11.4334 8.56004 11.1896 8.54671C10.9565 8.53604 10.6912 8.53337 10.4259 8.53337C10.1607 8.53337 9.72926 8.63204 9.36485 9.02937C8.9991 9.42537 7.97151 10.384 7.97151 12.3347C7.97151 14.284 9.39701 16.168 9.59663 16.4334C9.79625 16.6974 12.4034 20.7 16.3972 22.416C17.3484 22.824 18.0893 23.068 18.6667 23.2493C19.6206 23.552 20.4888 23.5093 21.1747 23.4067C21.9384 23.2933 23.53 22.448 23.8623 21.5227C24.1932 20.5974 24.1932 19.804 24.0941 19.6387C23.9949 19.4734 23.7296 19.3747 23.3304 19.176H23.3317ZM16.0676 29.0467H16.0623C13.6901 29.0471 11.3616 28.4125 9.32064 27.2093L8.83833 26.924L3.82499 28.2333L5.1634 23.3693L4.84855 22.8707C3.52239 20.7698 2.82057 18.3384 2.82419 15.8574C2.82687 8.59071 8.76732 2.67872 16.073 2.67872C19.6099 2.67872 22.9352 4.05205 25.4352 6.54271C26.6682 7.76482 27.6456 9.21813 28.3106 10.8186C28.9757 12.419 29.3153 14.1348 29.3097 15.8667C29.307 23.1333 23.3666 29.0467 16.0676 29.0467ZM27.3376 4.65071C25.8614 3.17195 24.1051 1.99943 22.1703 1.20112C20.2355 0.402806 18.1608 -0.00543499 16.0663 5.46367e-05C7.28556 5.46367e-05 0.136654 7.11338 0.133975 15.856C0.129906 18.6384 0.863301 21.3725 2.26016 23.7827L0 32L8.44578 29.7947C10.7821 31.0615 13.4003 31.7253 16.0609 31.7253H16.0676C24.8483 31.7253 31.9972 24.612 31.9999 15.868C32.0064 13.7844 31.5977 11.7202 30.7974 9.79475C29.9971 7.86933 28.8212 6.12094 27.3376 4.65071Z" fill="white"/>
                </svg>
            </span>
            <span class="floating-whatsapp__label" aria-hidden="true">Escríbenos por WhatsApp</span>
        </a>
    @endif

    <script nonce="{{ request()->attributes->get('csp-nonce') }}">
        (() => {
            const syncFloatingWhatsapp = () => {
                const button = document.querySelector(".floating-whatsapp");
                const copyright = document.querySelector(".nm-site-footer__copyright");

                if (!button || !copyright) {
                    return;
                }

                const isCompact = window.matchMedia("(max-width: 768px)").matches;
                const baseBottom = isCompact ? 20 : 60;
                const gap = isCompact ? 16 : 20;
                const rect = copyright.getBoundingClientRect();
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                const footerLimitBottom = Math.max(baseBottom, viewportHeight - rect.top + gap);

                button.style.setProperty(
                    "--floating-whatsapp-bottom",
                    `${Math.round(rect.top < viewportHeight ? footerLimitBottom : baseBottom)}px`
                );
            };

            window.addEventListener("load", syncFloatingWhatsapp, { once: true });
            window.addEventListener("scroll", syncFloatingWhatsapp, { passive: true });
            window.addEventListener("resize", syncFloatingWhatsapp);
            document.addEventListener("DOMContentLoaded", syncFloatingWhatsapp);
        })();
    </script>

    <script nonce="{{ request()->attributes->get('csp-nonce') }}">
        (() => {
            const isInternalUrl = (href) => {
                if (!href || /^(#|javascript:|mailto:|tel:)/i.test(href)) return false;

                try {
                    const url = new URL(href, window.location.href);
                    return url.origin === window.location.origin && url.href !== window.location.href;
                } catch {
                    return false;
                }
            };

            const transition = document.querySelector("[data-page-transition]");
            window.addEventListener("pageshow", () => {
                transition?.classList.remove("is-active");
            });

            document.addEventListener("click", (event) => {
                if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

                const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
                if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

                if (isInternalUrl(link.getAttribute("href"))) {
                    transition?.classList.add("is-active");
                }
            }, { capture: true });

        })();
    </script>

    <script nonce="{{ request()->attributes->get('csp-nonce') }}">
        (() => {
            const heartbeatUrl = @json(route('web.presence.heartbeat'));
            const leaveUrl = @json(route('web.presence.leave'));
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            const buildPayload = (event) => {
                const data = new FormData();
                data.append('_token', csrfToken || '');
                data.append('event', event);
                data.append('path', window.location.pathname);
                data.append('url', window.location.href);
                data.append('title', document.title || '');

                return data;
            };
            const send = (url, event, keepalive = false) => {
                const payload = buildPayload(event);

                if (keepalive && navigator.sendBeacon) {
                    navigator.sendBeacon(url, payload);
                    return;
                }

                fetch(url, {
                    method: 'POST',
                    body: payload,
                    credentials: 'same-origin',
                    keepalive,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                }).catch(() => {});
            };
            const heartbeat = () => send(heartbeatUrl, document.visibilityState === 'hidden' ? 'hidden' : 'active');
            const leave = () => send(leaveUrl, 'left', true);

            window.addEventListener('load', heartbeat, { once: true });
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    leave();
                } else {
                    heartbeat();
                }
            });
            window.addEventListener('pagehide', leave);
            window.setInterval(heartbeat, 30000);
        })();
    </script>

    @vite('resources/js/web.js')
    @stack('scripts')
</body>
</html>

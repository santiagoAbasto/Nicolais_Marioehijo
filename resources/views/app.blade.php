<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    @php
        $appName = config('app.name', 'Nicolais Mario e Hijo');
        $appDescription = 'Repuestos automotores, transmisión y gestión comercial de Nicolais Mario e Hijo.';
        $canonicalUrl = url()->current();
        $robots = request()->is('admin*') ? 'noindex,nofollow' : 'index,follow';
        $cspNonce = request()->attributes->get('csp-nonce');
        $shareImage = default_seo_image_url() ?: asset('storage/brand/logo.svg');
        $faviconVersion = max(array_map(
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
        )) ?: '1';
    @endphp

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title inertia>{{ $appName }}</title>
    <link rel="shortcut icon" href="{{ asset('favicon/favicon.ico') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon/favicon.ico') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/svg+xml" href="{{ asset('favicon/favicon.svg') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/png" sizes="96x96" href="{{ asset('favicon/favicon-96x96.png') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/png" sizes="192x192" href="{{ asset('favicon/web-app-manifest-192x192.png') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/png" sizes="512x512" href="{{ asset('favicon/web-app-manifest-512x512.png') }}?v={{ $faviconVersion }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('favicon/apple-touch-icon.png') }}?v={{ $faviconVersion }}">
    <link rel="manifest" href="{{ route('web.manifest') }}?v={{ $faviconVersion }}">
    <meta name="theme-color" content="#ffffff">
    <meta name="description" content="{{ $appDescription }}">
    <meta name="robots" content="{{ $robots }}">
    <link rel="canonical" href="{{ $canonicalUrl }}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="{{ $appName }}">
    <meta property="og:title" content="{{ $appName }}">
    <meta property="og:description" content="{{ $appDescription }}">
    <meta property="og:url" content="{{ $canonicalUrl }}">
    <meta property="og:image" content="{{ $shareImage }}">
    <meta property="og:image:secure_url" content="{{ $shareImage }}">
    <meta property="og:image:alt" content="{{ $appName }}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{{ $appName }}">
    <meta name="twitter:description" content="{{ $appDescription }}">
    <meta name="twitter:image" content="{{ $shareImage }}">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Scripts -->
    @routes(null, $cspNonce)
    <script nonce="{{ $cspNonce }}">
        window.__BUNDLED_DEV__ = false;
        window.__SERVER_FORWARD_CONSOLE__ = false;
    </script>
    @viteReactRefresh

    @vite([
        'resources/css/admin/app.css',
        'resources/js/app.jsx',
        "resources/js/Pages/{$page['component']}.jsx"
    ])

    @inertiaHead

</head>

<body class="font-sans antialiased">

    @inertia

</body>
</html>

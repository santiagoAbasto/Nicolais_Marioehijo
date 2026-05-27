@php
    $faviconFiles = [
        'favicon/favicon.ico',
        'favicon/favicon.svg',
        'favicon/favicon-96x96.png',
        'favicon/web-app-manifest-192x192.png',
        'favicon/web-app-manifest-512x512.png',
        'favicon/apple-touch-icon.png',
        'favicon/site.webmanifest',
    ];
    $faviconVersion = max(array_map(
        fn (string $file): int => file_exists(public_path($file)) ? filemtime(public_path($file)) : 1,
        $faviconFiles,
    ));
@endphp
@php
    $usesOfficeViewer = $usesOfficeViewer ?? false;
    $rawFileUrl = $rawFileUrl ?? $fileUrl;
    $isExcel = ($fileFormat ?? '') === 'EXCEL';
@endphp
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>{{ $title }} | Nicolais Mario e Hijo</title>
    <link rel="shortcut icon" href="{{ asset('favicon/favicon.ico') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon/favicon.ico') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/svg+xml" href="{{ asset('favicon/favicon.svg') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/png" sizes="96x96" href="{{ asset('favicon/favicon-96x96.png') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/png" sizes="192x192" href="{{ asset('favicon/web-app-manifest-192x192.png') }}?v={{ $faviconVersion }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('favicon/apple-touch-icon.png') }}?v={{ $faviconVersion }}">
    <link rel="manifest" href="{{ route('web.manifest') }}?v={{ $faviconVersion }}">
    <style nonce="{{ request()->attributes->get('csp-nonce') }}">
        :root {
            --Celeste: #0072BB;
            --Negro: #111010;
            --Blanco: #fff;
            font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        * {
            box-sizing: border-box;
        }

        body {
            background: #eef4f8;
            color: var(--Negro);
            margin: 0;
        }

        .price-list-view {
            display: grid;
            gap: 18px;
            margin: 0 auto;
            max-width: 1366px;
            min-height: 100vh;
            padding: 24px;
        }

        .price-list-view__header {
            align-items: center;
            background: var(--Blanco);
            border: 1px solid #d9e2ea;
            border-radius: 12px;
            display: flex;
            gap: 20px;
            justify-content: space-between;
            padding: 18px 22px;
        }

        .price-list-view__brand {
            align-items: center;
            display: flex;
            gap: 16px;
            min-width: 0;
        }

        .price-list-view__brand img {
            display: block;
            height: 54px;
            width: 168px;
        }

        .price-list-view__title {
            min-width: 0;
        }

        .price-list-view__title span {
            color: var(--Celeste);
            display: block;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
        }

        .price-list-view__title h1 {
            font-size: 22px;
            line-height: 1.2;
            margin: 4px 0 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .price-list-view__actions {
            align-items: center;
            display: flex;
            gap: 14px;
        }

        .price-list-view__button {
            align-items: center;
            border-radius: 8px;
            display: inline-flex;
            font-size: 16px;
            font-weight: 700;
            height: 46px;
            justify-content: center;
            min-width: 142px;
            padding: 0 18px;
            text-decoration: none;
        }

        .price-list-view__button--outline {
            background: var(--Blanco);
            border: 1px solid var(--Celeste);
            color: var(--Celeste);
        }

        .price-list-view__button--primary {
            background: var(--Celeste);
            border: 1px solid var(--Celeste);
            color: var(--Blanco);
        }

        .price-list-view__frame {
            background: var(--Blanco);
            border: 1px solid #d9e2ea;
            border-radius: 12px;
            min-height: calc(100vh - 142px);
            overflow: hidden;
        }

        .price-list-view__frame iframe {
            border: 0;
            display: block;
            height: calc(100vh - 144px);
            min-height: 640px;
            width: 100%;
        }

        @media (max-width: 760px) {
            .price-list-view {
                padding: 12px;
            }

            .price-list-view__header {
                align-items: flex-start;
                flex-direction: column;
            }

            .price-list-view__actions,
            .price-list-view__button {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <main class="price-list-view">
        <header class="price-list-view__header">
            <div class="price-list-view__brand">
                <img src="{{ asset('storage/brand/logo.svg') }}" alt="Nicolais Mario e Hijo" width="168" height="54">
                <div class="price-list-view__title">
                    <span>Lista de precios</span>
                    <h1>{{ $title }}</h1>
                </div>
            </div>

            <div class="price-list-view__actions">
                <a class="price-list-view__button price-list-view__button--outline" href="{{ $usesOfficeViewer ? $fileUrl : $rawFileUrl }}" target="_blank" rel="noopener">Abrir archivo</a>
                <a class="price-list-view__button price-list-view__button--primary" href="{{ $downloadUrl }}">Descargar</a>
            </div>
        </header>

        <section class="price-list-view__frame" aria-label="{{ $fileName }}">
            @if ($isExcel && ! $usesOfficeViewer)
                <div style="display:grid;min-height:640px;place-items:center;padding:32px;text-align:center;">
                    <div>
                        <strong style="display:block;font-size:24px;margin-bottom:10px;">Vista online disponible en producción</strong>
                        <p style="color:#5c5c5c;font-size:16px;line-height:1.5;margin:0 auto 22px;max-width:560px;">
                            Los archivos Excel se visualizan con Office Online cuando el sitio está publicado en un dominio accesible. En local podés descargarlo o abrirlo desde el botón superior.
                        </p>
                        <a class="price-list-view__button price-list-view__button--primary" href="{{ $downloadUrl }}" style="margin:auto;">Descargar</a>
                    </div>
                </div>
            @else
                <iframe src="{{ $fileUrl }}" title="{{ $fileName }}"></iframe>
            @endif
        </section>
    </main>
</body>
</html>

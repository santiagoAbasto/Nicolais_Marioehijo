@php
    $money = fn (float $value): string => '$'.number_format($value, 2, ',', '.');
    $statusLabels = [
        'pending' => 'Pendiente',
        'invoiced' => 'Facturado',
        'dispatched' => 'Despachado',
        'delivered' => 'Entregado',
    ];
    $isPdf = $isPdf ?? false;
    $attachment = $attachment ?? null;
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
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Pedido {{ $order->order_number }}</title>
    <link rel="shortcut icon" href="{{ asset('favicon/favicon.ico') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon/favicon.ico') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/svg+xml" href="{{ asset('favicon/favicon.svg') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/png" sizes="96x96" href="{{ asset('favicon/favicon-96x96.png') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/png" sizes="192x192" href="{{ asset('favicon/web-app-manifest-192x192.png') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/png" sizes="512x512" href="{{ asset('favicon/web-app-manifest-512x512.png') }}?v={{ $faviconVersion }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('favicon/apple-touch-icon.png') }}?v={{ $faviconVersion }}">
    @if (! $isPdf)
        <link rel="manifest" href="{{ route('web.manifest') }}?v={{ $faviconVersion }}">
        <meta name="theme-color" content="#0072bb">
    @endif
    <style nonce="{{ request()->attributes->get('csp-nonce') }}">
        @page { margin: 18px 22px; }
        * { box-sizing: border-box; }
        body { background: #ffffff; color: #111010; font-family: "Plus Jakarta Sans", "DejaVu Sans", Arial, sans-serif; font-size: 10.5px; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .page { background: #ffffff; padding: 0; }
        .header { border-bottom: 3px solid #0072bb; display: table; padding-bottom: 12px; width: 100%; }
        .brand, .meta { display: table-cell; vertical-align: top; }
        .brand img { height: 56px; width: 174px; }
        .meta { text-align: right; }
        .meta h1 { font-size: 24px; line-height: 1; margin: 0 0 8px; }
        .meta p { color: #5c5c5c; font-size: 10.5px; margin: 3px 0; }
        .badge { background: #eaf6fd; border-radius: 999px; color: #0072bb; display: inline-block; font-size: 8px; font-weight: 700; letter-spacing: .08em; margin-top: 5px; padding: 4px 8px; text-transform: uppercase; }
        .section { margin-top: 14px; }
        .grid { display: table; width: 100%; }
        .col { display: table-cell; padding-right: 12px; vertical-align: top; width: 50%; }
        .col + .col { padding-right: 0; padding-left: 0; }
        .card { background: #fbfdff; border: 1px solid #d9d9d9; border-radius: 8px; min-height: 78px; padding: 10px 12px; }
        .label { color: #0072bb; font-size: 8px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
        .value { color: #111010; font-size: 10.5px; font-weight: 600; line-height: 1.35; margin: 3px 0 7px; }
        table { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: 100%; }
        .items { border: 1px solid #d9d9d9; border-radius: 8px; overflow: hidden; }
        th { background: #000; color: #fff; font-family: "Plus Jakarta Sans", "DejaVu Sans", Arial, sans-serif; font-size: 9.5px; font-weight: 700; padding: 8px 5px; text-align: left; }
        td { border-bottom: 1px solid #d9d9d9; color: #111010; font-family: "Plus Jakarta Sans", "DejaVu Sans", Arial, sans-serif; font-size: 9.5px; line-height: 1.28; padding: 8px 5px; vertical-align: top; word-wrap: break-word; }
        tbody tr:last-child td { border-bottom: 0; }
        .right { text-align: right; }
        .green { color: #308c05; }
        .items .family { width: 11%; }
        .items .code { width: 8%; }
        .items .description { width: 22%; }
        .items .type { width: 12%; }
        .items .quantity { width: 5%; }
        .items .price { width: 10%; }
        .items .subtotal { width: 12%; }
        .totals { border: 1px solid #d9d9d9; border-radius: 8px; margin-left: auto; margin-top: 14px; padding: 9px 12px; width: 340px; }
        .totals td { border: 0; font-size: 10px; padding: 4px 0; }
        .totals .line td { border-top: 1px solid #d9d9d9; padding-top: 9px; }
        .total { font-weight: 700; }
        .attachment { background: #fbfdff; border: 1px solid #d9d9d9; border-radius: 8px; margin-top: 14px; padding: 10px 12px; page-break-inside: avoid; }
        .attachment .title { color: #0072bb; font-size: 8px; font-weight: 700; letter-spacing: .1em; margin-bottom: 5px; text-transform: uppercase; }
        .attachment .name { color: #111010; font-size: 10.5px; font-weight: 700; line-height: 1.35; margin-bottom: 5px; }
        .attachment .meta-file { color: #5c5c5c; font-size: 8.8px; line-height: 1.35; }
        .attachment img { border: 1px solid #d9d9d9; border-radius: 6px; display: block; margin-top: 9px; max-height: 155px; max-width: 260px; object-fit: contain; }
        .attachment-link { color: #0072bb; font-weight: 700; text-decoration: none; }
        .note { border-top: 2px solid #0072bb; color: #5c5c5c; font-size: 8.5px; line-height: 1.35; margin-top: 14px; padding-top: 10px; }

        body.order-online { background: #eef3f8; font-family: "Plus Jakarta Sans", Arial, sans-serif; font-size: 16px; padding: 18px; }
        body.order-online .page { background: #ffffff; border: 1px solid #d9e2ec; border-radius: 18px; box-shadow: 0 24px 70px rgba(15,23,42,.14); margin: 0 auto; max-width: 1240px; padding: 24px; }
        body.order-online .header { border-bottom-width: 4px; padding-bottom: 24px; }
        body.order-online .brand img { height: 72px; width: 222px; }
        body.order-online .meta h1 { font-size: 32px; margin-bottom: 10px; }
        body.order-online .meta p { font-size: 15px; margin: 5px 0; }
        body.order-online .badge { font-size: 11px; padding: 6px 10px; }
        body.order-online .section { margin-top: 22px; }
        body.order-online .col { padding-right: 20px; }
        body.order-online .card { border-radius: 12px; min-height: 128px; padding: 18px; }
        body.order-online .label { font-size: 11px; }
        body.order-online .value { font-size: 16px; margin: 6px 0 14px; }
        body.order-online th { font-size: 14px; padding: 14px 10px; }
        body.order-online td { font-size: 14px; padding: 14px 10px; }
        body.order-online .totals { margin-top: 22px; padding: 14px 16px; width: 390px; }
        body.order-online .totals td { font-size: 15px; padding: 8px 0; }
        body.order-online .attachment { border-radius: 12px; margin-top: 22px; padding: 16px 18px; }
        body.order-online .attachment .title { font-size: 11px; }
        body.order-online .attachment .name { font-size: 16px; }
        body.order-online .attachment .meta-file { font-size: 13px; }
        body.order-online .attachment img { max-height: 240px; max-width: 420px; }
        body.order-online .note { font-size: 13px; margin-top: 22px; }
        body.order-pdf .header { border-bottom-width: 3px; padding-bottom: 9px; }
        body.order-pdf .brand img { height: 50px; width: 155px; }
        body.order-pdf .meta h1 { color: #111010; font-size: 21px; margin-bottom: 5px; }
        body.order-pdf .meta p { color: #5c5c5c; font-size: 9.4px; margin: 2px 0; }
        body.order-pdf .badge { background: #eaf6fd; color: #0072bb; font-size: 7.4px; margin-top: 3px; padding: 3px 7px; }
        body.order-pdf .section { margin-top: 9px; }
        body.order-pdf .col { padding-right: 9px; }
        body.order-pdf .card { background: #fbfdff; border-color: #d9d9d9; border-radius: 6px; min-height: 58px; padding: 7px 9px; }
        body.order-pdf .label { color: #0072bb; font-size: 7.4px; letter-spacing: .09em; }
        body.order-pdf .value { color: #111010; font-size: 9.4px; line-height: 1.2; margin: 2px 0 4px; }
        body.order-pdf th { background: #000; color: #fff; font-size: 8.8px; padding: 6px 4px; }
        body.order-pdf td { color: #111010; font-size: 8.8px; line-height: 1.18; padding: 6px 4px; }
        body.order-pdf .green { color: #308c05; }
        body.order-pdf .totals { background: #ffffff; border-color: #d9d9d9; border-radius: 6px; margin-top: 9px; padding: 6px 9px; width: 310px; }
        body.order-pdf .totals td { font-size: 9px; padding: 2px 0; }
        body.order-pdf .totals .line td { padding-top: 6px; }
        body.order-pdf .attachment { background: #fbfdff; border-color: #d9d9d9; border-radius: 6px; margin-top: 8px; padding: 6px 9px; }
        body.order-pdf .attachment .title { color: #0072bb; font-size: 7.4px; margin-bottom: 3px; }
        body.order-pdf .attachment .name { color: #111010; font-size: 9px; line-height: 1.15; margin-bottom: 3px; }
        body.order-pdf .attachment .meta-file { color: #5c5c5c; font-size: 7.8px; line-height: 1.15; }
        body.order-pdf .attachment img { margin-top: 5px; max-height: 74px; max-width: 170px; }
        body.order-pdf .note { border-top-color: #0072bb; color: #5c5c5c; font-size: 7.4px; line-height: 1.2; margin-top: 8px; padding-top: 6px; }
    </style>
</head>
<body class="{{ $isPdf ? 'order-pdf' : 'order-online' }}">
    <main class="page">
        <header class="header">
            <div class="brand">
                @if ($logoDataUri)
                    <img src="{{ $logoDataUri }}" alt="Nicolais Mario e Hijo">
                @endif
            </div>
            <div class="meta">
                <h1>Pedido {{ $order->order_number }}</h1>
                <p><strong>Estado:</strong> {{ $statusLabels[$order->status] ?? $order->status }}</p>
                <p><strong>Fecha:</strong> {{ $order->created_at?->format('d/m/Y H:i') }}</p>
                <span class="badge">Zona Cliente</span>
            </div>
        </header>

        <section class="section grid">
            <div class="col">
                <div class="card">
                    <div class="label">Cliente</div>
                    <div class="value">{{ $order->clientRequest?->full_name }}</div>
                    <div class="label">Empresa</div>
                    <div class="value">{{ $order->clientRequest?->company ?: '-' }}</div>
                    <div class="label">Correo</div>
                    <div class="value">{{ $order->clientRequest?->email }}</div>
                </div>
            </div>
            <div class="col">
                <div class="card">
                    <div class="label">Forma de entrega</div>
                    <div class="value">{{ $order->delivery_method ?: '-' }}</div>
                    <div class="label">Mensaje</div>
                    <div class="value">{{ $order->message ?: '-' }}</div>
                </div>
            </div>
        </section>

        <section class="section">
            <table class="items">
                <colgroup>
                    <col class="family">
                    <col class="code">
                    <col class="description">
                    <col class="type">
                    <col class="quantity">
                    <col class="price">
                    <col class="price">
                    <col class="price">
                    <col class="subtotal">
                </colgroup>
                <thead>
                    <tr>
                        <th>Marca/Familia</th>
                        <th>Código</th>
                        <th>Descripción</th>
                        <th>Tipo</th>
                        <th class="right">Cant.</th>
                        <th class="right">Precio lista</th>
                        <th class="right">Precio desc.</th>
                        <th class="right">Precio venta</th>
                        <th class="right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($order->items as $item)
                        <tr>
                            <td>{{ $item->family ?: '-' }}</td>
                            <td>{{ $item->code ?: '-' }}</td>
                            <td>{{ $item->description }}</td>
                            <td>{{ $item->type ?: '-' }}</td>
                            <td class="right">{{ $item->quantity }}</td>
                            <td class="right">{{ $money($item->list_price) }}</td>
                            <td class="right green">{{ $money($item->discounted_price) }}<br>({{ number_format($item->discount_percent, 0, ',', '.') }}%)</td>
                            <td class="right">{{ $money($item->sale_price) }}<br>({{ number_format($item->margin_percent, 0, ',', '.') }}%)</td>
                            <td class="right">{{ $money($item->subtotal) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </section>

        <table class="totals">
            <tr><td>Subtotal sin descuento</td><td class="right">{{ $money($order->subtotal_list) }}</td></tr>
            <tr><td class="green">Descuentos</td><td class="right green">-{{ $money($order->discount_total) }}</td></tr>
            <tr><td>Subtotal con descuento</td><td class="right">{{ $money($order->subtotal_discount) }}</td></tr>
            <tr class="line"><td>IVA 21%</td><td class="right">{{ $money($order->iva) }}</td></tr>
            <tr class="total"><td>Total (IVA incluido)</td><td class="right">{{ $money($order->total) }}</td></tr>
        </table>

        @if ($attachment)
            <section class="attachment">
                <div class="title">Archivo adjunto</div>
                <div class="name">{{ $attachment['name'] }}</div>
                <div class="meta-file">{{ $attachment['mime'] }}</div>
                @if ($attachment['is_image'] && $attachment['data_uri'])
                    <img src="{{ $attachment['data_uri'] }}" alt="{{ $attachment['name'] }}">
                @elseif (! $isPdf)
                    <div class="meta-file">
                        <a class="attachment-link" href="{{ $attachment['url'] }}" target="_blank" rel="noopener">Ver archivo adjunto</a>
                    </div>
                @else
                    <div class="meta-file">Archivo adjunto disponible en el pedido original.</div>
                @endif
            </section>
        @endif

        <p class="note">Documento emitido por Nicolais Mario e Hijo para seguimiento de pedido en Zona Cliente. Los precios están expresados en pesos argentinos y sujetos a disponibilidad.</p>
    </main>
</body>
</html>

@php
    $money = fn (float $value): string => '$'.number_format($value, 2, ',', '.');
    $isPdf = $isPdf ?? false;
    $attachment = $attachment ?? null;
    $products = $budget->items->whereNotNull('product_id')->values();
    $services = $budget->items->whereNull('product_id')->values();
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
    <title>Presupuesto {{ $budget->order_number }} | Nicolais Mario e Hijo</title>
    <link rel="shortcut icon" href="{{ asset('favicon/favicon.ico') }}?v={{ $faviconVersion }}">
    <link rel="icon" type="image/png" sizes="96x96" href="{{ asset('favicon/favicon-96x96.png') }}?v={{ $faviconVersion }}">
    @if (! $isPdf)
        <link rel="manifest" href="{{ route('web.manifest') }}?v={{ $faviconVersion }}">
        <meta name="theme-color" content="#0072bb">
    @endif
    <style nonce="{{ request()->attributes->get('csp-nonce') }}">
        @page { margin: 18px 22px; }
        * { box-sizing: border-box; }
        body { background: #eef3f8; color: #111010; font-family: "Plus Jakarta Sans", "DejaVu Sans", Arial, sans-serif; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .page { background: #ffffff; border: 1px solid #d9e2ec; border-radius: 18px; box-shadow: 0 24px 70px rgba(15,23,42,.14); margin: 18px auto; max-width: 1240px; padding: 24px; }
        .header { align-items: flex-start; border-bottom: 4px solid #0072bb; display: table; padding-bottom: 16px; width: 100%; }
        .brand, .meta { display: table-cell; vertical-align: top; }
        .brand img { display: block; height: 68px; width: 210px; }
        .meta { text-align: right; }
        .meta h1 { color: #111010; font-size: 32px; line-height: 1; margin: 0 0 8px; }
        .meta p { color: #5c5c5c; font-size: 13px; margin: 4px 0; }
        .badge { background: #eaf6fd; border-radius: 999px; color: #0072bb; display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: .08em; margin-top: 7px; padding: 6px 10px; text-transform: uppercase; }
        .top { display: table; margin-top: 16px; width: 100%; }
        .top .card { display: table-cell; width: 50%; }
        .top .card + .card { padding-left: 12px; }
        .box { background: #fbfdff; border: 1px solid #d9d9d9; border-radius: 12px; min-height: 76px; padding: 12px 14px; }
        .eyebrow { color: #0072bb; display: block; font-size: 10px; font-weight: 800; letter-spacing: .12em; margin-bottom: 6px; text-transform: uppercase; }
        .box strong { color: #111010; display: block; font-size: 13px; line-height: 1.45; }
        .section { margin-top: 16px; }
        .section h2 { color: #111010; font-size: 18px; margin: 0 0 9px; }
        table { border: 1px solid #d9d9d9; border-collapse: separate; border-radius: 10px; border-spacing: 0; font-size: 11.8px; line-height: 1.32; overflow: hidden; table-layout: fixed; width: 100%; }
        th { background: #000000; color: #ffffff; font-size: 11.8px; font-weight: 800; padding: 10px 8px; text-align: left; }
        td { border-bottom: 1px solid #d9d9d9; color: #111010; padding: 10px 8px; vertical-align: middle; }
        tr:last-child td { border-bottom: 0; }
        .right { text-align: right; }
        .center { text-align: center; }
        .green { color: #308c05; }
        .grid { display: table; margin-top: 16px; width: 100%; }
        .grid .panel { display: table-cell; width: 50%; }
        .grid .panel + .panel { padding-left: 16px; }
        .panel-box { border: 1px solid #d9d9d9; border-radius: 12px; overflow: hidden; }
        .panel-box h2 { background: #000000; color: #ffffff; font-size: 17px; margin: 0; padding: 11px 15px; }
        .panel-body { font-size: 12.5px; line-height: 1.5; min-height: 104px; padding: 13px 15px; }
        .summary-line { display: table; margin-bottom: 9px; width: 100%; }
        .summary-line span, .summary-line strong { display: table-cell; }
        .summary-line strong { text-align: right; }
        .summary-line.is-discount { color: #308c05; }
        .summary-line.is-total { border-top: 1px solid #d9d9d9; color: #111010; font-weight: 800; margin-top: 18px; padding-top: 14px; }
        .attachment { background: #fbfdff; border: 1px solid #d9d9d9; border-radius: 12px; margin-top: 16px; padding: 14px; page-break-inside: avoid; }
        .attachment img { border: 1px solid #d9d9d9; border-radius: 10px; display: block; margin-top: 9px; max-height: 210px; max-width: 360px; object-fit: contain; }
        .footer { border-top: 2px solid #0072bb; color: #5c5c5c; display: table; font-size: 11px; margin-top: 16px; padding-top: 12px; width: 100%; }
        .footer span { display: table-cell; }
        .footer span:last-child { text-align: right; white-space: nowrap; }
        .footer strong { color: #111010; }
        body.budget-pdf { background: #ffffff; font-size: 9.5px; }
        body.budget-pdf .page { border: 0; border-radius: 0; box-shadow: none; margin: 0; max-width: none; padding: 0; }
        body.budget-pdf .brand img { height: 48px; width: 150px; }
        body.budget-pdf .header { border-bottom-width: 3px; padding-bottom: 8px; }
        body.budget-pdf .meta h1 { font-size: 22px; }
        body.budget-pdf .meta p { font-size: 9px; margin: 2px 0; }
        body.budget-pdf .badge { font-size: 7.5px; margin-top: 4px; padding: 4px 8px; }
        body.budget-pdf .top, body.budget-pdf .section, body.budget-pdf .grid { margin-top: 9px; }
        body.budget-pdf .box { border-radius: 7px; min-height: 48px; padding: 7px 9px; }
        body.budget-pdf .eyebrow { font-size: 7.5px; margin-bottom: 3px; }
        body.budget-pdf .box strong { font-size: 9.5px; line-height: 1.2; }
        body.budget-pdf .section h2 { font-size: 14px; margin-bottom: 5px; }
        body.budget-pdf table { border-radius: 7px; font-size: 8.8px; line-height: 1.15; }
        body.budget-pdf th, body.budget-pdf td { padding: 5px; }
        body.budget-pdf .grid .panel + .panel { padding-left: 9px; }
        body.budget-pdf .panel-box { border-radius: 8px; }
        body.budget-pdf .panel-box h2 { font-size: 13px; padding: 7px 10px; }
        body.budget-pdf .panel-body { font-size: 9px; line-height: 1.28; min-height: 58px; padding: 8px 10px; }
        body.budget-pdf .summary-line { margin-bottom: 5px; }
        body.budget-pdf .summary-line.is-total { margin-top: 9px; padding-top: 8px; }
        body.budget-pdf .attachment { border-radius: 8px; margin-top: 9px; padding: 8px 10px; }
        body.budget-pdf .attachment img { max-height: 92px; max-width: 190px; }
        body.budget-pdf .footer { font-size: 8px; margin-top: 9px; padding-top: 7px; }
    </style>
</head>
<body class="{{ $isPdf ? 'budget-pdf' : 'budget-online' }}">
    <main class="page">
        <header class="header">
            <div class="brand">
                @if ($logoDataUri)
                    <img src="{{ $logoDataUri }}" alt="Nicolais Mario e Hijo">
                @endif
            </div>
            <div class="meta">
                <h1>Presupuesto</h1>
                <p>{{ $budget->created_at?->timezone('America/Argentina/Buenos_Aires')->format('d/m/y, g:i a') }} · Hora Argentina</p>
                <span class="badge">Zona Cliente</span>
            </div>
        </header>

        <section class="top">
            <article class="card"><div class="box"><span class="eyebrow">Forma de entrega</span><strong>{{ $budget->delivery_method ?: 'Retiro cliente' }}</strong></div></article>
            <article class="card"><div class="box"><span class="eyebrow">Mensaje</span><strong>{{ $budget->message ?: 'Sin observaciones.' }}</strong></div></article>
        </section>

        <section class="section">
            <h2>Productos</h2>
            <table>
                <thead>
                    <tr>
                        <th>Familia</th><th>Código</th><th>Descripción</th><th>Tipo</th><th class="right">Precio lista</th><th class="right">Precio con<br>descuento</th><th class="right">Precio venta</th><th class="center">Cant</th><th class="right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($products as $item)
                        <tr>
                            <td>{{ $item->family ?: '-' }}</td>
                            <td>{{ $item->code ?: '-' }}</td>
                            <td>{{ $item->description }}</td>
                            <td>{{ $item->type ?: '-' }}</td>
                            <td class="right">{{ $money($item->list_price) }}</td>
                            <td class="right green">{{ $money($item->discounted_price) }} ({{ number_format($item->discount_percent, 0, ',', '.') }}%)</td>
                            <td class="right">{{ $money($item->sale_price) }} ({{ number_format($item->margin_percent, 0, ',', '.') }}%)</td>
                            <td class="center">{{ $item->quantity }}</td>
                            <td class="right">{{ $money($item->subtotal) }}</td>
                        </tr>
                    @empty
                        <tr><td colspan="9">Sin productos agregados.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </section>

        @if ($services->isNotEmpty())
            <section class="section">
                <h2>Servicios</h2>
                <table>
                    <thead><tr><th>Servicio</th><th class="center">Cant</th><th class="right">Precio</th><th class="right">Precio con<br>descuento</th><th class="right">Subtotal</th></tr></thead>
                    <tbody>
                        @foreach ($services as $item)
                            <tr>
                                <td>{{ $item->description }}</td>
                                <td class="center">{{ $item->quantity }}</td>
                                <td class="right">{{ $money($item->list_price) }}</td>
                                <td class="right green">{{ $money($item->discounted_price) }}</td>
                                <td class="right">{{ $money($item->subtotal) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </section>
        @endif

        <section class="grid">
            <article class="panel"><div class="panel-box"><h2>Información Importante</h2><div class="panel-body">- Venta sujeta a disponibilidad en stock<br>- Los precios se encuentran expresados en ($) pesos argentinos<br>- El plazo de entrega se coordina con la empresa</div></div></article>
            <article class="panel">
                <div class="panel-box">
                    <h2>Tu Pedido</h2>
                    <div class="panel-body">
                        <div class="summary-line"><span>Subtotal sin descuento</span><strong>{{ $money($budget->subtotal_list) }}</strong></div>
                        <div class="summary-line is-discount"><span>Descuentos</span><strong>-{{ $money($budget->discount_total) }}</strong></div>
                        <div class="summary-line"><span>Subtotal con descuento</span><strong>{{ $money($budget->subtotal_discount) }}</strong></div>
                        <div class="summary-line"><span>IVA 21%</span><strong>{{ $money($budget->iva) }}</strong></div>
                        <div class="summary-line is-total"><span>Total (IVA incluido)</span><strong>{{ $money($budget->total) }}</strong></div>
                    </div>
                </div>
            </article>
        </section>

        @if ($attachment)
            <section class="attachment">
                <span class="eyebrow">Adjunto</span>
                <strong>{{ $attachment['name'] }}</strong>
                @if ($attachment['is_image'] && $attachment['data_uri'])
                    <img src="{{ $attachment['data_uri'] }}" alt="{{ $attachment['name'] }}">
                @elseif (! $isPdf)
                    <p><a href="{{ $attachment['url'] }}" target="_blank" rel="noopener">Ver archivo adjunto</a></p>
                @endif
            </section>
        @endif

        <footer class="footer">
            <span><strong>Nicolais Mario e Hijo</strong> · Presupuesto guardado desde Zona Cliente</span>
            <span>Importes en pesos argentinos · Sujeto a disponibilidad</span>
        </footer>
    </main>
</body>
</html>

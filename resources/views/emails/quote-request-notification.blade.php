<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $mailHeading ?? 'Nueva solicitud de presupuesto' }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #f4f4f4; color: #333; padding: 30px 20px; }
        .wrapper { width: 100%; max-width: 640px; margin: 0 auto; }
        .header { background: #093E66; color: #fff; padding: 24px 28px; border-radius: 10px 10px 0 0; }
        .header__eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; opacity: 0.78; margin-bottom: 10px; text-transform: uppercase; }
        .header h2 { font-size: 22px; font-weight: 700; }
        .header p { font-size: 13px; opacity: 0.85; margin-top: 4px; }
        .body { background: #ffffff; padding: 28px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
        .field { margin-bottom: 16px; }
        .label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #9ca3af; letter-spacing: 0.05em; }
        .value { font-size: 15px; color: #1f2937; margin-top: 4px; line-height: 1.6; }
        .value a { color: #093E66; text-decoration: none; }
        .divider { border: none; border-top: 1px solid #f3f4f6; margin: 20px 0; }
        .message-box { background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #093E66; margin-top: 8px; }
        .message-box .value { white-space: pre-wrap; }
        .products { margin-top: 10px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .product { display: table; width: 100%; border-bottom: 1px solid #f3f4f6; }
        .product:last-child { border-bottom: none; }
        .product__media, .product__name, .product__qty { display: table-cell; padding: 12px 14px; vertical-align: middle; }
        .product__media { width: 84px; }
        .product__thumb {
            width: 72px;
            height: 72px;
            border: 1px solid #e5e7eb;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            text-align: center;
        }
        .product__thumb img {
            width: 72px;
            height: 72px;
            display: block;
            object-fit: contain;
        }
        .product__name { width: 60%; color: #1f2937; }
        .product__qty { width: 20%; text-align: right; color: #6b7280; white-space: nowrap; }
        .attachments { margin-top: 10px; }
        .attachments li { margin-left: 18px; color: #374151; line-height: 1.6; }
        .footer { margin-top: 24px; font-size: 12px; color: #9ca3af; text-align: center; }
        .button {
            display: inline-block;
            margin-top: 16px;
            padding: 11px 16px;
            background: #093E66;
            color: #fff !important;
            text-decoration: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 700;
        }
        @media only screen and (max-width: 640px) {
            body {
                padding: 16px 12px;
            }
            .header {
                padding: 18px 18px 16px;
                border-radius: 8px 8px 0 0;
            }
            .header h2 {
                font-size: 18px;
                line-height: 1.35;
            }
            .header p {
                font-size: 12px;
                line-height: 1.5;
            }
            .body {
                padding: 18px;
                border-radius: 0 0 8px 8px;
            }
            .value {
                font-size: 14px;
                line-height: 1.65;
                word-break: break-word;
            }
            .product,
            .product__media,
            .product__name,
            .product__qty {
                display: block;
                width: 100%;
            }
            .product__media {
                padding-bottom: 0;
            }
            .product__thumb {
                margin: 0 auto;
            }
            .product__name {
                padding-bottom: 6px;
                text-align: center;
            }
            .product__qty {
                padding-top: 0;
                text-align: center;
            }
            .attachments li {
                margin-left: 16px;
                word-break: break-word;
            }
            .button {
                display: block;
                width: 100%;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            @if(!empty($mailContextLabel))
                <p class="header__eyebrow">{{ $mailContextLabel }}</p>
            @endif
            <h2>{{ $mailHeading ?? 'Nueva solicitud de presupuesto' }}</h2>
            <p>Solicitud #{{ $quoteRequest->id }} recibida el {{ $quoteRequest->created_at?->timezone(config('app.timezone'))->format('d/m/Y \a \l\a\s H:i') }}</p>
        </div>

        <div class="body">
            <div class="field">
                <div class="label">Nombre</div>
                <div class="value">{{ $quoteRequest->name }}</div>
            </div>

            <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:{{ $quoteRequest->email }}">{{ $quoteRequest->email }}</a></div>
            </div>

            @if($quoteRequest->country)
                <div class="field">
                    <div class="label">País</div>
                    <div class="value">{{ $quoteRequest->country }}</div>
                </div>
            @endif

            @if($quoteRequest->company)
                <div class="field">
                    <div class="label">Empresa</div>
                    <div class="value">{{ $quoteRequest->company }}</div>
                </div>
            @endif

            @if($quoteRequest->phone)
                <div class="field">
                    <div class="label">Teléfono</div>
                    <div class="value">{{ $quoteRequest->phone }}</div>
                </div>
            @endif

            <hr class="divider">

            <div class="field">
                <div class="label">Material</div>
                <div class="value">{{ $quoteRequest->material ?: '-' }}</div>
            </div>

            <div class="field">
                <div class="label">Forma</div>
                <div class="value">{{ $quoteRequest->shape ?: '-' }}</div>
            </div>

            <div class="field">
                <div class="label">Dimensiones</div>
                <div class="value">{{ $quoteRequest->dimensions ?: '-' }}</div>
            </div>

            <div class="field">
                <div class="label">Cantidad</div>
                <div class="value">{{ $quoteRequest->quantity ?: '-' }}</div>
            </div>

            @if($quoteRequest->message)
                <div class="field">
                    <div class="label">Aclaraciones / Observaciones</div>
                    <div class="message-box">
                        <div class="value">{{ $quoteRequest->message }}</div>
                    </div>
                </div>
            @endif

            @if($quoteRequest->attachments->isNotEmpty())
                <div class="field">
                    <div class="label">Adjuntos</div>
                    <ul class="attachments">
                        @foreach($quoteRequest->attachments as $attachment)
                            <li>{{ $attachment->file_name_snapshot ?: optional($attachment->media)->title ?: 'Archivo adjunto' }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            @if($adminUrl)
                <a href="{{ $adminUrl }}" class="button">Ver solicitud en admin</a>
            @endif
        </div>

        <div class="footer">
            <p>Este mensaje fue generado automáticamente desde el formulario de presupuesto.</p>
        </div>
    </div>
</body>
</html>

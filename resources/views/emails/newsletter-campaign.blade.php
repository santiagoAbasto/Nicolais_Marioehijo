<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $campaignSubject }}</title>
    <style>
        body { margin: 0; padding: 0; background: #eef3f7; color: #101828; font-family: Arial, Helvetica, sans-serif; }
        table { border-collapse: collapse; }
        img { border: 0; display: block; max-width: 100%; }
        .shell { width: 100%; padding: 32px 12px; }
        .card { width: 100%; max-width: 680px; margin: 0 auto; overflow: hidden; border: 1px solid #d9e3ea; border-radius: 24px; background: #ffffff; box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12); }
        .top { padding: 28px 32px; background: #0072bb; color: #ffffff; }
        .brand { font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; opacity: 0.9; }
        .subject { margin: 10px 0 0; font-size: 26px; line-height: 1.18; font-weight: 700; }
        .hero img { width: 100%; height: auto; }
        .content { padding: 32px; }
        .title { margin: 0; color: #101828; font-size: 24px; line-height: 1.25; font-weight: 700; }
        .description { margin: 12px 0 0; color: #475467; font-size: 16px; line-height: 1.65; }
        .body { margin: 24px 0 0; color: #1d2939; font-size: 15px; line-height: 1.75; white-space: pre-line; }
        .divider { height: 1px; margin: 28px 0; background: #e4e7ec; }
        .footer { padding: 0 32px 30px; color: #667085; font-size: 12px; line-height: 1.6; text-align: center; }
        .footer a { color: #0072bb; text-decoration: underline; }
        @media (max-width: 640px) {
            .shell { padding: 18px 10px; }
            .top, .content, .footer { padding-left: 22px; padding-right: 22px; }
            .subject { font-size: 22px; }
            .title { font-size: 21px; }
        }
    </style>
</head>
<body>
    <div class="shell">
        <div class="card">
            <div class="top">
                <div class="brand">{{ config('app.name', 'Nicolais Mario e Hijo') }}</div>
                <h1 class="subject">{{ $campaignSubject }}</h1>
            </div>

            @if ($campaignImageUrl)
                <div class="hero">
                    <img src="{{ $campaignImageUrl }}" alt="{{ $campaignTitle ?: $campaignSubject }}">
                </div>
            @endif

            <div class="content">
                @if ($campaignTitle)
                    <h2 class="title">{{ $campaignTitle }}</h2>
                @endif

                @if ($campaignDescription)
                    <p class="description">{{ $campaignDescription }}</p>
                @endif

                <div class="body">{{ $campaignBody }}</div>
                <div class="divider"></div>
            </div>

            <div class="footer">
                Recibiste este email porque estás suscripto al newsletter de {{ config('app.name', 'Nicolais Mario e Hijo') }}.<br>
                <a href="{{ $unsubscribeUrl }}">Desuscribirme</a>
            </div>
        </div>
    </div>
</body>
</html>

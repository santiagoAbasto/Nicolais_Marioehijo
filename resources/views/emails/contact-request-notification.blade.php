<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo mensaje de contacto</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #f4f4f4; color: #333; padding: 30px 20px; }
        .wrapper { max-width: 620px; margin: 0 auto; }
        .header { background: #093E66; color: #fff; padding: 24px 28px; border-radius: 12px 12px 0 0; }
        .header h2 { font-size: 20px; font-weight: 700; }
        .header p { font-size: 13px; opacity: 0.85; margin-top: 4px; }
        .body { background: #fff; padding: 28px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
        .grid { width: 100%; border-collapse: collapse; }
        .grid td { vertical-align: top; padding: 0 0 16px; }
        .label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #8FA1B2; letter-spacing: 0.06em; }
        .value { font-size: 15px; color: #1f2937; margin-top: 4px; line-height: 1.6; }
        .value a { color: #093E66; text-decoration: none; }
        .message-box { background: #f9fafb; padding: 16px; border-radius: 10px; border-left: 4px solid #093E66; margin-top: 8px; }
        .message-box .value { white-space: pre-wrap; }
        .button { display: inline-block; margin-top: 22px; padding: 12px 18px; background: #093E66; color: #fff !important; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 700; }
        .footer { margin-top: 22px; text-align: center; font-size: 12px; color: #9ca3af; }
        @media (max-width: 640px) {
            body { padding: 16px 10px; }
            .header, .body { padding: 20px 18px; }
            .value { font-size: 14px; }
            .button { width: 100%; text-align: center; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h2>Nuevo mensaje de contacto</h2>
            <p>Recibido el {{ now()->format('d/m/Y \\a \\l\\a\\s H:i') }}</p>
        </div>

        <div class="body">
            <table class="grid" role="presentation" width="100%">
                <tr>
                    <td>
                        <div class="label">Nombre</div>
                        <div class="value">{{ trim(($contactRequest->first_name ?? '').' '.($contactRequest->last_name ?? '')) }}</div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="label">Email</div>
                        <div class="value"><a href="mailto:{{ $contactRequest->email }}">{{ $contactRequest->email }}</a></div>
                    </td>
                </tr>
                @if($contactRequest->phone)
                    <tr>
                        <td>
                            <div class="label">Teléfono</div>
                            <div class="value">{{ $contactRequest->phone }}</div>
                        </td>
                    </tr>
                @endif
            </table>

            @if($contactRequest->message)
                <div class="message-box">
                    <div class="label">Mensaje</div>
                    <div class="value">{{ $contactRequest->message }}</div>
                </div>
            @endif

            @if($adminUrl)
                <a href="{{ $adminUrl }}" class="button">Ver en admin</a>
            @endif

            <div class="footer">
                Este mensaje fue generado automáticamente desde el formulario de contacto.
            </div>
        </div>
    </div>
</body>
</html>

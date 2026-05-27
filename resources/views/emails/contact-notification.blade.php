<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo mensaje de contacto</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #f4f4f4; color: #333; padding: 30px 20px; }
        .wrapper { max-width: 580px; margin: 0 auto; }
        .header { background: #25A7CA; color: white; padding: 24px 28px; border-radius: 10px 10px 0 0; }
        .header h2 { font-size: 20px; font-weight: 700; }
        .header p { font-size: 13px; opacity: 0.85; margin-top: 4px; }
        .body { background: #ffffff; padding: 28px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
        .field { margin-bottom: 16px; }
        .label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #9ca3af; letter-spacing: 0.05em; }
        .value { font-size: 15px; color: #1f2937; margin-top: 4px; }
        .value a { color: #25A7CA; text-decoration: none; }
        .message-box { background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #25A7CA; margin-top: 20px; }
        .message-box .label { margin-bottom: 8px; }
        .message-box .value { line-height: 1.7; white-space: pre-wrap; }
        .footer { margin-top: 24px; font-size: 12px; color: #9ca3af; text-align: center; }
        .divider { border: none; border-top: 1px solid #f3f4f6; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h2>📬 Nuevo mensaje de contacto</h2>
            <p>Recibido el {{ now()->format('d/m/Y \a \l\a\s H:i') }}</p>
        </div>
        <div class="body">
            <div class="field">
                <div class="label">Nombre</div>
                <div class="value">{{ $contactMessage->name }}</div>
            </div>
            <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:{{ $contactMessage->email }}">{{ $contactMessage->email }}</a></div>
            </div>
            @if($contactMessage->phone)
            <div class="field">
                <div class="label">Teléfono</div>
                <div class="value">{{ $contactMessage->phone }}</div>
            </div>
            @endif
            @if($contactMessage->company)
            <div class="field">
                <div class="label">Empresa</div>
                <div class="value">{{ $contactMessage->company }}</div>
            </div>
            @endif
            <hr class="divider">
            <div class="message-box">
                <div class="label">Mensaje</div>
                <div class="value">{{ $contactMessage->message }}</div>
            </div>
            <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">
                Podés responder directamente a
                <a href="mailto:{{ $contactMessage->email }}" style="color: #25A7CA;">{{ $contactMessage->email }}</a>
            </p>
        </div>
        <div class="footer">
            <p>Este mensaje fue generado automáticamente desde el formulario de contacto.</p>
        </div>
    </div>
</body>
</html>

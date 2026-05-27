<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva solicitud de catálogo</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Montserrat,Arial,sans-serif;color:#1A181C;">
    <div style="width:100%;padding:24px 12px;box-sizing:border-box;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ea;">
            <div style="padding:24px 28px;background:#093E66;color:#ffffff;">
                <div style="font-size:24px;font-weight:600;line-height:1.2;">Nueva solicitud de catálogo</div>
                <div style="margin-top:6px;font-size:13px;line-height:1.5;opacity:.85;">Recibida el {{ $catalogRequest->created_at?->format('d/m/Y H:i') }}</div>
            </div>

            <div style="padding:24px 28px;">
                <div style="margin-bottom:18px;">
                    <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8b95a7;">Nombre</div>
                    <div style="margin-top:4px;font-size:16px;line-height:1.5;">{{ $catalogRequest->name }}</div>
                </div>

                <div style="margin-bottom:18px;">
                    <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8b95a7;">Email</div>
                    <div style="margin-top:4px;font-size:16px;line-height:1.5;word-break:break-word;">{{ $catalogRequest->email }}</div>
                </div>

                @if($catalogRequest->phone)
                    <div style="margin-bottom:18px;">
                        <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8b95a7;">Teléfono</div>
                        <div style="margin-top:4px;font-size:16px;line-height:1.5;">{{ $catalogRequest->phone }}</div>
                    </div>
                @endif

                @if($catalogRequest->company)
                    <div style="margin-bottom:18px;">
                        <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8b95a7;">Empresa</div>
                        <div style="margin-top:4px;font-size:16px;line-height:1.5;">{{ $catalogRequest->company }}</div>
                    </div>
                @endif

                @if($catalogRequest->message)
                    <div style="margin-bottom:18px;">
                        <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8b95a7;">Mensaje</div>
                        <div style="margin-top:8px;padding:16px;border:1px solid #dbe3ea;background:#f8fafc;font-size:15px;line-height:1.6;word-break:break-word;">{{ $catalogRequest->message }}</div>
                    </div>
                @endif

                @if($adminUrl)
                    <div style="margin-top:24px;text-align:center;">
                        <a href="{{ $adminUrl }}" style="display:inline-block;padding:14px 20px;background:#093E66;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;">Ver en admin</a>
                    </div>
                @endif
            </div>
        </div>
    </div>
</body>
</html>

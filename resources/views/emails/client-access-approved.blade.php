<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acceso aprobado</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f3f6f9; color: #111010; font-family: Arial, sans-serif; padding: 28px 16px; }
        .wrap { max-width: 640px; margin: 0 auto; }
        .hero { background: #0072BB; border-radius: 16px 16px 0 0; color: #fff; padding: 30px; }
        .hero small { display: block; font-size: 12px; font-weight: 700; letter-spacing: .14em; margin-bottom: 10px; text-transform: uppercase; }
        .hero h1 { font-size: 25px; line-height: 1.2; }
        .body { background: #fff; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 16px 16px; padding: 28px 30px; }
        .body p { color: #4b5563; font-size: 15px; line-height: 1.7; margin-bottom: 16px; }
        .credentials { background: #f8fafc; border: 1px solid #d9d9d9; border-radius: 12px; margin: 20px 0; padding: 18px; }
        .label { color: #6b7280; font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
        .value { color: #111010; font-size: 16px; font-weight: 700; margin: 5px 0 14px; word-break: break-word; }
        .button { background: #0072BB; border-radius: 8px; color: #fff !important; display: inline-block; font-size: 15px; font-weight: 700; padding: 13px 18px; text-decoration: none; }
        .foot { color: #94a3b8; font-size: 12px; margin-top: 22px; text-align: center; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="hero">
            <small>Zona Cliente</small>
            <h1>Tu solicitud fue aprobada</h1>
        </div>
        <div class="body">
            <p>Hola {{ $clientRequest->first_name }}, ya activamos tu acceso privado a Nicolais Mario e Hijo.</p>
            <p>Estas son tus credenciales iniciales. Por seguridad, guardalas y pedí al administrador un restablecimiento si necesitás cambiarlas.</p>

            <div class="credentials">
                <div class="label">Usuario</div>
                <div class="value">{{ $clientRequest->email }}</div>
                <div class="label">Contraseña</div>
                <div class="value">{{ $temporaryPassword }}</div>
            </div>

            <a class="button" href="{{ $loginUrl }}">Ingresar a Zona Cliente</a>
        </div>
        <div class="foot">Este correo fue generado automáticamente por Nicolais Mario e Hijo.</div>
    </div>
</body>
</html>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitud revisada</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f3f6f9; color: #111010; font-family: Arial, sans-serif; padding: 28px 16px; }
        .wrap { max-width: 620px; margin: 0 auto; }
        .head { background: #111010; border-radius: 16px 16px 0 0; color: #fff; padding: 28px; }
        .head h1 { font-size: 23px; line-height: 1.2; }
        .body { background: #fff; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 16px 16px; padding: 28px; }
        p { color: #4b5563; font-size: 15px; line-height: 1.7; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="head"><h1>Revisamos tu solicitud</h1></div>
        <div class="body">
            <p>Hola {{ $clientRequest->first_name }}, gracias por solicitar acceso a Zona Cliente.</p>
            <p>Por el momento no pudimos aprobar la solicitud con los datos recibidos. Podés comunicarte con nuestro equipo comercial para revisar la información.</p>
        </div>
    </div>
</body>
</html>

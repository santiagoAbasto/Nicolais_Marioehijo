# Nicolais Mario e Hijo

Aplicacion web institucional, catalogo publico, panel administrativo y Zona Cliente privada para Nicolais Mario e Hijo. El proyecto combina Laravel, Blade, Inertia, React y Vite para administrar contenido publico, productos, presupuestos, pedidos, listas de precios, comprobantes de pago, SEO y seguridad operativa.

## Objetivo del Proyecto

La plataforma centraliza la presencia digital de la empresa y permite:

- Publicar secciones publicas: inicio, nosotros, productos, catalogos, novedades, contacto, presupuesto y clientes.
- Administrar contenido desde un panel privado con roles de superadmin y admin.
- Gestionar catalogo de productos, importadores masivos, familias, subfamilias, marcas, fichas y archivos.
- Operar Zona Cliente con login, productos, carrito, presupuesto, pedidos, listas de precios, comprobantes de pago y margenes.
- Generar documentos profesionales en PDF y vistas online para pedidos y presupuestos.
- Gestionar SEO por seccion desde el panel administrativo.
- Registrar actividad, formularios, eventos de seguridad y usuarios activos.

## Stack Principal

- Backend: PHP 8.3+, Laravel 13, Eloquent ORM, Blade, Inertia Laravel.
- Frontend publico: Blade, CSS modular, JavaScript Vite.
- Frontend admin: React 19, Inertia React, Tailwind CSS 4, Vite 8.
- Base de datos: MySQL en produccion. SQLite puede usarse para pruebas locales puntuales si se configura.
- Documentos: DomPDF para PDF y PHPSpreadsheet para Excel.
- Assets: Vite, Laravel Vite Plugin, almacenamiento publico mediante `storage:link`.
- Seguridad: middlewares de roles, CSRF, rate limiting, sanitizacion, headers de seguridad, logs de eventos sospechosos.

## Requisitos

- PHP 8.3 o superior.
- Composer 2.
- Node.js 22 o compatible con Vite 8.
- NPM 10 o superior.
- MySQL 8 o MariaDB compatible.
- Extensiones PHP habituales de Laravel: `mbstring`, `openssl`, `pdo`, `tokenizer`, `xml`, `ctype`, `json`, `fileinfo`, `zip`, `gd` o equivalente para imagenes/PDF.

## Instalacion Local

1. Instalar dependencias PHP:

```bash
composer install
```

2. Instalar dependencias JavaScript:

```bash
npm install
```

3. Crear el archivo de entorno:

```bash
cp .env.example .env
php artisan key:generate
```

4. Configurar base de datos, correo, `APP_URL` y credenciales necesarias en `.env`.

5. Ejecutar migraciones:

```bash
php artisan migrate
```

6. Crear enlace publico de storage:

```bash
php artisan storage:link
```

7. Levantar Laravel y Vite en puertos separados:

```bash
php artisan serve --host=127.0.0.1 --port=8001
npm run dev -- --host=127.0.0.1 --port=5173
```

## Comandos Utiles

```bash
npm run dev
npm run build
php artisan test
php artisan route:list
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Para produccion, ejecutar build y caches despues de configurar `.env`:

```bash
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Estructura del Proyecto

```text
app/
  Http/Controllers/Admin/   Panel administrativo
  Http/Controllers/Web/     Sitio publico y Zona Cliente
  Http/Middleware/          Seguridad, roles, tracking y protecciones
  Models/                   Entidades Eloquent
  Support/                  Helpers de dominio y seguridad
database/
  migrations/               Esquema de base de datos
  seeders/                  Datos iniciales
resources/
  css/                      Estilos web y Zona Cliente
  js/                       React admin e interacciones web
  views/                    Blade publico, layouts y PDFs
routes/
  web.php                   Rutas publicas, admin y Zona Cliente
public/
  build/                    Assets compilados por Vite
  favicon/                  Favicons
storage/
  app/public/               Archivos subidos
```

## Modulos Funcionales

### Sitio Publico

- Inicio con hero, contenido administrable y SEO.
- Productos publicos y slug de productos.
- Catalogos, novedades, contacto, presupuesto y clientes.
- Buscador publico inteligente.
- Newsletter y formularios con protecciones anti-abuso.

### Panel Admin

- Dashboard con metricas reales, actividad y mapa de usuarios activos.
- Gestion de home, secciones, footer, redes, novedades, newsletter, contacto y SEO.
- Productos, importadores y archivos.
- Usuarios admin con separacion estricta respecto a usuarios cliente.
- Zona Cliente: solicitudes, productos privados, pedidos, presupuestos, listas de precios y pagos.

### Zona Cliente

- Login de clientes aprobados.
- Productos privados con carrito o presupuesto.
- Carrito con pedido y PDF.
- Presupuesto con productos, servicios cargados por el cliente, adjuntos, exportacion e impresion.
- Mis pedidos con ver online y descarga.
- Listas de precios por cliente.
- Info de pagos con comprobantes y estados administrables.
- Margenes de cliente para precio venta.

## Seguridad Implementada

- Autenticacion separada por contexto: admin y cliente.
- Superadmin protegido contra eliminacion y perdida de acceso.
- Usuarios cliente separados del listado de usuarios admin.
- Middlewares para acceso admin y Zona Cliente.
- CSRF en formularios.
- Rate limits en login, formularios publicos y busquedas.
- Honeypot y proteccion progresiva en formularios publicos.
- Sanitizacion centralizada de texto plano.
- Validaciones backend en endpoints sensibles.
- Validacion de uploads por tipo, MIME y tamano.
- Nombres seguros para archivos subidos.
- Headers de seguridad HTTP y CSP progresiva con nonce.
- Registro de eventos sospechosos en `security_events`.
- `last_seen_at` para usuarios activos reales.

## Variables de Entorno Importantes

```dotenv
APP_NAME="Nicolais Mario e Hijo"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8001

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=

MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME="${APP_NAME}"

SESSION_SECURE_COOKIE=false
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
```

En produccion usar `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` con HTTPS y `SESSION_SECURE_COOKIE=true`.

## Flujo de Despliegue

1. Subir codigo sin `.env`, `vendor`, `node_modules`, `storage` runtime ni `public/build` si el servidor compila assets.
2. Instalar dependencias con `composer install --no-dev --optimize-autoloader`.
3. Instalar/compilar assets con `npm ci` y `npm run build`, o subir `public/build` si el hosting no compila.
4. Configurar `.env` de produccion.
5. Ejecutar migraciones con respaldo previo:

```bash
php artisan migrate --force
```

6. Crear `storage:link`.
7. Cachear configuracion, rutas y vistas.
8. Verificar permisos de `storage` y `bootstrap/cache`.

## Diagramas

Ver:

- `STACK_TECNOLOGICO.md`
- `DIAGRAMA_STACK.md`

## Notas para Git

El repositorio debe incluir:

- Codigo fuente.
- `composer.lock` y `package-lock.json`.
- Migraciones y seeders.
- Vistas, assets fuente y configuraciones.

El repositorio no debe incluir:

- `.env`.
- `vendor/`.
- `node_modules/`.
- Logs, cache, sesiones, archivos subidos y builds temporales.
- Credenciales SMTP, tokens o claves privadas.

## Estado de QA

Antes de publicar cambios importantes:

```bash
php artisan optimize:clear
php artisan test
npm run build
```

Si se modifican rutas, vistas o configuracion:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```


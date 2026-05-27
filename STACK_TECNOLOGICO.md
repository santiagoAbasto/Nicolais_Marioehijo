# Stack Tecnologico

Documento tecnico del proyecto Nicolais Mario e Hijo. Describe el stack real detectado en `composer.json`, `package.json`, estructura de carpetas y modulos implementados.

## Resumen

| Capa | Tecnologia |
| --- | --- |
| Backend | PHP 8.3+, Laravel 13 |
| Render server-side | Blade |
| Admin SPA | Inertia Laravel + React 19 |
| Build | Vite 8 + Laravel Vite Plugin |
| Estilos | Tailwind CSS 4 + CSS modular por vista |
| Base de datos | MySQL/MariaDB |
| PDFs | barryvdh/laravel-dompdf |
| Excel | phpoffice/phpspreadsheet |
| Rutas JS | tightenco/ziggy |
| Iconos | Iconify, Lucide React, SVG propios |
| Visualizaciones | Recharts, D3, Three.js, react-globe.gl |
| Seguridad | CSRF, rate limiting, CSP, sanitizacion, roles, logs |

## Backend

### PHP y Laravel

- PHP requerido: `^8.3`.
- Laravel: `^13.0`.
- Arquitectura principal: MVC con Eloquent, middlewares, controllers, Blade e Inertia.
- Autoload adicional: `app/helpers.php`.

### Paquetes PHP

- `barryvdh/laravel-dompdf`: generacion de PDFs para pedidos, presupuestos y documentos.
- `inertiajs/inertia-laravel`: puente entre Laravel y React para el panel admin.
- `laravel/framework`: nucleo de aplicacion.
- `laravel/sanctum`: base de autenticacion/API cuando sea requerido.
- `laravel/tinker`: inspeccion local.
- `phpoffice/phpspreadsheet`: importadores/exportadores Excel.
- `tightenco/ziggy`: rutas Laravel disponibles en JavaScript.

### Paquetes de Desarrollo

- Laravel Breeze.
- Laravel Pint.
- Laravel Pail.
- PHPUnit 12.
- Mockery.
- Faker.
- Collision.
- Sail opcional.

## Frontend

### Runtime y Build

- JavaScript con ES Modules.
- React 19 para el panel administrativo.
- Vite 8 para bundling, HMR y manifest de produccion.
- Laravel Vite Plugin para integracion con Blade e Inertia.

### UI y Estado

- Inertia React para navegacion del panel.
- Headless UI y Radix Switch para interacciones accesibles.
- Iconify, Lucide y SVGs propios para iconografia.
- Zustand y TanStack React Query disponibles para estado/datos cuando aplica.

### Estilos

- Tailwind CSS 4 para el admin.
- CSS modular en `resources/css/web` para vistas publicas y Zona Cliente.
- Fuentes y diseno orientados a Plus Jakarta Sans, con componentes especificos para tablas, formularios, modales, footers y documentos.

### Visualizaciones

- Recharts para graficos.
- D3 para transformaciones/visualizaciones.
- Three.js, React Three Fiber y React Globe para dashboard/mapa global.

## Base de Datos

Motor objetivo: MySQL/MariaDB.

Entidades principales:

- `users`: usuarios admin y usuarios cliente, separados por `can_access_admin`.
- `client_access_requests`: solicitudes y credenciales de Zona Cliente.
- `products`, `product_families`, `product_subfamilies`: catalogo e importadores.
- `client_orders`, `client_order_items`: pedidos de Zona Cliente.
- `client_budget_services`: servicios creados por cliente en presupuesto.
- `client_price_list_files`: listas de precios visibles por cliente.
- `client_payment_receipts`, `client_payment_settings`: comprobantes e informacion de pagos.
- `contact_requests`, `quote_requests`, `newsletter_subscribers`: formularios publicos.
- `seo_meta`: metadatos SEO por seccion.
- `security_events`: eventos de seguridad y abuso.
- `site_visit_logs`, `site_visit_sessions`: tracking y dashboard.

## Seguridad

### Autenticacion y Accesos

- Login admin protegido por guard/admin y `can_access_admin`.
- Login cliente limitado a usuarios aprobados en `client_access_requests`.
- Superadmin protegido contra eliminacion y perdida de acceso.
- Usuarios cliente excluidos del panel de usuarios admin.

### Formularios

- Validacion backend obligatoria.
- CSRF en formularios.
- Rate limiting por rutas sensibles.
- Honeypot y proteccion anti-bots para formularios publicos.
- Sanitizacion de texto plano.

### Uploads

- Validacion de extension, MIME y tamano.
- Nombres de archivo seguros.
- Storage en disco publico controlado.
- Bloqueo de formatos peligrosos salvo casos autorizados.

### Headers

- CSP progresiva con nonce.
- X-Frame-Options / frame-ancestors.
- X-Content-Type-Options.
- Referrer-Policy.
- Permissions-Policy.
- Cookies httpOnly, sameSite y secure en produccion.

## Modulos

### Publico

- Inicio.
- Nosotros.
- Productos.
- Catalogos.
- Novedades.
- Contacto.
- Presupuesto publico.
- Clientes.
- Buscador publico.
- Newsletter.

### Admin

- Dashboard.
- SEO profesional guiado.
- Usuarios admin.
- Home, footer, redes y contacto.
- Productos e importador masivo.
- Novedades y newsletter.
- Presupuestos y consultas.
- Zona Cliente: usuarios, productos, pedidos, presupuestos, listas de precios y pagos.

### Zona Cliente

- Login cliente.
- Productos privados.
- Carrito y pedido.
- Presupuesto con productos y servicios del cliente.
- Mis pedidos.
- Listas de precios asignadas por cliente.
- Info de pagos y comprobantes.
- Margenes.

## Comandos

```bash
composer install
npm install
php artisan migrate
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8001
npm run dev -- --host=127.0.0.1 --port=5173
npm run build
php artisan test
```

## Reglas de Produccion

- Nunca subir `.env`, `vendor`, `node_modules`, logs ni archivos subidos.
- Mantener `composer.lock` y `package-lock.json`.
- Usar `APP_DEBUG=false`.
- Usar HTTPS y `SESSION_SECURE_COOKIE=true`.
- Ejecutar `npm run build`.
- Ejecutar caches de Laravel despues de configurar `.env`.
- Revisar permisos de `storage` y `bootstrap/cache`.


<div align="center">
<img src="docs/readme/banner.svg" alt="Nicolais Mario e Hijo — Catálogo técnico de materiales, calculadora de peso y zona privada para clientes" width="100%">
<br/>

**Sitio corporativo con catálogo técnico de materiales, zona privada de clientes y panel de contenido.**

<img alt="Proyecto cliente" src="https://img.shields.io/badge/estado-proyecto_cliente-0072bb?style=for-the-badge&labelColor=0b1220">
<img alt="Laravel 13" src="https://img.shields.io/badge/Laravel-13-ff2d20?style=flat-square&logo=laravel&logoColor=white">
<img alt="PHP 8.3+" src="https://img.shields.io/badge/PHP-8.3%2B-777bb4?style=flat-square&logo=php&logoColor=white">
<img alt="React 19" src="https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react&logoColor=white">
<img alt="Inertia.js 3" src="https://img.shields.io/badge/Inertia.js-3-9553e9?style=flat-square">
<img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white">
<img alt="MySQL" src="https://img.shields.io/badge/MySQL-configurado-4479a1?style=flat-square&logo=mysql&logoColor=white">
</div>

<img src="docs/readme/divider.svg" alt="" width="100%">

## 📑 Contenido

[El problema](#-el-problema) · [La solución](#-la-solución) · [Funcionalidades](#-funcionalidades) · [Arquitectura](#-arquitectura) · [Flujos de trabajo](#-flujos-de-trabajo) · [Modelo de datos](#-modelo-de-datos) · [Criterios y decisiones](#-criterios-y-decisiones) · [Stack](#-stack) · [Estructura](#-estructura-del-repo) · [Puesta en marcha](#-puesta-en-marcha) · [Pruebas y calidad](#-pruebas-y-calidad) · [Despliegue](#-despliegue) · [Estado y pendientes](#-estado-y-pendientes) · [Licencia y autoría](#-licencia-y-autoría)

<img src="docs/readme/divider.svg" alt="" width="100%">

## 🧩 El problema

La empresa maneja un catálogo técnico amplio: familias, líneas, series, grados, formas, normas y composición química. Esa información vivía dispersa en planillas y documentos, y las consultas de clientes (precios, stock, presupuestos, pagos) llegaban por canales separados. Calcular el peso de una pieza y verificar una norma eran pasos manuales.

## 💡 La solución

**Nicolais Mario e Hijo** es una aplicación Laravel con tres perfiles:

- **Visitantes**: sitio institucional, catálogo público jerárquico, buscador, calculadora de peso y consulta de ofertas y novedades.
- **Clientes**: zona privada con acceso sujeto a aprobación, catálogo privado, carrito, pedidos, presupuestos, servicios adicionales, listas de precios y comprobantes de pago.
- **Administración**: panel para contenidos, catálogo, importaciones desde Excel y CSV, usuarios, medios, SEO y campañas de newsletter.

<img src="docs/readme/divider.svg" alt="" width="100%">

## ✨ Funcionalidades

**Sitio público** (rol: visitante)
- Catálogo por familias, líneas, series, grados, formas, variantes, normas y composición química.
- Buscador y sugerencias sobre productos y referencias técnicas.
- Calculadora de peso configurable por materiales, formas, campos y fórmulas.
- Formularios de contacto, presupuesto, alta de clientes y newsletter, con notificaciones por correo.

**Zona cliente** (rol: cliente aprobado)
- Catálogo privado, carrito, pedidos y presupuestos en PDF.
- Servicios adicionales y márgenes; listas de precios asignadas por cliente.
- Carga y revisión de comprobantes de pago.

**Panel administrativo** (rol: administrador)
- Importación, previsualización, validación, mapeo, publicación y exportación de catálogos, stock y normas en Excel y CSV.
- Productos comerciales, imágenes, fichas técnicas, especificaciones y relacionados.
- Campañas de newsletter, metadatos SEO, sitemap, robots.txt y web manifest.
- Registro de actividad autenticada, sesiones de visita y eventos de seguridad.

<img src="docs/readme/divider.svg" alt="" width="100%">

## 🏗️ Arquitectura

Monolito modular con Laravel y Eloquent. Las rutas públicas y de cliente se renderizan con Blade y JavaScript progresivo; el panel usa React con Inertia, sin una API pública separada. La lógica de importación y normalización vive en `app/Services`; controladores, Form Requests y middlewares coordinan HTTP, validación y seguridad.

<img src="docs/readme/flujo.svg" alt="Cómo viaja una petición: visitante o cliente consulta el catálogo y pide presupuesto, Blade o Inertia responden, Laravel importa, calcula precios y genera PDF, MySQL guarda catálogo, pedidos y contenidos" width="100%">

```mermaid
flowchart LR
    V["Visitante"] --> B["Sitio público (Blade + JS)"]
    C["Cliente autenticado"] --> Z["Zona cliente (Blade)"]
    A["Administrador"] --> P["Panel (React + Inertia)"]
    B --> R["Rutas y middlewares"]
    Z --> R
    P --> R
    R --> CTL["Controladores y Form Requests"]
    CTL --> SV["Services (importación, normalización)"]
    CTL --> EL["Eloquent"]
    SV --> EL
    EL --> DB[("MySQL")]
    CTL --> ST["Storage (local y público)"]
    CTL --> PDF["PDF de pedidos y presupuestos (Dompdf)"]
    SV --> XL["Excel y CSV (PhpSpreadsheet)"]
    CTL --> ML["Laravel Mail"]
```

<img src="docs/readme/divider.svg" alt="" width="100%">

## 🔄 Flujos de trabajo

**Acceso de un cliente a la zona privada**

```mermaid
stateDiagram-v2
    [*] --> Solicitada: el cliente envía el formulario de alta
    Solicitada --> Aprobada: el administrador aprueba
    Solicitada --> Rechazada: el administrador rechaza
    Aprobada --> Activa: el cliente ingresa a la zona privada
    Activa --> [*]
    Rechazada --> [*]
```

**Presupuesto con PDF**

```mermaid
sequenceDiagram
    actor Cliente
    participant Zona as Zona cliente
    participant Laravel as Laravel
    participant DB as MySQL
    participant PDF as Dompdf
    participant Mail as Laravel Mail
    Cliente->>Zona: Arma el presupuesto con productos y servicios
    Zona->>Laravel: Envía la solicitud
    Laravel->>Laravel: Aplica márgenes y lista de precios del cliente
    Laravel->>DB: Guarda presupuesto e ítems en transacción
    Laravel->>PDF: Genera el documento desde una vista Blade
    Laravel->>Mail: Notifica con el presupuesto
```

**Importación de catálogo**

```mermaid
sequenceDiagram
    actor Admin as Administrador
    participant Panel as Panel
    participant Svc as Servicio de importación
    participant DB as MySQL
    Admin->>Panel: Sube un archivo Excel o CSV
    Panel->>Svc: Crea lote de importación
    Svc-->>Panel: Previsualización y errores de validación
    Admin->>Panel: Confirma el mapeo
    Panel->>Svc: Publica el lote
    Svc->>DB: Escribe catálogo, stock o normas en transacción
```

<img src="docs/readme/divider.svg" alt="" width="100%">

## 🗃️ Modelo de datos

Eloquent con 65 migraciones y 48 modelos en el repositorio. Cuatro áreas principales:

- **Catálogo técnico y comercial:** familias y subfamilias, productos, medios, tablas de especificaciones y relacionados, y la calculadora de peso.
- **Operación de clientes:** `ClientAccessRequest`, `Client`, `ClientOrder` e ítems, `QuoteRequest` con adjuntos, `ClientPriceListFile`, `ClientPaymentReceipt`.
- **Contenido y operación web:** secciones, noticias (`Post`), medios, SEO, formularios de contacto, newsletter, visitas y `SecurityEvent`.
- **Configuración del sitio:** contacto, pie de página, portada y datos de presupuesto editables.

```mermaid
erDiagram
    PRODUCT_FAMILY ||--o{ PRODUCT_SUBFAMILY : agrupa
    PRODUCT_SUBFAMILY ||--o{ PRODUCT : contiene
    CLIENT ||--o{ CLIENT_ORDER : realiza
    CLIENT_ORDER ||--o{ CLIENT_ORDER_ITEM : contiene
    CLIENT ||--o{ CLIENT_PAYMENT_RECEIPT : presenta
    PRODUCT_FAMILY {
        bigint id PK
    }
    PRODUCT {
        bigint id PK
    }
    CLIENT {
        bigint id PK
    }
    CLIENT_ORDER {
        bigint id PK
    }
```

El catálogo técnico (grados, normas, formas) y la calculadora de peso tienen sus propias tablas y modelos (`WeightCalculator*`). Las relaciones incluyen jerarquías uno a muchos y asociaciones muchos a muchos entre grados y normas, ofertas y productos, y listas de precios y clientes. Los flujos de publicación, importación, pedidos, presupuestos y limpieza de catálogo usan transacciones.

<img src="docs/readme/divider.svg" alt="" width="100%">

## 🧭 Criterios y decisiones

- **Acceso por aprobación.** La zona cliente no se abre sin una solicitud aprobada, asociada a su usuario.
- **Importación en pasos.** Previsualizar, validar, mapear y publicar evita cargar un archivo malo al catálogo.
- **Documentos en el servidor.** Pedidos y presupuestos se generan como PDF desde Blade, sin depender de un servicio externo.
- **Límites en formularios públicos.** Honeypot, tiempo mínimo de envío y límites por ruta, correo e IP.

| Decisión | Por qué |
| --- | --- |
| Monolito Laravel con Blade y React/Inertia | Una sola base y un solo despliegue; el sitio público necesita render en servidor y el panel necesita interacción. |
| Sin API pública versionada | El repositorio solo expone endpoints JSON internos del panel. |
| Storage con UUID en los nombres de archivo | Evita colisiones y no expone los nombres originales. |

<img src="docs/readme/divider.svg" alt="" width="100%">

## 🧱 Stack

| Capa | Tecnología | Versión |
| --- | --- | --- |
| Lenguaje | PHP | ^8.3 |
| Backend | Laravel framework | ^13 (lock 13.31.0) |
| Integración panel | inertiajs/inertia-laravel | 3.3.4 |
| API y sesiones | Laravel Sanctum | 4.3.3 |
| Frontend | React | 19.2.6 |
| Frontend | @inertiajs/react | 3.1.1 |
| Estilos | Tailwind CSS | 4.3.0 |
| Build | Vite | 8.3.0 |
| Documentos | Dompdf | según `composer.json` |
| Hojas de cálculo | PhpSpreadsheet | según `composer.json` |
| Base de datos | MySQL | configurada en `.env.example` |

<img src="docs/readme/divider.svg" alt="" width="100%">

## 🗂️ Estructura del repo

```text
app/Http/Controllers/    sitio, zona cliente, panel y endpoints JSON internos
app/Http/Requests/       validación de formularios
app/Services/            importación y normalización de catálogo
app/Models/              entidades Eloquent (48)
database/migrations/     esquema relacional (65)
resources/views/         Blade público, zona cliente y PDF
resources/js/            panel React e Inertia
routes/web.php           rutas públicas, cliente y panel
routes/auth.php          autenticación
routes/console.php       comandos programados
tests/                   pruebas Feature
docs/readme/             recursos visuales del README
```

<img src="docs/readme/divider.svg" alt="" width="100%">

## 🚀 Puesta en marcha

Requisitos: PHP 8.3+, Composer, Node.js, npm y MySQL.

```bash
composer install
npm ci
cp .env.example .env              # definir base, correo y almacenamiento localmente
php artisan key:generate
php artisan migrate
php artisan storage:link
composer dev                      # servidor, cola, logs y Vite en paralelo
```

Variables relevantes (por nombre): `DB_*`, `MAIL_*`, `QUEUE_CONNECTION`, `FILESYSTEM_*`, y la configuración de correo y HMAC de seguridad. Los valores reales no se versionan.

<img src="docs/readme/divider.svg" alt="" width="100%">

## 🧪 Pruebas y calidad

Pruebas Feature sobre catálogo, normas, stock, búsqueda, SEO, infraestructura, productos destacados y zona cliente. La suite usa SQLite, caché y sesión en memoria, correo simulado y colas síncronas.

```bash
composer test
npm run build
./vendor/bin/pint --test
npm audit
composer audit
```

La última verificación registrada en el README anterior fue de 85 pruebas y 446 aserciones aprobadas, con `php artisan test --compact`; no se volvió a ejecutar para este cambio. El propio README anterior indica que la suite requiere estabilización. No hay pipeline CI versionado.

<img src="docs/readme/divider.svg" alt="" width="100%">

## 🚢 Despliegue

Documentado como despliegue Laravel: Composer, build de Vite, migraciones, enlace de storage y cachés, con `composer dev` para desarrollo. No hay infraestructura como código ni pipeline CI/CD. El servidor web, proveedor, backups y proceso de publicación quedan fuera del repositorio.

<img src="docs/readme/divider.svg" alt="" width="100%">

## 📌 Estado y pendientes

- **Estado:** aplicación funcional con catálogo, zona cliente, importaciones, PDF y panel. Producción no verificada.
- **Último commit:** 2026-07-12, `VERSION 1.1.2`, en el historial local.
- **Pendientes:**
  - Estabilizar la suite de pruebas y volver a registrar su resultado.
  - Definir el despliegue, las copias de seguridad y el proceso de publicación.
  - Repetir periódicamente `npm audit` y `composer audit`.

<img src="docs/readme/divider.svg" alt="" width="100%">

## 📄 Licencia y autoría

Desarrollado por el **Ing. Santiago Abasto**.


Repositorio sin archivo de licencia. El código y el contenido son propiedad del cliente, Nicolais Mario e Hijo, salvo que se acuerde otra cosa.

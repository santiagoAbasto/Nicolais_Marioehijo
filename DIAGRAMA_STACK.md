# Diagramas del Proyecto

Diagramas de arquitectura, seguridad y flujos principales del sistema Nicolais Mario e Hijo.

## Arquitectura General

```mermaid
flowchart TB
    U["Usuario publico / Cliente / Admin"] --> B["Navegador"]
    B --> N["Nginx o Apache"]
    N --> L["Laravel 13"]

    L --> MW["Middlewares"]
    MW --> SEC["Seguridad: CSRF, CSP, rate limit, sanitizacion, roles"]
    MW --> R["Router web.php"]

    R --> WC["Controllers Web"]
    R --> AC["Controllers Admin"]
    R --> AUTH["Controllers Auth"]

    WC --> BL["Blade publico y Zona Cliente"]
    AC --> IN["Inertia"]
    IN --> RE["React Admin"]

    BL --> VITE["Vite assets"]
    RE --> VITE

    WC --> M["Eloquent Models"]
    AC --> M
    AUTH --> M

    M --> DB["MySQL / MariaDB"]
    M --> ST["Storage publico"]

    L --> MAIL["SMTP / Mailtrap / Produccion"]
    L --> PDF["DomPDF"]
    L --> XLS["PHPSpreadsheet"]
```

## Separacion de Contextos

```mermaid
flowchart LR
    PUB["Sitio publico"] --> PUBFORMS["Formularios: contacto, presupuesto, newsletter"]
    PUB --> CLIENTLOGIN["Modal Clientes"]

    CLIENTLOGIN --> CLIENTAUTH{"Usuario cliente aprobado?"}
    CLIENTAUTH -- "Si" --> ZC["Zona Cliente"]
    CLIENTAUTH -- "No" --> DENY["Rechazo generico"]

    ADMINLOGIN["/admin/login"] --> ADMINAUTH{"can_access_admin?"}
    ADMINAUTH -- "Si" --> ADMIN["Panel Admin"]
    ADMINAUTH -- "No" --> FORBID["403"]

    ADMIN --> ADMINUSERS["Usuarios Admin"]
    ADMIN --> CLIENTS["Zona Cliente > Usuarios"]
    ADMINUSERS -. "solo admins" .-> UADMIN["users.can_access_admin = true"]
    CLIENTS -. "solo clientes" .-> UCLIENT["client_access_requests aprobadas"]
```

## Flujo de Login Cliente

```mermaid
sequenceDiagram
    participant Cliente
    participant Modal
    participant Laravel
    participant DB

    Cliente->>Modal: Ingresa email y clave
    Modal->>Laravel: POST /clientes/login
    Laravel->>Laravel: Rate limit y validacion
    Laravel->>DB: Busca user por email
    Laravel->>DB: Verifica solicitud aprobada
    alt Credenciales validas y solicitud aprobada
        Laravel->>Laravel: Regenera sesion
        Laravel-->>Modal: redirect /zona-clientes
    else Credenciales invalidas
        Laravel-->>Modal: Mensaje generico
    else No aprobado o dado de baja
        Laravel-->>Modal: Mensaje generico
    end
```

## Flujo de Zona Cliente

```mermaid
flowchart TB
    ZC["Zona Cliente"] --> PROD["Productos"]
    PROD --> CART["Carrito"]
    PROD --> BUDGET["Presupuesto"]

    CART --> ORDER["Realizar pedido"]
    ORDER --> PDFORDER["PDF / Ver online"]
    ORDER --> ADMINORDERS["Admin: Carrito y Pedidos"]

    BUDGET --> SERVICES["Servicios creados por cliente"]
    BUDGET --> EXPORT["Exportar / Imprimir"]
    BUDGET --> ADMINBUDGET["Admin: Presupuestos"]

    ZC --> PRICES["Listas de precios asignadas"]
    ZC --> PAYMENTS["Info de pagos"]
    PAYMENTS --> RECEIPTS["Comprobantes"]
    RECEIPTS --> ADMINPAY["Admin: verifica, pagado, revisado"]
```

## Flujo de Formularios Publicos

```mermaid
sequenceDiagram
    participant Usuario
    participant Browser
    participant Middleware
    participant Controller
    participant DB
    participant Admin

    Usuario->>Browser: Completa formulario
    Browser->>Middleware: POST con CSRF
    Middleware->>Middleware: Honeypot, rate limit, sanitizacion
    alt Sospechoso
        Middleware-->>Browser: Respuesta generica
        Middleware->>DB: security_events
    else Valido
        Middleware->>Controller: Request validada
        Controller->>DB: Guarda consulta
        Controller-->>Browser: Toast de exito
        Admin->>DB: Visualiza en panel
    end
```

## Flujo de Uploads

```mermaid
flowchart LR
    F["Archivo subido"] --> V["Validacion backend"]
    V --> EXT["Extension permitida"]
    V --> MIME["MIME real"]
    V --> SIZE["Tamano maximo"]
    EXT --> SAFE["Nombre seguro"]
    MIME --> SAFE
    SIZE --> SAFE
    SAFE --> ST["Storage public disk"]
    ST --> URL["URL controlada"]
```

## Pipeline de Build y Produccion

```mermaid
flowchart TB
    DEV["Desarrollo"] --> COMPOSER["composer install"]
    DEV --> NPM["npm install"]
    COMPOSER --> MIGRATE["php artisan migrate"]
    NPM --> VITE["npm run build"]
    MIGRATE --> CACHE["config:cache / route:cache / view:cache"]
    VITE --> CACHE
    CACHE --> DEPLOY["Servidor produccion"]
    DEPLOY --> HTTPS["HTTPS + APP_DEBUG=false"]
    DEPLOY --> STORAGE["storage:link + permisos"]
```

## Mapa de Capas

```mermaid
flowchart TB
    subgraph "Presentacion"
        Blade["Blade publico y PDFs"]
        React["React Admin"]
        CSS["Tailwind + CSS web"]
    end

    subgraph "Aplicacion"
        Routes["routes/web.php"]
        Controllers["Controllers"]
        Middleware["Middlewares"]
        Support["Support / Helpers"]
    end

    subgraph "Dominio"
        Models["Eloquent Models"]
        Mail["Mailables"]
        Pdf["PDF Views"]
        Imports["Importadores Excel"]
    end

    subgraph "Infraestructura"
        DB["MySQL"]
        Storage["Storage"]
        SMTP["SMTP"]
        Vite["Vite build"]
    end

    Blade --> Routes
    React --> Routes
    Routes --> Middleware
    Middleware --> Controllers
    Controllers --> Models
    Controllers --> Mail
    Controllers --> Pdf
    Controllers --> Imports
    Models --> DB
    Models --> Storage
    Mail --> SMTP
    CSS --> Vite
```


<?php

namespace App\Support;

use Illuminate\Http\Request;

class SeoPageResolver
{
    protected const PAGES = [
        'home' => [
            'label' => 'Inicio',
            'recommended_title' => 'Nicolais Mario e Hijo | Repuestos automotores para transmisión',
            'recommended_description' => 'Repuestos automotores, piezas de transmisión, catálogos técnicos y atención comercial especializada para talleres, distribuidores y clientes profesionales.',
            'recommended_keywords' => 'Nicolais Mario e Hijo, repuestos automotores, transmisión, autopartes, engranajes, corona y piñón',
        ],
        'about' => [
            'label' => 'Nosotros',
            'recommended_title' => 'Nosotros | Trayectoria en repuestos automotores',
            'recommended_description' => 'Conocé la historia, valores y experiencia de Nicolais Mario e Hijo en repuestos automotores y soluciones para sistemas de transmisión.',
            'recommended_keywords' => 'Nicolais Mario e Hijo, trayectoria, repuestos automotores, autopartes, empresa familiar',
        ],
        'products' => [
            'label' => 'Productos',
            'recommended_title' => 'Productos | Catálogo de repuestos automotores',
            'recommended_description' => 'Buscá repuestos por familia, marca, modelo, código, equivalencia y OEM dentro del catálogo de Nicolais Mario e Hijo.',
            'recommended_keywords' => 'catálogo de repuestos, autopartes, código OEM, equivalencias, marcas, transmisión',
        ],
        'applications' => [
            'label' => 'Aplicaciones',
            'recommended_title' => 'Aplicaciones | Soluciones para sistemas automotores',
            'recommended_description' => 'Aplicaciones y usos técnicos de repuestos automotores para transmisión, reparación y mantenimiento profesional.',
            'recommended_keywords' => 'aplicaciones automotores, sistemas de transmisión, mantenimiento, reparación, repuestos',
        ],
        'calculator' => [
            'label' => 'Calculadora de pesos',
            'recommended_title' => 'Calculadora técnica | Herramientas para cotización',
            'recommended_description' => 'Herramienta de apoyo para consultas técnicas, cálculos rápidos y gestión comercial dentro del sitio de Nicolais Mario e Hijo.',
            'recommended_keywords' => 'calculadora técnica, cotización, herramientas, repuestos, autopartes',
        ],
        'products_family' => [
            'label' => 'Líneas de productos',
            'recommended_title' => 'Líneas de productos | Familias de repuestos',
            'recommended_description' => 'Familias y líneas de repuestos automotores disponibles para sistemas de transmisión, mantenimiento y reposición profesional.',
            'recommended_keywords' => 'familias de repuestos, líneas de productos, autopartes, transmisión, catálogo',
        ],
        'products_detail' => [
            'label' => 'Detalle de producto',
            'recommended_title' => 'Detalle de producto | Repuestos y equivalencias',
            'recommended_description' => 'Ficha comercial de producto con información técnica, equivalencias, códigos y datos útiles para consultas profesionales.',
            'recommended_keywords' => 'detalle de producto, ficha técnica, equivalencias, código, OEM, repuesto',
        ],
        'products_all' => [
            'label' => 'Todos los productos',
            'recommended_title' => 'Todos los productos | Repuestos automotores',
            'recommended_description' => 'Listado completo de productos publicados por Nicolais Mario e Hijo para búsqueda rápida por código, familia o descripción.',
            'recommended_keywords' => 'todos los productos, listado de repuestos, catálogo automotor, códigos, autopartes',
        ],
        'products_sheet' => [
            'label' => 'Ficha técnica',
            'recommended_title' => 'Ficha técnica | Producto Nicolais Mario e Hijo',
            'recommended_description' => 'Información técnica ampliada de producto para consultas, equivalencias y documentación comercial.',
            'recommended_keywords' => 'ficha técnica, repuesto automotor, documentación, producto, equivalencia',
        ],
        'quality' => [
            'label' => 'Calidad',
            'recommended_title' => 'Calidad | Repuestos automotores con respaldo',
            'recommended_description' => 'Conocé el enfoque de calidad, control y respaldo comercial de Nicolais Mario e Hijo para repuestos automotores.',
            'recommended_keywords' => 'calidad, repuestos automotores, control, respaldo, proveedores',
        ],
        'offers' => [
            'label' => 'Ofertas',
            'recommended_title' => 'Ofertas | Repuestos disponibles',
            'recommended_description' => 'Ofertas comerciales, novedades de stock y oportunidades en repuestos automotores seleccionados.',
            'recommended_keywords' => 'ofertas, repuestos, stock, autopartes, promociones',
        ],
        'news' => [
            'label' => 'Novedades',
            'recommended_title' => 'Novedades | Nicolais Mario e Hijo',
            'recommended_description' => 'Noticias, lanzamientos, actualizaciones comerciales y novedades de Nicolais Mario e Hijo.',
            'recommended_keywords' => 'novedades, noticias, lanzamientos, repuestos, autopartes',
        ],
        'news_detail' => [
            'label' => 'Detalle de novedad',
            'recommended_title' => 'Novedad | Nicolais Mario e Hijo',
            'recommended_description' => 'Artículo informativo de Nicolais Mario e Hijo con novedades comerciales, técnicas o institucionales.',
            'recommended_keywords' => 'novedad, noticia, repuestos automotores, Nicolais Mario e Hijo',
        ],
        'catalog' => [
            'label' => 'Catálogos',
            'recommended_title' => 'Catálogos | Repuestos automotores',
            'recommended_description' => 'Descargá y consultá catálogos de repuestos automotores, marcas representadas y documentación comercial.',
            'recommended_keywords' => 'catálogos, PDF, repuestos automotores, autopartes, marcas',
        ],
        'quote' => [
            'label' => 'Presupuesto',
            'recommended_title' => 'Presupuesto | Consultas comerciales',
            'recommended_description' => 'Solicitá presupuesto, disponibilidad, equivalencias y atención comercial para repuestos automotores.',
            'recommended_keywords' => 'presupuesto, consulta comercial, cotización, repuestos automotores, autopartes',
        ],
        'contact' => [
            'label' => 'Contacto',
            'recommended_title' => 'Contacto | Nicolais Mario e Hijo',
            'recommended_description' => 'Contactá a Nicolais Mario e Hijo para consultas comerciales, presupuestos, disponibilidad y atención especializada.',
            'recommended_keywords' => 'contacto, consultas, repuestos automotores, atención comercial, presupuesto',
        ],
        'partners' => [
            'label' => 'Representadas',
            'recommended_title' => 'Marcas representadas | Nicolais Mario e Hijo',
            'recommended_description' => 'Conocé marcas, líneas y representadas disponibles dentro de la oferta comercial de Nicolais Mario e Hijo.',
            'recommended_keywords' => 'marcas representadas, autopartes, repuestos, proveedores, catálogo',
        ],
        'clients' => [
            'label' => 'Clientes',
            'recommended_title' => 'Clientes | Acceso y solicitud de Zona Cliente',
            'recommended_description' => 'Acceso para clientes, solicitud de usuario y gestión privada de productos, pedidos, presupuestos y listas de precios.',
            'recommended_keywords' => 'clientes, zona cliente, acceso privado, pedidos, presupuestos',
        ],
        'client_zone' => [
            'label' => 'Zona Cliente',
            'recommended_title' => 'Zona Cliente | Área privada',
            'recommended_description' => 'Área privada para clientes aprobados con productos, pedidos, presupuestos, listas de precios e información de pagos.',
            'recommended_keywords' => 'zona cliente, área privada, pedidos, presupuestos, lista de precios',
        ],
        'search' => [
            'label' => 'Buscador',
            'recommended_title' => 'Buscar | Nicolais Mario e Hijo',
            'recommended_description' => 'Buscador interno para encontrar productos, códigos, novedades, contacto y secciones del sitio.',
            'recommended_keywords' => 'buscar, buscador, productos, códigos, repuestos, Nicolais Mario e Hijo',
        ],
    ];

    protected const ROUTE_PAGE_MAP = [
        'web.home' => 'home',
        'web.about' => 'about',
        'web.applications' => 'applications',
        'web.applications.detail' => 'applications',
        'web.calculator.index' => 'calculator',
        'web.products.index' => 'products',
        'web.products.all' => 'products_all',
        'web.products.family' => 'products_family',
        'web.products.line' => 'products_family',
        'web.products.series' => 'products_detail',
        'web.products.grade' => 'products_detail',
        'web.products.show' => 'products_detail',
        'web.products.technical-sheet' => 'products_sheet',
        'web.quality' => 'quality',
        'web.offers.index' => 'offers',
        'web.news.index' => 'news',
        'web.news.show' => 'news_detail',
        'web.catalog.show' => 'catalog',
        'web.catalog.store' => 'catalog',
        'web.partners.index' => 'partners',
        'web.clients.index' => 'clients',
        'web.clients.login' => 'clients',
        'web.clients.store' => 'clients',
        'web.client-zone.index' => 'client_zone',
        'web.client-zone.section' => 'client_zone',
        'web.client-zone.suggest' => 'client_zone',
        'web.client-zone.orders.show' => 'client_zone',
        'web.client-zone.price-lists.view' => 'client_zone',
        'web.quote.show' => 'quote',
        'web.quote.store' => 'quote',
        'web.contact.show' => 'contact',
        'web.contact.store' => 'contact',
        'web.search.index' => 'search',
        'web.search.suggest' => 'search',
    ];

    public static function pages(): array
    {
        return self::PAGES;
    }

    public static function resolvePageKey(?Request $request = null): ?string
    {
        $routeName = $request?->route()?->getName();

        if (! $routeName) {
            return null;
        }

        if (str_starts_with($routeName, 'web.client-zone.')) {
            return 'client_zone';
        }

        return self::ROUTE_PAGE_MAP[$routeName] ?? null;
    }
}

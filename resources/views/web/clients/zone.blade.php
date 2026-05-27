@extends('web.layouts.app')

@section('title', 'Zona Cliente')
@section('meta_description', 'Área privada para clientes de Nicolais Mario e Hijo.')

@push('styles')
    <link rel="preload" as="image" href="{{ asset('storage/brand/logo.svg') }}" type="image/svg+xml" fetchpriority="high">
    @vite('resources/css/web/client-zone.css')
@endpush

@section('content')
    <main class="products-page client-zone-page">
        <div class="products-topbar">
            <div class="products-topbar__inner">
                <form class="client-zone-search" action="{{ route('web.client-zone.section', $section) }}" method="GET">
                    <label class="sr-only" for="client-zone-search">Buscar en Zona Cliente</label>
                    <input id="client-zone-search" class="sr-only" type="search" name="q" value="{{ $query }}" autocomplete="off">
                    <button class="products-search-button" type="submit" aria-label="Buscar en zona clientes">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                            <path d="M6.5 13C4.68333 13 3.146 12.3707 1.888 11.112C0.63 9.85333 0.000667196 8.316 5.29101e-07 6.5C-0.000666138 4.684 0.628667 3.14667 1.888 1.888C3.14733 0.629333 4.68467 0 6.5 0C8.31533 0 9.853 0.629333 11.113 1.888C12.373 3.14667 13.002 4.684 13 6.5C13 7.23333 12.8833 7.925 12.65 8.575C12.4167 9.225 12.1 9.8 11.7 10.3L17.3 15.9C17.4833 16.0833 17.575 16.3167 17.575 16.6C17.575 16.8833 17.4833 17.1167 17.3 17.3C17.1167 17.4833 16.8833 17.575 16.6 17.575C16.3167 17.575 16.0833 17.4833 15.9 17.3L10.3 11.7C9.8 12.1 9.225 12.4167 8.575 12.65C7.925 12.8833 7.23333 13 6.5 13ZM6.5 11C7.75 11 8.81267 10.5627 9.688 9.688C10.5633 8.81333 11.0007 7.75067 11 6.5C10.9993 5.24933 10.562 4.187 9.688 3.313C8.814 2.439 7.75133 2.00133 6.5 2C5.24867 1.99867 4.18633 2.43633 3.313 3.313C2.43967 4.18967 2.002 5.252 2 6.5C1.998 7.748 2.43567 8.81067 3.313 9.688C4.19033 10.5653 5.25267 11.0027 6.5 11Z" fill="white"/>
                        </svg>
                    </button>
                </form>
            </div>
        </div>

        <header class="products-header">
            <div class="products-header__inner">
                <a class="products-header__logo" href="{{ url('/zona-clientes') }}" aria-label="Nicolais Mario e Hijo">
                    <img src="{{ asset('storage/brand/logo.svg') }}" alt="Nicolais Mario e Hijo" width="209" height="68" loading="eager" decoding="sync" fetchpriority="high">
                </a>

                <nav class="products-nav client-zone-nav" aria-label="Zona Cliente">
                    @foreach ($sections as $slug => $label)
                        <a href="{{ $slug === 'productos' ? route('web.client-zone.index') : route('web.client-zone.section', $slug) }}" @if ($section === $slug) aria-current="page" @endif>{{ $label }}</a>
                    @endforeach
                </nav>

                <form class="client-zone-profile" action="{{ route('web.client-zone.logout') }}" method="POST">
                    @csrf
                    <details class="client-zone-profile__menu">
                        <summary class="products-client client-zone-user" aria-label="Perfil de cliente">
                            <svg class="nm-client-button__icon" width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
                                <path d="M1.75 18C1.26875 18 0.856916 17.8323 0.5145 17.4969C0.172083 17.1614 0.000583333 16.7577 0 16.2857V7.71429C0 7.24286 0.1715 6.83943 0.5145 6.504C0.8575 6.16857 1.26933 6.00057 1.75 6H2.625V4.28571C2.625 3.1 3.05171 2.08943 3.90512 1.254C4.75854 0.418572 5.79017 0.000572014 7 5.8508e-07C8.20983 -0.000570843 9.24175 0.417429 10.0957 1.254C10.9497 2.09057 11.3762 3.10114 11.375 4.28571V6H12.25C12.7312 6 13.1434 6.168 13.4864 6.504C13.8294 6.84 14.0006 7.24343 14 7.71429V16.2857C14 16.7571 13.8288 17.1609 13.4864 17.4969C13.144 17.8329 12.7318 18.0006 12.25 18H1.75ZM1.75 16.2857H12.25V7.71429H1.75V16.2857ZM7 13.7143C7.48125 13.7143 7.89337 13.5466 8.23637 13.2111C8.57937 12.8757 8.75058 12.472 8.75 12C8.74942 11.528 8.57821 11.1246 8.23637 10.7897C7.89454 10.4549 7.48242 10.2869 7 10.2857C6.51758 10.2846 6.10575 10.4526 5.7645 10.7897C5.42325 11.1269 5.25175 11.5303 5.25 12C5.24825 12.4697 5.41975 12.8734 5.7645 13.2111C6.10925 13.5489 6.52108 13.7166 7 13.7143ZM4.375 6H9.625V4.28571C9.625 3.57143 9.36979 2.96429 8.85937 2.46429C8.34896 1.96429 7.72917 1.71429 7 1.71429C6.27083 1.71429 5.65104 1.96429 5.14062 2.46429C4.63021 2.96429 4.375 3.57143 4.375 4.28571V6Z" fill="white"/>
                            </svg>
                            <span class="client-zone-user__name">{{ Str::limit(auth()->user()->name, 10, '') }}</span>
                        </summary>
                        <div class="client-zone-profile__dropdown">
                            <button class="client-zone-profile__logout" type="submit">Cerrar sesión</button>
                        </div>
                    </details>
                </form>
            </div>
        </header>

        <section @class([
            'products-shell',
            'client-zone-shell',
            'client-zone-shell--products' => $section === 'productos',
            'client-zone-shell--orders' => $section === 'mis-pedidos',
            'client-zone-shell--price-lists' => $section === 'lista-de-precios',
            'client-zone-shell--payments' => $section === 'info-de-pagos',
        ])>
            @if (session('status'))
                <div
                    data-web-toast="{{ session('status') }}"
                    data-web-toast-type="success"
                    data-web-toast-title="{{ session('toast_title', Str::contains(Str::lower(session('status')), 'presupuesto') ? 'Presupuesto actualizado' : 'Carrito actualizado') }}"
                    hidden
                ></div>
            @endif

            <nav class="products-breadcrumb" aria-label="Breadcrumb">
                <a href="{{ route('web.client-zone.index') }}">Inicio</a>
                <span>&gt;</span>
                <span>{{ $current }}</span>
            </nav>

            <div class="client-zone-content">
                @if ($section === 'productos')
                    @include('web.products.partials-search', [
                        'searchAction' => route('web.client-zone.index'),
                        'clearUrl' => route('web.client-zone.index'),
                        'families' => $families,
                        'brands' => $brands,
                        'models' => $models,
                    ])

                    <div class="client-products-toolbar">
                        <label class="client-products-public-toggle">
                            <input type="checkbox" checked data-client-public-toggle>
                            <span></span>
                            Vista público
                        </label>
                    </div>

                    <div class="client-products-table-wrap">
                        <table class="client-products-table">
                            <colgroup>
                                <col class="client-products-table__col-family">
                                <col class="client-products-table__col-code">
                                <col class="client-products-table__col-description">
                                <col class="client-products-table__col-type">
                                <col class="client-products-table__col-list">
                                <col class="client-products-table__col-discount">
                                <col class="client-products-table__col-sale">
                                <col class="client-products-table__col-qty">
                                <col class="client-products-table__col-subtotal">
                                <col class="client-products-table__col-cart">
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>Familia</th>
                                    <th>Código</th>
                                    <th>Descripción</th>
                                    <th>Tipo</th>
                                    <th>Precio lista</th>
                                    <th><span class="client-products-table__two-line"><span>Precio con</span><span>Descuento</span></span></th>
                                    <th>Precio venta</th>
                                    <th>Cant</th>
                                    <th>Subtotal</th>
                                    <th aria-label="Carrito"></th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse ($products as $product)
                                    @php
                                        $listPrice = (float) ($product->price ?? 0);
                                        $discountedPrice = (float) ($product->discount_price ?? $listPrice);
                                        $discountPercent = $listPrice > 0 ? max(0, (1 - ($discountedPrice / $listPrice)) * 100) : 0;
                                        $salePrice = $discountedPrice * (1 + ($clientMargin / 100));
                                        $quantity = 1;
                                        $subtotal = $salePrice * $quantity;
                                        $money = fn (float $value): string => '$'.number_format($value, 2, ',', '.');
                                    @endphp
                                    <tr data-client-product-row data-sale-price="{{ number_format($salePrice, 2, '.', '') }}">
                                        <td>{{ $product->family?->name ?? '-' }}</td>
                                        <td>{{ $product->sku ?? $product->original_code ?? '-' }}</td>
                                        <td>{{ $product->name }}</td>
                                        <td>{{ $product->brand ?: ($product->subfamily?->name ?? '-') }}</td>
                                        <td>{{ $money($listPrice) }}</td>
                                        <td>
                                            <span class="client-products-table__discount">{{ $money($discountedPrice) }}</span>
                                            <small class="client-products-table__discount-percent">({{ number_format($discountPercent, 0, ',', '.') }}%)</small>
                                        </td>
                                        <td>
                                            <span class="client-products-table__sale">{{ $money($salePrice) }}</span>
                                            <small class="client-products-table__sale-percent">({{ number_format($clientMargin, 0, ',', '.') }}%)</small>
                                        </td>
                                        <td>
                                            <span class="client-products-table__qty-card">
                                                <input class="client-products-table__qty" type="text" value="{{ $quantity }}" inputmode="numeric" pattern="[0-9]*" aria-label="Cantidad" data-client-product-qty>
                                                <span class="client-products-table__qty-arrows">
                                                    <button type="button" data-client-product-step="1" aria-label="Aumentar cantidad">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
                                                        <g clip-path="url(#qty-up-{{ $product->id }})">
                                                            <path d="M10.4922 11.5L1.50781 11.5L6 3.53125L10.4922 11.5Z" stroke="#939393"/>
                                                        </g>
                                                        <defs>
                                                            <clipPath id="qty-up-{{ $product->id }}">
                                                                <rect width="12" height="10" fill="white"/>
                                                            </clipPath>
                                                        </defs>
                                                        </svg>
                                                    </button>
                                                    <button type="button" data-client-product-step="-1" aria-label="Disminuir cantidad">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
                                                        <g clip-path="url(#qty-down-{{ $product->id }})">
                                                            <path d="M6.00098 5.2085C5.98689 5.2085 5.97591 5.20518 5.96973 5.20264L1.32715 -1.49951L10.6748 -1.49951L6.03223 5.20264C6.02618 5.20521 6.0153 5.20846 6.00098 5.2085Z" stroke="#939393"/>
                                                        </g>
                                                        <defs>
                                                            <clipPath id="qty-down-{{ $product->id }}">
                                                                <rect width="12" height="10" fill="white" transform="translate(12 10) rotate(180)"/>
                                                            </clipPath>
                                                        </defs>
                                                        </svg>
                                                    </button>
                                                </span>
                                            </span>
                                        </td>
                                        <td data-client-product-subtotal>{{ $money($subtotal) }}</td>
                                        <td>
                                            <button
                                                class="client-products-table__cart"
                                                type="button"
                                                aria-label="Elegir destino"
                                                data-client-product-choose
                                                data-cart-action="{{ route('web.client-zone.cart.add', $product) }}"
                                                data-budget-action="{{ route('web.client-zone.budget.add', $product) }}"
                                                data-product-name="{{ $product->name }}"
                                            >
                                                <span aria-hidden="true">+</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="16" viewBox="0 0 15 16" fill="none" aria-hidden="true">
                                                    <path d="M4.50416 16C4.09128 16 3.73795 15.8435 3.44418 15.5304C3.15041 15.2173 3.00327 14.8405 3.00277 14.4C3.00277 13.96 3.14991 13.5835 3.44418 13.2704C3.73845 12.9573 4.09178 12.8005 4.50416 12.8C4.91704 12.8 5.27062 12.9568 5.56489 13.2704C5.85916 13.584 6.00605 13.9605 6.00555 14.4C6.00555 14.84 5.85866 15.2168 5.56489 15.5304C5.27112 15.844 4.91754 16.0005 4.50416 16ZM12.0111 16C11.5982 16 11.2449 15.8435 10.9511 15.5304C10.6573 15.2173 10.5102 14.8405 10.5097 14.4C10.5097 13.96 10.6568 13.5835 10.9511 13.2704C11.2454 12.9573 11.5987 12.8005 12.0111 12.8C12.424 12.8 12.7776 12.9568 13.0718 13.2704C13.3661 13.584 13.513 13.9605 13.5125 14.4C13.5125 14.84 13.3656 15.2168 13.0718 15.5304C12.7781 15.844 12.4245 16.0005 12.0111 16ZM3.86607 3.2L5.66774 7.2H10.9226L12.987 3.2H3.86607ZM3.15291 1.6H14.2256C14.5134 1.6 14.7324 1.7368 14.8825 2.0104C15.0326 2.284 15.0389 2.56053 14.9013 2.84L12.2363 7.96C12.0987 8.22667 11.9143 8.43333 11.683 8.58C11.4518 8.72667 11.1983 8.8 10.9226 8.8H5.32992L4.50416 10.4H13.5125V12H4.50416C3.94114 12 3.51575 11.7368 3.22798 11.2104C2.94022 10.684 2.9277 10.1605 3.19045 9.64L4.20388 7.68L1.50139 1.6H0V0H2.43975L3.15291 1.6Z" fill="#0072BB"/>
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="10">No encontramos productos para esos filtros.</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>

                    {{ $products->links('web.products.partials-pagination') }}

                    <div class="client-product-destination-modal" data-client-product-modal hidden>
                        <button class="client-product-destination-modal__backdrop" type="button" data-client-product-modal-close aria-label="Cerrar"></button>
                        <section class="client-product-destination-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="client-product-destination-title">
                            <button class="client-product-destination-modal__close" type="button" data-client-product-modal-close aria-label="Cerrar">&times;</button>
                            <h2 id="client-product-destination-title">Elegí destino</h2>
                            <p data-client-product-modal-name>Producto seleccionado</p>
                            <div class="client-product-destination-modal__actions">
                                <form method="POST" data-client-product-modal-cart>
                                    @csrf
                                    <input type="hidden" name="quantity" value="1">
                                    <button type="submit">Ir a carrito</button>
                                </form>
                                <form method="POST" data-client-product-modal-budget>
                                    @csrf
                                    <input type="hidden" name="quantity" value="1">
                                    <button type="submit">Ir a presupuesto</button>
                                </form>
                            </div>
                        </section>
                    </div>
                @elseif ($section === 'carrito')
                    @php
                        $money = fn (float $value): string => '$'.number_format($value, 2, ',', '.');
                    @endphp

                    <div class="client-cart">
                        <div class="client-cart__table-wrap">
                            <table class="client-products-table client-cart__table">
                                <thead>
                                    <tr>
                                        <th>Familia</th>
                                        <th>Código</th>
                                        <th>Descripción</th>
                                        <th>Tipo</th>
                                        <th>Precio lista</th>
                                        <th>Precio con<br>descuento</th>
                                        <th>Precio venta</th>
                                        <th>Cant</th>
                                        <th>Subtotal</th>
                                        <th aria-label="Eliminar"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @forelse ($cart['items'] as $item)
                                        @php
                                            $product = $item['product'];
                                        @endphp
                                        <tr>
                                            <td>{{ $product->family?->name ? Str::ucfirst(Str::lower($product->family->name)) : '-' }}</td>
                                            <td>{{ $product->sku ?? $product->original_code ?? '-' }}</td>
                                            <td>{{ $product->name }}</td>
                                            <td>{{ $product->brand ?: ($product->subfamily?->name ?? '-') }}</td>
                                            <td>{{ $money($item['list_price']) }}</td>
                                            <td>
                                                <span class="client-products-table__discount">{{ $money($item['discounted_price']) }}</span>
                                                <small class="client-products-table__discount-percent">({{ number_format($item['discount_percent'], 0, ',', '.') }}%)</small>
                                            </td>
                                            <td>
                                                <span class="client-products-table__sale">{{ $money($item['sale_price']) }}</span>
                                                <small class="client-products-table__sale-percent">({{ number_format($clientMargin, 0, ',', '.') }}%)</small>
                                            </td>
                                            <td>
                                                <form class="client-cart__qty-form" action="{{ route('web.client-zone.cart.update', $product) }}" method="POST">
                                                    @csrf
                                                    @method('PATCH')
                                                    <span class="client-products-table__qty-card">
                                                        <input class="client-products-table__qty client-cart__qty" type="text" name="quantity" value="{{ $item['quantity'] }}" inputmode="numeric" pattern="[0-9]*" aria-label="Cantidad" data-client-cart-qty>
                                                        <span class="client-products-table__qty-arrows">
                                                            <button type="button" data-client-cart-step="1" aria-label="Aumentar cantidad">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
                                                                    <g clip-path="url(#cart-qty-up-{{ $product->id }})">
                                                                        <path d="M10.4922 11.5L1.50781 11.5L6 3.53125L10.4922 11.5Z" stroke="#939393"/>
                                                                    </g>
                                                                    <defs>
                                                                        <clipPath id="cart-qty-up-{{ $product->id }}">
                                                                            <rect width="12" height="10" fill="white"/>
                                                                        </clipPath>
                                                                    </defs>
                                                                </svg>
                                                            </button>
                                                            <button type="button" data-client-cart-step="-1" aria-label="Disminuir cantidad">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
                                                                    <g clip-path="url(#cart-qty-down-{{ $product->id }})">
                                                                        <path d="M6.00098 5.2085C5.98689 5.2085 5.97591 5.20518 5.96973 5.20264L1.32715 -1.49951L10.6748 -1.49951L6.03223 5.20264C6.02618 5.20521 6.0153 5.20846 6.00098 5.2085Z" stroke="#939393"/>
                                                                    </g>
                                                                    <defs>
                                                                        <clipPath id="cart-qty-down-{{ $product->id }}">
                                                                            <rect width="12" height="10" fill="white" transform="translate(12 10) rotate(180)"/>
                                                                        </clipPath>
                                                                    </defs>
                                                                </svg>
                                                            </button>
                                                        </span>
                                                    </span>
                                                </form>
                                            </td>
                                            <td>{{ $money($item['subtotal_discount']) }}</td>
                                            <td>
                                                <form action="{{ route('web.client-zone.cart.remove', $product) }}" method="POST">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button class="client-cart__delete" type="submit" aria-label="Eliminar producto">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                            <path d="M6.28531 8.571L7.42831 20H16.5703L17.7133 8.571M13.4993 15.5V10.5M10.4993 15.5V10.5M4.57031 6.286H9.14231M9.14231 6.286L9.52431 4.757C9.57848 4.54075 9.70336 4.34881 9.8791 4.21166C10.0548 4.0745 10.2714 4.00001 10.4943 4H13.5043C13.7272 4.00001 13.9438 4.0745 14.1195 4.21166C14.2953 4.34881 14.4201 4.54075 14.4743 4.757L14.8563 6.286M9.14231 6.286H14.8563M14.8563 6.286H19.4283" stroke="#0072BB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                                        </svg>
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    @empty
                                        <tr>
                                            <td colspan="10">Todavía no agregaste productos al carrito.</td>
                                        </tr>
                                    @endforelse
                                </tbody>
                            </table>
                        </div>

                        <a class="client-cart__add-more" href="{{ route('web.client-zone.index') }}">+ Agregar más productos</a>

                        <form class="client-cart__order-form" action="{{ route('web.client-zone.cart.order') }}" method="POST" enctype="multipart/form-data">
                            @csrf
                            <div class="client-cart__grid">
                            <section class="client-cart__panel">
                                <h2>Información Importante</h2>
                                <p>- Venta sujeta a disponibilidad en stock<br>- Los precios se encuentran expresados en ($) pesos argentinos<br>- El plazo de entrega se coordina con la empresa</p>
                            </section>

                            <section class="client-cart__panel client-cart__delivery">
                                <h2>Forma de Entrega</h2>
                                <label><input type="radio" name="delivery_method" value="Retiro cliente" checked> Retiro cliente</label>
                                <label><input type="radio" name="delivery_method" value="Reparto Nicolais Mario e Hijo (sin costo)"> Reparto Nicolais Mario e Hijo (sin costo)</label>
                                <label><input type="radio" name="delivery_method" value="Interior (envío hasta expreso asignado sin costo)"> Interior (envío hasta expreso asignado sin costo)</label>
                            </section>

                            <section class="client-cart__panel client-cart__message">
                                <h2>Escribinos un Mensaje</h2>
                                <textarea name="message" placeholder="Días especiales de entrega, cambios de domicilio, expresos, requerimientos especiales en la mercadería, exenciones."></textarea>
                            </section>

                            <section class="client-cart__panel client-cart__summary">
                                <h2>Tu Pedido</h2>
                                <dl>
                                    <div><dt>Subtotal sin descuento</dt><dd>{{ $money($cart['subtotal_list']) }}</dd></div>
                                    <div class="is-discount"><dt>Descuentos</dt><dd>-{{ $money($cart['discount_total']) }}</dd></div>
                                    <div><dt>Subtotal con descuento</dt><dd>{{ $money($cart['subtotal_discount']) }}</dd></div>
                                    <div class="is-spaced"><dt>IVA 21%</dt><dd>{{ $money($cart['iva']) }}</dd></div>
                                    <div class="is-total"><dt>Total (IVA incluido)</dt><dd>{{ $money($cart['total']) }}</dd></div>
                                </dl>
                            </section>
                            </div>

                            <div class="client-cart__actions">
                            <label class="client-cart__file">
                                <span>Adjunta un Archivo</span>
                                <span class="client-cart__file-control">
                                    <span data-client-file-label>Seleccionar archivo</span>
                                    <span class="client-cart__file-button">Adjuntar</span>
                                    <input type="file" name="attachment" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp" data-client-file-input>
                                </span>
                                <span class="client-cart__file-preview" data-client-file-preview hidden></span>
                            </label>
                            <a class="client-cart__cancel" href="{{ route('web.client-zone.index') }}">Cancelar</a>
                            <button class="client-cart__submit" type="submit">Realizar pedido</button>
                            </div>
                        </form>
                    </div>
                @elseif ($section === 'presupuesto')
                    @php
                        $money = fn (float $value): string => '$'.number_format($value, 2, ',', '.');
                    @endphp

                    <div class="client-cart client-budget" data-client-budget-document data-budget-save-url="{{ route('web.client-zone.budget.save') }}">
                        <div class="client-cart__table-wrap">
                            <table class="client-products-table client-cart__table">
                                <thead>
                                    <tr>
                                        <th>Familia</th>
                                        <th>Código</th>
                                        <th>Descripción</th>
                                        <th>Tipo</th>
                                        <th>Precio lista</th>
                                        <th>Precio con<br>descuento</th>
                                        <th>Precio venta</th>
                                        <th>Cant</th>
                                        <th>Subtotal</th>
                                        <th aria-label="Eliminar"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @forelse ($budget['items'] as $item)
                                        @php
                                            $product = $item['product'];
                                        @endphp
                                        <tr>
                                            <td>{{ $product->family?->name ? Str::ucfirst(Str::lower($product->family->name)) : '-' }}</td>
                                            <td>{{ $product->sku ?? $product->original_code ?? '-' }}</td>
                                            <td>{{ $product->name }}</td>
                                            <td>{{ $product->brand ?: ($product->subfamily?->name ?? '-') }}</td>
                                            <td>{{ $money($item['list_price']) }}</td>
                                            <td>
                                                <span class="client-products-table__discount">{{ $money($item['discounted_price']) }}</span>
                                                <small class="client-products-table__discount-percent">({{ number_format($item['discount_percent'], 0, ',', '.') }}%)</small>
                                            </td>
                                            <td>
                                                <span class="client-products-table__sale">{{ $money($item['sale_price']) }}</span>
                                                <small class="client-products-table__sale-percent">({{ number_format($clientMargin, 0, ',', '.') }}%)</small>
                                            </td>
                                            <td>
                                                <form class="client-cart__qty-form" action="{{ route('web.client-zone.budget.update', $product) }}" method="POST">
                                                    @csrf
                                                    @method('PATCH')
                                                    <span class="client-products-table__qty-card">
                                                        <input class="client-products-table__qty client-cart__qty" type="text" name="quantity" value="{{ $item['quantity'] }}" inputmode="numeric" pattern="[0-9]*" aria-label="Cantidad" data-client-cart-qty>
                                                        <span class="client-products-table__qty-arrows">
                                                            <button type="button" data-client-cart-step="1" aria-label="Aumentar cantidad">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
                                                                    <g clip-path="url(#budget-qty-up-{{ $product->id }})">
                                                                        <path d="M10.4922 11.5L1.50781 11.5L6 3.53125L10.4922 11.5Z" stroke="#939393"/>
                                                                    </g>
                                                                    <defs>
                                                                        <clipPath id="budget-qty-up-{{ $product->id }}">
                                                                            <rect width="12" height="10" fill="white"/>
                                                                        </clipPath>
                                                                    </defs>
                                                                </svg>
                                                            </button>
                                                            <button type="button" data-client-cart-step="-1" aria-label="Disminuir cantidad">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
                                                                    <g clip-path="url(#budget-qty-down-{{ $product->id }})">
                                                                        <path d="M6.00098 5.2085C5.98689 5.2085 5.97591 5.20518 5.96973 5.20264L1.32715 -1.49951L10.6748 -1.49951L6.03223 5.20264C6.02618 5.20521 6.0153 5.20846 6.00098 5.2085Z" stroke="#939393"/>
                                                                    </g>
                                                                    <defs>
                                                                        <clipPath id="budget-qty-down-{{ $product->id }}">
                                                                            <rect width="12" height="10" fill="white" transform="translate(12 10) rotate(180)"/>
                                                                        </clipPath>
                                                                    </defs>
                                                                </svg>
                                                            </button>
                                                        </span>
                                                    </span>
                                                </form>
                                            </td>
                                            <td>{{ $money($item['subtotal_discount']) }}</td>
                                            <td>
                                                <form action="{{ route('web.client-zone.budget.remove', $product) }}" method="POST">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button class="client-cart__delete" type="submit" aria-label="Eliminar producto">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                            <path d="M6.28531 8.571L7.42831 20H16.5703L17.7133 8.571M13.4993 15.5V10.5M10.4993 15.5V10.5M4.57031 6.286H9.14231M9.14231 6.286L9.52431 4.757C9.57848 4.54075 9.70336 4.34881 9.8791 4.21166C10.0548 4.0745 10.2714 4.00001 10.4943 4H13.5043C13.7272 4.00001 13.9438 4.0745 14.1195 4.21166C14.2953 4.34881 14.4201 4.54075 14.4743 4.757L14.8563 6.286M9.14231 6.286H14.8563M14.8563 6.286H19.4283" stroke="#0072BB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                                        </svg>
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    @empty
                                        <tr>
                                            <td colspan="10">Todavía no agregaste productos al presupuesto.</td>
                                        </tr>
                                    @endforelse
                                </tbody>
                            </table>
                        </div>

                        @if ($budget['services']->isNotEmpty())
                            <div class="client-budget__selected-services">
                                <div class="client-budget__selected-services-heading">
                                    <span>Servicio</span>
                                    <span>Cant</span>
                                    <span>Precio</span>
                                    <span>Precio con<br>Descuento</span>
                                    <span>Subtotal</span>
                                    <span aria-label="Acciones"></span>
                                </div>
                                <div class="client-budget__selected-services-list">
                                    @foreach ($budget['services'] as $serviceItem)
                                        <article class="client-budget__selected-service">
                                            <div>
                                                <strong>{{ $serviceItem['name'] }}</strong>
                                            </div>
                                            <div>
                                                <strong>{{ $serviceItem['quantity'] }}</strong>
                                            </div>
                                            <div>
                                                <strong>{{ $money((float) $serviceItem['price']) }}</strong>
                                            </div>
                                            <div class="is-discount">
                                                <strong>{{ $money((float) $serviceItem['discounted_price']) }}</strong>
                                            </div>
                                            <div>
                                                <strong>{{ $money((float) $serviceItem['subtotal_discount']) }}</strong>
                                            </div>
                                            <form action="{{ route('web.client-zone.budget.services.remove', $serviceItem['id']) }}" method="POST">
                                                @csrf
                                                @method('DELETE')
                                                <button class="client-cart__delete" type="submit" aria-label="Quitar servicio">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                        <path d="M6.28531 8.571L7.42831 20H16.5703L17.7133 8.571M13.4993 15.5V10.5M10.4993 15.5V10.5M4.57031 6.286H9.14231M9.14231 6.286L9.52431 4.757C9.57848 4.54075 9.70336 4.34881 9.8791 4.21166C10.0548 4.0745 10.2714 4.00001 10.4943 4H13.5043C13.7272 4.00001 13.9438 4.0745 14.1195 4.21166C14.2953 4.34881 14.4201 4.54075 14.4743 4.757L14.8563 6.286M9.14231 6.286H14.8563M14.8563 6.286H19.4283" stroke="#0072BB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                                    </svg>
                                                </button>
                                            </form>
                                        </article>
                                    @endforeach
                                </div>
                            </div>
                        @endif

                        <div class="client-budget__add-actions">
                            <a class="client-cart__add-more" href="{{ route('web.client-zone.index') }}">+ Agregar más productos</a>
                            <button
                                class="client-budget__add-service"
                                type="button"
                                aria-expanded="false"
                                aria-controls="client-budget-services"
                                data-client-budget-services-toggle
                            >+ Agregar servicios</button>
                        </div>

                        <div class="client-budget__services-wrap" id="client-budget-services" data-client-budget-services hidden>
                            <form class="client-budget__service-form" action="{{ route('web.client-zone.budget.services.store') }}" method="POST">
                                @csrf
                                <label>
                                    <span>Servicio</span>
                                    <input type="text" name="name" placeholder="Mano de obra, instalación, envío especial..." required>
                                </label>
                                <label>
                                    <span>Cant</span>
                                    <input type="number" name="quantity" min="1" value="1" required>
                                </label>
                                <label>
                                    <span>Precio</span>
                                    <input type="number" name="price" min="0" step="0.01" placeholder="0,00" required>
                                </label>
                                <label>
                                    <span>Precio con descuento</span>
                                    <input type="number" name="discount_price" min="0" step="0.01" placeholder="Opcional">
                                </label>
                                <button class="client-budget__service-add" type="submit">
                                    <span>+</span>
                                    Añadir servicio
                                </button>
                            </form>
                        </div>

                        <div class="client-cart__grid">
                            <section class="client-cart__panel">
                                <h2>Información Importante</h2>
                                <p>- Venta sujeta a disponibilidad en stock<br>- Los precios se encuentran expresados en ($) pesos argentinos<br>- El plazo de entrega se coordina con la empresa</p>
                            </section>

                            <section class="client-cart__panel client-cart__delivery">
                                <h2>Forma de Entrega</h2>
                                <label><input type="radio" name="budget_delivery_method" value="Retiro cliente" checked> Retiro cliente</label>
                                <label><input type="radio" name="budget_delivery_method" value="Reparto Nicolais Mario e Hijo (sin costo)"> Reparto Nicolais Mario e Hijo (sin costo)</label>
                                <label><input type="radio" name="budget_delivery_method" value="Interior (envío hasta expreso asignado sin costo)"> Interior (envío hasta expreso asignado sin costo)</label>
                            </section>

                            <section class="client-cart__panel client-cart__message">
                                <h2>Escribinos un Mensaje</h2>
                                <textarea name="budget_message" placeholder="Días especiales de entrega, cambios de domicilio, expresos, requerimientos especiales en la mercadería, exenciones."></textarea>
                            </section>

                            <section class="client-cart__panel client-cart__summary">
                                <h2>Tu Pedido</h2>
                                <dl>
                                    <div><dt>Subtotal sin descuento</dt><dd>{{ $money($budget['subtotal_list']) }}</dd></div>
                                    <div class="is-discount"><dt>Descuentos</dt><dd>-{{ $money($budget['discount_total']) }}</dd></div>
                                    <div><dt>Subtotal con descuento</dt><dd>{{ $money($budget['subtotal_discount']) }}</dd></div>
                                    <div class="is-spaced"><dt>IVA 21%</dt><dd>{{ $money($budget['iva']) }}</dd></div>
                                    <div class="is-total"><dt>Total (IVA incluido)</dt><dd>{{ $money($budget['total']) }}</dd></div>
                                </dl>
                            </section>
                        </div>

                        <div class="client-cart__actions client-budget__actions">
                            <label class="client-cart__file">
                                <span>Adjunta un Archivo</span>
                                <span class="client-cart__file-control">
                                    <span data-client-file-label>Seleccionar archivo</span>
                                    <span class="client-cart__file-button">Adjuntar</span>
                                    <input type="file" name="budget_attachment" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp" data-client-file-input>
                                </span>
                                <span class="client-cart__file-preview" data-client-file-preview hidden></span>
                            </label>
                            <button class="client-cart__cancel client-budget__export" type="button" data-client-budget-export>
                                Exportar archivo
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M8.66675 3.88525V11.3333H7.33342V3.88525L5.17141 6.04725L4.22875 5.10459L8.00008 1.33325L11.7714 5.10459L10.8287 6.04725L8.66675 3.88525ZM2.66675 10.6666H4.00008V13.3333H12.0001V10.6666H13.3334V13.3333C13.3334 14.0666 12.7334 14.6666 12.0001 14.6666H4.00008C3.26675 14.6666 2.66675 14.0246 2.66675 13.3333V10.6666Z" fill="#0072BB"/>
                                </svg>
                            </button>
                            <button class="client-cart__submit client-budget__print" type="button" data-client-budget-print>
                                Imprimir
                                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
                                    <path d="M4.25 6.375V2.83333C4.25 2.45761 4.39926 2.09728 4.66493 1.8316C4.93061 1.56592 5.29094 1.41667 5.66667 1.41667H11.3333C11.7091 1.41667 12.0694 1.56592 12.3351 1.8316C12.6007 2.09728 12.75 2.45761 12.75 2.83333V6.375M4.25 12.0417H3.54167C3.16594 12.0417 2.80561 11.8924 2.53993 11.6267C2.27426 11.3611 2.125 11.0007 2.125 10.625V7.79167C2.125 7.41594 2.27426 7.05561 2.53993 6.78993C2.80561 6.52426 3.16594 6.375 3.54167 6.375H13.4583C13.8341 6.375 14.1944 6.52426 14.4601 6.78993C14.7257 7.05561 14.875 7.41594 14.875 7.79167V10.625C14.875 11.0007 14.7257 11.3611 14.4601 11.6267C14.1944 11.8924 13.8341 12.0417 13.4583 12.0417H12.75M4.25 9.91667H12.75V15.5833H4.25V9.91667Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                @elseif ($section === 'mis-pedidos')
                    @php
                        $money = fn (float $value): string => '$'.number_format($value, 2, ',', '.');
                        $statusLabels = [
                            'pending' => 'Pendiente',
                            'invoiced' => 'Facturado',
                            'dispatched' => 'Despachado',
                            'delivered' => 'Entregado',
                        ];
                    @endphp

                    <section class="client-orders">
                        <div class="client-orders__table-wrap">
                            <table class="client-orders__table">
                                <colgroup>
                                    <col class="client-orders__col-doc">
                                    <col class="client-orders__col-number">
                                    <col class="client-orders__col-purchase">
                                    <col class="client-orders__col-delivery">
                                    <col class="client-orders__col-amount">
                                    <col class="client-orders__col-status">
                                    <col class="client-orders__col-online">
                                    <col class="client-orders__col-download">
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th aria-label="Documento"></th>
                                        <th>N° de pedido</th>
                                        <th>Fecha de compra</th>
                                        <th>Fecha de entrega</th>
                                        <th>Importe</th>
                                        <th>Entregado</th>
                                        <th aria-label="Ver online"></th>
                                        <th aria-label="Descargar"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @forelse ($orders as $order)
                                        <tr>
                                            <td>
                                                <span class="client-orders__doc" aria-hidden="true">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="43" height="43" viewBox="0 0 43 43" fill="none">
                                                        <path d="M25.0827 3.5835V10.7502C25.0827 11.7005 25.4602 12.612 26.1322 13.284C26.8042 13.956 27.7157 14.3335 28.666 14.3335H35.8327M17.916 16.1252H14.3327M28.666 23.2918H14.3327M28.666 30.4585H14.3327M26.8743 3.5835H10.7493C9.79899 3.5835 8.88755 3.96102 8.21555 4.63303C7.54354 5.30504 7.16602 6.21647 7.16602 7.16683V35.8335C7.16602 36.7839 7.54354 37.6953 8.21555 38.3673C8.88755 39.0393 9.79899 39.4168 10.7493 39.4168H32.2493C33.1997 39.4168 34.1111 39.0393 34.7831 38.3673C35.4552 37.6953 35.8327 36.7839 35.8327 35.8335V12.5418L26.8743 3.5835Z" stroke="#0072BB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                                    </svg>
                                                </span>
                                            </td>
                                            <td>{{ $order->order_number }}</td>
                                            <td>{{ $order->created_at?->format('d/m/Y') }}</td>
                                            <td>{{ $order->delivered_at?->format('d/m/Y') ?: '-' }}</td>
                                            <td>{{ $money($order->total) }}</td>
                                            <td><span class="client-orders__status client-orders__status--{{ $order->status }}">{{ $statusLabels[$order->status] ?? $order->status }}</span></td>
                                            <td><a class="client-orders__outline" href="{{ route('web.client-zone.orders.show', $order) }}" target="_blank" rel="noopener">Ver online</a></td>
                                            <td><a class="client-orders__download" href="{{ route('web.client-zone.orders.pdf', $order) }}" download="pedido-{{ $order->order_number }}.pdf" data-no-transition data-client-order-download>Descargar</a></td>
                                        </tr>
                                    @empty
                                        <tr>
                                            <td colspan="8">Todavía no realizaste pedidos.</td>
                                        </tr>
                                    @endforelse
                                </tbody>
                            </table>
                        </div>
                    </section>
                @elseif ($section === 'lista-de-precios')
                    <section class="client-price-lists">
                        <div class="client-price-lists__table-wrap">
                            <table class="client-price-lists__table">
                                <colgroup>
                                    <col class="client-price-lists__col-doc">
                                    <col class="client-price-lists__col-name">
                                    <col class="client-price-lists__col-format">
                                    <col class="client-price-lists__col-size">
                                    <col class="client-price-lists__col-online">
                                    <col class="client-price-lists__col-download">
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th aria-label="Archivo"></th>
                                        <th>Nombre</th>
                                        <th>Formato</th>
                                        <th>Peso</th>
                                        <th aria-label="Ver online"></th>
                                        <th aria-label="Descargar"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @forelse ($priceLists as $priceList)
                                        <tr>
                                            <td>
                                                <span class="client-price-lists__doc" aria-hidden="true">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="43" height="43" viewBox="0 0 43 43" fill="none">
                                                        <path d="M25.0827 3.5835V10.7502C25.0827 11.7005 25.4602 12.612 26.1322 13.284C26.8042 13.956 27.7157 14.3335 28.666 14.3335H35.8327M17.916 16.1252H14.3327M28.666 23.2918H14.3327M28.666 30.4585H14.3327M26.8743 3.5835H10.7493C9.79899 3.5835 8.88755 3.96102 8.21555 4.63303C7.54354 5.30504 7.16602 6.21647 7.16602 7.16683V35.8335C7.16602 36.7839 7.54354 37.6953 8.21555 38.3673C8.88755 39.0393 9.79899 39.4168 10.7493 39.4168H32.2493C33.1997 39.4168 34.1111 39.0393 34.7831 38.3673C35.4552 37.6953 35.8327 36.7839 35.8327 35.8335V12.5418L26.8743 3.5835Z" stroke="#0072BB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                                    </svg>
                                                </span>
                                            </td>
                                            <td>{{ $priceList['name'] }}</td>
                                            <td>{{ $priceList['format'] }}</td>
                                            <td>{{ $priceList['size'] }}</td>
                                            <td><a class="client-price-lists__outline" href="{{ $priceList['view_url'] }}" target="_blank" rel="noopener">Ver online</a></td>
                                            <td><a class="client-price-lists__download" href="{{ $priceList['download_url'] }}" download>Descargar</a></td>
                                        </tr>
                                    @empty
                                        <tr>
                                            <td colspan="6">Todavía no hay listas de precios disponibles.</td>
                                        </tr>
                                    @endforelse
                                </tbody>
                            </table>
                        </div>
                    </section>
                @elseif ($section === 'info-de-pagos')
                    <section class="client-payments">
                        <div class="client-payments__grid">
                            <aside class="client-payments__aside">
                                <div class="client-payments__info">
                                    <h1>{{ $paymentInfo['settings']['bank_title'] }}</h1>
                                    <div class="client-payments__text">
                                        @foreach (preg_split('/\R/', (string) $paymentInfo['settings']['bank_details']) as $line)
                                            @if (trim($line) !== '')
                                                <p>{{ $line }}</p>
                                            @endif
                                        @endforeach
                                    </div>
                                </div>

                                <div class="client-payments__divider"></div>

                                <div class="client-payments__info">
                                    <h2>{{ $paymentInfo['settings']['terms_title'] }}</h2>
                                    <div class="client-payments__text">
                                        @foreach (preg_split('/\R/', (string) $paymentInfo['settings']['terms_details']) as $line)
                                            @if (trim($line) !== '')
                                                <p>{{ $line }}</p>
                                            @endif
                                        @endforeach
                                    </div>
                                </div>
                            </aside>

                            <form class="client-payments__form" action="{{ route('web.client-zone.payments.store') }}" method="POST" enctype="multipart/form-data">
                                @csrf
                                <div class="client-payments__form-grid client-payments__form-grid--two">
                                    <label>
                                        <span>Fecha*</span>
                                        <span class="client-payments__date-control">
                                            <input type="date" name="paid_at" value="{{ old('paid_at') }}" required data-client-payment-date>
                                            <span data-client-payment-date-text>dd/mm/aaaa</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                <path d="M7 3V6M17 3V6M4 9H20M6 5H18C19.1046 5 20 5.89543 20 7V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V7C4 5.89543 4.89543 5 6 5Z" stroke="#0072BB" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </span>
                                        @error('paid_at')<small>{{ $message }}</small>@enderror
                                    </label>
                                    <label>
                                        <span>Importe*</span>
                                        <span class="client-payments__money-control">
                                            <span>$</span>
                                            <input type="text" value="{{ old('amount') }}" inputmode="decimal" autocomplete="off" placeholder="0,00" data-client-payment-money-display>
                                            <input type="hidden" name="amount" value="{{ old('amount') }}" data-client-payment-money required>
                                            <small>ARS</small>
                                        </span>
                                        @error('amount')<small>{{ $message }}</small>@enderror
                                    </label>
                                </div>

                                <div class="client-payments__form-grid client-payments__form-grid--three">
                                    <label>
                                        <span>Banco*</span>
                                        <input type="text" name="bank" value="{{ old('bank') }}" required>
                                        @error('bank')<small>{{ $message }}</small>@enderror
                                    </label>
                                    <label>
                                        <span>Sucursal*</span>
                                        <input type="text" name="branch" value="{{ old('branch') }}" required>
                                        @error('branch')<small>{{ $message }}</small>@enderror
                                    </label>
                                    <label>
                                        <span>Facturas canceladas</span>
                                        <input type="text" name="invoices" value="{{ old('invoices') }}">
                                        @error('invoices')<small>{{ $message }}</small>@enderror
                                    </label>
                                </div>

                                <label class="client-payments__textarea">
                                    <span>Observaciones / Aclaraciones</span>
                                    <textarea name="observations">{{ old('observations') }}</textarea>
                                    @error('observations')<small>{{ $message }}</small>@enderror
                                </label>

                                <div class="client-payments__actions">
                                    <label class="client-payments__file">
                                        <span>Adjuntar archivo*</span>
                                        <span class="client-payments__file-control">
                                            <input type="file" name="attachment" required data-client-payment-file-input>
                                            <span data-client-payment-file-label>Seleccionar archivo</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.66675 3.88525V11.3333H7.33342V3.88525L5.17141 6.04725L4.22875 5.10459L8.00008 1.33325L11.7714 5.10459L10.8287 6.04725L8.66675 3.88525ZM2.66675 10.6666H4.00008V13.3333H12.0001V10.6666H13.3334V13.3333C13.3334 14.0666 12.7334 14.6666 12.0001 14.6666H4.00008C3.26675 14.6666 2.66675 14.0246 2.66675 13.3333V10.6666Z" fill="#0072BB"/>
                                            </svg>
                                        </span>
                                        @error('attachment')<small>{{ $message }}</small>@enderror
                                    </label>
                                    <span class="client-payments__required">* campos obligatorios</span>
                                    <button type="submit">Enviar</button>
                                </div>

                                @if ($paymentInfo['settings']['receipt_note'])
                                    <p class="client-payments__note">{{ $paymentInfo['settings']['receipt_note'] }}</p>
                                @endif
                            </form>
                        </div>

                        @if ($paymentInfo['receipts']->isNotEmpty())
                            <div class="client-payments__history">
                                <h2>Comprobantes enviados</h2>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Importe</th>
                                            <th>Banco</th>
                                            <th>Facturas</th>
                                            <th>Estado</th>
                                            <th>Observaciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach ($paymentInfo['receipts'] as $receipt)
                                            <tr>
                                                <td>{{ $receipt['paid_at'] }}</td>
                                                <td>{{ $receipt['amount'] }}</td>
                                                <td>{{ $receipt['bank'] }} / {{ $receipt['branch'] }}</td>
                                                <td>{{ $receipt['invoices'] }}</td>
                                                <td>
                                                    <span class="client-payments__status client-payments__status--{{ $receipt['status'] }}">{{ $receipt['status_label'] }}</span>
                                                </td>
                                                <td>
                                                    @if ($receipt['admin_notes'] || $receipt['observations'] || $receipt['reviewed_at'])
                                                        <button
                                                            class="client-payments__review-button"
                                                            type="button"
                                                            data-client-payment-review
                                                            data-client-payment-status="{{ $receipt['status_label'] }}"
                                                            data-client-payment-date="{{ $receipt['paid_at'] }}"
                                                            data-client-payment-amount="{{ $receipt['amount'] }}"
                                                            data-client-payment-admin-note="{{ e($receipt['admin_notes'] ?? '') }}"
                                                            data-client-payment-client-note="{{ e($receipt['observations'] ?? '') }}"
                                                            data-client-payment-reviewed="{{ e($receipt['reviewed_at'] ?? '') }}"
                                                        >
                                                            Ver detalle
                                                        </button>
                                                    @else
                                                        <span class="client-payments__review-empty">Sin notas</span>
                                                    @endif
                                                </td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>

                            <div class="client-payments-review-modal" data-client-payment-review-modal hidden>
                                <button class="client-payments-review-modal__backdrop" type="button" data-client-payment-review-close aria-label="Cerrar"></button>
                                <section class="client-payments-review-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="client-payment-review-title">
                                    <button class="client-payments-review-modal__close" type="button" data-client-payment-review-close aria-label="Cerrar">&times;</button>
                                    <p class="client-payments-review-modal__eyebrow">Comprobante</p>
                                    <h2 id="client-payment-review-title">Observaciones</h2>
                                    <div class="client-payments-review-modal__meta">
                                        <span data-client-payment-review-status></span>
                                        <span data-client-payment-review-date></span>
                                        <span data-client-payment-review-amount></span>
                                    </div>
                                    <div class="client-payments-review-modal__content">
                                        <article>
                                            <h3>Respuesta de administración</h3>
                                            <p data-client-payment-review-admin></p>
                                        </article>
                                        <article>
                                            <h3>Comentario enviado</h3>
                                            <p data-client-payment-review-client></p>
                                        </article>
                                        <small data-client-payment-review-reviewed></small>
                                    </div>
                                </section>
                            </div>
                        @endif
                    </section>
                @elseif ($section === 'margenes')
                    <section class="client-zone-margins">
                        <div class="client-zone-margins__intro">
                            <h1>Márgenes sobre lista de precios</h1>
                            <p>Configurá el porcentaje que se suma al precio con descuento para calcular tu precio venta dentro de Zona Cliente.</p>
                        </div>

                        @if (session('status'))
                            <p class="client-zone-status">{{ session('status') }}</p>
                        @endif

                        <div class="client-zone-margins__grid">
                            <form class="client-zone-margin-form" action="{{ route('web.client-zone.margins.update') }}" method="POST">
                                @csrf
                                <label for="price-list-margin">Margen sobre lista de precios</label>
                                <div class="client-zone-margin-form__control">
                                    <input id="price-list-margin" name="price_list_margin" type="number" value="{{ old('price_list_margin', $clientMargin) }}" min="0" max="200" step="0.01">
                                    <span>%</span>
                                </div>
                                @error('price_list_margin')
                                    <p class="client-zone-form-error">{{ $message }}</p>
                                @enderror
                                <button type="submit">Guardar margen</button>
                            </form>

                            <div class="client-zone-margin-preview" aria-label="Vista de cálculo de margen">
                                <span>Margen actual</span>
                                <strong>{{ number_format($clientMargin, 2, ',', '.') }}%</strong>
                            </div>
                        </div>
                    </section>
                @elseif ($query !== '')
                    <h1>{{ $current }}</h1>
                    <div class="client-zone__results">
                        <h2>Resultados para "{{ $query }}"</h2>
                        @forelse ($results as $result)
                            <a href="{{ route('web.products.grade', [$result->series?->line?->slug, $result->series?->slug, $result->slug]) }}">
                                {{ $result->name }}
                            </a>
                        @empty
                            <p>No encontramos coincidencias dentro de Zona Cliente.</p>
                        @endforelse
                    </div>
                @else
                    <h1>{{ $current }}</h1>
                    <p>Esta sección privada está lista para mostrar contenido exclusivo del cliente.</p>
                @endif
            </div>
        </section>
    </main>
@endsection

@push('scripts')
    <script nonce="{{ request()->attributes->get('csp-nonce') }}">
        (() => {
            const formatter = new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
            });
            const decimalFormatter = new Intl.NumberFormat("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

            const normalizeArgentineMoney = (value) => {
                const raw = String(value || "").replace(/[^\d,.-]/g, "").trim();
                if (!raw) return "";
                const hasComma = raw.includes(",");
                const normalized = hasComma
                    ? raw.replace(/\./g, "").replace(",", ".")
                    : raw.replace(/\./g, "").replace(/,/g, "");
                const number = Number.parseFloat(normalized);

                return Number.isFinite(number) && number > 0 ? number.toFixed(2) : "";
            };

            const formatArgentineMoneyInput = (value) => {
                const raw = String(value || "").replace(/[^\d,]/g, "");
                const [integerRaw, decimalRaw = ""] = raw.split(",");
                const integer = integerRaw.replace(/^0+(?=\d)/, "");
                const formattedInteger = integer
                    ? new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Number(integer))
                    : "";
                const decimals = decimalRaw.slice(0, 2);

                if (raw.includes(",")) {
                    return `${formattedInteger || "0"},${decimals}`;
                }

                return formattedInteger;
            };

            const formatDateForArgentina = (value) => {
                if (!value) return "dd/mm/aaaa";
                const [year, month, day] = value.split("-");

                return year && month && day ? `${day}/${month}/${year}` : "dd/mm/aaaa";
            };

            document.querySelectorAll("[data-client-payment-date]").forEach((input) => {
                const text = input.closest(".client-payments__date-control")?.querySelector("[data-client-payment-date-text]");
                const update = () => {
                    if (text) text.textContent = formatDateForArgentina(input.value);
                };

                update();
                input.addEventListener("change", update);
            });

            document.querySelectorAll("[data-client-payment-money-display]").forEach((display) => {
                const hidden = display.closest(".client-payments__money-control")?.querySelector("[data-client-payment-money]");
                const sync = (format = false) => {
                    if (format) {
                        display.value = formatArgentineMoneyInput(display.value);
                    }

                    const normalized = normalizeArgentineMoney(display.value);

                    if (hidden) hidden.value = normalized;
                };

                sync(true);
                display.addEventListener("input", () => {
                    const next = formatArgentineMoneyInput(display.value);
                    display.value = next;
                    display.setSelectionRange(next.length, next.length);
                    sync(false);
                });
                display.addEventListener("blur", () => sync(true));
                display.form?.addEventListener("submit", () => sync(false));
            });

            document.querySelectorAll("[data-client-payment-file-input]").forEach((input) => {
                const control = input.closest(".client-payments__file-control");
                const label = control?.querySelector("[data-client-payment-file-label]");

                if (!control || !label) return;

                input.addEventListener("change", () => {
                    const file = input.files?.[0];
                    label.textContent = file?.name || "Seleccionar archivo";
                    control.classList.toggle("has-file", Boolean(file));
                });
            });

            const paymentReviewModal = document.querySelector("[data-client-payment-review-modal]");
            const paymentReviewStatus = paymentReviewModal?.querySelector("[data-client-payment-review-status]");
            const paymentReviewDate = paymentReviewModal?.querySelector("[data-client-payment-review-date]");
            const paymentReviewAmount = paymentReviewModal?.querySelector("[data-client-payment-review-amount]");
            const paymentReviewAdmin = paymentReviewModal?.querySelector("[data-client-payment-review-admin]");
            const paymentReviewClient = paymentReviewModal?.querySelector("[data-client-payment-review-client]");
            const paymentReviewReviewed = paymentReviewModal?.querySelector("[data-client-payment-review-reviewed]");

            const closePaymentReviewModal = () => {
                if (!paymentReviewModal) return;
                paymentReviewModal.hidden = true;
                document.body.classList.remove("is-client-product-modal-open");
            };

            document.querySelectorAll("[data-client-payment-review]").forEach((button) => {
                button.addEventListener("click", () => {
                    if (!paymentReviewModal) return;

                    if (paymentReviewStatus) paymentReviewStatus.textContent = button.dataset.clientPaymentStatus || "Estado";
                    if (paymentReviewDate) paymentReviewDate.textContent = button.dataset.clientPaymentDate || "Sin fecha";
                    if (paymentReviewAmount) paymentReviewAmount.textContent = button.dataset.clientPaymentAmount || "";
                    if (paymentReviewAdmin) paymentReviewAdmin.textContent = button.dataset.clientPaymentAdminNote || "Sin observaciones de administración.";
                    if (paymentReviewClient) paymentReviewClient.textContent = button.dataset.clientPaymentClientNote || "Sin comentario enviado.";
                    if (paymentReviewReviewed) paymentReviewReviewed.textContent = button.dataset.clientPaymentReviewed ? `Revisado: ${button.dataset.clientPaymentReviewed}` : "";

                    paymentReviewModal.hidden = false;
                    document.body.classList.add("is-client-product-modal-open");
                });
            });

            paymentReviewModal?.querySelectorAll("[data-client-payment-review-close]").forEach((button) => {
                button.addEventListener("click", closePaymentReviewModal);
            });

            document.querySelectorAll("[data-client-product-row]").forEach((row) => {
                const input = row.querySelector("[data-client-product-qty]");
                const subtotal = row.querySelector("[data-client-product-subtotal]");
                const stepButtons = row.querySelectorAll("[data-client-product-step]");
                const salePrice = Number.parseFloat(row.dataset.salePrice || "0");

                if (!input || !subtotal || !Number.isFinite(salePrice)) return;

                const update = () => {
                    const quantity = Math.max(1, Number.parseInt(input.value || "1", 10));
                    input.value = quantity;
                    subtotal.textContent = formatter.format(salePrice * quantity);
                };

                input.addEventListener("input", update);
                input.addEventListener("change", update);
                stepButtons.forEach((button) => {
                    button.addEventListener("click", () => {
                        const step = Number.parseInt(button.dataset.clientProductStep || "0", 10);
                        const quantity = Math.max(1, Number.parseInt(input.value || "1", 10) + step);
                        input.value = quantity;
                        update();
                    });
                });
            });

            const destinationModal = document.querySelector("[data-client-product-modal]");
            const destinationName = destinationModal?.querySelector("[data-client-product-modal-name]");
            const destinationCartForm = destinationModal?.querySelector("[data-client-product-modal-cart]");
            const destinationBudgetForm = destinationModal?.querySelector("[data-client-product-modal-budget]");

            const closeDestinationModal = () => {
                if (!destinationModal) return;
                destinationModal.hidden = true;
                document.body.classList.remove("is-client-product-modal-open");
            };

            document.querySelectorAll("[data-client-product-choose]").forEach((button) => {
                button.addEventListener("click", () => {
                    const row = button.closest("[data-client-product-row]");
                    const quantity = 1;

                    if (!destinationModal || !destinationCartForm || !destinationBudgetForm) return;

                    destinationCartForm.action = button.dataset.cartAction || "";
                    destinationBudgetForm.action = button.dataset.budgetAction || "";
                    destinationCartForm.querySelector("input[name='quantity']").value = quantity;
                    destinationBudgetForm.querySelector("input[name='quantity']").value = quantity;

                    if (destinationName) {
                        destinationName.textContent = button.dataset.productName || "Producto seleccionado";
                    }

                    destinationModal.hidden = false;
                    document.body.classList.add("is-client-product-modal-open");
                });
            });

            destinationModal?.querySelectorAll("[data-client-product-modal-close]").forEach((button) => {
                button.addEventListener("click", closeDestinationModal);
            });

            document.addEventListener("keydown", (event) => {
                if (event.key === "Escape" && destinationModal && !destinationModal.hidden) {
                    closeDestinationModal();
                }
            });

            const publicToggle = document.querySelector("[data-client-public-toggle]");
            const table = document.querySelector(".client-products-table");
            if (publicToggle && table) {
                const applyToggle = () => {
                    table.classList.toggle("is-sale-hidden", !publicToggle.checked);
                };

                publicToggle.addEventListener("change", applyToggle);
                applyToggle();
            }

            document.querySelectorAll(".client-cart__qty-form").forEach((form) => {
                const input = form.querySelector("[data-client-cart-qty]");
                const buttons = form.querySelectorAll("[data-client-cart-step]");

                if (!input) return;

                input.addEventListener("change", () => {
                    input.value = Math.max(1, Number.parseInt(input.value || "1", 10));
                    form.submit();
                });

                buttons.forEach((button) => {
                    button.addEventListener("click", () => {
                        const step = Number.parseInt(button.dataset.clientCartStep || "0", 10);
                        input.value = Math.max(1, Number.parseInt(input.value || "1", 10) + step);
                        form.submit();
                    });
                });
            });

            document.querySelectorAll(".client-cart__file").forEach((field) => {
                const input = field.querySelector("[data-client-file-input]");
                const label = field.querySelector("[data-client-file-label]");
                const preview = field.querySelector("[data-client-file-preview]");
                let previewUrl = null;

                if (!input || !label || !preview) return;

                const formatSize = (size) => {
                    if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
                    if (size >= 1024) return `${Math.round(size / 1024)} KB`;
                    return `${size} B`;
                };

                input.addEventListener("change", () => {
                    const file = input.files?.[0];

                    if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        previewUrl = null;
                    }

                    preview.replaceChildren();

                    if (!file) {
                        label.textContent = "Seleccionar archivo";
                        preview.hidden = true;
                        return;
                    }

                    label.textContent = file.name;
                    preview.hidden = false;
                    preview.classList.toggle("is-image", file.type.startsWith("image/"));

                    const icon = document.createElement("span");
                    icon.className = "client-cart__file-preview-icon";
                    icon.innerHTML = file.type.startsWith("image/")
                        ? `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 16.5L8.2 12.3C8.64183 11.8582 9.35817 11.8582 9.8 12.3L13 15.5M12 14.5L14.2 12.3C14.6418 11.8582 15.3582 11.8582 15.8 12.3L20 16.5M5 20H19C19.5523 20 20 19.5523 20 19V5C20 4.44772 19.5523 4 19 4H5C4.44772 4 4 4.44772 4 5V19C4 19.5523 4.44772 20 5 20ZM15 8.5H15.01" stroke="#0072BB" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
                        : `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 3V7C14 7.55228 14.4477 8 15 8H19M7 13H17M7 17H13M14 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V8L14 3Z" stroke="#0072BB" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
                    preview.append(icon);

                    if (file.type.startsWith("image/")) {
                        previewUrl = URL.createObjectURL(file);
                        const image = document.createElement("img");
                        image.src = previewUrl;
                        image.alt = `Vista previa de ${file.name}`;
                        preview.append(image);
                    }

                    const details = document.createElement("span");
                    details.className = "client-cart__file-preview-details";
                    details.innerHTML = `<strong>${file.name}</strong><small>${formatSize(file.size)} · Listo para adjuntar</small>`;
                    preview.append(details);

                    const remove = document.createElement("button");
                    remove.className = "client-cart__file-preview-remove";
                    remove.type = "button";
                    remove.textContent = "Quitar";
                    remove.addEventListener("click", (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        input.value = "";
                        label.textContent = "Seleccionar archivo";
                        preview.replaceChildren();
                        preview.hidden = true;

                        if (previewUrl) {
                            URL.revokeObjectURL(previewUrl);
                            previewUrl = null;
                        }
                    });
                    preview.append(remove);
                });
            });

            document.querySelectorAll("[data-client-order-download]").forEach((link) => {
                link.addEventListener("click", () => {
                    window.setTimeout(() => {
                        document.querySelector("[data-page-transition]")?.classList.remove("is-active");

                        if (typeof window.showWebToast === "function") {
                            window.showWebToast(
                                "El PDF se descargó correctamente.",
                                "success",
                                "Descarga exitosa"
                            );
                        }
                    }, 900);
                });
            });

            const budgetDocument = document.querySelector("[data-client-budget-document]");
            const logoSrc = document.querySelector(".products-header__logo img")?.getAttribute("src") || "";
            const logo = logoSrc ? new URL(logoSrc, window.location.origin).href : "";
            const faviconSrc = document.querySelector("link[rel~='icon']")?.getAttribute("href") || "/favicon.ico";
            const favicon = @json('data:image/png;base64,'.base64_encode(file_get_contents(public_path('favicon/favicon-96x96.png'))));
            const faviconUrl = new URL(faviconSrc, window.location.origin).href;
            const exportedAt = () => new Intl.DateTimeFormat("es-AR", {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: "America/Argentina/Buenos_Aires",
            }).format(new Date());
            const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;",
            }[char]));
            const textOf = (node) => (node?.textContent || "").replace(/\s+/g, " ").trim();
            const quantityOf = (node) => {
                const input = node?.querySelector("[data-client-cart-qty], [data-client-product-qty], input[name='quantity'], input");
                const rawValue = input?.value || input?.getAttribute("value") || input?.getAttribute("aria-valuenow") || textOf(node);
                const match = String(rawValue).match(/\d+/);
                const quantity = match ? Number.parseInt(match[0], 10) : 1;

                return String(Math.max(1, Number.isFinite(quantity) ? quantity : 1));
            };
            const formatFileSize = (size) => {
                if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
                if (size >= 1024) return `${Math.round(size / 1024)} KB`;

                return `${size} B`;
            };
            const fileToDataUrl = (file) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const selectedDelivery = () => document.querySelector("[name='budget_delivery_method']:checked")?.value || "Retiro cliente";
            const budgetMessage = () => document.querySelector("[name='budget_message']")?.value?.trim() || "Sin observaciones.";
            const saveBudgetSnapshot = async () => {
                if (!budgetDocument?.dataset?.budgetSaveUrl) return null;

                const token = document.querySelector("meta[name='csrf-token']")?.getAttribute("content") || "";
                const formData = new FormData();
                formData.append("delivery_method", selectedDelivery());
                formData.append("message", budgetMessage() === "Sin observaciones." ? "" : budgetMessage());

                const file = document.querySelector("[name='budget_attachment']")?.files?.[0];

                if (file) {
                    formData.append("attachment", file);
                }

                const response = await fetch(budgetDocument.dataset.budgetSaveUrl, {
                    method: "POST",
                    headers: {
                        "X-CSRF-TOKEN": token,
                        "Accept": "application/json",
                    },
                    body: formData,
                    credentials: "same-origin",
                });

                if (!response.ok) {
                    const payload = await response.json().catch(() => ({}));
                    throw new Error(payload.message || "No se pudo guardar el presupuesto.");
                }

                return response.json();
            };
            const productRows = () => Array.from(document.querySelectorAll(".client-cart__table tbody tr"))
                .map((row) => {
                    const cells = Array.from(row.children);

                    if (cells.length < 9) return null;

                    return [
                        textOf(cells[0]),
                        textOf(cells[1]),
                        textOf(cells[2]),
                        textOf(cells[3]),
                        textOf(cells[4]),
                        textOf(cells[5]),
                        textOf(cells[6]),
                        quantityOf(cells[7]),
                        textOf(cells[8]),
                    ];
                })
                .filter(Boolean);
            const serviceRows = () => Array.from(document.querySelectorAll(".client-budget__selected-service"))
                .map((row) => Array.from(row.querySelectorAll(":scope > div")).slice(0, 5).map(textOf))
                .filter((row) => row.length >= 5);
            const summaryRows = () => Array.from(document.querySelectorAll(".client-cart__summary dl > div"))
                .map((row) => ({
                    label: textOf(row.querySelector("dt")),
                    value: textOf(row.querySelector("dd")),
                    discount: row.classList.contains("is-discount"),
                    total: row.classList.contains("is-total"),
                }));
            const tableRows = (rows, currencyIndexes = [], greenIndexes = []) => rows.map((row) => `
                <tr>
                    ${row.map((cell, index) => `<td class="${currencyIndexes.includes(index) ? "is-money" : ""} ${greenIndexes.includes(index) ? "is-green" : ""}">${escapeHtml(cell)}</td>`).join("")}
                </tr>
            `).join("");
            const budgetAttachmentMarkup = async () => {
                const file = document.querySelector("[name='budget_attachment']")?.files?.[0];

                if (!file) {
                    return "";
                }

                const dataUrl = await fileToDataUrl(file);
                const meta = `${escapeHtml(file.name)} · ${formatFileSize(file.size)}`;

                if (file.type.startsWith("image/")) {
                    return `
                        <section class="doc-attachment">
                            <div>
                                <span class="eyebrow">Adjunto</span>
                                <h2>${escapeHtml(file.name)}</h2>
                                <p>${formatFileSize(file.size)} · Imagen renderizada en el documento</p>
                            </div>
                            <img class="doc-attachment__image" src="${dataUrl}" alt="${escapeHtml(file.name)}">
                        </section>
                    `;
                }

                if (file.type === "application/pdf") {
                    return `
                        <section class="doc-attachment">
                            <div>
                                <span class="eyebrow">Adjunto</span>
                                <h2>${escapeHtml(file.name)}</h2>
                                <p>${formatFileSize(file.size)} · PDF adjunto renderizado debajo</p>
                            </div>
                            <object class="doc-attachment__frame" data="${dataUrl}" type="application/pdf">
                                <a href="${dataUrl}" download="${escapeHtml(file.name)}">${meta}</a>
                            </object>
                        </section>
                    `;
                }

                return `
                    <section class="doc-attachment">
                        <span class="doc-file-icon" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M14 3V7C14 7.55228 14.4477 8 15 8H19M7 13H17M7 17H13M14 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V8L14 3Z" stroke="#0072BB" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </span>
                        <div>
                            <span class="eyebrow">Adjunto</span>
                            <h2>${escapeHtml(file.name)}</h2>
                            <p>${formatFileSize(file.size)} · Archivo incluido como referencia del presupuesto</p>
                        </div>
                    </section>
                `;
            };
            const buildBudgetHtml = async () => {
                const products = productRows();
                const services = serviceRows();
                const summary = summaryRows();
                const attachment = await budgetAttachmentMarkup();
                const hasAttachment = attachment.trim() !== "";

                return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Presupuesto | Nicolais Mario e Hijo</title>
<link rel="shortcut icon" href="${favicon}">
<link rel="icon" type="image/png" sizes="96x96" href="${favicon}">
<link rel="apple-touch-icon" href="${favicon}">
<meta name="theme-color" content="#0072bb">
<style>
@page{size:A4 landscape;margin:12mm}
*{box-sizing:border-box}
body{margin:0;background:#eef3f8;color:#111010;font-family:"Plus Jakarta Sans",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.doc{max-width:1240px;margin:18px auto;padding:24px;background:#fff;border:1px solid #d9e2ec;border-radius:18px;box-shadow:0 24px 70px rgba(15,23,42,.14)}
.doc-header{display:flex;align-items:center;justify-content:space-between;gap:28px;padding-bottom:16px;border-bottom:4px solid #0072bb}
.doc-logo{width:210px;height:auto;display:block}.doc-title{text-align:right}.doc-title h1{margin:0;color:#111010;font-size:32px;line-height:1;font-weight:800}.doc-title p{margin:8px 0 0;color:#5c5c5c;font-size:13px}.doc-title span{display:inline-flex;margin-top:9px;padding:6px 10px;border-radius:999px;background:#eaf6fd;color:#0072bb;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.doc-top{display:grid;grid-template-columns:1fr 1.35fr;gap:12px;margin:16px 0 0}
.info-box{min-height:76px;padding:12px 14px;border:1px solid #d9d9d9;border-radius:12px;background:#fbfdff}.info-box strong{display:block;color:#111010;font-size:13px;line-height:1.45;font-weight:600}
.eyebrow{display:block;margin-bottom:6px;color:#0072bb;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.doc-section{margin-top:16px}.doc-section h2{margin:0 0 9px;color:#111010;font-size:18px}
table{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;font-size:11.8px;line-height:1.32;border:1px solid #d9d9d9;border-radius:10px;overflow:hidden}thead{background:#000;color:#fff}th{padding:10px 8px;text-align:left;font-weight:800;vertical-align:middle;white-space:normal}th span{display:inline-block;line-height:1.15}td{padding:10px 8px;border-bottom:1px solid #d9d9d9;vertical-align:middle;overflow:hidden;text-overflow:ellipsis}tbody tr:last-child td{border-bottom:0}.is-money,th:nth-last-child(-n+5),td:nth-last-child(-n+5){text-align:right}.is-green{color:#308c05}.doc-section:first-of-type th:nth-child(1),.doc-section:first-of-type td:nth-child(1){width:9%}.doc-section:first-of-type th:nth-child(2),.doc-section:first-of-type td:nth-child(2){width:8%}.doc-section:first-of-type th:nth-child(3),.doc-section:first-of-type td:nth-child(3){width:21%;white-space:normal}.doc-section:first-of-type th:nth-child(4),.doc-section:first-of-type td:nth-child(4){width:12%}.doc-section:first-of-type th:nth-child(5),.doc-section:first-of-type td:nth-child(5){width:10%}.doc-section:first-of-type th:nth-child(6),.doc-section:first-of-type td:nth-child(6){width:13%}.doc-section:first-of-type th:nth-child(7),.doc-section:first-of-type td:nth-child(7){width:11%}.doc-section:first-of-type th:nth-child(8),.doc-section:first-of-type td:nth-child(8){width:5%;text-align:center}.doc-section:first-of-type th:nth-child(9),.doc-section:first-of-type td:nth-child(9){width:11%}.doc-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.doc-card{border:1px solid #d9d9d9;border-radius:12px;overflow:hidden;background:#fff}.doc-card h2{margin:0;padding:11px 15px;background:#000;color:#fff;font-size:17px}.doc-card__body{padding:13px 15px;min-height:104px;font-size:12.5px;line-height:1.5}
.summary-line{display:flex;justify-content:space-between;gap:20px;margin-bottom:9px}.summary-line.is-discount{color:#308c05}.summary-line.is-total{margin-top:18px;padding-top:14px;border-top:1px solid #d9d9d9;color:#111010;font-weight:800}
.doc-attachment{break-inside:avoid;page-break-inside:avoid;display:flex;align-items:flex-start;gap:16px;margin-top:16px;padding:14px;border:1px solid #d9d9d9;border-radius:12px;background:#fbfdff}.doc-attachment h2{margin:0;color:#111010;font-size:16px}.doc-attachment p{margin:6px 0 0;color:#5c5c5c;font-size:12px}.doc-file-icon{display:grid;place-items:center;width:52px;height:52px;border-radius:12px;background:#eaf6fd;flex:0 0 auto}.doc-attachment__image{display:block;max-width:360px;max-height:190px;margin-left:auto;border:1px solid #d9d9d9;border-radius:10px;object-fit:contain;background:#fff}.doc-attachment__frame{width:100%;height:260px;border:1px solid #d9d9d9;border-radius:10px;background:#fff}
.doc-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:16px;padding-top:12px;border-top:2px solid #0072bb;color:#5c5c5c;font-size:11px}.doc-footer strong{color:#111010}.doc-footer span:last-child{white-space:nowrap}
@media print{body{background:#fff;padding:0}.doc{width:100%;max-width:none;margin:0;border:0;border-radius:0;box-shadow:none;padding:0}.doc-logo{width:190px}.doc-title h1{font-size:27px}.doc-header{padding-bottom:12px}.doc-top{margin-top:12px}.doc-section{margin-top:12px}.doc-grid{margin-top:12px;gap:12px}.doc-card__body{min-height:82px}.doc-attachment{margin-top:12px;padding:12px}.doc-attachment__image{max-width:320px;max-height:132px}.doc-attachment__frame{height:160px}.doc-footer{margin-top:12px;padding-top:10px}table{font-size:10.6px}th,td{padding:7px 6px}body.no-attachment .doc-logo{width:168px}body.no-attachment .doc-header{padding-bottom:8px;border-bottom-width:3px}body.no-attachment .doc-title h1{font-size:24px}body.no-attachment .doc-title p{font-size:11px;margin-top:5px}body.no-attachment .doc-title span{font-size:9px;padding:4px 8px;margin-top:6px}body.no-attachment .doc-top{grid-template-columns:1fr 1fr;margin-top:8px;gap:8px}body.no-attachment .info-box{min-height:48px;padding:7px 9px;border-radius:8px}body.no-attachment .eyebrow{font-size:8px;margin-bottom:3px}body.no-attachment .info-box strong{font-size:10.5px;line-height:1.2}body.no-attachment .doc-section{margin-top:8px}body.no-attachment .doc-section h2{font-size:14px;margin-bottom:5px}body.no-attachment table{font-size:9.2px;line-height:1.12;border-radius:7px}body.no-attachment th,body.no-attachment td{padding:5px 5px}body.no-attachment .doc-grid{gap:9px;margin-top:9px}body.no-attachment .doc-card{border-radius:8px}body.no-attachment .doc-card h2{font-size:13.5px;padding:7px 10px}body.no-attachment .doc-card__body{font-size:9.8px;line-height:1.28;min-height:60px;padding:8px 10px}body.no-attachment .summary-line{margin-bottom:5px}body.no-attachment .summary-line.is-total{margin-top:9px;padding-top:8px}body.no-attachment .doc-footer{font-size:8.8px;margin-top:9px;padding-top:7px}}
</style>
</head>
<body class="${hasAttachment ? "has-attachment" : "no-attachment"}">
<main class="doc">
    <header class="doc-header">
        ${logo ? `<img class="doc-logo" src="${logo}" alt="Nicolais Mario e Hijo">` : `<strong>Nicolais Mario e Hijo</strong>`}
        <div class="doc-title">
            <h1>Presupuesto</h1>
            <p>${exportedAt()} · Hora Argentina</p>
            <span>Zona Cliente</span>
        </div>
    </header>
    <section class="doc-top">
        <article class="info-box"><span class="eyebrow">Forma de entrega</span><strong>${escapeHtml(selectedDelivery())}</strong></article>
        <article class="info-box"><span class="eyebrow">Mensaje</span><strong>${escapeHtml(budgetMessage())}</strong></article>
    </section>
    <section class="doc-section">
        <h2>Productos</h2>
        <table>
            <thead><tr><th><span>Familia</span></th><th><span>Código</span></th><th><span>Descripción</span></th><th><span>Tipo</span></th><th><span>Precio lista</span></th><th><span>Precio con<br>descuento</span></th><th><span>Precio venta</span></th><th><span>Cant</span></th><th><span>Subtotal</span></th></tr></thead>
            <tbody>${products.length ? tableRows(products, [4, 5, 6, 8], [5]) : `<tr><td colspan="9">Sin productos agregados.</td></tr>`}</tbody>
        </table>
    </section>
    ${services.length ? `<section class="doc-section"><h2>Servicios</h2><table><thead><tr><th><span>Servicio</span></th><th><span>Cant</span></th><th><span>Precio</span></th><th><span>Precio con<br>descuento</span></th><th><span>Subtotal</span></th></tr></thead><tbody>${tableRows(services, [2, 3, 4], [3])}</tbody></table></section>` : ""}
    <section class="doc-grid">
        <article class="doc-card"><h2>Información Importante</h2><div class="doc-card__body">- Venta sujeta a disponibilidad en stock<br>- Los precios se encuentran expresados en ($) pesos argentinos<br>- El plazo de entrega se coordina con la empresa</div></article>
        <article class="doc-card"><h2>Tu Pedido</h2><div class="doc-card__body">${summary.map(({ label, value, discount, total }) => `<div class="summary-line ${discount ? "is-discount" : ""} ${total ? "is-total" : ""}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div></article>
    </section>
    ${attachment}
    <footer class="doc-footer">
        <span><strong>Nicolais Mario e Hijo</strong> · Presupuesto generado desde Zona Cliente</span>
        <span>Importes en pesos argentinos · Sujeto a disponibilidad</span>
    </footer>
</main>
</body>
</html>`;
            };
            const downloadBudget = async (event) => {
                event?.preventDefault();
                if (!budgetDocument) return;

                try {
                    await saveBudgetSnapshot();
                    const html = await buildBudgetHtml();
                    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `presupuesto-zona-cliente-${new Date().toISOString().slice(0, 10)}.html`;
                    document.body.append(link);
                    link.click();
                    link.remove();
                    URL.revokeObjectURL(url);

                    if (typeof window.showWebToast === "function") {
                        window.showWebToast("El presupuesto se exportó y quedó guardado para administración.", "success", "Exportación lista");
                    }
                } catch (error) {
                    if (typeof window.showWebToast === "function") {
                        window.showWebToast(error.message || "No se pudo guardar el presupuesto.", "error", "Revisá el presupuesto");
                    }
                }
            };
            const printBudget = async (event) => {
                event?.preventDefault();
                if (!budgetDocument) return;

                const printWindow = window.open("", "_blank");

                if (!printWindow) {
                    if (typeof window.showWebToast === "function") {
                        window.showWebToast("El navegador bloqueó la ventana de impresión.", "error", "No se pudo imprimir");
                    }

                    return;
                }

                try {
                    await saveBudgetSnapshot();
                } catch (error) {
                    printWindow.close();

                    if (typeof window.showWebToast === "function") {
                        window.showWebToast(error.message || "No se pudo guardar el presupuesto.", "error", "Revisá el presupuesto");
                    }

                    return;
                }

                const html = await buildBudgetHtml();

                printWindow.document.open();
                printWindow.document.write(html);
                printWindow.document.close();

                const finishPrint = () => {
                    printWindow.document.title = "Presupuesto | Nicolais Mario e Hijo";
                    printWindow.focus();
                    window.setTimeout(() => {
                        printWindow.print();
                    }, 450);
                };

                if (printWindow.document.readyState === "complete") {
                    finishPrint();
                } else {
                    printWindow.addEventListener("load", finishPrint, { once: true });
                }

                if (typeof window.showWebToast === "function") {
                    window.showWebToast("Preparamos una versión limpia para imprimir.", "success", "Impresión lista");
                }
            };

            document.querySelector("[data-client-budget-export]")?.addEventListener("click", downloadBudget);
            document.querySelector("[data-client-budget-print]")?.addEventListener("click", printBudget);

            const budgetServicesToggle = document.querySelector("[data-client-budget-services-toggle]");
            const budgetServices = document.querySelector("[data-client-budget-services]");

            if (budgetServicesToggle && budgetServices) {
                budgetServicesToggle.addEventListener("click", () => {
                    const isOpen = budgetServicesToggle.getAttribute("aria-expanded") === "true";

                    budgetServicesToggle.setAttribute("aria-expanded", String(!isOpen));
                    budgetServices.hidden = isOpen;

                    if (!isOpen) {
                        budgetServices.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }
                });
            }
        })();
    </script>
@endpush

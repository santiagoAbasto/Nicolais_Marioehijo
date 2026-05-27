@php
    $current = $current ?? 'productos';
@endphp

<div class="products-topbar">
    <div class="products-topbar__inner">
        <button class="products-search-button" type="button" aria-label="Buscar">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M6.5 13C4.68333 13 3.146 12.3707 1.888 11.112C0.63 9.85333 0.000667196 8.316 5.29101e-07 6.5C-0.000666138 4.684 0.628667 3.14667 1.888 1.888C3.14733 0.629333 4.68467 0 6.5 0C8.31533 0 9.853 0.629333 11.113 1.888C12.373 3.14667 13.002 4.684 13 6.5C13 7.23333 12.8833 7.925 12.65 8.575C12.4167 9.225 12.1 9.8 11.7 10.3L17.3 15.9C17.4833 16.0833 17.575 16.3167 17.575 16.6C17.575 16.8833 17.4833 17.1167 17.3 17.3C17.1167 17.4833 16.8833 17.575 16.6 17.575C16.3167 17.575 16.0833 17.4833 15.9 17.3L10.3 11.7C9.8 12.1 9.225 12.4167 8.575 12.65C7.925 12.8833 7.23333 13 6.5 13ZM6.5 11C7.75 11 8.81267 10.5627 9.688 9.688C10.5633 8.81333 11.0007 7.75067 11 6.5C10.9993 5.24933 10.562 4.187 9.688 3.313C8.814 2.439 7.75133 2.00133 6.5 2C5.24867 1.99867 4.18633 2.43633 3.313 3.313C2.43967 4.18967 2.002 5.252 2 6.5C1.998 7.748 2.43567 8.81067 3.313 9.688C4.19033 10.5653 5.25267 11.0027 6.5 11Z" fill="white"/>
            </svg>
        </button>
    </div>
</div>
<header class="products-header">
    <div class="products-header__inner">
        <a class="products-header__logo" href="{{ route('web.home') }}" aria-label="Nicolais Mario e Hijo">
            <img src="{{ asset('storage/brand/logo.svg') }}" alt="Nicolais Mario e Hijo">
        </a>

        <nav class="products-nav" aria-label="Principal">
            <a href="/nosotros" @if ($current === 'nosotros') aria-current="page" @endif>Nosotros</a>
            <a href="{{ route('web.products.index') }}" @if ($current === 'productos') aria-current="page" @endif>Productos</a>
            <a href="/catalogo" @if ($current === 'catalogo') aria-current="page" @endif>Catálogos</a>
            <a href="/novedades" @if ($current === 'novedades') aria-current="page" @endif>Novedades</a>
            <a href="/contacto" @if ($current === 'contacto') aria-current="page" @endif>Contacto</a>
        </nav>

        <button type="button" class="nm-client-button products-client" data-client-modal-open>
            <svg class="nm-client-button__icon" xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
                <path d="M1.75 18C1.26875 18 0.856916 17.8323 0.5145 17.4969C0.172083 17.1614 0.000583333 16.7577 0 16.2857V7.71429C0 7.24286 0.1715 6.83943 0.5145 6.504C0.8575 6.16857 1.26933 6.00057 1.75 6H2.625V4.28571C2.625 3.1 3.05171 2.08943 3.90512 1.254C4.75854 0.418572 5.79017 0.000572014 7 5.8508e-07C8.20983 -0.000570843 9.24175 0.417429 10.0957 1.254C10.9497 2.09057 11.3762 3.10114 11.375 4.28571V6H12.25C12.7312 6 13.1434 6.168 13.4864 6.504C13.8294 6.84 14.0006 7.24343 14 7.71429V16.2857C14 16.7571 13.8288 17.1609 13.4864 17.4969C13.144 17.8329 12.7318 18.0006 12.25 18H1.75ZM1.75 16.2857H12.25V7.71429H1.75V16.2857ZM7 13.7143C7.48125 13.7143 7.89337 13.5466 8.23637 13.2111C8.57937 12.8757 8.75058 12.472 8.75 12C8.74942 11.528 8.57821 11.1246 8.23637 10.7897C7.89454 10.4549 7.48242 10.2869 7 10.2857C6.51758 10.2846 6.10575 10.4526 5.7645 10.7897C5.42325 11.1269 5.25175 11.5303 5.25 12C5.24825 12.4697 5.41975 12.8734 5.7645 13.2111C6.10925 13.5489 6.52108 13.7166 7 13.7143ZM4.375 6H9.625V4.28571C9.625 3.57143 9.36979 2.96429 8.85937 2.46429C8.34896 1.96429 7.72917 1.71429 7 1.71429C6.27083 1.71429 5.65104 1.96429 5.14062 2.46429C4.63021 2.96429 4.375 3.57143 4.375 4.28571V6Z" fill="white"/>
            </svg>
            Clientes
        </button>

        <button
            type="button"
            class="products-mobile-menu-toggle"
            data-products-menu-toggle
            aria-label="Abrir menú"
            aria-controls="products-mobile-nav"
            aria-expanded="false"
        >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
        </button>
    </div>
</header>

<nav class="products-mobile-nav" id="products-mobile-nav" data-products-mobile-menu aria-label="Menú principal" hidden>
    <button class="products-mobile-nav__backdrop" type="button" data-products-menu-close aria-label="Cerrar menú"></button>
    <div class="products-mobile-nav__panel" data-products-mobile-menu-panel>
        <div class="products-mobile-nav__head">
            <a href="{{ route('web.home') }}" class="products-mobile-nav__logo" aria-label="Nicolais Mario e Hijo">
                <img src="{{ asset('storage/brand/logo.svg') }}" alt="Nicolais Mario e Hijo">
            </a>
            <button class="products-mobile-nav__close" type="button" data-products-menu-close aria-label="Cerrar menú">
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
            </button>
        </div>
        <a href="/nosotros" @if ($current === 'nosotros') aria-current="page" @endif>Nosotros</a>
        <a href="{{ route('web.products.index') }}" @if ($current === 'productos') aria-current="page" @endif>Productos</a>
        <a href="/catalogo" @if ($current === 'catalogo') aria-current="page" @endif>Catálogos</a>
        <a href="/novedades" @if ($current === 'novedades') aria-current="page" @endif>Novedades</a>
        <a href="/contacto" @if ($current === 'contacto') aria-current="page" @endif>Contacto</a>
        <button type="button" class="products-mobile-nav__client" data-client-modal-open>
            <svg class="nm-client-button__icon" xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
                <path d="M1.75 18C1.26875 18 0.856916 17.8323 0.5145 17.4969C0.172083 17.1614 0.000583333 16.7577 0 16.2857V7.71429C0 7.24286 0.1715 6.83943 0.5145 6.504C0.8575 6.16857 1.26933 6.00057 1.75 6H2.625V4.28571C2.625 3.1 3.05171 2.08943 3.90512 1.254C4.75854 0.418572 5.79017 0.000572014 7 5.8508e-07C8.20983 -0.000570843 9.24175 0.417429 10.0957 1.254C10.9497 2.09057 11.3762 3.10114 11.375 4.28571V6H12.25C12.7312 6 13.1434 6.168 13.4864 6.504C13.8294 6.84 14.0006 7.24343 14 7.71429V16.2857C14 16.7571 13.8288 17.1609 13.4864 17.4969C13.144 17.8329 12.7318 18.0006 12.25 18H1.75ZM1.75 16.2857H12.25V7.71429H1.75V16.2857ZM7 13.7143C7.48125 13.7143 7.89337 13.5466 8.23637 13.2111C8.57937 12.8757 8.75058 12.472 8.75 12C8.74942 11.528 8.57821 11.1246 8.23637 10.7897C7.89454 10.4549 7.48242 10.2869 7 10.2857C6.51758 10.2846 6.10575 10.4526 5.7645 10.7897C5.42325 11.1269 5.25175 11.5303 5.25 12C5.24825 12.4697 5.41975 12.8734 5.7645 13.2111C6.10925 13.5489 6.52108 13.7166 7 13.7143ZM4.375 6H9.625V4.28571C9.625 3.57143 9.36979 2.96429 8.85937 2.46429C8.34896 1.96429 7.72917 1.71429 7 1.71429C6.27083 1.71429 5.65104 1.96429 5.14062 2.46429C4.63021 2.96429 4.375 3.57143 4.375 4.28571V6Z" fill="currentColor"/>
            </svg>
            Clientes
        </button>
    </div>
</nav>

@extends('web.layouts.app')

@section('title', 'Home')
@section('meta_description', 'Nicolais Mario e Hijo: distribuidores de repuestos automotores para sistemas de transmisión.')

@push('styles')
    @vite('resources/css/web/home.css')
@endpush

@section('content')
    @php
        $title = $hero['title'] ?? 'Distribuidores de repuestos para transmisión';
        $background = $hero['background'] ?? '/storage/uploads/cms/2026/05/4f580ba9-37bd-4981-a949-09a920fbd876.png';
        $mediaType = $slide?->media_type ?? 'image';
        $mediaUrl = $slide?->desktop_media_url ?? $background;
        $youtubeUrl = $slide?->desktop_youtube_embed_url;
        $logoOneUrl = $slide?->logo_one_media_url;
        $logoTwoUrl = $slide?->logo_two_media_url;
        $representadas = $representadas ?? [];
        $aboutTitle = $aboutSection?->title ?: 'Quiénes somos';
        $aboutDescription = $aboutSection?->description ?: '<p>Somos una empresa dedicada a la comercialización de productos para la transmisión.</p><p>Nuestro esfuerzo está dedicado a abastecer el mercado de reposición con gran variedad de productos y un amplio stock, asegurando una rápida respuesta y distribución a todo el país.</p>';
        $aboutImage = media_asset_url($aboutSection?->media) ?: asset('storage/uploads/cms/2026/05/4f580ba9-37bd-4981-a949-09a920fbd876.png');
        $aboutButtonText = $aboutSection?->button_text ?: 'Más Info';
        $aboutButtonUrl = $aboutSection?->button_url ?: '/nosotros';
    @endphp

    <main class="nm-home">
        <section class="nm-hero" style="--nm-hero-image: url('{{ $background }}')">
            <div class="nm-hero__media" aria-hidden="true">
                @if ($mediaType === 'youtube' && $youtubeUrl)
                    <iframe
                        src="{{ $youtubeUrl }}"
                        title="{{ $slide?->alt_text ?: $title }}"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                    ></iframe>
                @elseif ($mediaType === 'video' && $mediaUrl)
                    <video src="{{ $mediaUrl }}" autoplay muted loop playsinline></video>
                @elseif ($mediaUrl)
                    <img src="{{ $mediaUrl }}" alt="">
                @endif
            </div>

            <div class="nm-search-strip">
                <div class="nm-search-strip__inner">
                    <button class="nm-search-button" type="button" aria-label="Buscar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                            <path d="M6.5 13C4.68333 13 3.146 12.3707 1.888 11.112C0.63 9.85333 0.000667196 8.316 5.29101e-07 6.5C-0.000666138 4.684 0.628667 3.14667 1.888 1.888C3.14733 0.629333 4.68467 0 6.5 0C8.31533 0 9.853 0.629333 11.113 1.888C12.373 3.14667 13.002 4.684 13 6.5C13 7.23333 12.8833 7.925 12.65 8.575C12.4167 9.225 12.1 9.8 11.7 10.3L17.3 15.9C17.4833 16.0833 17.575 16.3167 17.575 16.6C17.575 16.8833 17.4833 17.1167 17.3 17.3C17.1167 17.4833 16.8833 17.575 16.6 17.575C16.3167 17.575 16.0833 17.4833 15.9 17.3L10.3 11.7C9.8 12.1 9.225 12.4167 8.575 12.65C7.925 12.8833 7.23333 13 6.5 13ZM6.5 11C7.75 11 8.81267 10.5627 9.688 9.688C10.5633 8.81333 11.0007 7.75067 11 6.5C10.9993 5.24933 10.562 4.187 9.688 3.313C8.814 2.439 7.75133 2.00133 6.5 2C5.24867 1.99867 4.18633 2.43633 3.313 3.313C2.43967 4.18967 2.002 5.252 2 6.5C1.998 7.748 2.43567 8.81067 3.313 9.688C4.19033 10.5653 5.25267 11.0027 6.5 11Z" fill="white"/>
                        </svg>
                    </button>
                </div>
            </div>

            <header class="nm-header">
                <a href="{{ route('web.home') }}" class="nm-logo" aria-label="{{ config('app.name', 'Nicolais Mario e Hijo') }}">
                    <img src="{{ asset('storage/brand/logo.svg') }}" alt="Nicolais Mario e Hijo">
                </a>

                <nav class="nm-nav" aria-label="Principal">
                    <a href="/nosotros">Nosotros</a>
                    <a href="/productos">Productos</a>
                    <a href="/catalogo">Catálogos</a>
                    <a href="/novedades">Novedades</a>
                    <a href="/contacto">Contacto</a>
                </nav>

                <button type="button" class="nm-client-button" data-client-modal-open>
                    <svg class="nm-client-button__icon" xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
                        <path d="M1.75 18C1.26875 18 0.856916 17.8323 0.5145 17.4969C0.172083 17.1614 0.000583333 16.7577 0 16.2857V7.71429C0 7.24286 0.1715 6.83943 0.5145 6.504C0.8575 6.16857 1.26933 6.00057 1.75 6H2.625V4.28571C2.625 3.1 3.05171 2.08943 3.90512 1.254C4.75854 0.418572 5.79017 0.000572014 7 5.8508e-07C8.20983 -0.000570843 9.24175 0.417429 10.0957 1.254C10.9497 2.09057 11.3762 3.10114 11.375 4.28571V6H12.25C12.7312 6 13.1434 6.168 13.4864 6.504C13.8294 6.84 14.0006 7.24343 14 7.71429V16.2857C14 16.7571 13.8288 17.1609 13.4864 17.4969C13.144 17.8329 12.7318 18.0006 12.25 18H1.75ZM1.75 16.2857H12.25V7.71429H1.75V16.2857ZM7 13.7143C7.48125 13.7143 7.89337 13.5466 8.23637 13.2111C8.57937 12.8757 8.75058 12.472 8.75 12C8.74942 11.528 8.57821 11.1246 8.23637 10.7897C7.89454 10.4549 7.48242 10.2869 7 10.2857C6.51758 10.2846 6.10575 10.4526 5.7645 10.7897C5.42325 11.1269 5.25175 11.5303 5.25 12C5.24825 12.4697 5.41975 12.8734 5.7645 13.2111C6.10925 13.5489 6.52108 13.7166 7 13.7143ZM4.375 6H9.625V4.28571C9.625 3.57143 9.36979 2.96429 8.85937 2.46429C8.34896 1.96429 7.72917 1.71429 7 1.71429C6.27083 1.71429 5.65104 1.96429 5.14062 2.46429C4.63021 2.96429 4.375 3.57143 4.375 4.28571V6Z" fill="white"/>
                    </svg>
                    Clientes
                </button>

                <button
                    type="button"
                    class="nm-mobile-menu-toggle"
                    data-home-menu-toggle
                    aria-label="Abrir menú"
                    aria-controls="home-mobile-nav"
                    aria-expanded="false"
                >
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </button>
            </header>

            <nav class="nm-mobile-nav" id="home-mobile-nav" data-home-mobile-menu aria-label="Menú principal" hidden>
                <button class="nm-mobile-nav__backdrop" type="button" data-home-menu-close aria-label="Cerrar menú"></button>
                <div class="nm-mobile-nav__panel" data-home-mobile-menu-panel>
                    <div class="nm-mobile-nav__head">
                        <a href="{{ route('web.home') }}" class="nm-mobile-nav__logo" aria-label="{{ config('app.name', 'Nicolais Mario e Hijo') }}">
                            <img src="{{ asset('storage/brand/logo.svg') }}" alt="Nicolais Mario e Hijo">
                        </a>
                        <button class="nm-mobile-nav__close" type="button" data-home-menu-close aria-label="Cerrar menú">
                            <span aria-hidden="true"></span>
                            <span aria-hidden="true"></span>
                        </button>
                    </div>
                    <a href="/nosotros">Nosotros</a>
                    <a href="/productos">Productos</a>
                    <a href="/catalogo">Catálogos</a>
                    <a href="/novedades">Novedades</a>
                    <a href="/contacto">Contacto</a>
                    <button type="button" class="nm-mobile-nav__client" data-client-modal-open>
                        <svg class="nm-client-button__icon" xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
                            <path d="M1.75 18C1.26875 18 0.856916 17.8323 0.5145 17.4969C0.172083 17.1614 0.000583333 16.7577 0 16.2857V7.71429C0 7.24286 0.1715 6.83943 0.5145 6.504C0.8575 6.16857 1.26933 6.00057 1.75 6H2.625V4.28571C2.625 3.1 3.05171 2.08943 3.90512 1.254C4.75854 0.418572 5.79017 0.000572014 7 5.8508e-07C8.20983 -0.000570843 9.24175 0.417429 10.0957 1.254C10.9497 2.09057 11.3762 3.10114 11.375 4.28571V6H12.25C12.7312 6 13.1434 6.168 13.4864 6.504C13.8294 6.84 14.0006 7.24343 14 7.71429V16.2857C14 16.7571 13.8288 17.1609 13.4864 17.4969C13.144 17.8329 12.7318 18.0006 12.25 18H1.75ZM1.75 16.2857H12.25V7.71429H1.75V16.2857ZM7 13.7143C7.48125 13.7143 7.89337 13.5466 8.23637 13.2111C8.57937 12.8757 8.75058 12.472 8.75 12C8.74942 11.528 8.57821 11.1246 8.23637 10.7897C7.89454 10.4549 7.48242 10.2869 7 10.2857C6.51758 10.2846 6.10575 10.4526 5.7645 10.7897C5.42325 11.1269 5.25175 11.5303 5.25 12C5.24825 12.4697 5.41975 12.8734 5.7645 13.2111C6.10925 13.5489 6.52108 13.7166 7 13.7143ZM4.375 6H9.625V4.28571C9.625 3.57143 9.36979 2.96429 8.85937 2.46429C8.34896 1.96429 7.72917 1.71429 7 1.71429C6.27083 1.71429 5.65104 1.96429 5.14062 2.46429C4.63021 2.96429 4.375 3.57143 4.375 4.28571V6Z" fill="currentColor"/>
                        </svg>
                        Clientes
                    </button>
                </div>
            </nav>

            <div class="nm-hero__content">
                <h1>{{ $title }}</h1>
            </div>

            <div class="nm-partners" aria-label="Marcas representadas">
                @if ($logoOneUrl || $logoTwoUrl)
                    @if ($logoOneUrl)
                        <div class="nm-partner nm-partner--logo">
                            <img src="{{ $logoOneUrl }}" alt="Logo representada 1">
                        </div>
                    @endif

                    @if ($logoTwoUrl)
                        <div class="nm-partner nm-partner--logo">
                            <img src="{{ $logoTwoUrl }}" alt="Logo representada 2">
                        </div>
                    @endif
                @else
                    @foreach ($representadas as $partner)
                        @if (($partner['name'] ?? '') === 'MAHIRO')
                            <div class="nm-partner nm-partner--mahiro">
                                <span class="nm-partner__mark" aria-hidden="true">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </span>
                                <span>
                                    <strong>{{ $partner['name'] }}</strong>
                                    <small>{{ $partner['subtitle'] ?? '' }}</small>
                                </span>
                            </div>
                        @else
                            <div class="nm-partner nm-partner--tecno">
                                <span class="nm-partner__gear" aria-hidden="true"></span>
                                <strong>{{ $partner['name'] ?? '' }}</strong>
                            </div>
                        @endif
                    @endforeach
                @endif
            </div>
        </section>

        <section class="nm-home-search" aria-label="Buscador de productos">
            @include('web.products.partials-search', [
                'searchAction' => route('web.products.index'),
                'clearUrl' => route('web.products.index'),
            ])
        </section>

        <section class="nm-home-categories" aria-labelledby="home-categories-title">
            <div class="products-section-head products-section-head--categories">
                <h2 id="home-categories-title">Nuestras categorías</h2>
                <a class="products-outline-btn" href="{{ route('web.products.all') }}">Ver todas</a>
            </div>

            <div class="category-grid">
                @foreach ($families as $family)
                    <a class="category-card" href="{{ route('web.products.line', $family->slug) }}">
                        <span class="category-card__image">
                            <img src="{{ media_asset_url($family->coverMedia) ?: asset('images/placeholder-equipment.svg') }}" alt="{{ $family->name }}">
                        </span>
                        <h3>{{ $family->name }}</h3>
                    </a>
                @endforeach
            </div>
        </section>

        <section class="nm-home-about" aria-labelledby="home-about-title">
            <div class="nm-home-about__image">
                <img src="{{ $aboutImage }}" alt="{{ $aboutTitle }}">
            </div>

            <div class="nm-home-about__content">
                <div class="nm-home-about__copy">
                    <h2 id="home-about-title">{{ $aboutTitle }}</h2>
                    <div class="nm-home-about__text">
                        {!! $aboutDescription !!}
                    </div>

                    <a class="nm-home-about__button" href="{{ $aboutButtonUrl }}">
                        {{ $aboutButtonText }}
                    </a>
                </div>
            </div>
        </section>

        <section class="nm-home-featured" aria-labelledby="home-featured-title">
            <div class="products-section-head nm-home-featured__head">
                <h2 id="home-featured-title">Productos destacados</h2>
                <a class="products-outline-btn" href="{{ route('web.products.all') }}">Ver todas</a>
            </div>

            <div class="product-grid nm-home-featured__grid">
                @foreach ($featuredProducts as $product)
                    @include('web.products.partials-card', ['product' => $product])
                @endforeach
            </div>
        </section>

        <section class="nm-home-news" aria-labelledby="home-news-title">
            <div class="products-section-head nm-home-news__head">
                <h2 id="home-news-title">Novedades</h2>
                <a class="products-outline-btn" href="{{ route('web.news.index') }}">Ver todas</a>
            </div>

            @if (($homePosts ?? collect())->isNotEmpty())
                <div class="nm-home-news__grid">
                    @foreach ($homePosts as $post)
                        <a class="nm-news-card" href="{{ route('web.news.show', $post->slug) }}">
                            <span class="nm-news-card__image">
                                <img src="{{ media_asset_url($post->coverMedia) ?: asset('images/placeholder-equipment.svg') }}" alt="{{ $post->title }}">
                            </span>
                            <span class="nm-news-card__body">
                                @if ($post->category)
                                    <span class="nm-news-card__category">{{ $post->category->name }}</span>
                                @endif
                                <span class="nm-news-card__title">{{ $post->title }}</span>
                                @if ($post->excerpt)
                                    <span class="nm-news-card__excerpt">{{ $post->excerpt }}</span>
                                @endif
                                <span class="nm-news-card__more">
                                    <span>Leer más</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                        <path d="M1 8H15M8 15L15 8L8 1" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </span>
                            </span>
                        </a>
                    @endforeach
                </div>
            @endif
        </section>
    </main>
@endsection

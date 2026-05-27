@extends('web.layouts.app')

@section('title', 'Nosotros')
@section('meta_description', 'Conocé la historia, misión, visión y valores de Nicolais Mario e Hijo.')

@push('styles')
    @vite('resources/css/web/about.css')
@endpush

@section('content')
    @include('web.products.partials-header', ['current' => 'nosotros'])

    @php
        $introTitle = $intro?->title ?: 'Quienes Somos';
        $introText = $intro?->description ?: '<p>Somos una empresa dedicada a la comercialización de productos para la transmisión.</p><p>Nuestro esfuerzo está dedicado a abastecer el mercado de reposición con gran variedad de productos y un amplio stock, asegurando una rápida respuesta y distribución a todo el país.</p>';
        $introImage = media_asset_url($intro?->media) ?: asset('storage/uploads/cms/2026/05/4f580ba9-37bd-4981-a949-09a920fbd876.png');
    @endphp

    <main class="about-page">
        <div class="about-shell">
            <nav class="products-breadcrumb about-breadcrumb" aria-label="Breadcrumb">
                <a href="{{ route('web.home') }}">Inicio</a>
                <span aria-hidden="true">&gt;</span>
                <span>Nosotros</span>
            </nav>

            @if (($intro?->is_active ?? true))
                <section class="about-intro" aria-labelledby="about-intro-title">
                    <div class="about-intro__image">
                        <img src="{{ $introImage }}" alt="{{ $introTitle }}">
                    </div>

                    <div class="about-intro__content">
                        <h1 id="about-intro-title">{{ $introTitle }}</h1>
                        <div class="about-intro__text">{!! $introText !!}</div>
                    </div>
                </section>
            @endif
        </div>

        @if (($missionVision?->is_active ?? true) || ($values?->is_active ?? true))
            <section class="about-why" aria-labelledby="about-why-title">
                <div class="about-why__inner">
                    <h2 id="about-why-title">¿Porque elegirnos?</h2>

                    <div class="about-values-grid">
                        @if (($missionVision?->is_active ?? true))
                            <article class="about-value-card">
                                <span class="about-value-card__icon" aria-hidden="true">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none">
                                        <path d="M30 55C43.8071 55 55 43.8071 55 30C55 16.1929 43.8071 5 30 5C16.1929 5 5 16.1929 5 30C5 43.8071 16.1929 55 30 55Z" stroke="#0072BB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M30 45C38.2843 45 45 38.2843 45 30C45 21.7157 38.2843 15 30 15C21.7157 15 15 21.7157 15 30C15 38.2843 21.7157 45 30 45Z" stroke="#0072BB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M30 35C32.7614 35 35 32.7614 35 30C35 27.2386 32.7614 25 30 25C27.2386 25 25 27.2386 25 30C25 32.7614 27.2386 35 30 35Z" stroke="#0072BB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </span>
                                <h3>{{ $missionTitle }}</h3>
                                <div class="about-value-card__text">{!! $missionText ?: '<p>Brindar soluciones confiables para el mercado de reposición automotor.</p>' !!}</div>
                            </article>

                            <article class="about-value-card">
                                <span class="about-value-card__icon" aria-hidden="true">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none">
                                        <path d="M5 30C5 30 12.5 12.5 30 12.5C47.5 12.5 55 30 55 30C55 30 47.5 47.5 30 47.5C12.5 47.5 5 30 5 30Z" stroke="#0072BB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M30 37.5C34.1421 37.5 37.5 34.1421 37.5 30C37.5 25.8579 34.1421 22.5 30 22.5C25.8579 22.5 22.5 25.8579 22.5 30C22.5 34.1421 25.8579 37.5 30 37.5Z" stroke="#0072BB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </span>
                                <h3>{{ $visionTitle }}</h3>
                                <div class="about-value-card__text">{!! $visionText ?: '<p>Ser una empresa referente por su respuesta, variedad y compromiso comercial.</p>' !!}</div>
                            </article>
                        @endif

                        @if (($values?->is_active ?? true))
                            <article class="about-value-card">
                                <span class="about-value-card__icon" aria-hidden="true">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none">
                                        <path d="M9.62499 21.55C9.2601 19.9063 9.31613 18.1971 9.78789 16.5808C10.2596 14.9646 11.1319 13.4936 12.3237 12.3043C13.5155 11.115 14.9883 10.2459 16.6055 9.77749C18.2228 9.30911 19.9321 9.25666 21.575 9.625C22.4793 8.21075 23.725 7.0469 25.1974 6.24071C26.6697 5.43453 28.3214 5.01196 30 5.01196C31.6786 5.01196 33.3302 5.43453 34.8026 6.24071C36.275 7.0469 37.5207 8.21075 38.425 9.625C40.0704 9.25506 41.7827 9.30727 43.4025 9.77678C45.0223 10.2463 46.4971 11.1179 47.6896 12.3104C48.8821 13.5029 49.7537 14.9777 50.2232 16.5975C50.6927 18.2173 50.7449 19.9296 50.375 21.575C51.7892 22.4793 52.9531 23.725 53.7593 25.1974C54.5655 26.6697 54.988 28.3214 54.988 30C54.988 31.6786 54.5655 33.3303 53.7593 34.8026C52.9531 36.275 51.7892 37.5207 50.375 38.425C50.7433 40.0679 50.6909 41.7772 50.2225 43.3945C49.7541 45.0117 48.885 46.4845 47.6957 47.6763C46.5064 48.8681 45.0354 49.7403 43.4191 50.2121C41.8029 50.6839 40.0937 50.7399 38.45 50.375C37.5469 51.7947 36.3002 52.9635 34.8253 53.7733C33.3504 54.5831 31.6951 55.0076 30.0125 55.0076C28.3299 55.0076 26.6746 54.5831 25.1997 53.7733C23.7248 52.9635 22.4781 51.7947 21.575 50.375C19.9321 50.7433 18.2228 50.6909 16.6055 50.2225C14.9883 49.7541 13.5155 48.885 12.3237 47.6957C11.1319 46.5064 10.2596 45.0354 9.78789 43.4192C9.31613 41.8029 9.2601 40.0937 9.62499 38.45C8.19989 37.5481 7.02603 36.3004 6.21262 34.823C5.3992 33.3456 4.97266 31.6865 4.97266 30C4.97266 28.3135 5.3992 26.6544 6.21262 25.177C7.02603 23.6996 8.19989 22.4519 9.62499 21.55Z" stroke="#0072BB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M22.5 30L27.5 35L37.5 25" stroke="#0072BB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </span>
                                <h3>{{ $valuesTitle }}</h3>
                                <div class="about-value-card__text">{!! $valuesText ?: '<p>Compromiso, responsabilidad y atención cercana en cada operación.</p>' !!}</div>
                            </article>
                        @endif
                    </div>
                </div>
            </section>
        @endif
    </main>
@endsection

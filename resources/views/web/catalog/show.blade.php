@extends('web.layouts.app')

@section('title', 'Catálogos')
@section('meta_description', 'Catálogos descargables de repuestos automotores Nicolais Mario e Hijo.')

@push('styles')
    @vite('resources/css/web/catalog.css')
@endpush

@section('content')
    @include('web.products.partials-header', ['current' => 'catalogo'])

    <main class="catalog-page">
        <div class="catalog-shell">
            <nav class="catalog-breadcrumb" aria-label="Breadcrumb">
                <a href="{{ route('web.home') }}">Inicio</a>
                <span aria-hidden="true">&gt;</span>
                <span>Catálogos</span>
            </nav>

            @if($catalogItems->isNotEmpty())
                <section class="catalog-grid" aria-label="Catálogos disponibles">
                    @foreach($catalogItems as $catalogItem)
                        <article class="catalog-card">
                            <div class="catalog-card__media" @if($catalogItem['cover_url']) style="--catalog-cover: url('{{ $catalogItem['cover_url'] }}');" @endif>
                                @if($catalogItem['cover_url'])
                                    <span class="catalog-card__media-alt">{{ $catalogItem['title'] }}</span>
                                @endif
                            </div>

                            <div class="catalog-card__body">
                                <h2 class="catalog-card__title">{{ $catalogItem['title'] }}</h2>
                                <div class="catalog-card__divider" aria-hidden="true"></div>
                                <div class="catalog-card__actions">
                                    @if($catalogItem['file_view_url'])
                                        <a href="{{ $catalogItem['file_view_url'] }}" target="_blank" rel="noreferrer" aria-label="Ver {{ $catalogItem['title'] }}">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
                                                <path d="M1.06251 8.34738C0.979165 8.12287 0.979165 7.8759 1.06251 7.65138C1.87421 5.68324 3.25202 4.00042 5.02128 2.81628C6.79053 1.63214 8.87155 1 11.0005 1C13.1295 1 15.2105 1.63214 16.9797 2.81628C18.749 4.00042 20.1268 5.68324 20.9385 7.65138C21.0218 7.8759 21.0218 8.12287 20.9385 8.34738C20.1268 10.3155 18.749 11.9983 16.9797 13.1825C15.2105 14.3666 13.1295 14.9988 11.0005 14.9988C8.87155 14.9988 6.79053 14.3666 5.02128 13.1825C3.25202 11.9983 1.87421 10.3155 1.06251 8.34738Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M11.0005 10.9994C12.6574 10.9994 14.0005 9.65624 14.0005 7.99938C14.0005 6.34253 12.6574 4.99938 11.0005 4.99938C9.34365 4.99938 8.00051 6.34253 8.00051 7.99938C8.00051 9.65624 9.34365 10.9994 11.0005 10.9994Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </a>
                                        <a href="{{ $catalogItem['file_download_url'] }}" download aria-label="Descargar {{ $catalogItem['title'] }}">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                                <path d="M10 13V1M15 8L10 13L5 8M19 13V17C19 17.5304 18.7893 18.0391 18.4142 18.4142C18.0391 18.7893 17.5304 19 17 19H3C2.46957 19 1.96086 18.7893 1.58579 18.4142C1.21071 18.0391 1 17.5304 1 17V13" stroke="#0072BB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </a>
                                    @endif
                                </div>
                            </div>
                        </article>
                    @endforeach
                </section>
            @else
                <section class="catalog-empty">
                    <p>Los catálogos estarán disponibles próximamente.</p>
                </section>
            @endif
        </div>
    </main>
@endsection

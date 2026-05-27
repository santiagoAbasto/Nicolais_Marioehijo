@extends('web.layouts.app')

@section('title', $query ? 'Buscar: '.$query : 'Buscar')
@section('meta_description', 'Buscador inteligente de Nicolais Mario e Hijo.')

@push('styles')
    @vite('resources/css/web/products.css')
@endpush

@section('content')
    <main class="products-page search-page">
        @include('web.products.partials-header', ['current' => 'buscar'])

        <div class="products-shell search-page__shell">
            <nav class="products-breadcrumb" aria-label="Breadcrumb">
                <a href="{{ route('web.home') }}">Inicio</a>
                <span aria-hidden="true">&gt;</span>
                <span aria-current="page">Buscar</span>
            </nav>

            <section class="search-page__hero" aria-labelledby="search-page-title">
                <div class="search-page__assistant">
                    <span class="search-page__assistant-mark" aria-hidden="true"></span>
                    <p class="search-page__eyebrow">Asistente IA</p>
                    <h1 id="search-page-title">Buscador inteligente</h1>
                    <p>{{ $insight['description'] ?? 'Buscá por producto, código, familia, novedad o preguntá por una sección.' }}</p>
                </div>

                <form class="search-page__form" action="{{ route('web.search.index') }}" method="GET">
                    <label class="sr-only" for="search-page-input">Buscar</label>
                    <input
                        id="search-page-input"
                        type="search"
                        name="q"
                        value="{{ $query }}"
                        placeholder="Preguntá o buscá por producto, código, sección..."
                        autocomplete="off"
                    >
                    <button type="submit">Buscar</button>
                </form>
            </section>

            @if ($query)
                <p class="search-page__summary">
                    {{ $totalResults }} resultado{{ $totalResults === 1 ? '' : 's' }} para “{{ $query }}”.
                </p>
            @endif

            @if (! empty($insight['headline']))
                <div class="ai-halo-shell search-page__ai-halo">
                    <section class="search-page__ai-card" aria-label="Respuesta del asistente">
                        <div class="search-page__ai-head">
                            <div class="search-page__ai-title">
                                <span class="global-search__ai-orb global-search__ai-orb--small" aria-hidden="true"><span></span></span>
                                <h2>Asistente IA</h2>
                            </div>
                            <span class="search-page__ai-label">IA asistida</span>
                        </div>

                        <div class="search-page__ai-body">
                            <span>Interpretación</span>
                            <strong>{{ $insight['headline'] }}</strong>
                            @if (! empty($insight['description']))
                                <p>{{ $insight['description'] }}</p>
                            @endif
                        </div>

                        @foreach (($insight['supporting_groups'] ?? []) as $supportGroup)
                            @if (! empty($supportGroup['items']))
                                <div class="search-page__chips" aria-label="{{ $supportGroup['title'] ?? 'Sugerencias' }}">
                                    @foreach ($supportGroup['items'] as $item)
                                        <a href="{{ $item['url'] }}">{{ $item['title'] }}</a>
                                    @endforeach
                                </div>
                            @endif
                        @endforeach
                    </section>
                </div>
            @endif

            @if ($query && $totalResults === 0)
                <p class="products-empty search-page__empty">No encontramos coincidencias exactas. Probá con código, producto, marca, teléfono, catálogo o presupuesto.</p>
            @endif

            @foreach ($groups as $group)
                <section class="search-page__group">
                    <div class="products-section-head">
                        <h2>{{ $group['title'] }}</h2>
                    </div>

                    <div class="search-page__results">
                        @foreach ($group['items'] as $item)
                            <a class="search-page__result" href="{{ $item['url'] }}">
                                <span class="search-page__result-context">{{ $item['context'] }}</span>
                                <strong>{{ $item['title'] }}</strong>
                                @if (! empty($item['match_reason']))
                                    <span>{{ $item['match_reason'] }}</span>
                                @endif
                                @if (! empty($item['meta']))
                                    <small>{{ $item['meta'] }}</small>
                                @endif
                            </a>
                        @endforeach
                    </div>
                </section>
            @endforeach
        </div>
    </main>
@endsection

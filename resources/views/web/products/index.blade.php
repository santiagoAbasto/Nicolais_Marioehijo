@extends('web.layouts.app')

@section('title', 'Productos')
@section('meta_description', 'Catálogo de repuestos automotores Nicolais Mario e Hijo.')

@push('styles')
    @vite('resources/css/web/products.css')
@endpush

@section('content')
    <main class="products-page">
        @include('web.products.partials-header')

        <div class="products-shell">
            <nav class="products-breadcrumb" aria-label="Breadcrumb">
                <a href="{{ route('web.home') }}">Inicio</a>
                <span aria-hidden="true">&gt;</span>
                <span aria-current="page">Productos</span>
            </nav>

            @include('web.products.partials-search', [
                'searchAction' => $selectedFamily ? route('web.products.line', $selectedFamily->slug) : route('web.products.index'),
                'clearUrl' => $selectedFamily ? route('web.products.line', $selectedFamily->slug) : route('web.products.index'),
            ])

            @if (! $showAll && ! $selectedFamily)
                <section class="product-grid products-results-grid" aria-label="Productos">
                    @forelse ($products as $product)
                        @include('web.products.partials-card', ['product' => $product])
                    @empty
                        <p class="products-empty">No encontramos productos para esos filtros.</p>
                    @endforelse
                </section>

                {{ $products->links('web.products.partials-pagination') }}
            @else
                <div class="products-section-head">
                    <h1>{{ $selectedFamily?->name ?? 'Productos' }}</h1>
                </div>

                <section class="product-grid">
                    @forelse ($products as $product)
                        @include('web.products.partials-card', ['product' => $product])
                    @empty
                        <p class="products-empty">No encontramos productos para esos filtros.</p>
                    @endforelse
                </section>

                {{ $products->links('web.products.partials-pagination') }}
            @endif
        </div>
    </main>
@endsection

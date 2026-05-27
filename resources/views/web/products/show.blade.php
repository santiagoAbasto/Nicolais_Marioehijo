@extends('web.layouts.app')

@section('title', $product->name)
@section('meta_description', $product->short_description ?: $product->name)

@push('styles')
    @vite('resources/css/web/products.css')
@endpush

@section('content')
    <main class="products-page">
        @include('web.products.partials-header')

        <div class="products-shell">
            <div class="products-breadcrumb">
                Inicio &gt; Productos &gt; {{ $product->family?->name }} &gt; {{ $product->name }}
            </div>

            <section class="product-detail">
                <div>
                    <div class="product-detail__media">
                        <span class="product-card__badge">{{ $product->brand ?: 'Importado' }}</span>
                        <img src="{{ media_asset_url($product->mainMedia) ?: asset('images/placeholder-equipment.svg') }}" alt="{{ $product->name }}">
                    </div>
                </div>

                <div class="product-detail__info">
                    <div class="product-detail__brand">
                        <span>{{ $product->family?->name }}</span>
                        @if ($product->brandLogoMedia)
                            <img src="{{ media_asset_url($product->brandLogoMedia) }}" alt="{{ $product->brand }}">
                        @endif
                    </div>

                    <div class="product-detail__code">{{ $product->sku }}</div>
                    <h1>{{ $product->name }}</h1>
                    <p>{{ $product->description ?: 'Descripción de producto' }}</p>

                    <div class="product-detail__variants">
                        <div class="product-detail__variant">
                            <strong>{{ $product->sku }}</strong>
                            <span>{{ $product->original_code ?: $product->name }}</span>
                            <a href="{{ route('web.contact.show', ['producto' => $product->slug]) }}">Consultar</a>
                        </div>
                        @if ($product->oem_code)
                            <div class="product-detail__variant">
                                <strong>OEM</strong>
                                <span>{{ $product->oem_code }}</span>
                                <a href="{{ route('web.contact.show', ['producto' => $product->slug]) }}">Consultar</a>
                            </div>
                        @endif
                    </div>

                    <a class="download-btn" href="/catalogo">Descargar catálogo</a>
                </div>
            </section>

            @if ($product->applications)
                <div class="products-section-head">
                    <h2>Aplicaciones</h2>
                </div>
                <section class="applications-grid">
                    @foreach (preg_split('/[,;\\/]+/', $product->applications) as $application)
                        @if (trim($application) !== '')
                            <span>{{ trim($application) }}</span>
                        @endif
                    @endforeach
                </section>
            @endif

            <div class="products-section-head">
                <h2>Productos relacionados para {{ $product->subfamily?->name ?: $product->family?->name }}</h2>
            </div>

            <section class="product-grid">
                @foreach ($related as $product)
                    @include('web.products.partials-card', ['product' => $product])
                @endforeach
            </section>
        </div>
    </main>
@endsection

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
            <nav class="products-breadcrumb" aria-label="Breadcrumb">
                <a href="{{ route('web.home') }}">Inicio</a>
                <span aria-hidden="true">&gt;</span>
                <a href="{{ route('web.products.index') }}">Productos</a>
                @if ($product->family)
                    <span aria-hidden="true">&gt;</span>
                    <a href="{{ route('web.products.line', $product->family->slug) }}">{{ $product->family->name }}</a>
                @endif
                <span aria-hidden="true">&gt;</span>
                <span>{{ $product->name }}</span>
            </nav>

            <section class="product-detail">
                <div>
                    @php
                        $galleryImages = collect([$product->mainMedia])
                            ->merge($product->media->pluck('media'))
                            ->filter()
                            ->unique('id')
                            ->values();
                    @endphp

                    <div class="product-detail__media">
                        <span class="product-card__badge">{{ $product->brand ?: 'Importado' }}</span>
                        <img
                            data-product-main-image
                            src="{{ media_asset_url($galleryImages->first()) ?: asset('images/placeholder-equipment.svg') }}"
                            alt="{{ $product->name }}"
                        >
                    </div>

                    @if ($galleryImages->count() > 1)
                        <div class="product-detail__thumbs" aria-label="Imágenes del producto">
                            @foreach ($galleryImages as $index => $media)
                                <button
                                    type="button"
                                    class="product-detail__thumb @if($index === 0) is-active @endif"
                                    data-product-thumb
                                    data-image-src="{{ media_asset_url($media) }}"
                                    aria-label="Ver imagen {{ $index + 1 }} de {{ $product->name }}"
                                    aria-pressed="{{ $index === 0 ? 'true' : 'false' }}"
                                >
                                    <img src="{{ media_asset_url($media) }}" alt="">
                                </button>
                            @endforeach
                        </div>
                    @endif
                </div>

                <div class="product-detail__info">
                    <div class="product-detail__brand">
                        <span class="product-detail__code">{{ $product->sku }}</span>
                        <span class="product-detail__family">{{ $product->family?->name }}</span>
                    </div>

                    <h1>{{ $product->name }}</h1>
                    <p>{{ $product->description ?: 'Descripción de producto' }}</p>

                    <div class="product-detail__variants">
                        @foreach ($equivalences as $equivalence)
                            <div class="product-detail__variant @if($equivalence->is($product)) is-current @endif">
                                <strong>{{ $equivalence->sku ?: 'Sin código' }}</strong>
                                <span>{{ $product->name }}</span>
                                @if ($equivalence->brandLogoMedia)
                                    <img src="{{ media_asset_url($equivalence->brandLogoMedia) }}" alt="{{ $equivalence->brand ?: 'Marca' }}">
                                @else
                                    <small>{{ $equivalence->brand ?: 'Importado' }}</small>
                                @endif
                                <a href="{{ route('web.contact.show', ['producto' => $equivalence->getKey()]) }}">Consultar</a>
                            </div>
                        @endforeach
                    </div>

                    <a class="download-btn" href="/catalogo">Descargar catálogo</a>
                </div>
            </section>

            @if ($product->applications)
                <div class="products-section-head products-section-head--applications">
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

            @php
                $relatedContext = $product->subfamily?->name ?: $product->family?->name;

                if ($relatedContext && preg_match('/(?:https?:\/\/|www\.|\.com|\.ar)/i', $relatedContext)) {
                    $relatedContext = $product->family?->name ?: 'este producto';
                }
            @endphp

            <div class="products-section-head products-section-head--related">
                <h2>Productos relacionados para {{ $relatedContext ?: 'este producto' }}</h2>
            </div>

            <section class="product-grid product-grid--related">
                @foreach ($related as $product)
                    @include('web.products.partials-card', ['product' => $product])
                @endforeach
            </section>
        </div>
    </main>
@endsection

@push('scripts')
    <script nonce="{{ request()->attributes->get('csp-nonce') }}">
        document.querySelectorAll('[data-product-thumb]').forEach((button) => {
            button.addEventListener('click', () => {
                const image = document.querySelector('[data-product-main-image]');

                if (!image || !button.dataset.imageSrc) {
                    return;
                }

                image.src = button.dataset.imageSrc;
                document.querySelectorAll('[data-product-thumb]').forEach((thumb) => {
                    const isActive = thumb === button;
                    thumb.classList.toggle('is-active', isActive);
                    thumb.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                });
            });
        });
    </script>
@endpush

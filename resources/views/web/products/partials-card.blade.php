<a class="product-card" href="{{ route('web.products.line', $product->slug) }}">
    @php
        $productImageUrl = media_asset_url($product->mainMedia);
        $brandImageUrl = media_asset_url($product->brandLogoMedia);
        $cardImageUrl = $productImageUrl ?: $brandImageUrl ?: asset('images/placeholder-equipment.svg');
        $usesBrandImage = ! $productImageUrl && $brandImageUrl;
    @endphp
    <span class="product-card__badge">{{ $product->brand ?: 'Importado' }}</span>
    <span class="product-card__image">
        <img
            class="product-card__media-img @if($usesBrandImage) product-card__media-img--logo @endif"
            src="{{ $cardImageUrl }}"
            alt="{{ $product->name }}"
            loading="lazy"
            decoding="async"
        >
    </span>
    <span class="product-card__body">
        <span class="product-card__meta">
            <span>{{ $product->sku }}</span>
            <span class="product-card__family">{{ $product->family?->name }}</span>
        </span>
        <h3>{{ $product->name }}</h3>
    </span>
</a>

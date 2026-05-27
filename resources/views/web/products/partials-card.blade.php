<a class="product-card" href="{{ route('web.products.line', $product->slug) }}">
    <span class="product-card__badge">{{ $product->brand ?: 'Importado' }}</span>
    <span class="product-card__image">
        <img src="{{ media_asset_url($product->mainMedia) ?: asset('images/placeholder-equipment.svg') }}" alt="{{ $product->name }}" loading="lazy" decoding="async">
    </span>
    <span class="product-card__body">
        <span class="product-card__meta">
            <span>{{ $product->sku }}</span>
            <span class="product-card__family">{{ $product->family?->name }}</span>
        </span>
        <h3>{{ $product->name }}</h3>
    </span>
</a>

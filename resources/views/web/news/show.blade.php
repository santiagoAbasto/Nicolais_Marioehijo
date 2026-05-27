@extends('web.layouts.app')

@section('title', $post->title)
@section('meta_description', $post->excerpt ?: $post->title)

@push('styles')
    @vite('resources/css/web/news.css')
@endpush

@section('content')
    <main class="products-page">
        @include('web.products.partials-header', ['current' => 'novedades'])

        <article class="products-shell news-detail-shell">
            <p class="products-breadcrumb">
                <a href="{{ route('web.news.index') }}">Novedades</a> · {{ $post->title }}
            </p>

            @if ($post->category)
                <p class="nm-news-card__category">{{ $post->category->name }}</p>
            @endif

            <h1 class="news-detail-title">
                {{ $post->title }}
            </h1>

            @if (media_asset_url($post->coverMedia))
                <img
                    class="news-detail-image"
                    src="{{ media_asset_url($post->coverMedia) }}"
                    alt="{{ $post->title }}"
                >
            @endif

            @if ($post->excerpt)
                <p class="news-detail-excerpt">
                    {{ $post->excerpt }}
                </p>
            @endif

            <div class="news-detail-content">
                {!! $post->content !!}
            </div>
        </article>
    </main>
@endsection

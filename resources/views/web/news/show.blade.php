@extends('web.layouts.app')

@section('title', $post->title)
@section('meta_description', $post->excerpt ?: $post->title)

@push('styles')
    @vite('resources/css/web/home.css')
@endpush

@section('content')
    <main class="products-page">
        @include('web.products.partials-header', ['current' => 'novedades'])

        <article class="products-shell" style="max-width: 920px;">
            <p class="products-breadcrumb">
                <a href="{{ route('web.news.index') }}">Novedades</a> · {{ $post->title }}
            </p>

            @if ($post->category)
                <p class="nm-news-card__category">{{ $post->category->name }}</p>
            @endif

            <h1 style="margin: 12px 0 24px; color: #111010; font-size: 42px; line-height: 1.1;">
                {{ $post->title }}
            </h1>

            @if (media_asset_url($post->coverMedia))
                <img
                    src="{{ media_asset_url($post->coverMedia) }}"
                    alt="{{ $post->title }}"
                    style="display: block; width: 100%; max-height: 480px; object-fit: cover; border-radius: 8px; border: 1px solid #d9d9d9;"
                >
            @endif

            @if ($post->excerpt)
                <p style="margin: 32px 0 0; color: #111010; font-size: 20px; line-height: 30px;">
                    {{ $post->excerpt }}
                </p>
            @endif

            <div style="margin-top: 32px; color: #111010; font-size: 17px; line-height: 28px;">
                {!! $post->content !!}
            </div>
        </article>
    </main>
@endsection

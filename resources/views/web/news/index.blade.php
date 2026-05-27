@extends('web.layouts.app')

@section('title', 'Novedades')
@section('meta_description', 'Novedades de Nicolais Mario e Hijo.')

@push('styles')
    @vite('resources/css/web/news.css')
@endpush

@section('content')
    <main class="products-page news-page">
        @include('web.products.partials-header', ['current' => 'novedades'])

        <section class="products-shell news-shell">
            <nav class="products-breadcrumb news-breadcrumb" aria-label="Breadcrumb">
                <a href="{{ route('web.home') }}">Inicio</a>
                <span aria-hidden="true">&gt;</span>
                <span>Novedades</span>
            </nav>

            <div class="nm-home-news__grid">
                @foreach ($posts as $post)
                    <a class="nm-news-card" href="{{ route('web.news.show', $post->slug) }}">
                        <span class="nm-news-card__image">
                            <img src="{{ media_asset_url($post->coverMedia) ?: asset('images/placeholder-equipment.svg') }}" alt="{{ $post->title }}">
                        </span>
                        <span class="nm-news-card__body">
                            @if ($post->category)
                                <span class="nm-news-card__category">{{ $post->category->name }}</span>
                            @endif
                            <span class="nm-news-card__title">{{ $post->title }}</span>
                            @if ($post->excerpt)
                                <span class="nm-news-card__excerpt">{{ $post->excerpt }}</span>
                            @endif
                            <span class="nm-news-card__more">
                                <span>Leer más</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                    <path d="M1 8H15M8 15L15 8L8 1" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </span>
                        </span>
                    </a>
                @endforeach
            </div>

            <div class="news-pagination">
                {{ $posts->links() }}
            </div>
        </section>
    </main>
@endsection

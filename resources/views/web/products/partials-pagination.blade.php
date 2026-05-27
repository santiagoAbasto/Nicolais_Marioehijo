@if ($paginator->hasPages())
    <nav class="products-pagination" aria-label="Paginación de productos">
        @if ($paginator->onFirstPage())
            <span class="products-pagination__control is-disabled">Anterior</span>
        @else
            <a class="products-pagination__control" href="{{ $paginator->previousPageUrl() }}" rel="prev">Anterior</a>
        @endif

        <div class="products-pagination__pages">
            @foreach ($elements as $element)
                @if (is_string($element))
                    <span class="products-pagination__ellipsis">{{ $element }}</span>
                @endif

                @if (is_array($element))
                    @foreach ($element as $page => $url)
                        @if ($page == $paginator->currentPage())
                            <span class="products-pagination__page is-current" aria-current="page">{{ $page }}</span>
                        @else
                            <a class="products-pagination__page" href="{{ $url }}">{{ $page }}</a>
                        @endif
                    @endforeach
                @endif
            @endforeach
        </div>

        @if ($paginator->hasMorePages())
            <a class="products-pagination__control" href="{{ $paginator->nextPageUrl() }}" rel="next">Siguiente</a>
        @else
            <span class="products-pagination__control is-disabled">Siguiente</span>
        @endif
    </nav>
@endif

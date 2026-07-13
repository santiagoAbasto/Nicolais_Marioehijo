@php
    $searchAction = $searchAction ?? route('web.products.index');
    $clearUrl = $clearUrl ?? $searchAction;
    $families = $families ?? collect();
    $brands = $brands ?? collect();
    $productBrands = $productBrands ?? collect();
    $models = $models ?? collect();
    $selectedFamily = $selectedFamily ?? null;
@endphp

<form class="products-filter" method="GET" action="{{ $searchAction }}">
    <div class="products-filter__top">
        <input class="products-filter__main-input" name="q" value="{{ request('q') }}" placeholder="Marca / Equivalencias / Código">
        <button class="products-filter__search" type="submit">Buscar</button>
        <a class="products-filter__clear" href="{{ $clearUrl }}">Limpiar</a>
    </div>

    <div class="products-filter__grid">
        <div class="products-filter__column">
            <label class="products-filter__field">
                <span>Familia</span>
                <select name="family" onchange="this.form.submit()">
                    <option value="">Seleccionar familia</option>
                    @foreach ($families as $family)
                        <option value="{{ $family->id }}" @selected((string) request('family') === (string) $family->id || $selectedFamily?->id === $family->id)>
                            {{ $family->name }}
                        </option>
                    @endforeach
                </select>
            </label>
            <label class="products-filter__field">
                <span>Rubro</span>
                <select name="rubro" onchange="this.form.submit()">
                    <option value="">Seleccionar rubro</option>
                    @foreach (($rubros ?? collect()) as $rubro)
                        <option value="{{ $rubro }}" @selected(request('rubro') === $rubro)>{{ $rubro }}</option>
                    @endforeach
                </select>
            </label>
        </div>

        <div class="products-filter__column">
            <label class="products-filter__field">
                <span>Marca</span>
                <select name="brand" onchange="this.form.submit()">
                    <option value="">Seleccionar marca</option>
                    @foreach ($brands as $brand)
                        <option value="{{ $brand }}" @selected(request('brand') === $brand)>{{ $brand }}</option>
                    @endforeach
                </select>
            </label>
            <label class="products-filter__field">
                <span>Modelo</span>
                <select name="model">
                    <option value="">Seleccionar modelo</option>
                    @foreach ($models as $model)
                        <option value="{{ $model }}" @selected(request('model') === $model)>{{ $model }}</option>
                    @endforeach
                </select>
            </label>
        </div>

        <div class="products-filter__column">
            <label class="products-filter__field">
                <span>Marca producto</span>
                <select name="product_brand" onchange="this.form.submit()">
                    <option value="">Seleccionar marca</option>
                    @foreach ($productBrands as $productBrand)
                        <option value="{{ $productBrand }}" @selected(request('product_brand') === $productBrand)>{{ $productBrand }}</option>
                    @endforeach
                </select>
            </label>
            <span class="products-filter__field products-filter__field--empty" aria-hidden="true"></span>
        </div>

        <div class="products-filter__column">
            <label class="products-filter__field">
                <span>Código NM</span>
                <input name="codigo" value="{{ request('codigo') }}" placeholder="Código NM">
            </label>
            <span class="products-filter__field products-filter__field--empty" aria-hidden="true"></span>
        </div>

        <div class="products-filter__column">
            <label class="products-filter__field">
                <span>Equivalencias</span>
                <input name="equivalencia" value="{{ request('equivalencia') }}" placeholder="Equivalencia">
            </label>
            <label class="products-filter__field">
                <span>Código OEM</span>
                <input name="oem" value="{{ request('oem') }}" placeholder="Código OEM">
            </label>
        </div>
    </div>
</form>

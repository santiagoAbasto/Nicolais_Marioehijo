@php
    $searchAction = $searchAction ?? route('web.products.index');
    $clearUrl = $clearUrl ?? $searchAction;
    $families = $families ?? collect();
    $brands = $brands ?? collect();
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
        <label class="products-filter__field">
            <span>Familia</span>
            <select name="family" onchange="this.form.submit()">
                <option value="">Seleccionar</option>
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

        <label class="products-filter__field products-filter__field--stack">
            <span>Marca y modelo</span>
            <select name="brand" onchange="this.form.submit()">
                <option value="">Seleccionar marca</option>
                @foreach ($brands as $brand)
                    <option value="{{ $brand }}" @selected(request('brand') === $brand)>{{ $brand }}</option>
                @endforeach
            </select>
            <select name="model">
                <option value="">Seleccionar modelo</option>
                @foreach ($models as $model)
                    <option value="{{ $model }}" @selected(request('model') === $model)>{{ $model }}</option>
                @endforeach
            </select>
        </label>

        <label class="products-filter__field">
            <span>Código NM</span>
            <input name="codigo" value="{{ request('codigo') }}" placeholder="Código NM">
        </label>

        <label class="products-filter__field products-filter__field--stack">
            <span>Equivalencias</span>
            <input name="equivalencia" value="{{ request('equivalencia') }}" placeholder="Equivalencia">
            <input name="oem" value="{{ request('oem') }}" placeholder="Código OEM">
        </label>
    </div>
</form>

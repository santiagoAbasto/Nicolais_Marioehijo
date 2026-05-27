@extends('web.layouts.app')

@section('title', 'Contacto')
@section('meta_description', 'Contacto comercial de Nicolais Mario e Hijo.')

@push('styles')
    @vite('resources/css/web/contact.css')
@endpush

@section('content')
    @php
        $meta = $contentSection?->meta_json ?? [];
        $address = $settings?->address ?: ($footerSettings?->contact_address ?: 'Jose Melian 2137 (B1852) Burzaco Provincia de Buenos Aires');
        $email = $settings?->email_primary ?: ($footerSettings?->email_primary ?: 'nicolaismario@yahoo.com.ar');
        $whatsapp = $settings?->phone_secondary ?: ($footerSettings?->phone_secondary ?: '+54 (911) 6094 - 8992');
        $phonePrimary = $settings?->phone_primary ?: ($footerSettings?->phone_primary ?: '(011) 6072 - 6008');
        $phoneSecondary = $settings?->phone_tertiary ?: ($footerSettings?->phone_tertiary ?: '(011) 6062 - 1347');
        $phones = array_filter([$whatsapp, $phonePrimary, $phoneSecondary]);
        $visibleContactItems = collect($contactItems ?? []);

        if ($visibleContactItems->isEmpty()) {
            $visibleContactItems = collect(array_filter([
                $address ? (object) ['type' => 'address', 'value' => $address] : null,
                $email ? (object) ['type' => 'email', 'value' => $email] : null,
                $whatsapp ? (object) ['type' => 'whatsapp', 'value' => $whatsapp] : null,
                $phonePrimary ? (object) ['type' => 'phone', 'value' => $phonePrimary] : null,
                $phoneSecondary ? (object) ['type' => 'additional_phone', 'value' => $phoneSecondary] : null,
            ]));
        }

        $mapSrc = 'https://www.google.com/maps?q=Jose%20Melian%202137%20Burzaco%20Buenos%20Aires&output=embed';
        $mapIframe = cms_map_iframe($settings?->map_iframe);
        $mapLink = $settings?->map_link ?: 'https://maps.app.goo.gl/w6zFeoJnA8cKMvrZ9';
        $formTitle = $contentSection?->title ?: 'Contacto';
        $buttonText = $meta['button_text'] ?? 'Enviar mensaje';
    @endphp

    <main class="products-page contact-page @if ($product) contact-page--has-product @endif">
        @include('web.products.partials-header', ['current' => 'contacto'])

        <section class="products-shell contact-shell">
            <nav class="products-breadcrumb contact-breadcrumb" aria-label="Breadcrumb">
                <a href="{{ route('web.home') }}">Inicio</a>
                <span aria-hidden="true">&gt;</span>
                <span>Contacto</span>
            </nav>

            @if (session('status') || session('success'))
                <div
                    data-web-toast="{{ session('status') ?: session('success') }}"
                    data-web-toast-type="success"
                    hidden
                ></div>
            @endif

            @if ($errors->any())
                <div
                    data-web-toast="Revisá los campos marcados y volvé a enviar el mensaje."
                    data-web-toast-type="error"
                    hidden
                ></div>
                <div class="contact-alert contact-alert--error" role="alert">
                    Revisá los campos marcados y volvé a enviar el mensaje.
                </div>
            @endif

            @if ($product)
                <section class="contact-product" aria-label="Producto consultado">
                    <div class="contact-product__head">
                        <span>Familia</span>
                        <span>Código</span>
                        <span>Descripción</span>
                        <span>Tipo</span>
                    </div>
                    <div class="contact-product__row">
                        <img src="{{ media_asset_url($product->mainMedia) ?: asset('images/placeholder-equipment.svg') }}" alt="{{ $product->name }}">
                        <span>{{ $product->family?->name ?: '-' }}</span>
                        <span>{{ $product->sku ?: '-' }}</span>
                        <span>{{ $product->name }}</span>
                        <span>{{ $product->brand ?: 'Importado' }}</span>
                    </div>
                </section>
            @endif

            <section class="contact-consult" aria-labelledby="contact-form-title">
                <address class="contact-details">
                    @foreach ($visibleContactItems as $contactItem)
                        @php
                            $type = $contactItem->type ?? 'phone';
                            $value = $contactItem->value ?? '';
                            $href = match ($type) {
                                'address' => $mapLink,
                                'email' => 'mailto:'.$value,
                                default => 'tel:'.preg_replace('/\D+/', '', $value),
                            };
                        @endphp
                        <a class="contact-details__item" href="{{ $href }}" @if ($type === 'address') target="_blank" rel="noopener noreferrer" @endif>
                            <span class="contact-info-card__icon" aria-hidden="true">
                                @if ($type === 'address')
                                    <svg viewBox="0 0 20 20" width="20" height="20" fill="none"><path d="M16.7 8.3C16.7 13.3 10 18.3 10 18.3S3.3 13.3 3.3 8.3a6.7 6.7 0 1 1 13.4 0Z" stroke="currentColor" stroke-width="2"/><path d="M10 10.8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" stroke-width="2"/></svg>
                                @elseif ($type === 'email')
                                    <svg viewBox="0 0 20 20" width="20" height="20" fill="none"><path d="m18.3 5.8-7.4 4.8a1.7 1.7 0 0 1-1.8 0L1.7 5.8M3.3 3.3h13.4c.9 0 1.6.8 1.6 1.7v10c0 .9-.7 1.7-1.6 1.7H3.3c-.9 0-1.6-.8-1.6-1.7V5c0-.9.7-1.7 1.6-1.7Z" stroke="currentColor" stroke-width="2"/></svg>
                                @else
                                    <svg viewBox="0 0 18 18" width="18" height="18" fill="none"><path d="M17 12.5c-1.2 0-2.5-.2-3.6-.6h-.3c-.3 0-.5.1-.7.3l-2.2 2.2A15 15 0 0 1 3.6 7.8l2.2-2.2c.3-.3.4-.7.2-1C5.7 3.5 5.5 2.2 5.5 1c0-.5-.5-1-1-1H1C.5 0 0 .5 0 1c0 9.4 7.6 17 17 17 .5 0 1-.5 1-1v-3.5c0-.5-.5-1-1-1Z" fill="currentColor"/></svg>
                                @endif
                            </span>
                            <span>{{ $value }}</span>
                        </a>
                    @endforeach
                </address>

                <form class="contact-form" action="{{ route('web.contact.store') }}" method="POST">
                    @csrf
                    <input class="nm-honeypot-field" type="text" name="{{ config('security.forms.honeypot_field', 'website') }}" value="" tabindex="-1" autocomplete="off" aria-hidden="true">
                    <input type="hidden" name="_form_started_at" value="{{ time() }}">
                    @if ($product)
                        <input type="hidden" name="product_slug" value="{{ $product->slug }}">
                    @endif

                    <h1 id="contact-form-title" class="sr-only">{{ $formTitle }}</h1>

                    <div class="contact-form__field">
                        <label for="first_name">{{ $meta['first_name_label'] ?? 'Nombre*' }}</label>
                        <input id="first_name" name="first_name" type="text" value="{{ old('first_name') }}" autocomplete="given-name" required>
                        @error('first_name') <span>{{ $message }}</span> @enderror
                    </div>

                    <div class="contact-form__field">
                        <label for="last_name">{{ $meta['last_name_label'] ?? 'Apellido*' }}</label>
                        <input id="last_name" name="last_name" type="text" value="{{ old('last_name') }}" autocomplete="family-name" required>
                        @error('last_name') <span>{{ $message }}</span> @enderror
                    </div>

                    <div class="contact-form__field">
                        <label for="email">{{ $meta['email_label'] ?? 'Email*' }}</label>
                        <input id="email" name="email" type="email" value="{{ old('email') }}" autocomplete="email" required>
                        @error('email') <span>{{ $message }}</span> @enderror
                    </div>

                    <div class="contact-form__field">
                        <label for="phone">{{ $meta['phone_label'] ?? 'Celular' }}</label>
                        <input id="phone" name="phone" type="tel" value="{{ old('phone') }}" autocomplete="tel">
                        @error('phone') <span>{{ $message }}</span> @enderror
                    </div>

                    <div class="contact-form__field contact-form__field--message">
                        <label for="message">{{ $meta['message_label'] ?? 'Mensaje' }}</label>
                        <textarea id="message" name="message" rows="6">{{ old('message') }}</textarea>
                        @error('message') <span>{{ $message }}</span> @enderror
                    </div>

                    <div class="contact-form__actions">
                        <button type="submit">{{ $buttonText }}</button>
                    </div>
                </form>
            </section>

            <section class="contact-map" aria-label="Mapa de ubicación">
                @if ($mapIframe)
                    {!! $mapIframe !!}
                @else
                    <iframe
                        src="{{ $mapSrc }}"
                        title="Ubicación de Nicolais Mario e Hijo"
                        loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"
                        allowfullscreen
                    ></iframe>
                @endif
            </section>
        </section>
    </main>
@endsection

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
                        <img src="{{ media_asset_url($product->mainMedia) ?: media_asset_url($product->brandLogoMedia) ?: asset('images/placeholder-equipment.svg') }}" alt="{{ $product->name }}">
                        <span class="contact-product__family">{{ $product->family?->name ?: '-' }}</span>
                        <span class="contact-product__code">{{ $product->sku ?: '-' }}</span>
                        <span class="contact-product__description">{{ $product->name }}</span>
                        <span class="contact-product__type">{{ $product->brand ?: 'Importado' }}</span>
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
                                'whatsapp' => 'https://wa.me/'.preg_replace('/\D+/', '', $value),
                                default => 'tel:'.preg_replace('/\D+/', '', $value),
                            };
                        @endphp
                        <a class="contact-details__item" href="{{ $href }}" @if (in_array($type, ['address', 'whatsapp'], true)) target="_blank" rel="noopener noreferrer" @endif>
                            <span class="contact-info-card__icon @if ($type === 'whatsapp') contact-info-card__icon--whatsapp @endif" aria-hidden="true">
                                @if ($type === 'address')
                                    <svg viewBox="0 0 20 20" width="20" height="20" fill="none"><path d="M16.7 8.3C16.7 13.3 10 18.3 10 18.3S3.3 13.3 3.3 8.3a6.7 6.7 0 1 1 13.4 0Z" stroke="currentColor" stroke-width="2"/><path d="M10 10.8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" stroke-width="2"/></svg>
                                @elseif ($type === 'email')
                                    <svg viewBox="0 0 20 20" width="20" height="20" fill="none"><path d="m18.3 5.8-7.4 4.8a1.7 1.7 0 0 1-1.8 0L1.7 5.8M3.3 3.3h13.4c.9 0 1.6.8 1.6 1.7v10c0 .9-.7 1.7-1.6 1.7H3.3c-.9 0-1.6-.8-1.6-1.7V5c0-.9.7-1.7 1.6-1.7Z" stroke="currentColor" stroke-width="2"/></svg>
                                @elseif ($type === 'whatsapp')
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.5823 11.985C14.3328 11.8608 13.1095 11.2625 12.8817 11.1792C12.6539 11.0967 12.4881 11.0558 12.3215 11.3042C12.1557 11.5508 11.6793 12.1092 11.5344 12.2742C11.3887 12.44 11.2438 12.46 10.9952 12.3367C10.7465 12.2117 9.94429 11.9508 8.99391 11.1075C8.25453 10.4509 7.75464 9.64002 7.60978 9.39169C7.46492 9.14419 7.59387 9.01002 7.71863 8.88669C7.83084 8.77585 7.96732 8.59752 8.09209 8.45335C8.21685 8.30835 8.25788 8.20502 8.34078 8.03919C8.42451 7.87419 8.38265 7.73002 8.31985 7.60585C8.25788 7.48169 7.7605 6.26252 7.55284 5.76669C7.35104 5.28419 7.14589 5.35003 6.99349 5.34169C6.8478 5.33503 6.682 5.33336 6.51621 5.33336C6.35041 5.33336 6.08079 5.39503 5.85303 5.64336C5.62444 5.89086 4.98219 6.49002 4.98219 7.70919C4.98219 8.92752 5.87313 10.105 5.99789 10.2709C6.12266 10.4359 7.75213 12.9375 10.2482 14.01C10.8428 14.265 11.3058 14.4175 11.6667 14.5308C12.2629 14.72 12.8055 14.6933 13.2342 14.6292C13.7115 14.5583 14.7063 14.03 14.9139 13.4517C15.1208 12.8733 15.1208 12.3775 15.0588 12.2742C14.9968 12.1708 14.831 12.1092 14.5815 11.985H14.5823ZM10.0423 18.1542H10.0389C8.55634 18.1544 7.10099 17.7578 5.8254 17.0058L5.52396 16.8275L2.39062 17.6458L3.22712 14.6058L3.03035 14.2942C2.20149 12.9811 1.76286 11.4615 1.76512 9.91085C1.7668 5.36919 5.47958 1.6742 10.0456 1.6742C12.2562 1.6742 14.3345 2.53253 15.897 4.08919C16.6676 4.85301 17.2785 5.76133 17.6941 6.7616C18.1098 7.76188 18.322 8.83425 18.3186 9.91668C18.3169 14.4583 14.6041 18.1542 10.0423 18.1542ZM17.086 2.9067C16.1634 1.98247 15.0657 1.24965 13.8564 0.7507C12.6472 0.251754 11.3505 -0.00339687 10.0414 3.41479e-05C4.55347 3.41479e-05 0.0854091 4.44586 0.0837344 9.91002C0.0811914 11.649 0.539563 13.3578 1.4126 14.8642L0 20L5.27861 18.6217C6.73884 19.4134 8.37519 19.8283 10.0381 19.8283H10.0423C15.5302 19.8283 19.9983 15.3825 20 9.91752C20.004 8.61525 19.7485 7.32511 19.2484 6.12172C18.7482 4.91833 18.0132 3.82559 17.086 2.9067Z" fill="#0072BB"/></svg>
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

import { usePage } from '@inertiajs/react';
import { useState } from 'react';

const ADMIN_LOGO_PATH = '/storage/brand/logo.svg';

function getBrandInitials(name) {
    const initials = (name || 'Nicolais Mario e Hijo')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase();

    return initials || 'NM';
}

export default function GuestLayout({ children }) {
    const { app } = usePage().props;
    const brandName = app?.name ?? 'Nicolais Mario e Hijo';
    const [showLogo, setShowLogo] = useState(true);

    return (
        <div className="gs-auth">
            <div className="gs-auth__ambient" aria-hidden="true" />

            <div className="gs-auth__shell">
                <section className="gs-auth__brand">
                    <span className="gs-auth__eyebrow">Panel administrativo</span>

                    <div className="gs-auth__logo-shell">
                        {showLogo ? (
                            <img
                                src={ADMIN_LOGO_PATH}
                                alt={`Logo de ${brandName}`}
                                className="gs-auth__logo"
                                onError={() => setShowLogo(false)}
                            />
                        ) : (
                            <span className="gs-auth__logo-fallback">
                                {getBrandInitials(brandName)}
                            </span>
                        )}
                    </div>

                    <div className="gs-auth__brand-copy">
                        <h1 className="gs-auth__brand-title">{brandName}</h1>
                        <p className="gs-auth__brand-desc">
                            Acceso interno para gestionar productos, catálogos,
                            novedades y consultas comerciales.
                        </p>
                    </div>

                    <div className="gs-auth__brand-notes">
                        <div className="gs-auth__note">
                            <strong>Acceso ordenado</strong>
                            <span>
                                Entrá al panel y trabajá con foco, sin pantallas
                                recargadas.
                            </span>
                        </div>
                        <div className="gs-auth__note">
                            <strong>Imagen profesional</strong>
                            <span>
                                La experiencia acompaña la marca desde el primer
                                segundo.
                            </span>
                        </div>
                        <div className="gs-auth__note">
                            <strong>Listo para móvil</strong>
                            <span>
                                Funciona bien en notebook, tablet y teléfono.
                            </span>
                        </div>
                    </div>
                </section>

                <section className="gs-auth__form-panel">
                    <div className="gs-auth__form-box">{children}</div>
                </section>
            </div>
        </div>
    );
}

import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import { useState } from 'react';

export default function Login({ status, canResetPassword }) {
    const { app } = usePage().props;
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Acceso administrador" />

            <div className="gs-auth__form-header">
                <span className="gs-auth__form-kicker">Acceso seguro</span>
                <h2 className="gs-auth__form-title">
                    Ingresá al panel de administración
                </h2>
                <p className="gs-auth__form-desc">
                    Usá tus credenciales para entrar al espacio de gestión de{' '}
                    {app?.name ?? 'Nicolais Mario e Hijo'}.
                </p>
            </div>

            {status && <div className="gs-auth__status">{status}</div>}

            <form className="gs-auth__form" onSubmit={submit}>
                <div className="gs-auth__field">
                    <label className="gs-auth__label" htmlFor="email">
                        Correo electrónico
                    </label>
                    <div className="gs-auth__input-shell">
                        <span className="gs-auth__input-icon" aria-hidden="true">
                            <Icon icon="solar:letter-outline" width={18} />
                        </span>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="gs-auth__input"
                            autoComplete="username"
                            autoFocus
                            placeholder="nombre@empresa.com"
                            onChange={(event) =>
                                setData('email', event.target.value)
                            }
                        />
                    </div>
                    <InputError message={errors.email} className="gs-auth__error" />
                </div>

                <div className="gs-auth__field">
                    <label className="gs-auth__label" htmlFor="password">
                        Contraseña
                    </label>
                    <div className="gs-auth__input-shell">
                        <span className="gs-auth__input-icon" aria-hidden="true">
                            <Icon icon="solar:lock-password-outline" width={18} />
                        </span>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            className="gs-auth__input gs-auth__input--with-action"
                            autoComplete="current-password"
                            placeholder="Ingresá tu contraseña"
                            onChange={(event) =>
                                setData('password', event.target.value)
                            }
                        />
                        <button
                            type="button"
                            className="gs-auth__password-toggle"
                            onClick={() => setShowPassword((value) => !value)}
                        >
                            {showPassword ? 'Ocultar' : 'Ver'}
                        </button>
                    </div>
                    <InputError
                        message={errors.password}
                        className="gs-auth__error"
                    />
                </div>

                <div className="gs-auth__form-row">
                    <label className="gs-auth__check">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(event) =>
                                setData('remember', event.target.checked)
                            }
                        />
                        <span>Recordarme en este equipo</span>
                    </label>

                    {canResetPassword && (
                        <Link
                            className="gs-auth__helper-link"
                            href={route('password.request')}
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    )}
                </div>

                <button
                    type="submit"
                    className="gs-auth__submit"
                    disabled={processing}
                >
                    {processing ? 'Ingresando...' : 'Ingresar al panel'}
                </button>
            </form>

            <p className="gs-auth__support-copy">
                Si no podés ingresar, pedile a la persona administradora que
                revise tu acceso.
            </p>
        </GuestLayout>
    );
}

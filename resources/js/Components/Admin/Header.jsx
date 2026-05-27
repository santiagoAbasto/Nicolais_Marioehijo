import { usePage, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import * as Switch from "@radix-ui/react-switch";

function ThemeSwitch({ dark, onThemeChange }) {
    return (
        <div className={`flex items-center gap-2 rounded-[22px] border px-2.5 py-2 ${dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
            <Icon icon="solar:sun-2-outline" width={16} className={dark ? "text-slate-500" : "text-amber-500"} />
            <Switch.Root
                checked={dark}
                onCheckedChange={(checked) => onThemeChange?.(checked ? "dark" : "light")}
                aria-label="Cambiar tema del panel"
                className={`relative h-[30px] w-[54px] rounded-full border p-0.5 outline-none transition duration-300 data-[state=checked]:bg-[#111827] data-[state=unchecked]:bg-white ${dark ? "border-white/15 shadow-[0_0_28px_rgba(77,235,255,.18)]" : "border-slate-200 shadow-inner"}`}
            >
                <Switch.Thumb
                    className={`block h-6 w-6 rounded-full bg-white shadow-[0_5px_16px_rgba(15,23,42,.22)] transition-transform duration-300 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0 ${dark ? "shadow-[0_0_18px_rgba(77,235,255,.45)]" : ""}`}
                />
            </Switch.Root>
            <Icon icon="solar:moon-stars-outline" width={16} className={dark ? "text-cyan-200" : "text-slate-400"} />
        </div>
    );
}

export default function Header({ onToggleSidebar, dark = false, showThemeSwitch = false, onThemeChange }) {
    const { auth, app } = usePage().props;
    const user = auth?.user;
    const userInitial = user?.name?.charAt(0)?.toUpperCase?.() || "A";

    return (
        <header className={`flex min-h-16 items-center justify-between border-b px-5 md:px-8 ${dark ? "border-white/10 bg-[#050A16]/95 text-white shadow-[0_18px_70px_rgba(0,0,0,.28)] backdrop-blur-xl" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition hover:border-[#25A7CA] hover:text-[#25A7CA] md:hidden ${dark ? "border-white/10 bg-white/5 text-slate-300" : "border-slate-200 text-slate-500"}`}
                    aria-label="Abrir menú"
                >
                    <Icon icon="solar:hamburger-menu-outline" width={20} />
                </button>

                <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${dark ? "text-cyan-100/60" : "text-slate-400"}`}>Administración</p>
                    <h2 className={`text-base font-semibold md:text-lg ${dark ? "text-white" : "text-slate-900"}`}>{app?.name ?? "Nicolais Mario e Hijo"}</h2>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
                {showThemeSwitch ? (
                    <ThemeSwitch dark={dark} onThemeChange={onThemeChange} />
                ) : null}

                <button
                    onClick={() => router.visit("/admin/dashboard")}
                    className={`relative flex rounded-2xl border p-3 transition hover:border-[#25A7CA] hover:text-[#25A7CA] ${dark ? "border-white/10 bg-white/5 text-cyan-100 shadow-[0_0_30px_rgba(77,235,255,.08)]" : "border-slate-200 text-slate-500"}`}
                    title="Dashboard"
                >
                    <Icon icon="solar:widget-2-outline" width={18} />
                </button>

                <div className="flex items-center gap-3">
                    {user?.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={user.name || "Usuario"}
                            className="h-9 w-9 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25A7CA] text-sm font-semibold text-white">
                            {userInitial}
                        </div>
                    )}
                    <div className="hidden min-w-0 sm:block">
                        <p className={`truncate text-sm ${dark ? "text-white" : "text-slate-700"}`}>{user?.name}</p>
                        <p className={`truncate text-xs ${dark ? "text-slate-400" : "text-slate-400"}`}>{user?.email}</p>
                    </div>
                    <button
                        onClick={() => router.post("/admin/logout")}
                        className={`hidden text-sm hover:text-red-400 sm:block ${dark ? "text-red-300" : "text-red-500"}`}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </header>
    );
}

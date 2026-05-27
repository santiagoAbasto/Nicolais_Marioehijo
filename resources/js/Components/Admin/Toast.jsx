import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { consumePendingAdminToast } from "@/lib/adminToast";

export default function Toast({ flash }) {
    const [toast, setToast] = useState(null);
    const timeoutRef = useRef(null);

    const showToast = (payload) => {
        if (!payload?.message) return;

        window.clearTimeout(timeoutRef.current);
        setToast({
            id: payload.id ?? Date.now(),
            message: payload.message,
            type: payload.type ?? "info",
            visible: true,
        });

        timeoutRef.current = window.setTimeout(() => {
            setToast((current) => (current ? { ...current, visible: false } : null));
        }, 3200);
    };

    useEffect(() => {
        const pending = consumePendingAdminToast();

        if (pending) {
            showToast(pending);
        }

        const handleToast = (event) => showToast(event.detail);
        window.addEventListener("admin-toast", handleToast);

        return () => {
            window.removeEventListener("admin-toast", handleToast);
            window.clearTimeout(timeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (flash?.success) {
            showToast({ message: flash.success, type: "success" });
            return;
        }

        if (flash?.error) {
            showToast({ message: flash.error, type: "error" });
            return;
        }

        if (flash?.info) {
            showToast({ message: flash.info, type: "info" });
        }
    }, [flash?.success, flash?.error, flash?.info]);

    useEffect(() => {
        if (!toast || toast.visible) return;

        const removeTimer = window.setTimeout(() => setToast(null), 260);
        return () => window.clearTimeout(removeTimer);
    }, [toast]);

    if (!toast) return null;

    const theme = {
        success: {
            shell: "border-emerald-200/80 bg-white/88 text-slate-900",
            icon: "bg-emerald-500 text-white",
            glyph: "solar:check-circle-bold",
        },
        error: {
            shell: "border-red-200/80 bg-white/88 text-slate-900",
            icon: "bg-red-500 text-white",
            glyph: "solar:close-circle-bold",
        },
        info: {
            shell: "border-sky-200/80 bg-white/88 text-slate-900",
            icon: "bg-[#25A7CA] text-white",
            glyph: "solar:info-circle-bold",
        },
    };

    const currentTheme = theme[toast.type] ?? theme.info;

    return (
        <div
            className={`pointer-events-none fixed right-5 top-5 z-[90] transition-all duration-300 md:right-8 md:top-8 ${
                toast.visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
            }`}
        >
            <div
                className={`pointer-events-auto relative flex min-w-[320px] max-w-[420px] items-center gap-3 rounded-[28px] border bg-white px-4 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.16)] before:absolute before:inset-[-3px] before:-z-10 before:rounded-[31px] before:border-[3px] before:border-transparent before:bg-[linear-gradient(#fff,#fff)_padding-box,linear-gradient(135deg,rgba(37,167,202,0.18),rgba(37,167,202,0.9),rgba(255,255,255,0.85),rgba(37,167,202,0.5))_border-box] before:shadow-[0_0_18px_rgba(37,167,202,0.28)] before:animate-[adminToastBorderPulse_2.35s_ease-in-out_infinite] after:absolute after:inset-[-16px] after:-z-20 after:rounded-[38px] after:bg-[radial-gradient(circle,rgba(37,167,202,0.22)_0%,rgba(37,167,202,0.11)_42%,rgba(37,167,202,0)_72%)] after:blur-xl after:animate-[adminToastRingPulse_2.35s_ease-in-out_infinite] ${currentTheme.shell}`}
            >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${currentTheme.icon}`}>
                    <Icon icon={currentTheme.glyph} width={20} />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Panel Admin</p>
                    <p className="mt-1 text-sm font-medium leading-5 text-slate-800">{toast.message}</p>
                </div>

                <button
                    type="button"
                    onClick={() => setToast((current) => (current ? { ...current, visible: false } : null))}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                    aria-label="Cerrar notificación"
                >
                    <Icon icon="solar:close-circle-outline" width={18} />
                </button>
            </div>
        </div>
    );
}

import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState } from "react";

function Field({ label, hint = null, children }) {
    return (
        <div className="block space-y-2">
            <div>
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
            </div>
            {children}
        </div>
    );
}

export default function WhatsAppIndex({ whatsappNumber: initialNumber }) {
    const [number, setNumber] = useState(initialNumber ?? "");
    const [saving, setSaving] = useState(false);

    const previewUrl = number ? `https://wa.me/${String(number).replace(/\D+/g, "")}` : "";

    useEffect(() => {
        setNumber(initialNumber ?? "");
    }, [initialNumber]);

    const save = async () => {
        setSaving(true);

        try {
            await axios.put("/admin/api/footer-settings/whatsapp", {
                whatsapp_number: number || null,
            });

            emitAdminToast("El número de WhatsApp flotante se actualizó correctamente.");
            router.reload();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar el número de WhatsApp.",
                "error",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="WhatsApp flotante" />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.16),_transparent_34%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_44%,#eef7fb_100%)] px-6 py-8 md:px-8">
                        <div className="max-w-3xl">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                <Icon icon="solar:phone-calling-rounded-outline" width={14} />
                                Extras / WhatsApp flotante
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                WhatsApp flotante
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                Configurá solamente el link del botón flotante que aparece en toda la web pública.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="max-w-xl space-y-5">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900">
                                Número de WhatsApp
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Ingresá el número con código de país y sin el signo <code className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700">+</code>. El sistema genera automáticamente el link público.
                            </p>
                        </div>

                        <Field
                            label="Número"
                            hint="Ejemplo: 5491112345678"
                        >
                            <div className="relative">
                                <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                                    <Icon icon="solar:phone-calling-rounded-outline" width={18} />
                                </span>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    placeholder="5491112345678"
                                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </div>
                        </Field>

                        <Field
                            label="Link generado"
                            hint="Este es el link que usa el WhatsApp flotante en la web pública."
                        >
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                {previewUrl || "Sin configurar"}
                            </div>
                        </Field>

                        {previewUrl ? (
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                            >
                                <Icon icon="solar:square-arrow-right-up-outline" width={16} />
                                Probar WhatsApp
                            </a>
                        ) : null}

                        <div className="flex justify-end border-t border-slate-200 pt-5">
                            <button
                                type="button"
                                onClick={save}
                                disabled={saving}
                                className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                            >
                                {saving ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

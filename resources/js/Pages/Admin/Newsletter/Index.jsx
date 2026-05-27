import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";

function StatCard({ label, value, icon }) {
    return (
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]">
                    <Icon icon={icon} width={22} />
                </div>
            </div>
        </article>
    );
}

function StatusBadge({ active }) {
    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}>
            {active ? "Activo" : "Inactivo"}
        </span>
    );
}

function sourceLabel(source) {
    if (source === "mail_header") return "Se desuscribió desde Gmail/mail";
    if (source === "mail_link") return "Se desuscribió desde el email";
    if (source === "admin") return "Baja desde admin";
    return "-";
}

function Field({ label, required = false, children }) {
    return (
        <label className="block space-y-2">
            <p className="text-sm font-semibold text-slate-900">
                {label} {required ? <span className="text-rose-500">*</span> : null}
            </p>
            {children}
        </label>
    );
}

export default function NewsletterIndex({
    subscribers: initialSubscribers,
    campaigns: initialCampaigns,
    stats,
}) {
    const [subscribers, setSubscribers] = useState(initialSubscribers ?? []);
    const [campaigns, setCampaigns] = useState(initialCampaigns ?? []);
    const [showCampaign, setShowCampaign] = useState(true);
    const [sending, setSending] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [newEmail, setNewEmail] = useState("");
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({
        subject: "",
        title: "",
        description: "",
        body: "",
        image: null,
    });

    useEffect(() => {
        setSubscribers(initialSubscribers ?? []);
        setCampaigns(initialCampaigns ?? []);
    }, [initialSubscribers, initialCampaigns]);

    const activeCount = stats?.active ?? subscribers.filter((s) => s.is_active).length;
    const inactiveCount = stats?.inactive ?? subscribers.filter((s) => !s.is_active).length;
    const mailUnsubscribed = stats?.mail_unsubscribed
        ?? subscribers.filter((s) => s.unsubscribe_source === "mail_header").length;

    const imagePreview = useMemo(() => {
        if (!form.image) return null;
        return URL.createObjectURL(form.image);
    }, [form.image]);

    const reloadPage = () => {
        router.reload({
            preserveScroll: true,
            onSuccess: (page) => {
                setSubscribers(page.props.subscribers ?? []);
                setCampaigns(page.props.campaigns ?? []);
            },
        });
    };

    const addSubscriber = async () => {
        if (!newEmail.trim()) {
            emitAdminToast("Ingresá un email para dar de alta.", "error");
            return;
        }

        setAdding(true);

        try {
            const response = await axios.post("/admin/api/newsletter-subscribers", {
                email: newEmail,
            });

            emitAdminToast(response.data?.message ?? "Suscriptor agregado.");
            setNewEmail("");
            reloadPage();
        } catch (error) {
            emitAdminToast(error?.response?.data?.message || "No se pudo agregar el suscriptor.", "error");
        } finally {
            setAdding(false);
        }
    };

    const sendCampaign = async () => {
        if (!form.subject.trim() || !form.body.trim()) {
            emitAdminToast("Completá asunto y cuerpo del email.", "error");
            return;
        }

        const payload = new FormData();
        payload.append("subject", form.subject);
        payload.append("title", form.title);
        payload.append("description", form.description);
        payload.append("body", form.body);

        if (form.image) {
            payload.append("image", form.image);
        }

        setSending(true);

        try {
            const response = await axios.post("/admin/api/newsletter/send", payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            emitAdminToast(response.data?.message ?? "Campaña enviada correctamente.");
            setForm({ subject: "", title: "", description: "", body: "", image: null });
            reloadPage();
        } catch (error) {
            emitAdminToast(error?.response?.data?.message || "No se pudo enviar la campaña.", "error");
        } finally {
            setSending(false);
        }
    };

    const toggleActive = async (item) => {
        setBusyId(item.id);

        try {
            await axios.put(`/admin/api/newsletter-subscribers/${item.id}`, {
                email: item.email,
                is_active: !item.is_active,
            });

            emitAdminToast(item.is_active ? "Suscriptor dado de baja." : "Suscriptor reactivado.");
            reloadPage();
        } catch (error) {
            emitAdminToast(error?.response?.data?.message || "No se pudo actualizar el suscriptor.", "error");
        } finally {
            setBusyId(null);
        }
    };

    const deleteSubscriber = async (item) => {
        if (!window.confirm(`¿Eliminar el suscriptor "${item.email}"?`)) return;

        setBusyId(item.id);

        try {
            await axios.delete(`/admin/api/newsletter-subscribers/${item.id}`);
            emitAdminToast("Suscriptor eliminado.");
            reloadPage();
        } catch (error) {
            emitAdminToast(error?.response?.data?.message || "No se pudo eliminar el suscriptor.", "error");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <AdminLayout>
            <Head title="Newsletter" />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.16),_transparent_34%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_44%,#eef7fb_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    <Icon icon="solar:letter-unread-outline" width={14} />
                                    Newsletter
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Campañas y suscriptores
                                </h1>
                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    Envíos listos para producción con SMTP configurado por `.env`, Mailtrap en local y baja automática desde email.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowCampaign((value) => !value)}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25A7CA] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                            >
                                <Icon icon="solar:plain-2-outline" width={18} />
                                {showCampaign ? "Ocultar editor" : "Crear campaña"}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    <StatCard label="Totales" value={stats?.total ?? subscribers.length} icon="solar:users-group-rounded-outline" />
                    <StatCard label="Activos" value={activeCount} icon="solar:letter-outline" />
                    <StatCard label="Inactivos" value={inactiveCount} icon="solar:user-cross-outline" />
                    <StatCard label="Baja desde mail" value={mailUnsubscribed} icon="solar:mailbox-outline" />
                </section>

                {showCampaign ? (
                    <section className="grid gap-6 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm xl:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Icon icon="solar:magic-stick-3-outline" className="text-[#25A7CA]" width={20} />
                                <h2 className="text-lg font-semibold text-slate-900">Crear email novedoso</h2>
                            </div>

                            <Field label="Asunto completo" required>
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                                    placeholder="Ej: Nuevos repuestos disponibles para sistemas de transmisión"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Título visual">
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                        placeholder="Novedades técnicas Nicolais"
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    />
                                </Field>

                                <Field label="Imagen destacada">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => setForm((current) => ({ ...current, image: event.target.files?.[0] ?? null }))}
                                        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-[#25A7CA] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                                    />
                                </Field>
                            </div>

                            <Field label="Descripción">
                                <textarea
                                    value={form.description}
                                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                                    rows={3}
                                    placeholder="Una bajada breve para abrir el email..."
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>

                            <Field label="Texto del email" required>
                                <textarea
                                    value={form.body}
                                    onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                                    rows={8}
                                    placeholder="Escribí el contenido completo del newsletter..."
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>

                            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
                                <p className="flex items-center gap-2 text-xs text-slate-500">
                                    <Icon icon="solar:shield-check-outline" className="text-emerald-500" width={16} />
                                    Incluye link y header de desuscripción compatible con Gmail.
                                </p>
                                <button
                                    type="button"
                                    onClick={sendCampaign}
                                    disabled={sending || activeCount === 0}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                >
                                    <Icon icon="solar:plain-2-outline" width={16} />
                                    {sending ? "Enviando..." : `Enviar a ${activeCount} activos`}
                                </button>
                            </div>
                        </div>

                        <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Vista rápida</p>
                            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                                <div className="bg-[#0072BB] p-5 text-white">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">Nicolais Mario e Hijo</p>
                                    <p className="mt-2 text-lg font-semibold leading-tight">{form.subject || "Asunto del newsletter"}</p>
                                </div>
                                {imagePreview ? <img src={imagePreview} alt="" className="h-40 w-full object-cover" /> : null}
                                <div className="p-5">
                                    <h3 className="text-base font-semibold text-slate-900">{form.title || "Título visual"}</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">{form.description || "Descripción breve del contenido."}</p>
                                    <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">{form.body || "Texto del email..."}</p>
                                </div>
                            </div>
                        </aside>
                    </section>
                ) : null}

                <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <Field label="Alta manual de suscriptor">
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(event) => setNewEmail(event.target.value)}
                                placeholder="cliente@empresa.com"
                                className="w-full min-w-[280px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                        </Field>
                        <button
                            type="button"
                            onClick={addSubscriber}
                            disabled={adding}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#25A7CA] bg-[#25A7CA]/10 px-5 py-3 text-sm font-semibold text-[#117a98] transition hover:bg-[#25A7CA]/15 disabled:opacity-60"
                        >
                            <Icon icon="solar:user-plus-outline" width={16} />
                            {adding ? "Agregando..." : "Dar de alta"}
                        </button>
                    </div>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-5">
                        <h2 className="text-lg font-semibold text-slate-900">Suscriptores</h2>
                    </div>
                    {subscribers.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        {["Email", "Estado", "Suscripción", "Baja", "Origen baja", "Último envío", "Acciones"].map((head) => (
                                            <th key={head} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                {head}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {subscribers.map((item) => (
                                        <tr key={item.id} className="transition hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{item.email}</td>
                                            <td className="px-6 py-4"><StatusBadge active={item.is_active} /></td>
                                            <td className="px-6 py-4 text-slate-600">{item.subscribed_at ?? "-"}</td>
                                            <td className="px-6 py-4 text-slate-600">{item.unsubscribed_at ?? "-"}</td>
                                            <td className="px-6 py-4 text-slate-600">{sourceLabel(item.unsubscribe_source)}</td>
                                            <td className="px-6 py-4 text-slate-600">{item.last_sent_at ?? "-"}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        title={item.is_active ? "Dar de baja" : "Reactivar"}
                                                        onClick={() => toggleActive(item)}
                                                        disabled={busyId === item.id}
                                                        className={`flex h-9 w-9 items-center justify-center rounded-2xl border transition disabled:opacity-60 ${
                                                            item.is_active
                                                                ? "border-amber-200 bg-white text-amber-500 hover:bg-amber-50"
                                                                : "border-emerald-200 bg-white text-emerald-500 hover:bg-emerald-50"
                                                        }`}
                                                    >
                                                        <Icon icon={item.is_active ? "solar:user-cross-outline" : "solar:user-check-outline"} width={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Eliminar"
                                                        onClick={() => deleteSubscriber(item)}
                                                        disabled={busyId === item.id}
                                                        className="flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-500 transition hover:bg-rose-50 disabled:opacity-60"
                                                    >
                                                        <Icon icon="solar:trash-bin-trash-outline" width={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <Icon icon="solar:letter-outline" width={24} />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-slate-900">Todavía no hay suscriptores</h3>
                            <p className="mt-2 text-sm text-slate-500">Cuando alguien se suscriba desde la web, aparecerá acá.</p>
                        </div>
                    )}
                </section>

                {campaigns.length ? (
                    <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <h2 className="text-lg font-semibold text-slate-900">Últimos envíos</h2>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {campaigns.map((campaign) => (
                                <article key={campaign.id} className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-900">{campaign.subject}</p>
                                        <p className="mt-1 text-xs text-slate-500">{campaign.sent_at ?? "-"}</p>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        {campaign.sent_count}/{campaign.recipient_count} enviados · {campaign.failed_count} fallidos
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>
                ) : null}
            </div>
        </AdminLayout>
    );
}

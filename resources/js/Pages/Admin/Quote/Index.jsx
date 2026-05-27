import PublicPreviewModal from "@/Components/Admin/PublicPreviewModal";
import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState } from "react";

const FIELD_DEFINITIONS = [
    { key: "name_label", label: "Etiqueta nombre", defaultValue: "Nombre y Apellido*", sortOrder: "A" },
    { key: "email_label", label: "Etiqueta email", defaultValue: "Email*", sortOrder: "B" },
    { key: "country_label", label: "Etiqueta país", defaultValue: "País*", sortOrder: "C" },
    { key: "phone_label", label: "Etiqueta teléfono", defaultValue: "Teléfono*", sortOrder: "D" },
    { key: "company_label", label: "Etiqueta empresa", defaultValue: "Empresa*", sortOrder: "E" },
    { key: "material_label", label: "Etiqueta material", defaultValue: "Material*", sortOrder: "F" },
    { key: "shape_label", label: "Etiqueta forma", defaultValue: "Forma*", sortOrder: "G" },
    { key: "dimensions_label", label: "Etiqueta dimensiones", defaultValue: "Dimensiones*", sortOrder: "H" },
    { key: "quantity_label", label: "Etiqueta cantidad", defaultValue: "Cantidad*", sortOrder: "I" },
    { key: "message_label", label: "Etiqueta observaciones", defaultValue: "Aclaraciones / Observaciones*", sortOrder: "J" },
    { key: "attachment_label", label: "Etiqueta adjunto", defaultValue: "Archivo adjunto*", sortOrder: "K" },
    { key: "required_legend", label: "Leyenda obligatorios", defaultValue: "*Campos obligatorios", sortOrder: "L" },
    { key: "button_text", label: "Texto botón", defaultValue: "Solicitar presupuesto", sortOrder: "M" },
];

function emptyHeroForm(hero) {
    return {
        id: hero?.id ?? null,
        title: hero?.title ?? "",
        media_id: hero?.media_id ?? null,
        media_url: hero?.media_url ?? "",
        image_file: null,
        sort_order: hero?.sort_order ?? "A",
        is_active: hero?.is_active ?? true,
    };
}

function emptyContentForm(content) {
    const fields = Object.fromEntries(
        FIELD_DEFINITIONS.map((field) => {
            const current = (content?.fields ?? []).find((item) => item.field_key === field.key);

            return [
                field.key,
                {
                    id: current?.id ?? null,
                    field_key: field.key,
                    field_label: current?.field_label ?? field.label,
                    field_type: current?.field_type ?? "text",
                    field_value: current?.field_value ?? field.defaultValue,
                    sort_order: current?.sort_order ?? field.sortOrder,
                    is_active: current?.is_active ?? true,
                },
            ];
        }),
    );

    return {
        id: content?.id ?? null,
        title: content?.title ?? "Datos de contacto",
        subtitle: content?.subtitle ?? "Consulta",
        sort_order: content?.sort_order ?? "B",
        is_active: content?.is_active ?? true,
        fields,
    };
}

function emptySettingsForm(settings) {
    return {
        id: settings?.id ?? null,
        notification_email_primary: settings?.notification_email_primary ?? "",
        notification_email_secondary: settings?.notification_email_secondary ?? "",
        map_iframe: settings?.map_iframe ?? "",
    };
}

async function uploadAsset(file, title) {
    const payload = new FormData();
    payload.append("file", file);
    payload.append("title", title || file.name);

    const response = await axios.post("/admin/api/media-assets", payload, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
}

function TabButton({ active, icon, label, onClick, badge = null }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                active
                    ? "border-[#25A7CA] bg-[#25A7CA]/10 text-[#117a98]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
        >
            <Icon icon={icon} width={18} />
            <span>{label}</span>
            {badge ? (
                <span className="rounded-full bg-[#25A7CA] px-2 py-0.5 text-[11px] font-semibold text-white">
                    {badge}
                </span>
            ) : null}
        </button>
    );
}

function StatCard({ label, value, icon }) {
    return (
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                        {value}
                    </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]">
                    <Icon icon={icon} width={22} />
                </div>
            </div>
        </article>
    );
}

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

function Toggle({ label, checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                checked
                    ? "border-[#25A7CA]/30 bg-[#25A7CA]/10 text-[#117a98]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
        >
            <span
                className={`flex h-6 w-10 items-center rounded-full p-1 transition ${
                    checked ? "bg-[#25A7CA]" : "bg-slate-300"
                }`}
            >
                <span
                    className={`h-4 w-4 rounded-full bg-white transition ${
                        checked ? "translate-x-4" : "translate-x-0"
                    }`}
                />
            </span>
            <span>{label}</span>
        </button>
    );
}

function basePathForTab(nextTab) {
    return nextTab === "requests" ? "/admin/presupuesto/consultas" : "/admin/presupuesto";
}

export default function QuoteIndex({
    hero,
    content,
    settings: initialSettings,
    requests: initialRequests,
    stats,
    initialTab,
    publicQuoteUrl,
}) {
    const [tab, setTab] = useState(initialTab || "page");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [heroForm, setHeroForm] = useState(emptyHeroForm(hero));
    const [contentForm, setContentForm] = useState(emptyContentForm(content));
    const [settingsForm, setSettingsForm] = useState(emptySettingsForm(initialSettings));
    const [heroSaving, setHeroSaving] = useState(false);
    const [contentSaving, setContentSaving] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [requests, setRequests] = useState(initialRequests ?? []);
    const [requestBusyId, setRequestBusyId] = useState(null);

    useEffect(() => {
        setTab(initialTab || "page");
    }, [initialTab]);

    useEffect(() => {
        setHeroForm(emptyHeroForm(hero));
    }, [hero]);

    useEffect(() => {
        setContentForm(emptyContentForm(content));
    }, [content]);

    useEffect(() => {
        setSettingsForm(emptySettingsForm(initialSettings));
    }, [initialSettings]);

    useEffect(() => {
        setRequests(initialRequests ?? []);
    }, [initialRequests]);

    const visitTab = (nextTab) => {
        setTab(nextTab);
        router.visit(basePathForTab(nextTab), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const reloadPage = () => {
        router.reload({
            onSuccess: (page) => {
                setHeroForm(emptyHeroForm(page.props.hero));
                setContentForm(emptyContentForm(page.props.content));
                setSettingsForm(emptySettingsForm(page.props.settings));
                setRequests(page.props.requests ?? []);
            },
        });
    };

    const saveHero = async () => {
        setHeroSaving(true);

        try {
            let mediaId = heroForm.media_id;

            if (heroForm.image_file) {
                const uploaded = await uploadAsset(
                    heroForm.image_file,
                    heroForm.title || "Presupuesto banner",
                );
                mediaId = uploaded.id;
            }

            await axios.put(`/admin/api/site-sections/${heroForm.id}`, {
                page_key: "presupuesto",
                section_key: "presupuesto_banner",
                title: heroForm.title || null,
                media_id: mediaId,
                sort_order: heroForm.sort_order || "A",
                is_active: heroForm.is_active,
                field_values: [],
                items: [],
            });

            emitAdminToast("La portada de presupuesto se actualizó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar la portada de presupuesto.",
                "error",
            );
        } finally {
            setHeroSaving(false);
        }
    };

    const saveContent = async () => {
        setContentSaving(true);

        try {
            await axios.put(`/admin/api/site-sections/${contentForm.id}`, {
                page_key: "presupuesto",
                section_key: "presupuesto_content",
                title: contentForm.title || null,
                subtitle: contentForm.subtitle || null,
                sort_order: contentForm.sort_order || "B",
                is_active: contentForm.is_active,
                field_values: FIELD_DEFINITIONS.map((field) => ({
                    ...contentForm.fields[field.key],
                    field_key: field.key,
                    field_label: field.label,
                    field_type: "text",
                    sort_order: contentForm.fields[field.key]?.sort_order ?? field.sortOrder,
                    is_active: true,
                })),
                items: [],
            });

            emitAdminToast("El formulario de presupuesto se actualizó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar el formulario de presupuesto.",
                "error",
            );
        } finally {
            setContentSaving(false);
        }
    };

    const saveSettings = async () => {
        setSettingsSaving(true);

        try {
            await axios.put("/admin/api/quote-page-settings", {
                notification_email_primary: settingsForm.notification_email_primary || null,
                notification_email_secondary: settingsForm.notification_email_secondary || null,
                map_iframe: settingsForm.map_iframe || null,
            });

            emitAdminToast("La configuración comercial de presupuesto se actualizó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar la configuración de presupuesto.",
                "error",
            );
        } finally {
            setSettingsSaving(false);
        }
    };

    const updateRequest = async (item, patch, successMessage) => {
        setRequestBusyId(item.id);

        try {
            await axios.put(`/admin/api/quote-requests/${item.id}`, {
                status: item.status || "pendiente",
                is_read: item.is_read,
                ...patch,
            });

            emitAdminToast(successMessage);
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo actualizar la solicitud.",
                "error",
            );
        } finally {
            setRequestBusyId(null);
        }
    };

    const deleteRequest = async (item) => {
        if (!window.confirm(`¿Eliminar la solicitud de presupuesto de "${item.name}"?`)) {
            return;
        }

        setRequestBusyId(item.id);

        try {
            await axios.delete(`/admin/api/quote-requests/${item.id}`);
            emitAdminToast("La solicitud de presupuesto se eliminó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo eliminar la solicitud.",
                "error",
            );
        } finally {
            setRequestBusyId(null);
        }
    };

    return (
        <AdminLayout>
            <Head title="Presupuesto" />

            <PublicPreviewModal
                open={previewOpen}
                title="Vista pública de Presupuesto"
                url={publicQuoteUrl}
                onClose={() => setPreviewOpen(false)}
            />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.16),_transparent_34%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_44%,#eef7fb_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    <Icon icon="solar:document-add-outline" width={14} />
                                    Presupuesto / Página y consultas
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Gestión de presupuesto
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                    Administrá el banner público, los textos del
                                    formulario, el mail de notificación y el iframe del
                                    mapa. En la segunda vista quedan todas las consultas.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPreviewOpen(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                            >
                                <Icon icon="solar:square-arrow-right-up-outline" width={18} />
                                Ver página pública
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                    <StatCard
                        label="Solicitudes totales"
                        value={stats?.requests ?? requests.length}
                        icon="solar:inbox-outline"
                    />
                    <StatCard
                        label="Pendientes de leer"
                        value={stats?.unread ?? requests.filter((item) => !item.is_read).length}
                        icon="solar:letter-unread-outline"
                    />
                </section>

                <section className="flex flex-wrap gap-3">
                    <TabButton
                        active={tab === "page"}
                        icon="solar:document-text-outline"
                        label="Página de presupuesto"
                        onClick={() => visitTab("page")}
                    />
                    <TabButton
                        active={tab === "requests"}
                        icon="solar:inbox-outline"
                        label="Consultas"
                        badge={stats?.unread ? String(stats.unread) : null}
                        onClick={() => visitTab("requests")}
                    />
                </section>

                {tab === "page" ? (
                    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
                        <div className="space-y-6">
                            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        Banner principal
                                    </h2>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Controlá el hero superior de la página pública de presupuesto.
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <Field label="Título">
                                        <input
                                            type="text"
                                            value={heroForm.title}
                                            onChange={(event) =>
                                                setHeroForm((current) => ({
                                                    ...current,
                                                    title: event.target.value,
                                                }))
                                            }
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                        />
                                    </Field>

                                    <Field label="Imagen del banner">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(event) =>
                                                setHeroForm((current) => ({
                                                    ...current,
                                                    image_file: event.target.files?.[0] ?? null,
                                                }))
                                            }
                                            className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                        />
                                        {heroForm.media_url ? (
                                            <img
                                                src={heroForm.media_url}
                                                alt={heroForm.title || "Banner presupuesto"}
                                                className="mt-3 h-56 w-full rounded-2xl border border-slate-200 object-cover"
                                            />
                                        ) : null}
                                    </Field>

                                    <Toggle
                                        label="Banner visible"
                                        checked={heroForm.is_active}
                                        onChange={(value) =>
                                            setHeroForm((current) => ({
                                                ...current,
                                                is_active: value,
                                            }))
                                        }
                                    />

                                    <div className="flex justify-end border-t border-slate-200 pt-5">
                                        <button
                                            type="button"
                                            onClick={saveHero}
                                            disabled={heroSaving}
                                            className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                        >
                                            {heroSaving ? "Guardando..." : "Guardar banner"}
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        Notificaciones y mapa
                                    </h2>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Definí a qué correos llega Mailtrap y qué iframe de Google Maps se muestra en la página.
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <Field label="Email de notificación principal">
                                        <input
                                            type="email"
                                            value={settingsForm.notification_email_primary}
                                            onChange={(event) =>
                                                setSettingsForm((current) => ({
                                                    ...current,
                                                    notification_email_primary: event.target.value,
                                                }))
                                            }
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                        />
                                    </Field>

                                    <Field label="Email de notificación secundario">
                                        <input
                                            type="email"
                                            value={settingsForm.notification_email_secondary}
                                            onChange={(event) =>
                                                setSettingsForm((current) => ({
                                                    ...current,
                                                    notification_email_secondary: event.target.value,
                                                }))
                                            }
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                        />
                                    </Field>

                                    <Field
                                        label="Iframe de Google Maps"
                                        hint='Pegá el código completo de "Compartir > Insertar un mapa".'
                                    >
                                        <textarea
                                            value={settingsForm.map_iframe}
                                            onChange={(event) =>
                                                setSettingsForm((current) => ({
                                                    ...current,
                                                    map_iframe: event.target.value,
                                                }))
                                            }
                                            rows={8}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                        />
                                    </Field>

                                    <div className="flex justify-end border-t border-slate-200 pt-5">
                                        <button
                                            type="button"
                                            onClick={saveSettings}
                                            disabled={settingsSaving}
                                            className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                        >
                                            {settingsSaving ? "Guardando..." : "Guardar configuración"}
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold text-slate-900">
                                    Formulario público
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Editá los títulos y labels visibles del formulario de presupuesto.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <Field label="Título bloque de contacto">
                                    <input
                                        type="text"
                                        value={contentForm.title}
                                        onChange={(event) =>
                                            setContentForm((current) => ({
                                                ...current,
                                                title: event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    />
                                </Field>

                                <Field label="Título bloque de consulta">
                                    <input
                                        type="text"
                                        value={contentForm.subtitle}
                                        onChange={(event) =>
                                            setContentForm((current) => ({
                                                ...current,
                                                subtitle: event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    />
                                </Field>

                                <div className="grid gap-5 md:grid-cols-2">
                                    {FIELD_DEFINITIONS.map((field) => (
                                        <Field key={field.key} label={field.label}>
                                            <input
                                                type="text"
                                                value={contentForm.fields[field.key]?.field_value ?? ""}
                                                onChange={(event) =>
                                                    setContentForm((current) => ({
                                                        ...current,
                                                        fields: {
                                                            ...current.fields,
                                                            [field.key]: {
                                                                ...current.fields[field.key],
                                                                field_value: event.target.value,
                                                            },
                                                        },
                                                    }))
                                                }
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                            />
                                        </Field>
                                    ))}
                                </div>

                                <Toggle
                                    label="Formulario visible"
                                    checked={contentForm.is_active}
                                    onChange={(value) =>
                                        setContentForm((current) => ({
                                            ...current,
                                            is_active: value,
                                        }))
                                    }
                                />

                                <div className="flex justify-end border-t border-slate-200 pt-5">
                                    <button
                                        type="button"
                                        onClick={saveContent}
                                        disabled={contentSaving}
                                        className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                    >
                                        {contentSaving ? "Guardando..." : "Guardar formulario"}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                ) : null}

                {tab === "requests" ? (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-slate-900">
                                Solicitudes de presupuesto
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Revisá, respondé y organizá las consultas que llegan desde la web.
                            </p>
                        </div>

                        {requests.length ? (
                            <div className="space-y-4">
                                {requests.map((item) => (
                                    <article
                                        key={item.id}
                                        className={`rounded-[26px] border p-5 transition ${
                                            item.is_read
                                                ? "border-slate-200 bg-slate-50"
                                                : "border-[#25A7CA]/30 bg-[#25A7CA]/5"
                                        }`}
                                    >
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="text-lg font-semibold text-slate-900">
                                                        {item.name}
                                                    </h3>
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                                                            item.is_read
                                                                ? "bg-slate-200 text-slate-600"
                                                                : "bg-[#25A7CA]/12 text-[#117a98]"
                                                        }`}
                                                    >
                                                        {item.is_read ? "Leída" : "Nueva"}
                                                    </span>
                                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                        {item.status || "pendiente"}
                                                    </span>
                                                </div>

                                                <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-3">
                                                    <p><strong className="text-slate-900">Email:</strong> {item.email}</p>
                                                    <p><strong className="text-slate-900">País:</strong> {item.country || "-"}</p>
                                                    <p><strong className="text-slate-900">Teléfono:</strong> {item.phone || "-"}</p>
                                                    <p><strong className="text-slate-900">Empresa:</strong> {item.company || "-"}</p>
                                                    <p><strong className="text-slate-900">Material:</strong> {item.material || "-"}</p>
                                                    <p><strong className="text-slate-900">Forma:</strong> {item.shape || "-"}</p>
                                                    <p><strong className="text-slate-900">Dimensiones:</strong> {item.dimensions || "-"}</p>
                                                    <p><strong className="text-slate-900">Cantidad:</strong> {item.quantity || "-"}</p>
                                                    <p><strong className="text-slate-900">Fecha:</strong> {item.created_at || "-"}</p>
                                                </div>

                                                {item.message ? (
                                                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                                                        {item.message}
                                                    </div>
                                                ) : null}

                                                {item.attachments?.length ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.attachments.map((attachment) => (
                                                            <a
                                                                key={attachment.id}
                                                                href={attachment.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                                            >
                                                                {attachment.name}
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="flex flex-wrap gap-3 xl:max-w-[340px] xl:justify-end">
                                                {!item.is_read ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateRequest(item, { is_read: true }, "La solicitud se marcó como leída.")
                                                        }
                                                        disabled={requestBusyId === item.id}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98] disabled:opacity-60"
                                                    >
                                                        Marcar leída
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateRequest(item, { is_read: false }, "La solicitud se marcó como no leída.")
                                                        }
                                                        disabled={requestBusyId === item.id}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98] disabled:opacity-60"
                                                    >
                                                        Marcar no leída
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateRequest(item, { status: "resuelta", is_read: true }, "La solicitud se marcó como resuelta.")
                                                    }
                                                    disabled={requestBusyId === item.id}
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98] disabled:opacity-60"
                                                >
                                                    Marcar resuelta
                                                </button>

                                                {item.reply_url ? (
                                                    <a
                                                        href={item.reply_url}
                                                        className="rounded-2xl bg-[#25A7CA] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                                                    >
                                                        Responder
                                                    </a>
                                                ) : null}

                                                <button
                                                    type="button"
                                                    onClick={() => deleteRequest(item)}
                                                    disabled={requestBusyId === item.id}
                                                    className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                                    <Icon icon="solar:inbox-outline" width={24} />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                                    Todavía no hay solicitudes
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    Cuando alguien envíe el formulario de presupuesto, la solicitud aparecerá acá.
                                </p>
                            </div>
                        )}
                    </section>
                ) : null}
            </div>
        </AdminLayout>
    );
}

import PublicPreviewModal from "@/Components/Admin/PublicPreviewModal";
import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState } from "react";

function emptyHeroForm(hero) {
    return {
        id: hero?.id ?? null,
        title: hero?.title ?? "",
        media_id: hero?.media_id ?? null,
        media_url: hero?.media_url ?? "",
        image_file: null,
        is_active: hero?.is_active ?? true,
    };
}

function emptySettingsForm(settings) {
    return {
        id: settings?.id ?? null,
        address: settings?.address ?? "",
        phone_primary: settings?.phone_primary ?? "",
        phone_secondary: settings?.phone_secondary ?? "",
        phone_tertiary: settings?.phone_tertiary ?? "",
        email_primary: settings?.email_primary ?? "",
        email_secondary: settings?.email_secondary ?? "",
        map_link: settings?.map_link ?? "",
        map_iframe: settings?.map_iframe ?? "",
    };
}

const contactItemTypes = [
    { value: "address", label: "Dirección" },
    { value: "phone", label: "Teléfono principal" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "additional_phone", label: "Teléfono adicional" },
    { value: "email", label: "Email" },
];

function emptyItemForm() {
    return {
        type: "phone",
        label: "",
        value: "",
        sort_order: "A",
        is_active: true,
    };
}

async function uploadAsset(file, title) {
    const payload = new FormData();
    payload.append("file", file);
    payload.append("title", title || file.name);

    const response = await axios.post("/admin/api/media-assets", payload, {
        headers: { "Content-Type": "multipart/form-data" },
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

export default function ContactsIndex({
    settings: initialSettings,
    contactItems: initialContactItems,
    requests: initialRequests,
    stats,
    initialTab,
    publicContactUrl,
}) {
    const [tab, setTab] = useState(initialTab || "page");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [settingsForm, setSettingsForm] = useState(emptySettingsForm(initialSettings));
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [contactItems, setContactItems] = useState(initialContactItems ?? []);
    const [itemForm, setItemForm] = useState(emptyItemForm());
    const [itemBusyId, setItemBusyId] = useState(null);
    const [requests, setRequests] = useState(initialRequests ?? []);
    const [requestBusyId, setRequestBusyId] = useState(null);

    useEffect(() => {
        setTab(initialTab || "page");
    }, [initialTab]);

    useEffect(() => {
        setSettingsForm(emptySettingsForm(initialSettings));
    }, [initialSettings]);

    useEffect(() => {
        setContactItems(initialContactItems ?? []);
    }, [initialContactItems]);

    useEffect(() => {
        setRequests(initialRequests ?? []);
    }, [initialRequests]);

    const visitTab = (nextTab) => {
        setTab(nextTab);
        router.visit(`/admin/contacto?tab=${nextTab}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const reloadPage = () => {
        router.reload({
            onSuccess: (page) => {
                setSettingsForm(emptySettingsForm(page.props.settings));
                setContactItems(page.props.contactItems ?? []);
                setRequests(page.props.requests ?? []);
            },
        });
    };

    const saveSettings = async () => {
        setSettingsSaving(true);

        try {
            await axios.put("/admin/api/contact-page-settings", {
                address: settingsForm.address || null,
                phone_primary: settingsForm.phone_primary || null,
                phone_secondary: settingsForm.phone_secondary || null,
                phone_tertiary: settingsForm.phone_tertiary || null,
                email_primary: settingsForm.email_primary || null,
                email_secondary: settingsForm.email_secondary || null,
                map_link: settingsForm.map_link || null,
                map_iframe: settingsForm.map_iframe || null,
            });

            emitAdminToast("Los datos de contacto se actualizaron correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudieron guardar los datos de contacto.",
                "error",
            );
        } finally {
            setSettingsSaving(false);
        }
    };

    const createItem = async () => {
        setItemBusyId("new");

        try {
            await axios.post("/admin/api/contact-page-items", {
                ...itemForm,
                label: itemForm.label || null,
                sort_order: itemForm.sort_order || "A",
            });
            emitAdminToast("El dato de contacto se agregó correctamente.");
            setItemForm(emptyItemForm());
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo agregar el dato de contacto.",
                "error",
            );
        } finally {
            setItemBusyId(null);
        }
    };

    const updateItem = async (item, patch, successMessage) => {
        setItemBusyId(item.id);

        try {
            await axios.put(`/admin/api/contact-page-items/${item.id}`, {
                type: item.type,
                label: item.label || null,
                value: item.value,
                sort_order: item.sort_order || "A",
                is_active: item.is_active,
                ...patch,
            });
            emitAdminToast(successMessage);
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo actualizar el dato de contacto.",
                "error",
            );
        } finally {
            setItemBusyId(null);
        }
    };

    const deleteItem = async (item) => {
        if (!window.confirm(`¿Eliminar "${item.value}"?`)) {
            return;
        }

        setItemBusyId(item.id);

        try {
            await axios.delete(`/admin/api/contact-page-items/${item.id}`);
            emitAdminToast("El dato de contacto se eliminó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo eliminar el dato de contacto.",
                "error",
            );
        } finally {
            setItemBusyId(null);
        }
    };

    const updateRequest = async (item, patch, successMessage) => {
        setRequestBusyId(item.id);

        try {
            await axios.put(`/admin/api/contact-requests/${item.id}`, {
                first_name: item.first_name,
                last_name: item.last_name,
                email: item.email,
                phone: item.phone,
                message: item.message,
                is_read: item.is_read,
                status: item.status || "pendiente",
                ...patch,
            });

            emitAdminToast(successMessage);
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo actualizar la consulta.",
                "error",
            );
        } finally {
            setRequestBusyId(null);
        }
    };

    const deleteRequest = async (item) => {
        const fullName = `${item.first_name} ${item.last_name}`.trim();
        if (!window.confirm(`¿Eliminar la consulta de "${fullName}"?`)) {
            return;
        }

        setRequestBusyId(item.id);

        try {
            await axios.delete(`/admin/api/contact-requests/${item.id}`);
            emitAdminToast("La consulta se eliminó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo eliminar la consulta.",
                "error",
            );
        } finally {
            setRequestBusyId(null);
        }
    };

    return (
        <AdminLayout>
            <Head title="Contacto" />

            <PublicPreviewModal
                open={previewOpen}
                title="Vista pública de Contacto"
                url={publicContactUrl}
                onClose={() => setPreviewOpen(false)}
            />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.16),_transparent_34%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_44%,#eef7fb_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    <Icon icon="solar:chat-round-outline" width={14} />
                                    Contacto / Datos y consultas
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Gestión de contacto
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                    Desde acá administrás los datos de contacto,
                                    el mapa y las consultas
                                    que llegan desde el formulario público.
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
                        label="Consultas totales"
                        value={stats?.total ?? requests.length}
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
                        icon="solar:chat-round-outline"
                        label="Página de contacto"
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
                    <div className="space-y-6">
                        <div className="grid gap-6">
                            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        Información de contacto
                                    </h2>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Dirección, teléfonos y emails que se muestran
                                        en la página pública de contacto.
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <Field label="Dirección">
                                        <input
                                            type="text"
                                            value={settingsForm.address}
                                            onChange={(event) =>
                                                setSettingsForm((current) => ({
                                                    ...current,
                                                    address: event.target.value,
                                                }))
                                            }
                                            placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                        />
                                    </Field>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <Field label="Teléfono principal">
                                            <input
                                                type="text"
                                                value={settingsForm.phone_primary}
                                                onChange={(event) =>
                                                    setSettingsForm((current) => ({
                                                        ...current,
                                                        phone_primary: event.target.value,
                                                    }))
                                                }
                                                placeholder="Ej: +54 11 1234-5678"
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                            />
                                        </Field>

                                        <Field
                                            label="WhatsApp / Tel. secundario"
                                            hint="Se muestra como link de WhatsApp"
                                        >
                                            <input
                                                type="text"
                                                value={settingsForm.phone_secondary}
                                                onChange={(event) =>
                                                    setSettingsForm((current) => ({
                                                        ...current,
                                                        phone_secondary: event.target.value,
                                                    }))
                                                }
                                                placeholder="Ej: +54 9 11 1234-5678"
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Teléfono adicional">
                                        <input
                                            type="text"
                                            value={settingsForm.phone_tertiary}
                                            onChange={(event) =>
                                                setSettingsForm((current) => ({
                                                    ...current,
                                                    phone_tertiary: event.target.value,
                                                }))
                                            }
                                            placeholder="Ej: (011) 6062 - 1347"
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                        />
                                    </Field>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <Field label="Email principal">
                                            <input
                                                type="text"
                                                value={settingsForm.email_primary}
                                                onChange={(event) =>
                                                    setSettingsForm((current) => ({
                                                        ...current,
                                                        email_primary: event.target.value,
                                                    }))
                                                }
                                                placeholder="Ej: info@tarea.com"
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                            />
                                        </Field>

                                        <Field label="Email secundario">
                                            <input
                                                type="text"
                                                value={settingsForm.email_secondary}
                                                onChange={(event) =>
                                                    setSettingsForm((current) => ({
                                                        ...current,
                                                        email_secondary: event.target.value,
                                                    }))
                                                }
                                                placeholder="Opcional"
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                            />
                                        </Field>
                                    </div>

                                    <div className="flex justify-end border-t border-slate-200 pt-5">
                                        <button
                                            type="button"
                                            onClick={saveSettings}
                                            disabled={settingsSaving}
                                            className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                        >
                                            {settingsSaving ? "Guardando..." : "Guardar datos"}
                                        </button>
                                    </div>

                                    <div className="border-t border-slate-200 pt-6">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold text-slate-900">
                                                Datos visibles adicionales
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Agregá dirección, teléfonos, WhatsApp o emails. En la web heredan el ícono según el tipo.
                                            </p>
                                        </div>

                                        <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[190px_1fr_110px_120px]">
                                            <Field label="Tipo">
                                                <select
                                                    value={itemForm.type}
                                                    onChange={(event) =>
                                                        setItemForm((current) => ({
                                                            ...current,
                                                            type: event.target.value,
                                                        }))
                                                    }
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                                >
                                                    {contactItemTypes.map((type) => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </Field>

                                            <Field label="Valor">
                                                <input
                                                    type="text"
                                                    value={itemForm.value}
                                                    onChange={(event) =>
                                                        setItemForm((current) => ({
                                                            ...current,
                                                            value: event.target.value,
                                                        }))
                                                    }
                                                    placeholder="Dato visible en la página"
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                                />
                                            </Field>

                                            <Field label="Orden">
                                                <input
                                                    type="text"
                                                    value={itemForm.sort_order}
                                                    onChange={(event) =>
                                                        setItemForm((current) => ({
                                                            ...current,
                                                            sort_order: event.target.value,
                                                        }))
                                                    }
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                                />
                                            </Field>

                                            <div className="flex items-end">
                                                <button
                                                    type="button"
                                                    onClick={createItem}
                                                    disabled={itemBusyId === "new" || !itemForm.value.trim()}
                                                    className="w-full rounded-2xl bg-[#25A7CA] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                                >
                                                    Agregar
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            {contactItems.map((item) => (
                                                <article
                                                    key={item.id}
                                                    className="grid gap-3 rounded-[22px] border border-slate-200 bg-white p-4 lg:grid-cols-[180px_1fr_90px_220px] lg:items-center"
                                                >
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {contactItemTypes.find((type) => type.value === item.type)?.label ?? item.type}
                                                    </div>
                                                    <div className="text-sm text-slate-600">{item.value}</div>
                                                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                        {item.sort_order || "A"}
                                                    </div>
                                                    <div className="flex flex-wrap justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateItem(
                                                                    item,
                                                                    { is_active: !item.is_active },
                                                                    item.is_active
                                                                        ? "El dato se ocultó correctamente."
                                                                        : "El dato se activó correctamente.",
                                                                )
                                                            }
                                                            disabled={itemBusyId === item.id}
                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#25A7CA] hover:text-[#117a98] disabled:opacity-60"
                                                        >
                                                            {item.is_active ? "Ocultar" : "Mostrar"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteItem(item)}
                                                            disabled={itemBusyId === item.id}
                                                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Row 2: Mapa (full width) */}
                        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold text-slate-900">
                                    Mapa
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Configurá el link y el código embed del mapa que
                                    aparece en la página de contacto.
                                </p>
                            </div>

                            <div className="grid gap-6 xl:grid-cols-2">
                                <Field
                                    label="Link del mapa"
                                    hint="URL que se abre al hacer clic en la dirección"
                                >
                                    <input
                                        type="text"
                                        value={settingsForm.map_link}
                                        onChange={(event) =>
                                            setSettingsForm((current) => ({
                                                ...current,
                                                map_link: event.target.value,
                                            }))
                                        }
                                        placeholder="https://maps.app.goo.gl/..."
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    />
                                </Field>

                                <Field
                                    label="Código embed del mapa"
                                    hint='Código iframe de Google Maps (Compartir → Insertar mapa)'
                                >
                                    <textarea
                                        value={settingsForm.map_iframe}
                                        onChange={(event) =>
                                            setSettingsForm((current) => ({
                                                ...current,
                                                map_iframe: event.target.value,
                                            }))
                                        }
                                        rows={4}
                                        placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    />
                                </Field>
                            </div>

                            <div className="flex justify-end border-t border-slate-200 pt-5 mt-5">
                                <button
                                    type="button"
                                    onClick={saveSettings}
                                    disabled={settingsSaving}
                                    className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                >
                                    {settingsSaving ? "Guardando..." : "Guardar mapa"}
                                </button>
                            </div>
                        </section>
                    </div>
                ) : null}

                {tab === "requests" ? (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-slate-900">
                                Consultas de contacto
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Revisá, marcá como leídas y respondé las consultas
                                que llegan desde la web pública.
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
                                                        {item.first_name} {item.last_name}
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

                                                <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                                                    <p>
                                                        <strong className="text-slate-900">Email:</strong>{" "}
                                                        {item.email}
                                                    </p>
                                                    <p>
                                                        <strong className="text-slate-900">Teléfono:</strong>{" "}
                                                        {item.phone || "-"}
                                                    </p>
                                                    <p>
                                                        <strong className="text-slate-900">Fecha:</strong>{" "}
                                                        {item.created_at || "-"}
                                                    </p>
                                                </div>

                                                {item.message ? (
                                                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                                                        {item.message}
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="flex flex-wrap gap-3 xl:max-w-[340px] xl:justify-end">
                                                {!item.is_read ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateRequest(
                                                                item,
                                                                { is_read: true },
                                                                "La consulta se marcó como leída.",
                                                            )
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
                                                            updateRequest(
                                                                item,
                                                                { is_read: false },
                                                                "La consulta se marcó como no leída.",
                                                            )
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
                                                        updateRequest(
                                                            item,
                                                            { status: "resuelta", is_read: true },
                                                            "La consulta se marcó como resuelta.",
                                                        )
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
                                    Todavía no hay consultas
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    Cuando alguien complete el formulario público de
                                    contacto, la consulta aparecerá acá.
                                </p>
                            </div>
                        )}
                    </section>
                ) : null}
            </div>
        </AdminLayout>
    );
}

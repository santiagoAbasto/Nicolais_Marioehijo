import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState } from "react";

const CONTACT_TYPES = [
    { value: "whatsapp", label: "WhatsApp", icon: "ri:whatsapp-line" },
    { value: "phone", label: "Teléfono", icon: "solar:phone-calling-rounded-outline" },
    { value: "email", label: "Correo", icon: "solar:letter-outline" },
];

function getContactType(type) {
    return CONTACT_TYPES.find((item) => item.value === type) ?? CONTACT_TYPES[1];
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

function emptyFooterSettings() {
    return {
        phone_primary: "",
        phone_secondary: "",
        phone_tertiary: "",
        contact_hours: "",
        email_primary: "",
        email_secondary: "",
        contact_address: "",
        copyright_text: "",
    };
}

export default function FooterSettingsIndex({ footerSettings, contactItems: initialContactItems }) {
    const [form, setForm] = useState(emptyFooterSettings());
    const [contactItems, setContactItems] = useState(initialContactItems ?? []);
    const [saving, setSaving] = useState(false);
    const [savingContactId, setSavingContactId] = useState(null);
    const [creatingContact, setCreatingContact] = useState(false);
    const [newContact, setNewContact] = useState({
        type: "whatsapp",
        label: "WhatsApp",
        value: "",
    });

    useEffect(() => {
        setForm({
            phone_primary: footerSettings?.phone_primary ?? "",
            phone_secondary: footerSettings?.phone_secondary ?? "",
            phone_tertiary: footerSettings?.phone_tertiary ?? "",
            contact_hours: footerSettings?.contact_hours ?? "",
            email_primary: footerSettings?.email_primary ?? "",
            email_secondary: footerSettings?.email_secondary ?? "",
            contact_address: footerSettings?.contact_address ?? "",
            copyright_text: footerSettings?.copyright_text ?? "",
        });
    }, [footerSettings]);

    useEffect(() => {
        setContactItems(initialContactItems ?? []);
    }, [initialContactItems]);

    const setField = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const save = async () => {
        setSaving(true);

        try {
            await axios.put("/admin/api/footer-settings", {
                phone_primary: form.phone_primary || null,
                phone_secondary: form.phone_secondary || null,
                phone_tertiary: form.phone_tertiary || null,
                contact_hours: form.contact_hours || null,
                email_primary: form.email_primary || null,
                email_secondary: form.email_secondary || null,
                contact_address: form.contact_address || null,
                copyright_text: form.copyright_text || null,
            });

            emitAdminToast("El footer se actualizó correctamente.");
            router.reload();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar la configuración del footer.",
                "error",
            );
        } finally {
            setSaving(false);
        }
    };

    const setContactField = (id, key, value) => {
        setContactItems((current) =>
            current.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
        );
    };

    const setNewContactField = (key, value) => {
        setNewContact((current) => ({
            ...current,
            [key]: value,
            ...(key === "type"
                ? { label: getContactType(value).label }
                : {}),
        }));
    };

    const createContact = async () => {
        setCreatingContact(true);

        try {
            await axios.post("/admin/api/footer-contact-items", {
                type: newContact.type,
                label: newContact.label,
                value: newContact.value,
            });

            emitAdminToast("Contacto agregado al footer.");
            setNewContact({ type: "whatsapp", label: "WhatsApp", value: "" });
            router.reload();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message || "No se pudo agregar el contacto.",
                "error",
            );
        } finally {
            setCreatingContact(false);
        }
    };

    const saveContact = async (item) => {
        setSavingContactId(item.id);

        try {
            await axios.put(`/admin/api/footer-contact-items/${item.id}`, {
                type: item.type,
                label: item.label,
                value: item.value,
                is_active: item.is_active,
            });

            emitAdminToast("Contacto del footer actualizado correctamente.");
            router.reload();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message || "No se pudo guardar el contacto.",
                "error",
            );
        } finally {
            setSavingContactId(null);
        }
    };

    return (
        <AdminLayout>
            <Head title="Footer" />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.16),_transparent_34%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_44%,#eef7fb_100%)] px-6 py-8 md:px-8">
                        <div className="max-w-3xl">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                <Icon icon="solar:widget-5-outline" width={14} />
                                Extras / Footer
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                Footer
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                Editá los datos visibles del footer sin cambiar su diseño en la web pública.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900">
                                Datos visibles
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Estos campos actualizan el footer público en toda la web manteniendo el mismo layout.
                            </p>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="WhatsApp del footer" hint="Número visible en el footer. El botón flotante se administra en Configuración.">
                                <input
                                    type="text"
                                    value={form.phone_secondary}
                                    onChange={(e) => setField("phone_secondary", e.target.value)}
                                    placeholder="+54 (911) 6094 - 8992"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>

                            <Field label="Teléfono principal" hint="Primer número telefónico visible en el footer.">
                                <input
                                    type="text"
                                    value={form.phone_primary}
                                    onChange={(e) => setField("phone_primary", e.target.value)}
                                    placeholder="(011) 6072 - 6008"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>

                            <Field label="Teléfono secundario" hint="Segundo número telefónico visible en el footer.">
                                <input
                                    type="text"
                                    value={form.phone_tertiary}
                                    onChange={(e) => setField("phone_tertiary", e.target.value)}
                                    placeholder="(011) 6062 - 1347"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>

                            <Field label="Horario" hint="Bloque horario del footer.">
                                <input
                                    type="text"
                                    value={form.contact_hours}
                                    onChange={(e) => setField("contact_hours", e.target.value)}
                                    placeholder="Lu a Vi de 10:00 - 13:30 / 14:00 - 17:30 hs"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>

                            <Field label="Correo principal" hint="Email principal visible en el footer.">
                                <input
                                    type="email"
                                    value={form.email_primary}
                                    onChange={(e) => setField("email_primary", e.target.value)}
                                    placeholder="nicolaismario@yahoo.com.ar"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>

                            <Field label="Correo secundario" hint="Opcional. Se muestra debajo del correo principal si está cargado.">
                                <input
                                    type="email"
                                    value={form.email_secondary}
                                    onChange={(e) => setField("email_secondary", e.target.value)}
                                    placeholder="ventas@nicolaismarioehijo.com"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>
                        </div>

                        <Field label="Dirección" hint="Bloque de ubicación del footer.">
                            <textarea
                                value={form.contact_address}
                                onChange={(e) => setField("contact_address", e.target.value)}
                                rows={3}
                                placeholder="Palpa 3551, CABA (C1427EBA), Argentina."
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                        </Field>

                        <Field label="Copyright" hint="Texto inferior del footer.">
                            <input
                                type="text"
                                value={form.copyright_text}
                                onChange={(e) => setField("copyright_text", e.target.value)}
                                placeholder="© Copyright 2026 Nicolais Mario e Hijo. Todos los derechos reservados"
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                        </Field>

                        <div className="flex justify-end border-t border-slate-200 pt-5">
                            <button
                                type="button"
                                onClick={save}
                                disabled={saving}
                                className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                            >
                                {saving ? "Guardando..." : "Guardar footer"}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-slate-900">
                            Contactos adicionales
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Agregá WhatsApp, teléfonos o correos extra. Cada tipo hereda el SVG correspondiente del footer público.
                        </p>
                    </div>

                    <div className="mb-6 rounded-[24px] border border-dashed border-[#25A7CA]/35 bg-[#25A7CA]/5 p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25A7CA] text-white">
                                <Icon icon="solar:add-circle-outline" width={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                    Añadir contacto
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Elegí si es WhatsApp, teléfono o correo y completá el dato visible.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[180px_220px_minmax(0,1fr)_auto] lg:items-end">
                            <Field label="Tipo">
                                <select
                                    value={newContact.type}
                                    onChange={(e) => setNewContactField("type", e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                >
                                    {CONTACT_TYPES.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Nombre visible">
                                <input
                                    type="text"
                                    value={newContact.label}
                                    onChange={(e) => setNewContactField("label", e.target.value)}
                                    placeholder="WhatsApp"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>

                            <Field label="Dato visible">
                                <input
                                    type="text"
                                    value={newContact.value}
                                    onChange={(e) => setNewContactField("value", e.target.value)}
                                    placeholder="+54 (911) 6094 - 8992"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>

                            <button
                                type="button"
                                onClick={createContact}
                                disabled={creatingContact}
                                className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                            >
                                {creatingContact ? "Agregando..." : "Añadir"}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {contactItems.map((item) => {
                            const meta = getContactType(item.type);

                            return (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-4 rounded-[24px] border border-slate-200 p-5 xl:flex-row xl:items-center"
                                >
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#25A7CA]/20 bg-[#25A7CA]/10 text-[#117a98]">
                                        <Icon icon={meta.icon} width={22} />
                                    </div>

                                    <div className="grid flex-1 gap-3 lg:grid-cols-[160px_180px_minmax(0,1fr)]">
                                        <Field label="Tipo">
                                            <select
                                                value={item.type}
                                                onChange={(e) => setContactField(item.id, "type", e.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                            >
                                                {CONTACT_TYPES.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>

                                        <Field label="Nombre">
                                            <input
                                                type="text"
                                                value={item.label ?? meta.label}
                                                onChange={(e) => setContactField(item.id, "label", e.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                            />
                                        </Field>

                                        <Field label="Dato visible">
                                            <input
                                                type="text"
                                                value={item.value}
                                                onChange={(e) => setContactField(item.id, "value", e.target.value)}
                                                placeholder="+54 (911) 6094 - 8992"
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                            />
                                        </Field>
                                    </div>

                                    <div className="flex items-center gap-2 xl:shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setContactField(item.id, "is_active", !item.is_active)}
                                            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                                                item.is_active
                                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                            }`}
                                        >
                                            {item.is_active ? "Visible" : "Oculta"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => saveContact(item)}
                                            disabled={savingContactId === item.id}
                                            className="rounded-2xl bg-[#25A7CA] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                        >
                                            {savingContactId === item.id ? "Guardando..." : "Guardar"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

import PublicPreviewModal from "@/Components/Admin/PublicPreviewModal";
import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function emptyHeroForm(hero) {
    return {
        id: hero?.id ?? null,
        section_key: hero?.section_key ?? "clientes_banner",
        title: hero?.title ?? "",
        media_id: hero?.media_id ?? null,
        media_url: hero?.media_url ?? "",
        image_file: null,
        sort_order: hero?.sort_order ?? "A",
        is_active: hero?.is_active ?? true,
    };
}

function emptyContentForm(content) {
    return {
        id: content?.id ?? null,
        title: content?.title ?? "",
        sort_order: content?.sort_order ?? "B",
        is_active: content?.is_active ?? true,
    };
}

function emptyCategoryForm(category = null) {
    return {
        id: category?.id ?? null,
        name: category?.name ?? "",
        slug: category?.slug ?? "",
        sort_order: category?.sort_order ?? "A",
        is_active: category?.is_active ?? true,
    };
}

function emptyClientForm(client = null) {
    return {
        id: client?.id ?? null,
        name: client?.name ?? "",
        slug: client?.slug ?? "",
        logo_media_id: client?.logo_media_id ?? null,
        logo_url: client?.logo_url ?? "",
        logo_file: null,
        website_url: client?.website_url ?? "",
        sort_order: client?.sort_order ?? "A",
        is_active: client?.is_active ?? true,
        show_on_home: client?.show_on_home ?? false,
        client_category_ids: client?.client_category_ids
            ? [...client.client_category_ids]
            : [],
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

function TabButton({ active, icon, label, onClick }) {
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

function ModalShell({ open, title, children, onClose, maxWidth = "max-w-4xl" }) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4">
            <button
                type="button"
                aria-label="Cerrar modal"
                className="absolute inset-0"
                onClick={onClose}
            />
            <div
                className={`relative z-[121] max-h-[90vh] w-full overflow-y-auto rounded-[30px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.28)] ${maxWidth}`}
            >
                <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                        <Icon icon="solar:close-circle-outline" width={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function CategoryModal({ open, category, onClose, onSaved }) {
    const [form, setForm] = useState(emptyCategoryForm(category));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm(emptyCategoryForm(category));
    }, [category, open]);

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            const payload = {
                name: form.name,
                slug: slugify(form.name),
                sort_order: form.sort_order || null,
                is_active: form.is_active,
            };

            if (form.id) {
                await axios.put(`/admin/api/client-categories/${form.id}`, payload);
            } else {
                await axios.post("/admin/api/client-categories", payload);
            }

            emitAdminToast(
                form.id
                    ? "La categoría se actualizó correctamente."
                    : "La categoría se creó correctamente.",
            );
            onSaved();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar la categoría.",
                "error",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            title={form.id ? "Editar categoría" : "Nueva categoría"}
        >
            <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Nombre">
                        <input
                            type="text"
                            value={form.name}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                    slug: slugify(event.target.value),
                                }))
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                    </Field>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Orden">
                        <input
                            type="text"
                            value={form.sort_order}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    sort_order: event.target.value.toUpperCase(),
                                }))
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                    </Field>
                </div>

                <Toggle
                    label="Categoría activa"
                    checked={form.is_active}
                    onChange={(value) =>
                        setForm((current) => ({ ...current, is_active: value }))
                    }
                />

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                    >
                        {saving ? "Guardando..." : form.id ? "Guardar cambios" : "Crear categoría"}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

function ClientModal({ open, client, categories, onClose, onSaved }) {
    const [form, setForm] = useState(emptyClientForm(client));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm(emptyClientForm(client));
    }, [client, open]);

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            let logoMediaId = form.logo_media_id;

            if (form.logo_file) {
                const uploaded = await uploadAsset(
                    form.logo_file,
                    form.name || "Cliente logo",
                );
                logoMediaId = uploaded.id;
            }

            const selectedCategories = form.client_category_ids.map(Number).filter(Boolean);

            const payload = {
                client_category_id: selectedCategories[0] ?? null,
                client_category_ids: selectedCategories,
                name: form.name,
                slug: slugify(form.name),
                logo_media_id: logoMediaId,
                website_url: form.website_url || null,
                sort_order: form.sort_order || null,
                is_active: form.is_active,
                show_on_home: form.show_on_home,
            };

            if (form.id) {
                await axios.put(`/admin/api/clients/${form.id}`, payload);
            } else {
                await axios.post("/admin/api/clients", payload);
            }

            emitAdminToast(
                form.id
                    ? "El cliente se actualizó correctamente."
                    : "El cliente se creó correctamente.",
            );
            onSaved();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar el cliente.",
                "error",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            title={form.id ? "Editar cliente" : "Nuevo cliente"}
            maxWidth="max-w-5xl"
        >
            <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Nombre">
                        <input
                            type="text"
                            value={form.name}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                    slug: slugify(event.target.value),
                                }))
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                    </Field>
                </div>

                <Field label="Categorías">
                    <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                        {categories.map((category) => (
                            <label
                                key={category.id}
                                className="flex items-center gap-3 rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-slate-700"
                            >
                                <input
                                    type="checkbox"
                                    checked={form.client_category_ids.includes(category.id)}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            client_category_ids: event.target.checked
                                                ? [...current.client_category_ids, category.id]
                                                : current.client_category_ids.filter(
                                                      (id) => id !== category.id,
                                                  ),
                                        }))
                                    }
                                />
                                <span>{category.name}</span>
                            </label>
                        ))}
                    </div>
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Sitio web">
                        <input
                            type="text"
                            value={form.website_url}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    website_url: event.target.value,
                                }))
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                    </Field>

                    <Field label="Orden">
                        <input
                            type="text"
                            value={form.sort_order}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    sort_order: event.target.value.toUpperCase(),
                                }))
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                    </Field>
                </div>

                <Field label="Logo">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                logo_file: event.target.files?.[0] ?? null,
                            }))
                        }
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                    />
                    {form.logo_url ? (
                        <div className="mt-3 flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white p-4">
                            <img
                                src={form.logo_url}
                                alt={form.name || "Cliente"}
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>
                    ) : null}
                </Field>

                <div className="flex flex-wrap gap-3">
                    <Toggle
                        label="Cliente activo"
                        checked={form.is_active}
                        onChange={(value) =>
                            setForm((current) => ({ ...current, is_active: value }))
                        }
                    />
                    <Toggle
                        label="Mostrar en home"
                        checked={form.show_on_home}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                show_on_home: value,
                            }))
                        }
                    />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                    >
                        {saving ? "Guardando..." : form.id ? "Guardar cambios" : "Crear cliente"}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

export default function ClientsIndex({
    hero,
    content,
    categories: initialCategories,
    clients: initialClients,
    stats,
    initialTab,
    publicClientsUrl,
}) {
    const [tab, setTab] = useState(initialTab || "page");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [heroForm, setHeroForm] = useState(emptyHeroForm(hero));
    const [contentForm, setContentForm] = useState(emptyContentForm(content));
    const [categories, setCategories] = useState(initialCategories ?? []);
    const [clients, setClients] = useState(initialClients ?? []);
    const [heroSaving, setHeroSaving] = useState(false);
    const [contentSaving, setContentSaving] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [clientModalOpen, setClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);

    useEffect(() => {
        setTab(initialTab || "page");
    }, [initialTab]);

    const reloadPage = () => {
        router.reload({
            onSuccess: (page) => {
                setHeroForm(emptyHeroForm(page.props.hero));
                setContentForm(emptyContentForm(page.props.content));
                setCategories(page.props.categories ?? []);
                setClients(page.props.clients ?? []);
                setCategoryModalOpen(false);
                setEditingCategory(null);
                setClientModalOpen(false);
                setEditingClient(null);
            },
        });
    };

    const visitTab = (nextTab) => {
        setTab(nextTab);
        router.visit(`/admin/clients?tab=${nextTab}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const saveHero = async () => {
        setHeroSaving(true);

        try {
            let mediaId = heroForm.media_id;

            if (heroForm.image_file) {
                const uploaded = await uploadAsset(
                    heroForm.image_file,
                    heroForm.title || "Clientes banner",
                );
                mediaId = uploaded.id;
            }

            await axios.put(`/admin/api/site-sections/${heroForm.id}`, {
                page_key: "clientes",
                section_key: heroForm.section_key || "clientes_banner",
                title: heroForm.title || null,
                media_id: mediaId,
                sort_order: heroForm.sort_order || "A",
                is_active: heroForm.is_active,
                field_values: [],
                items: [],
            });

            emitAdminToast("La portada de clientes se actualizó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar la portada de clientes.",
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
                page_key: "clientes",
                section_key: "clientes_content",
                title: contentForm.title || null,
                sort_order: contentForm.sort_order || "B",
                is_active: contentForm.is_active,
                field_values: [],
                items: [],
            });

            emitAdminToast("El contenido de clientes se actualizó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar el contenido de clientes.",
                "error",
            );
        } finally {
            setContentSaving(false);
        }
    };

    const deleteCategory = async (item) => {
        if (!window.confirm(`¿Eliminar la categoría "${item.name}"?`)) {
            return;
        }

        try {
            await axios.delete(`/admin/api/client-categories/${item.id}`);
            emitAdminToast("La categoría se eliminó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo eliminar la categoría.",
                "error",
            );
        }
    };

    const deleteClient = async (item) => {
        if (!window.confirm(`¿Eliminar el cliente "${item.name}"?`)) {
            return;
        }

        try {
            await axios.delete(`/admin/api/clients/${item.id}`);
            emitAdminToast("El cliente se eliminó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo eliminar el cliente.",
                "error",
            );
        }
    };

    const orderedCategories = useMemo(
        () => [...categories].sort((left, right) => String(left.sort_order).localeCompare(String(right.sort_order))),
        [categories],
    );

    return (
        <AdminLayout>
            <Head title="Clientes" />

            <PublicPreviewModal
                open={previewOpen}
                title="Vista pública de Clientes"
                url={publicClientsUrl}
                onClose={() => setPreviewOpen(false)}
            />

            <CategoryModal
                open={categoryModalOpen}
                category={editingCategory}
                onClose={() => {
                    setCategoryModalOpen(false);
                    setEditingCategory(null);
                }}
                onSaved={reloadPage}
            />

            <ClientModal
                open={clientModalOpen}
                client={editingClient}
                categories={orderedCategories.filter((item) => item.is_active)}
                onClose={() => {
                    setClientModalOpen(false);
                    setEditingClient(null);
                }}
                onSaved={reloadPage}
            />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.16),_transparent_34%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_44%,#eef7fb_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    <Icon icon="solar:buildings-2-outline" width={14} />
                                    Clientes / Rubros y logos
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Gestión de clientes
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                    Desde acá administrás el banner, el título de la
                                    página, las categorías y los clientes que se ven
                                    en la web pública y en home.
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

                <section className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        label="Categorías"
                        value={stats?.categories ?? categories.length}
                        icon="solar:widget-4-outline"
                    />
                    <StatCard
                        label="Clientes"
                        value={stats?.clients ?? clients.length}
                        icon="solar:buildings-2-outline"
                    />
                    <StatCard
                        label="En home"
                        value={stats?.home_clients ?? clients.filter((item) => item.show_on_home && item.is_active).length}
                        icon="solar:home-smile-outline"
                    />
                </section>

                <section className="flex flex-wrap gap-3">
                    <TabButton
                        active={tab === "page"}
                        icon="solar:document-text-outline"
                        label="Página de clientes"
                        onClick={() => visitTab("page")}
                    />
                    <TabButton
                        active={tab === "categories"}
                        icon="solar:widget-4-outline"
                        label="Categorías"
                        onClick={() => visitTab("categories")}
                    />
                    <TabButton
                        active={tab === "clients"}
                        icon="solar:buildings-2-outline"
                        label="Clientes"
                        onClick={() => visitTab("clients")}
                    />
                </section>

                {tab === "page" ? (
                    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold text-slate-900">
                                    Banner principal
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Controla el hero superior de la página pública de clientes.
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
                                                image_file:
                                                    event.target.files?.[0] ?? null,
                                            }))
                                        }
                                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                    />
                                    {heroForm.media_url ? (
                                        <img
                                            src={heroForm.media_url}
                                            alt={heroForm.title || "Banner clientes"}
                                            className="mt-3 h-56 w-full rounded-2xl border border-slate-200 object-cover"
                                        />
                                    ) : null}
                                </Field>

                                <Toggle
                                    label="Bloque activo"
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
                                    Título de contenido
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Este bloque aparece antes del listado de rubros en la página pública.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <Field label="Título">
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

                                <Toggle
                                    label="Bloque activo"
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
                                        {contentSaving ? "Guardando..." : "Guardar contenido"}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                ) : null}

                {tab === "categories" ? (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">
                                    Categorías de clientes
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Organizá los rubros o bloques que se muestran en la página.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setEditingCategory(null);
                                    setCategoryModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                            >
                                <Icon icon="solar:add-circle-outline" width={18} />
                                Nueva categoría
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-[24px] border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        <th className="px-4 py-4">Categoría</th>
                                        <th className="px-4 py-4">Slug</th>
                                        <th className="px-4 py-4">Clientes</th>
                                        <th className="px-4 py-4">Estado</th>
                                        <th className="px-4 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {orderedCategories.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{item.name}</p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Orden {item.sort_order}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-600">{item.slug}</td>
                                            <td className="px-4 py-4 text-slate-600">{item.clients_count}</td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        item.is_active
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-slate-100 text-slate-500"
                                                    }`}
                                                >
                                                    {item.is_active ? "Activa" : "Inactiva"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingCategory(item);
                                                            setCategoryModalOpen(true);
                                                        }}
                                                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteCategory(item)}
                                                        className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : null}

                {tab === "clients" ? (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">
                                    Clientes
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Administrá logos, categorías asociadas y visibilidad en home.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setEditingClient(null);
                                    setClientModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                            >
                                <Icon icon="solar:add-circle-outline" width={18} />
                                Nuevo cliente
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-[24px] border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        <th className="px-4 py-4">Cliente</th>
                                        <th className="px-4 py-4">Categorías</th>
                                        <th className="px-4 py-4">Home</th>
                                        <th className="px-4 py-4">Estado</th>
                                        <th className="px-4 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {clients.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-14 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2">
                                                        {item.logo_url ? (
                                                            <img
                                                                src={item.logo_url}
                                                                alt={item.name}
                                                                className="max-h-full max-w-full object-contain"
                                                            />
                                                        ) : (
                                                            <Icon
                                                                icon="solar:gallery-outline"
                                                                width={18}
                                                                className="text-slate-300"
                                                            />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{item.name}</p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Orden {item.sort_order}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-600">
                                                {item.category_names?.length
                                                    ? item.category_names.join(", ")
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        item.show_on_home
                                                            ? "bg-[#25A7CA]/12 text-[#117a98]"
                                                            : "bg-slate-100 text-slate-500"
                                                    }`}
                                                >
                                                    {item.show_on_home ? "Visible" : "Oculto"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        item.is_active
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-slate-100 text-slate-500"
                                                    }`}
                                                >
                                                    {item.is_active ? "Activo" : "Inactivo"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingClient(item);
                                                            setClientModalOpen(true);
                                                        }}
                                                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteClient(item)}
                                                        className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : null}
            </div>
        </AdminLayout>
    );
}

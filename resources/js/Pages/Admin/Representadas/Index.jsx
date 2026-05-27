import PublicPreviewModal from "@/Components/Admin/PublicPreviewModal";
import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState } from "react";

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
        section_key: hero?.section_key ?? "representadas_banner",
        title: hero?.title ?? "",
        media_id: hero?.media_id ?? null,
        media_url: hero?.media_url ?? "",
        image_file: null,
        sort_order: hero?.sort_order ?? "A",
        is_active: hero?.is_active ?? true,
    };
}

function emptyPartnerForm(partner = null) {
    return {
        id: partner?.id ?? null,
        name: partner?.name ?? "",
        slug: partner?.slug ?? "",
        logo_media_id: partner?.logo_media_id ?? null,
        logo_url: partner?.logo_url ?? "",
        logo_file: null,
        website_url: partner?.website_url ?? "",
        sort_order: partner?.sort_order ?? "A",
        is_active: partner?.is_active ?? true,
        show_on_home: partner?.show_on_home ?? false,
        show_on_page: partner?.show_on_page ?? true,
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

function ModalShell({ open, title, children, onClose }) {
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
            <div className="relative z-[121] max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
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

function PartnerModal({ open, partner, onClose, onSaved }) {
    const [form, setForm] = useState(emptyPartnerForm(partner));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm(emptyPartnerForm(partner));
    }, [partner, open]);

    const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            let logoMediaId = form.logo_media_id;

            if (form.logo_file) {
                const uploaded = await uploadAsset(
                    form.logo_file,
                    form.name || "Logo representada",
                );
                logoMediaId = uploaded.id;
            }

            const payload = {
                name: form.name,
                slug: slugify(form.name),
                logo_media_id: logoMediaId ?? null,
                website_url: form.website_url || null,
                partner_type: "representada",
                sort_order: form.sort_order || null,
                is_active: form.is_active,
                show_on_home: form.show_on_home,
                show_on_page: form.show_on_page,
            };

            if (form.id) {
                await axios.put(`/admin/api/partners/${form.id}`, payload);
            } else {
                await axios.post("/admin/api/partners", payload);
            }

            emitAdminToast(
                form.id
                    ? "La representada se actualizó correctamente."
                    : "La representada se creó correctamente.",
            );

            onSaved();
            onClose();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar la representada.",
                "error",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell
            open={open}
            title={form.id ? "Editar representada" : "Nueva representada"}
            onClose={onClose}
        >
            <form onSubmit={submit} className="space-y-5">
                <Field label="Nombre">
                    <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => {
                            set("name", e.target.value);
                            set("slug", slugify(e.target.value));
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        placeholder="Nombre de la representada"
                    />
                </Field>
                <Field label="Sitio web">
                    <input
                        type="url"
                        value={form.website_url}
                        onChange={(e) => set("website_url", e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        placeholder="https://ejemplo.com"
                    />
                </Field>

                <Field
                    label="Logo"
                    hint="PNG o SVG con fondo transparente. Recomendado: 400 × 200 px."
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => set("logo_file", e.target.files?.[0] ?? null)}
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                    />
                    {form.logo_url && !form.logo_file ? (
                        <div className="mt-3 flex h-24 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <img
                                src={form.logo_url}
                                alt={form.name}
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>
                    ) : null}
                </Field>

                <Field label="Orden">
                    <input
                        type="text"
                        value={form.sort_order}
                        onChange={(e) =>
                            set("sort_order", e.target.value.toUpperCase().slice(0, 16))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        placeholder="A"
                    />
                </Field>

                <div className="flex flex-wrap gap-3">
                    <Toggle
                        label="Activa"
                        checked={form.is_active}
                        onChange={(v) => set("is_active", v)}
                    />
                    <Toggle
                        label="Mostrar en home"
                        checked={form.show_on_home}
                        onChange={(v) => set("show_on_home", v)}
                    />
                    <Toggle
                        label="Mostrar en página"
                        checked={form.show_on_page}
                        onChange={(v) => set("show_on_page", v)}
                    />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                    >
                        <Icon icon="solar:diskette-outline" width={18} />
                        {saving ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

function DeleteModal({ open, partner, onClose, onDeleted }) {
    const [deleting, setDeleting] = useState(false);

    const confirm = async () => {
        setDeleting(true);
        try {
            await axios.delete(`/admin/api/partners/${partner.id}`);
            emitAdminToast("La representada se eliminó correctamente.");
            onDeleted();
            onClose();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo eliminar la representada.",
                "error",
            );
        } finally {
            setDeleting(false);
        }
    };

    return (
        <ModalShell open={open} title="Eliminar representada" onClose={onClose}>
            <div className="space-y-5">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm text-rose-700">
                        ¿Estás seguro que querés eliminar{" "}
                        <strong>{partner?.name}</strong>? Esta acción no se puede
                        deshacer.
                    </p>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={confirm}
                        disabled={deleting}
                        className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                    >
                        <Icon icon="solar:trash-bin-trash-outline" width={18} />
                        {deleting ? "Eliminando..." : "Eliminar"}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

export default function RepresentadasIndex({
    hero: initialHero,
    partners: initialPartners,
    stats,
    initialTab,
    publicRepresentadasUrl,
}) {
    const [tab, setTab] = useState(initialTab ?? "page");
    const [heroForm, setHeroForm] = useState(emptyHeroForm(initialHero));
    const [heroSaving, setHeroSaving] = useState(false);
    const [partners, setPartners] = useState(initialPartners ?? []);
    const [search, setSearch] = useState("");
    const [partnerModal, setPartnerModal] = useState({ open: false, partner: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, partner: null });
    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        setHeroForm(emptyHeroForm(initialHero));
    }, [initialHero]);

    const reloadPage = () => router.reload();

    const saveHero = async () => {
        setHeroSaving(true);

        try {
            let mediaId = heroForm.media_id;

            if (heroForm.image_file) {
                const uploaded = await uploadAsset(
                    heroForm.image_file,
                    heroForm.title || "Representadas banner",
                );
                mediaId = uploaded.id;
            }

            await axios.put(`/admin/api/site-sections/${heroForm.id}`, {
                page_key: "representadas",
                section_key: heroForm.section_key || "representadas_banner",
                title: heroForm.title || null,
                media_id: mediaId,
                sort_order: heroForm.sort_order || "A",
                is_active: heroForm.is_active,
                field_values: [],
                items: [],
            });

            emitAdminToast("El banner de representadas se actualizó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar el banner.",
                "error",
            );
        } finally {
            setHeroSaving(false);
        }
    };

    const filteredPartners = partners.filter((p) =>
        (p.name ?? "").toLowerCase().includes(search.toLowerCase()),
    );

    const openCreate = () => setPartnerModal({ open: true, partner: null });
    const openEdit = (partner) => setPartnerModal({ open: true, partner });
    const openDelete = (partner) => setDeleteModal({ open: true, partner });

    const handleSaved = () => reloadPage();
    const handleDeleted = () => reloadPage();

    return (
        <AdminLayout>
            <Head title="Representadas" />

            <PartnerModal
                open={partnerModal.open}
                partner={partnerModal.partner}
                onClose={() => setPartnerModal({ open: false, partner: null })}
                onSaved={handleSaved}
            />

            <DeleteModal
                open={deleteModal.open}
                partner={deleteModal.partner}
                onClose={() => setDeleteModal({ open: false, partner: null })}
                onDeleted={handleDeleted}
            />

            <PublicPreviewModal
                open={previewOpen}
                title="Página pública de representadas"
                url={publicRepresentadasUrl}
                onClose={() => setPreviewOpen(false)}
            />

            <div className="space-y-6">
                {/* Header */}
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.18),_transparent_38%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_45%,#eff6ff_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    <Icon
                                        icon="solar:users-group-two-rounded-outline"
                                        width={14}
                                    />
                                    Representadas / Marcas y aliados
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Gestión de representadas
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                    Administrá el banner de la página pública y la
                                    lista de marcas representadas con sus logos y
                                    visibilidad.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPreviewOpen(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                            >
                                <Icon
                                    icon="solar:square-arrow-right-up-outline"
                                    width={18}
                                />
                                Ver página pública
                            </button>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Total representadas"
                        value={stats?.total ?? partners.length}
                        icon="solar:users-group-two-rounded-outline"
                    />
                    <StatCard
                        label="Activas"
                        value={stats?.active ?? partners.filter((p) => p.is_active).length}
                        icon="solar:check-circle-outline"
                    />
                    <StatCard
                        label="Visibles en home"
                        value={stats?.on_home ?? partners.filter((p) => p.show_on_home && p.is_active).length}
                        icon="solar:home-smile-outline"
                    />
                    <StatCard
                        label="Visibles en página"
                        value={stats?.on_page ?? partners.filter((p) => p.show_on_page && p.is_active).length}
                        icon="solar:document-text-outline"
                    />
                </section>

                {/* Tabs */}
                <section className="flex flex-wrap gap-3">
                    <TabButton
                        active={tab === "page"}
                        icon="solar:document-text-outline"
                        label="Página"
                        onClick={() => setTab("page")}
                    />
                    <TabButton
                        active={tab === "representadas"}
                        icon="solar:users-group-two-rounded-outline"
                        label={`Representadas (${partners.length})`}
                        onClick={() => setTab("representadas")}
                    />
                </section>

                {/* Tab: Página / Banner */}
                {tab === "page" ? (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-slate-900">
                                Banner principal
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Título e imagen del hero superior en la página pública
                                de representadas.
                            </p>
                        </div>

                        <div className="space-y-5 xl:max-w-2xl">
                            <Field label="Título del banner">
                                <input
                                    type="text"
                                    value={heroForm.title}
                                    onChange={(e) =>
                                        setHeroForm((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    placeholder="REPRESENTADAS"
                                />
                            </Field>

                            <Field
                                label="Imagen del banner"
                                hint="Recomendado: 1920 × 600 px, JPG o WebP."
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setHeroForm((prev) => ({
                                            ...prev,
                                            image_file: e.target.files?.[0] ?? null,
                                        }))
                                    }
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                />
                                {heroForm.media_url ? (
                                    <img
                                        src={heroForm.media_url}
                                        alt={heroForm.title || "Banner representadas"}
                                        className="mt-3 h-56 w-full rounded-2xl border border-slate-200 object-cover"
                                    />
                                ) : null}
                            </Field>

                            <Toggle
                                label="Bloque activo"
                                checked={heroForm.is_active}
                                onChange={(v) =>
                                    setHeroForm((prev) => ({
                                        ...prev,
                                        is_active: v,
                                    }))
                                }
                            />

                            <div className="flex justify-end border-t border-slate-200 pt-5">
                                <button
                                    type="button"
                                    onClick={saveHero}
                                    disabled={heroSaving}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                >
                                    <Icon icon="solar:diskette-outline" width={18} />
                                    {heroSaving ? "Guardando..." : "Guardar banner"}
                                </button>
                            </div>
                        </div>
                    </section>
                ) : null}

                {/* Tab: Representadas list */}
                {tab === "representadas" ? (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">
                                    Listado de representadas
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Cada representada se puede mostrar en la home,
                                    en la página de representadas, o en ambas.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <Icon
                                        icon="solar:magnifer-outline"
                                        width={16}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Buscar representada..."
                                        className="w-64 rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                                >
                                    <Icon icon="solar:add-circle-outline" width={18} />
                                    Nueva representada
                                </button>
                            </div>
                        </div>

                        {filteredPartners.length > 0 ? (
                            <div className="overflow-hidden rounded-[24px] border border-slate-200">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                Logo
                                            </th>
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                Nombre
                                            </th>
                                            <th className="hidden px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:table-cell">
                                                Sitio web
                                            </th>
                                            <th className="hidden px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 xl:table-cell">
                                                Orden
                                            </th>
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                Visibilidad
                                            </th>
                                            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredPartners.map((partner) => (
                                            <tr
                                                key={partner.id}
                                                className="bg-white transition hover:bg-slate-50/60"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex h-12 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-2">
                                                        {partner.logo_url ? (
                                                            <img
                                                                src={partner.logo_url}
                                                                alt={partner.name}
                                                                className="max-h-full max-w-full object-contain"
                                                            />
                                                        ) : (
                                                            <Icon
                                                                icon="solar:image-outline"
                                                                width={18}
                                                                className="text-slate-400"
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-slate-900">
                                                        {partner.name}
                                                    </p>
                                                    {partner.slug ? (
                                                        <p className="mt-0.5 text-xs text-slate-400">
                                                            /{partner.slug}
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="hidden px-5 py-4 lg:table-cell">
                                                    {partner.website_url ? (
                                                        <a
                                                            href={partner.website_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs text-[#117a98] hover:underline"
                                                        >
                                                            <Icon
                                                                icon="solar:square-arrow-right-up-outline"
                                                                width={13}
                                                            />
                                                            {partner.website_url.replace(
                                                                /^https?:\/\//,
                                                                "",
                                                            )}
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="hidden px-5 py-4 xl:table-cell">
                                                    <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                                        {partner.sort_order || "—"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <span
                                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                                partner.is_active
                                                                    ? "bg-emerald-50 text-emerald-700"
                                                                    : "bg-slate-100 text-slate-500"
                                                            }`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${
                                                                    partner.is_active
                                                                        ? "bg-emerald-500"
                                                                        : "bg-slate-400"
                                                                }`}
                                                            />
                                                            {partner.is_active
                                                                ? "Activa"
                                                                : "Inactiva"}
                                                        </span>
                                                        {partner.show_on_home ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-[#25A7CA]/10 px-2.5 py-1 text-[11px] font-semibold text-[#117a98]">
                                                                <Icon
                                                                    icon="solar:home-smile-outline"
                                                                    width={11}
                                                                />
                                                                Home
                                                            </span>
                                                        ) : null}
                                                        {partner.show_on_page ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                                                                <Icon
                                                                    icon="solar:document-text-outline"
                                                                    width={11}
                                                                />
                                                                Página
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEdit(partner)
                                                            }
                                                            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                                            title="Editar"
                                                        >
                                                            <Icon
                                                                icon="solar:pen-outline"
                                                                width={15}
                                                            />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDelete(partner)
                                                            }
                                                            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                                                            title="Eliminar"
                                                        >
                                                            <Icon
                                                                icon="solar:trash-bin-trash-outline"
                                                                width={15}
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                                    <Icon
                                        icon="solar:users-group-two-rounded-outline"
                                        width={24}
                                    />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                                    {search
                                        ? "Sin resultados para esa búsqueda"
                                        : "Todavía no hay representadas cargadas"}
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    {search
                                        ? "Probá con otro término de búsqueda."
                                        : "Agregá la primera representada usando el botón de arriba."}
                                </p>
                                {!search ? (
                                    <button
                                        type="button"
                                        onClick={openCreate}
                                        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                                    >
                                        <Icon
                                            icon="solar:add-circle-outline"
                                            width={18}
                                        />
                                        Nueva representada
                                    </button>
                                ) : null}
                            </div>
                        )}
                    </section>
                ) : null}
            </div>
        </AdminLayout>
    );
}

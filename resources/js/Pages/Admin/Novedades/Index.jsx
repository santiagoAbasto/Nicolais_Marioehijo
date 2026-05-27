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

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── shared mini components ─────────────────────────── */

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
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
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
            <span className={`flex h-6 w-10 items-center rounded-full p-1 transition ${checked ? "bg-[#25A7CA]" : "bg-slate-300"}`}>
                <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-4" : "translate-x-0"}`} />
            </span>
            <span>{label}</span>
        </button>
    );
}

function ModalShell({ open, title, children, onClose }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4">
            <button type="button" aria-label="Cerrar" className="absolute inset-0" onClick={onClose} />
            <div className="relative z-[121] max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[30px] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
                <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
                    <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50">
                        <Icon icon="solar:close-circle-outline" width={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

/* ── Category modal ──────────────────────────────────── */

function emptyCatForm(cat = null) {
    return {
        id: cat?.id ?? null,
        name: cat?.name ?? "",
        slug: cat?.slug ?? "",
        color: cat?.color ?? "#25A7CA",
        sort_order: cat?.sort_order ?? "A",
        is_active: cat?.is_active ?? true,
    };
}

function CategoryModal({ open, category, onClose, onSaved }) {
    const [form, setForm] = useState(emptyCatForm(category));
    const [saving, setSaving] = useState(false);

    useEffect(() => { setForm(emptyCatForm(category)); }, [category, open]);

    const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                slug: slugify(form.name),
                color: form.color || null,
                sort_order: form.sort_order || null,
                is_active: form.is_active,
            };
            if (form.id) {
                await axios.put(`/admin/api/post-categories/${form.id}`, payload);
            } else {
                await axios.post("/admin/api/post-categories", payload);
            }
            emitAdminToast(form.id ? "Categoría actualizada." : "Categoría creada.");
            onSaved();
            onClose();
        } catch (error) {
            emitAdminToast(error?.response?.data?.message || "No se pudo guardar la categoría.", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell open={open} title={form.id ? "Editar categoría" : "Nueva categoría"} onClose={onClose}>
            <form onSubmit={submit} className="space-y-5">
                <Field label="Nombre">
                    <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => { set("name", e.target.value); set("slug", slugify(e.target.value)); }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        placeholder="Nombre de la categoría"
                    />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Color de etiqueta">
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={form.color || "#25A7CA"}
                                onChange={(e) => set("color", e.target.value)}
                                className="h-11 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                            />
                            <input
                                type="text"
                                value={form.color || ""}
                                onChange={(e) => set("color", e.target.value)}
                                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                placeholder="#25A7CA"
                            />
                        </div>
                    </Field>
                    <Field label="Orden">
                        <input
                            type="text"
                            value={form.sort_order}
                            onChange={(e) => set("sort_order", e.target.value.toUpperCase().slice(0, 16))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                            placeholder="A"
                        />
                    </Field>
                </div>
                <Toggle label="Categoría activa" checked={form.is_active} onChange={(v) => set("is_active", v)} />
                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
                    <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancelar</button>
                    <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60">
                        <Icon icon="solar:diskette-outline" width={18} />
                        {saving ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

/* ── Delete confirm modal ────────────────────────────── */

function DeleteModal({ open, item, label, apiPath, onClose, onDeleted }) {
    const [deleting, setDeleting] = useState(false);

    const confirm = async () => {
        setDeleting(true);
        try {
            await axios.delete(apiPath);
            emitAdminToast(`${label} eliminado/a correctamente.`);
            onDeleted();
            onClose();
        } catch (error) {
            emitAdminToast(error?.response?.data?.message || `No se pudo eliminar.`, "error");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <ModalShell open={open} title={`Eliminar ${label.toLowerCase()}`} onClose={onClose}>
            <div className="space-y-5">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm text-rose-700">
                        ¿Estás seguro que querés eliminar <strong>{item?.name || item?.title}</strong>? Esta acción no se puede deshacer.
                    </p>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
                    <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancelar</button>
                    <button type="button" onClick={confirm} disabled={deleting} className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60">
                        <Icon icon="solar:trash-bin-trash-outline" width={18} />
                        {deleting ? "Eliminando..." : "Eliminar"}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

/* ── Main page ───────────────────────────────────────── */

export default function NovedadesIndex({ categories: initialCategories, posts: initialPosts, initialTab, publicNovedadesUrl }) {
    const [tab, setTab] = useState(initialTab ?? "novedades");
    const [categories, setCategories] = useState(initialCategories ?? []);
    const [posts, setPosts] = useState(initialPosts ?? []);
    const [homeSavingId, setHomeSavingId] = useState(null);
    const [search, setSearch] = useState("");
    const [filterCat, setFilterCat] = useState("");
    const [catModal, setCatModal] = useState({ open: false, category: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, item: null, label: "", apiPath: "" });
    const [previewOpen, setPreviewOpen] = useState(false);

    const reloadPage = () => router.reload();

    const computedStats = {
        total: posts.length,
        active: posts.filter((post) => post.is_active).length,
        featured: posts.filter((post) => post.is_featured).length,
        on_home: posts.filter((post) => post.show_on_home).length,
        categories: categories.length,
    };

    const filteredPosts = posts.filter((p) => {
        const matchSearch = (p.title ?? "").toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCat ? String(p.category_id) === filterCat : true;
        return matchSearch && matchCat;
    });

    const openDeleteCat = (cat) => setDeleteModal({ open: true, item: cat, label: "Categoría", apiPath: `/admin/api/post-categories/${cat.id}` });
    const openDeletePost = (post) => setDeleteModal({ open: true, item: post, label: "Novedad", apiPath: `/admin/api/posts/${post.id}` });

    const togglePostHome = async (post) => {
        if (homeSavingId === post.id) {
            return;
        }

        const nextValue = !post.show_on_home;

        setHomeSavingId(post.id);
        setPosts((current) =>
            current.map((item) =>
                item.id === post.id ? { ...item, show_on_home: nextValue } : item,
            ),
        );

        try {
            await axios.patch(`/admin/api/posts/${post.id}/home`, {
                show_on_home: nextValue,
            });

            emitAdminToast(
                nextValue
                    ? "La novedad ahora se muestra en el home."
                    : "La novedad dejó de mostrarse en el home.",
            );
        } catch (error) {
            setPosts((current) =>
                current.map((item) =>
                    item.id === post.id ? { ...item, show_on_home: post.show_on_home } : item,
                ),
            );

            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo actualizar la visibilidad en home.",
                "error",
            );
        } finally {
            setHomeSavingId(null);
        }
    };

    return (
        <AdminLayout>
            <Head title="Novedades" />

            <CategoryModal
                open={catModal.open}
                category={catModal.category}
                onClose={() => setCatModal({ open: false, category: null })}
                onSaved={reloadPage}
            />

            <DeleteModal
                open={deleteModal.open}
                item={deleteModal.item}
                label={deleteModal.label}
                apiPath={deleteModal.apiPath}
                onClose={() => setDeleteModal({ open: false, item: null, label: "", apiPath: "" })}
                onDeleted={reloadPage}
            />

            <PublicPreviewModal
                open={previewOpen}
                title="Novedades públicas"
                url={publicNovedadesUrl}
                onClose={() => setPreviewOpen(false)}
            />

            <div className="space-y-6">
                {/* Header */}
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.18),_transparent_38%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_45%,#eff6ff_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    <Icon icon="solar:document-text-outline" width={14} />
                                    Novedades / Noticias del sitio
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Gestión de novedades
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                    Administrá las categorías y las novedades publicadas en el sitio con soporte para texto enriquecido.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPreviewOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                >
                                    <Icon icon="solar:square-arrow-right-up-outline" width={18} />
                                    Ver página pública
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.visit("/admin/novedades/create")}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                                >
                                    <Icon icon="solar:add-circle-outline" width={18} />
                                    Nueva novedad
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <StatCard label="Total novedades" value={computedStats.total} icon="solar:document-text-outline" />
                    <StatCard label="Publicadas" value={computedStats.active} icon="solar:check-circle-outline" />
                    <StatCard label="Destacadas" value={computedStats.featured} icon="solar:star-outline" />
                    <StatCard label="En home" value={computedStats.on_home} icon="solar:home-smile-outline" />
                    <StatCard label="Categorías" value={computedStats.categories} icon="solar:tag-outline" />
                </section>

                {/* Tabs */}
                <section className="flex flex-wrap gap-3">
                    <TabButton active={tab === "novedades"} icon="solar:document-text-outline" label={`Novedades (${posts.length})`} onClick={() => setTab("novedades")} />
                    <TabButton active={tab === "categorias"} icon="solar:tag-outline" label={`Categorías (${categories.length})`} onClick={() => setTab("categorias")} />
                </section>

                {/* ── Tab: Novedades ── */}
                {tab === "novedades" ? (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">Listado de novedades</h2>
                                <p className="mt-2 text-sm text-slate-500">Hacé clic en editar para modificar el contenido enriquecido de cada novedad.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    value={filterCat}
                                    onChange={(e) => setFilterCat(e.target.value)}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                >
                                    <option value="">Todas las categorías</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                                    ))}
                                </select>
                                <div className="relative">
                                    <Icon icon="solar:magnifer-outline" width={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Buscar novedad..."
                                        className="w-56 rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => router.visit("/admin/novedades/create")}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                                >
                                    <Icon icon="solar:add-circle-outline" width={18} />
                                    Nueva novedad
                                </button>
                            </div>
                        </div>

                        {filteredPosts.length > 0 ? (
                            <div className="overflow-hidden rounded-[24px] border border-slate-200">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Portada</th>
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Título</th>
                                            <th className="hidden px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:table-cell">Categoría</th>
                                            <th className="hidden px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 xl:table-cell">Publicación</th>
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Estado</th>
                                            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredPosts.map((post) => (
                                            <tr key={post.id} className="bg-white transition hover:bg-slate-50/60">
                                                <td className="px-5 py-4">
                                                    <div className="h-12 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                                                        {post.cover_url ? (
                                                            <img src={post.cover_url} alt={post.title} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center text-slate-400">
                                                                <Icon icon="solar:camera-outline" width={18} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-slate-900 line-clamp-1">{post.title}</p>
                                                    {post.slug ? <p className="mt-0.5 text-xs text-slate-400">/{post.slug}</p> : null}
                                                    {post.author_name ? <p className="mt-0.5 text-xs text-slate-500">{post.author_name}</p> : null}
                                                </td>
                                                <td className="hidden px-5 py-4 lg:table-cell">
                                                    {post.category_name ? (
                                                        <span
                                                            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                                                            style={{ backgroundColor: post.category_color || "#25A7CA" }}
                                                        >
                                                            {post.category_name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">Sin categoría</span>
                                                    )}
                                                </td>
                                                <td className="hidden px-5 py-4 xl:table-cell">
                                                    <span className="text-sm text-slate-600">{formatDate(post.published_at)}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${post.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                                            <span className={`h-1.5 w-1.5 rounded-full ${post.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                            {post.is_active ? "Publicada" : "Borrador"}
                                                        </span>
                                                        {post.is_featured ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                                                <Icon icon="solar:star-outline" width={11} />
                                                                Destacada
                                                            </span>
                                                        ) : null}
                                                        {post.show_on_home ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-[#25A7CA]/10 px-2.5 py-1 text-[11px] font-semibold text-[#117a98]">
                                                                <Icon icon="solar:home-smile-outline" width={11} />
                                                                Home
                                                            </span>
                                                        ) : null}
                                                        <button
                                                            type="button"
                                                            onClick={() => togglePostHome(post)}
                                                            disabled={homeSavingId === post.id}
                                                            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                                                                post.show_on_home
                                                                    ? "border-[#25A7CA]/30 bg-[#25A7CA]/10 text-[#117a98]"
                                                                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                                            } disabled:cursor-not-allowed disabled:opacity-60`}
                                                            title="Mostrar u ocultar esta novedad en el home"
                                                        >
                                                            <span className={`flex h-4 w-7 items-center rounded-full p-[2px] transition ${post.show_on_home ? "bg-[#25A7CA]" : "bg-slate-300"}`}>
                                                                <span className={`h-3 w-3 rounded-full bg-white transition ${post.show_on_home ? "translate-x-3" : "translate-x-0"}`} />
                                                            </span>
                                                            {homeSavingId === post.id
                                                                ? "Guardando..."
                                                                : post.show_on_home
                                                                  ? "Quitar del home"
                                                                  : "Mostrar en home"}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => router.visit(`/admin/novedades/${post.id}/edit`)}
                                                            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                                            title="Editar"
                                                        >
                                                            <Icon icon="solar:pen-outline" width={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openDeletePost(post)}
                                                            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                                                            title="Eliminar"
                                                        >
                                                            <Icon icon="solar:trash-bin-trash-outline" width={15} />
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
                                    <Icon icon="solar:document-text-outline" width={24} />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                                    {search || filterCat ? "Sin resultados" : "Todavía no hay novedades"}
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    {search || filterCat ? "Probá con otros filtros." : "Creá la primera novedad usando el botón de arriba."}
                                </p>
                                {!search && !filterCat ? (
                                    <button
                                        type="button"
                                        onClick={() => router.visit("/admin/novedades/create")}
                                        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                                    >
                                        <Icon icon="solar:add-circle-outline" width={18} />
                                        Nueva novedad
                                    </button>
                                ) : null}
                            </div>
                        )}
                    </section>
                ) : null}

                {/* ── Tab: Categorías ── */}
                {tab === "categorias" ? (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">Categorías de novedades</h2>
                                <p className="mt-2 text-sm text-slate-500">Las categorías permiten filtrar novedades en la web pública y asignarles un color identificador.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCatModal({ open: true, category: null })}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                            >
                                <Icon icon="solar:add-circle-outline" width={18} />
                                Nueva categoría
                            </button>
                        </div>

                        {categories.length > 0 ? (
                            <div className="overflow-hidden rounded-[24px] border border-slate-200">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Color</th>
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Nombre</th>
                                            <th className="hidden px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:table-cell">Slug</th>
                                            <th className="hidden px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 xl:table-cell">Novedades</th>
                                            <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Estado</th>
                                            <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {categories.map((cat) => (
                                            <tr key={cat.id} className="bg-white transition hover:bg-slate-50/60">
                                                <td className="px-5 py-4">
                                                    <span
                                                        className="inline-block h-7 w-7 rounded-full border-2 border-white shadow-sm"
                                                        style={{ backgroundColor: cat.color || "#25A7CA" }}
                                                    />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-white"
                                                        style={{ backgroundColor: cat.color || "#25A7CA" }}
                                                    >
                                                        {cat.name}
                                                    </span>
                                                </td>
                                                <td className="hidden px-5 py-4 lg:table-cell">
                                                    <span className="font-mono text-xs text-slate-500">{cat.slug || "—"}</span>
                                                </td>
                                                <td className="hidden px-5 py-4 xl:table-cell">
                                                    <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                                        {cat.posts_count ?? 0} novedad{cat.posts_count !== 1 ? "es" : ""}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cat.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${cat.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                        {cat.is_active ? "Activa" : "Inactiva"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCatModal({ open: true, category: cat })}
                                                            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                                            title="Editar"
                                                        >
                                                            <Icon icon="solar:pen-outline" width={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openDeleteCat(cat)}
                                                            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                                                            title="Eliminar"
                                                        >
                                                            <Icon icon="solar:trash-bin-trash-outline" width={15} />
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
                                    <Icon icon="solar:tag-outline" width={24} />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-slate-900">Sin categorías</h3>
                                <p className="mt-2 text-sm text-slate-500">Creá la primera categoría para organizar las novedades.</p>
                                <button
                                    type="button"
                                    onClick={() => setCatModal({ open: true, category: null })}
                                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                                >
                                    <Icon icon="solar:add-circle-outline" width={18} />
                                    Nueva categoría
                                </button>
                            </div>
                        )}
                    </section>
                ) : null}
            </div>
        </AdminLayout>
    );
}

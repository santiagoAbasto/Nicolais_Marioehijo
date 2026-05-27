import AdminLayout from "@/Layouts/AdminLayout";
import RichTextEditor from "@/Components/Admin/RichTextEditor";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useRef, useState } from "react";

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
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

function Field({ label, required, children, hint }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-slate-400">{hint}</p>}
        </div>
    );
}

function Toggle({ label, description, checked, onChange }) {
    return (
        <label className="flex cursor-pointer items-start gap-3">
            <div className="relative mt-0.5 shrink-0">
                <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-[#25A7CA]" />
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700">{label}</p>
                {description && (
                    <p className="text-xs text-slate-400">{description}</p>
                )}
            </div>
        </label>
    );
}

export default function NovedadesCreate({ categories = [], nextSortOrder = "A" }) {
    const [saving, setSaving] = useState(false);
    const coverInputRef = useRef(null);

    const [form, setForm] = useState({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        author_name: "",
        published_at: new Date().toISOString().slice(0, 10),
        sort_order: nextSortOrder,
        is_active: true,
        show_on_home: false,
        is_featured: false,
        post_category_id: "",
        cover_media_id: null,
        cover_url: "",
        cover_file: null,
    });

    function set(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function handleTitleChange(e) {
        const title = e.target.value;
        set("title", title);
        set("slug", slugify(title));
    }

    function handleCoverFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        set("cover_file", file);
        set("cover_url", URL.createObjectURL(file));
    }

    function removeCover() {
        set("cover_file", null);
        set("cover_url", "");
        set("cover_media_id", null);
        if (coverInputRef.current) coverInputRef.current.value = "";
    }

    async function handleSave() {
        if (!form.title.trim()) {
            emitAdminToast("El título es obligatorio.", "error");
            return;
        }
        setSaving(true);
        try {
            let cover_media_id = form.cover_media_id;

            if (form.cover_file) {
                const asset = await uploadAsset(form.cover_file, form.title);
                cover_media_id = asset.id;
            }

            const payload = {
                title: form.title,
                slug: slugify(form.title),
                excerpt: form.excerpt || null,
                content: form.content || null,
                author_name: form.author_name || null,
                published_at: form.published_at || null,
                sort_order: form.sort_order,
                is_active: form.is_active,
                show_on_home: form.show_on_home,
                is_featured: form.is_featured,
                post_category_id: form.post_category_id || null,
                cover_media_id,
            };

            await axios.post("/admin/api/posts", payload);
            emitAdminToast("Novedad creada correctamente.", "success");
            router.visit("/admin/novedades?tab=novedades");
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Error al guardar la novedad.";
            emitAdminToast(msg, "error");
        } finally {
            setSaving(false);
        }
    }

    return (
        <AdminLayout>
            <Head title="Nueva novedad" />

            {/* Header */}
            <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.visit("/admin/novedades?tab=novedades")}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                        <Icon icon="solar:arrow-left-outline" width={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Nueva novedad
                        </h1>
                        <p className="text-sm text-slate-500">
                            Completa los datos para crear una publicación
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d8fac] disabled:opacity-60"
                >
                    {saving ? (
                        <Icon icon="solar:refresh-outline" width={16} className="animate-spin" />
                    ) : (
                        <Icon icon="solar:diskette-outline" width={16} />
                    )}
                    {saving ? "Guardando…" : "Guardar novedad"}
                </button>
            </div>

            {/* Body */}
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                {/* Main */}
                <div className="space-y-6">
                    {/* Identificación */}
                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                            Identificación
                        </h2>
                        <div className="space-y-4">
                            <Field label="Título" required>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={handleTitleChange}
                                    placeholder="Ej: Nueva línea de productos 2025"
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#25A7CA] focus:ring-2 focus:ring-[#25A7CA]/20"
                                />
                            </Field>

                            <Field label="Autor">
                                <input
                                    type="text"
                                    value={form.author_name}
                                    onChange={(e) => set("author_name", e.target.value)}
                                    placeholder="Nombre del autor"
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#25A7CA] focus:ring-2 focus:ring-[#25A7CA]/20"
                                />
                            </Field>
                        </div>
                    </section>

                    {/* Resumen */}
                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                            Resumen
                        </h2>
                        <Field
                            label="Extracto"
                            hint="Breve descripción que aparece en listados y redes sociales."
                        >
                            <textarea
                                value={form.excerpt}
                                onChange={(e) => set("excerpt", e.target.value)}
                                rows={3}
                                placeholder="Breve descripción de la novedad…"
                                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#25A7CA] focus:ring-2 focus:ring-[#25A7CA]/20"
                            />
                        </Field>
                    </section>

                    {/* Contenido */}
                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                            Contenido
                        </h2>
                        <RichTextEditor
                            value={form.content}
                            onChange={(html) => set("content", html)}
                            placeholder="Escribe el contenido completo de la novedad…"
                        />
                    </section>

                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Portada */}
                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                            Imagen de portada
                        </h2>

                        {form.cover_url ? (
                            <div className="relative overflow-hidden rounded-2xl border border-slate-200">
                                <img
                                    src={form.cover_url}
                                    alt="Portada"
                                    className="h-44 w-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={removeCover}
                                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow transition hover:bg-white hover:text-red-600"
                                >
                                    <Icon icon="solar:close-circle-outline" width={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => coverInputRef.current?.click()}
                                className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 transition hover:border-[#25A7CA]/50 hover:text-[#25A7CA]"
                            >
                                <Icon icon="solar:gallery-add-outline" width={28} />
                                <span className="text-xs font-medium">
                                    Subir imagen de portada
                                </span>
                            </button>
                        )}

                        <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverFile}
                        />

                        <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-sm font-semibold text-amber-950">
                                Recomendado: imagen 900 x 900 px · entre 2 y 4 MB ·
                                JPG, PNG o WEBP.
                            </p>
                        </div>

                        {form.cover_url && (
                            <button
                                type="button"
                                onClick={() => coverInputRef.current?.click()}
                                className="mt-3 w-full rounded-2xl border border-slate-200 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50"
                            >
                                Cambiar imagen
                            </button>
                        )}
                    </section>

                    {/* Clasificación */}
                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                            Clasificación
                        </h2>
                        <div className="space-y-4">
                            <Field label="Categoría">
                                <select
                                    value={form.post_category_id}
                                    onChange={(e) => set("post_category_id", e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#25A7CA] focus:ring-2 focus:ring-[#25A7CA]/20"
                                >
                                    <option value="">Sin categoría</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Fecha de publicación">
                                <input
                                    type="date"
                                    value={form.published_at}
                                    onChange={(e) => set("published_at", e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#25A7CA] focus:ring-2 focus:ring-[#25A7CA]/20"
                                />
                            </Field>

                            <Field label="Orden" hint="Secuencia editorial: A, AA, AB, AC... AZ, B, BA, BB, BC...">
                                <input
                                    type="text"
                                    value={form.sort_order}
                                    onChange={(e) => set("sort_order", e.target.value)}
                                    placeholder="A"
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#25A7CA] focus:ring-2 focus:ring-[#25A7CA]/20"
                                />
                            </Field>
                        </div>
                    </section>

                    {/* Visibilidad */}
                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                            Visibilidad
                        </h2>
                        <div className="space-y-4">
                            <Toggle
                                label="Publicada"
                                description="Visible en el sitio web"
                                checked={form.is_active}
                                onChange={(v) => set("is_active", v)}
                            />
                            <Toggle
                                label="Destacada"
                                description="Aparece resaltada en listados"
                                checked={form.is_featured}
                                onChange={(v) => set("is_featured", v)}
                            />
                            <Toggle
                                label="Mostrar en inicio"
                                description="Visible en la sección de novedades del home"
                                checked={form.show_on_home}
                                onChange={(v) => set("show_on_home", v)}
                            />
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}

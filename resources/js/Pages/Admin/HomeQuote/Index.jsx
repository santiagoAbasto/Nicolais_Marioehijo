import PublicPreviewModal from "@/Components/Admin/PublicPreviewModal";
import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState } from "react";

function getInitialForm(section) {
    return {
        id: section?.id ?? null,
        subtitle: section?.subtitle ?? "",
        title: section?.title ?? "",
        description: section?.description ?? "",
        button_text: section?.button_text ?? "",
        button_url: section?.button_url ?? "",
        media_id: section?.media_id ?? null,
        media_url: section?.media_url ?? "",
        image_file: null,
        is_active: !!section?.is_active,
        sort_order: section?.sort_order ?? "F",
    };
}

function HomeQuotePreview({ form, previewUrl }) {
    return (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="relative min-h-[420px]">
                <div className="absolute inset-0">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={form.title || "Presupuesto en inicio"}
                            className="h-full w-full object-cover"
                        />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(143,216,248,.22),transparent_42%),linear-gradient(135deg,#0d4d7c_0%,#093E66_100%)] px-8 text-center text-slate-200">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                                    Vista previa
                                    </p>
                                    <p className="mt-4 text-sm leading-6">
                                    Subí la imagen del bloque de presupuesto para ver
                                    cómo queda en la home.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,27,.20)_0%,rgba(7,18,27,.55)_100%)]" />

                <div className="relative z-[1] flex min-h-[420px] items-end justify-between gap-6 p-8 md:p-10">
                    <div className="max-w-[520px] text-white">
                        {form.subtitle ? (
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                                {form.subtitle}
                            </div>
                        ) : null}
                        <h2 className="mt-3 font-['Mona_Sans'] text-3xl font-semibold leading-[1.1] md:text-[40px]">
                            {form.title || "Solicite su presupuesto"}
                        </h2>
                        <p className="mt-4 max-w-[480px] text-base leading-7 text-slate-100">
                            {form.description ||
                                "Nuestro equipo comercial acompaña cada requerimiento técnico con respuesta ágil y asesoramiento personalizado."}
                        </p>
                    </div>

                    {form.button_text ? (
                        <span className="inline-flex items-center gap-4 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#007CC2] shadow-sm">
                            {form.button_text}
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#007CC2] text-white">
                                <Icon icon="solar:arrow-right-up-outline" width={18} />
                            </span>
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default function HomeQuoteIndex({ section, publicHomeUrl }) {
    const [form, setForm] = useState(getInitialForm(section));
    const [previewUrl, setPreviewUrl] = useState(section?.media_url ?? "");
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        if (!form.image_file) {
            setPreviewUrl(form.media_url || "");
            return undefined;
        }

        const nextUrl = URL.createObjectURL(form.image_file);
        setPreviewUrl(nextUrl);

        return () => URL.revokeObjectURL(nextUrl);
    }, [form.image_file, form.media_url]);

    const updateForm = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            let mediaId = form.media_id;
            let nextMediaUrl = form.media_url;

            if (form.image_file) {
                const payload = new FormData();
                payload.append("file", form.image_file);
                payload.append("title", form.title || "Presupuesto en inicio");

                const upload = await axios.post("/admin/api/media-assets", payload, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                mediaId = upload.data.id;
                nextMediaUrl = previewUrl;
            }

            const response = await axios.put(`/admin/api/site-sections/${form.id}`, {
                page_key: "home",
                section_key: "quote_cta",
                subtitle: form.subtitle || null,
                title: form.title || null,
                description: form.description || null,
                media_id: mediaId,
                button_text: form.button_text || null,
                button_url: form.button_url || null,
                sort_order: form.sort_order || "F",
                is_active: form.is_active,
                field_values: [],
                items: [],
            });

            setForm((current) => ({
                ...current,
                media_id: mediaId,
                media_url: nextMediaUrl,
                image_file: null,
                subtitle: response.data.subtitle ?? current.subtitle,
                title: response.data.title ?? current.title,
                description: response.data.description ?? current.description,
                button_text: response.data.button_text ?? current.button_text,
                button_url: response.data.button_url ?? current.button_url,
                is_active: !!response.data.is_active,
                sort_order: response.data.sort_order ?? current.sort_order,
            }));

            emitAdminToast("El bloque de presupuesto del inicio se actualizó correctamente.");
        } catch (error) {
            if (error?.response?.status === 422) {
                setErrors(error.response.data.errors ?? {});
            }

            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar el bloque de presupuesto del inicio.",
                "error",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Presupuesto en inicio" />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.18),_transparent_38%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_45%,#eff6ff_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    <Icon icon="solar:wallet-money-outline" width={14} />
                                    Inicio / Presupuesto
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Bloque de presupuesto en inicio
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                    Editá la imagen, el copy y el botón del bloque
                                    de presupuesto que aparece al final del inicio
                                    pública.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPreviewOpen(true)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                            >
                                <Icon icon="solar:square-arrow-right-up-outline" width={18} />
                                Ver home pública
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
                    <HomeQuotePreview form={form} previewUrl={previewUrl} />

                    <form
                        onSubmit={handleSave}
                        className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <div className="border-b border-slate-200 pb-5">
                            <h2 className="text-xl font-semibold text-slate-900">
                                Editar contenido
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Todo lo que guardes acá impacta directamente en el
                                bloque de presupuesto de la home.
                            </p>
                        </div>

                        <div className="mt-6 space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-800">
                                    Antetítulo
                                </label>
                                <input
                                    type="text"
                                    value={form.subtitle}
                                    onChange={(event) => updateForm("subtitle", event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    placeholder="Presupuesto"
                                />
                                {errors.subtitle ? (
                                    <p className="mt-2 text-sm text-red-600">{errors.subtitle}</p>
                                ) : null}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-800">
                                    Título
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(event) => updateForm("title", event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    placeholder="Solicite su presupuesto"
                                />
                                {errors.title ? (
                                    <p className="mt-2 text-sm text-red-600">{errors.title}</p>
                                ) : null}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-800">
                                    Descripción
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(event) => updateForm("description", event.target.value)}
                                    rows={4}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    placeholder="Texto del bloque..."
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-800">
                                    Imagen
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => updateForm("image_file", event.target.files?.[0] ?? null)}
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                />
                                <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-amber-950">
                                        Recomendado: 1366 x 300 px · imagen entre
                                        2 y 3 MB · JPG, PNG o WEBP.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                                        Texto del botón
                                    </label>
                                    <input
                                        type="text"
                                        value={form.button_text}
                                        onChange={(event) => updateForm("button_text", event.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                        placeholder="Solicitar presupuesto"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                                        URL del botón
                                    </label>
                                    <input
                                        type="text"
                                        value={form.button_url}
                                        onChange={(event) => updateForm("button_url", event.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                        placeholder="/presupuesto"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                                        Orden
                                    </label>
                                    <input
                                        type="text"
                                        value={form.sort_order}
                                        onChange={(event) => updateForm("sort_order", event.target.value.toUpperCase().slice(0, 16))}
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                        placeholder="F"
                                    />
                                </div>

                                <div className="flex items-end">
                                    <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={form.is_active}
                                            onChange={(event) => updateForm("is_active", event.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                                        />
                                        Bloque activo en home
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <Icon icon="solar:diskette-outline" width={18} />
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    </form>
                </section>
            </div>

            <PublicPreviewModal
                open={previewOpen}
                title="Home pública"
                url={publicHomeUrl}
                onClose={() => setPreviewOpen(false)}
            />
        </AdminLayout>
    );
}

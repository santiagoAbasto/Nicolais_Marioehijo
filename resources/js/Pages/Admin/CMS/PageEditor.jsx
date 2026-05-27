import AdminLayout from "@/Layouts/AdminLayout";
import RichTextEditor from "@/Components/Admin/RichTextEditor";
import { router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";

function emptySection(order) {
    return {
        id: null,
        section_key: "",
        title: "",
        subtitle: "",
        description: "",
        meta: {},
        order,
        is_active: true,
        media: [],
    };
}

function sectionMetaToText(meta) {
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
        return "{}";
    }

    return JSON.stringify(meta, null, 2);
}

function nextOrder(items) {
    const fallback = String.fromCharCode(65 + items.length);
    const last = items
        .map((item) => item.order)
        .filter(Boolean)
        .sort()
        .at(-1);

    if (!last) {
        return fallback;
    }

    return String.fromCharCode(last.charCodeAt(0) + 1);
}

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function MediaCard({ media, onDelete }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{media.type}</p>
                    <p className="mt-1 text-sm text-slate-600">{media.alt_text || "Sin texto alternativo"}</p>
                </div>
                <button
                    type="button"
                    onClick={onDelete}
                    className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                >
                    Eliminar
                </button>
            </div>

            {media.type === "youtube" && media.youtube_embed && (
                <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-black">
                    <iframe
                        src={media.youtube_embed}
                        title={media.alt_text || "Video de YouTube"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                    />
                </div>
            )}

            {media.type === "image" && media.file_url && (
                <img
                    src={media.file_url}
                    alt={media.alt_text || "Media"}
                    className="h-44 w-full rounded-2xl object-cover"
                    draggable={false}
                    onContextMenu={(event) => event.preventDefault()}
                />
            )}

            {media.type === "video" && media.file_url && (
                <video
                    src={media.file_url}
                    controls
                    className="h-44 w-full rounded-2xl bg-black object-cover"
                />
            )}
        </div>
    );
}

function SectionEditor({ section, onChange, onSave, onDelete, isBusy }) {
    const [metaText, setMetaText] = useState(sectionMetaToText(section.meta));
    const [mediaType, setMediaType] = useState("image");
    const [mediaFile, setMediaFile] = useState(null);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [altText, setAltText] = useState("");
    const [mediaError, setMediaError] = useState("");

    useEffect(() => {
        setMetaText(sectionMetaToText(section.meta));
    }, [section.meta]);

    const saveSection = () => {
        let parsedMeta = {};

        try {
            parsedMeta = metaText.trim() === "" ? {} : JSON.parse(metaText);
        } catch {
            setMediaError("El JSON de metadata no es válido.");
            return;
        }

        setMediaError("");
        onSave({
            ...section,
            meta: parsedMeta,
        });
    };

    const uploadMedia = async () => {
        setMediaError("");

        try {
            const payload = new FormData();
            payload.append("type", mediaType);
            payload.append("alt_text", altText);
            payload.append("order", nextOrder(section.media));
            payload.append("is_active", "1");

            if (mediaType === "youtube") {
                payload.append("youtube_url", youtubeUrl);
            } else if (mediaFile) {
                payload.append("file", mediaFile);
            }

            await axios.post(`/admin/sections/${section.id}/media`, payload, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setMediaFile(null);
            setYoutubeUrl("");
            setAltText("");
            router.reload({ only: ["page", "admin"] });
        } catch (error) {
            setMediaError(error?.response?.data?.message || "No se pudo guardar la media.");
        }
    };

    const deleteMedia = async (mediaId) => {
        if (!window.confirm("¿Eliminar este archivo?")) return;

        await axios.delete(`/admin/section-media/${mediaId}`);
        router.reload({ only: ["page", "admin"] });
    };

    return (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Sección</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900">{section.section_key || "Nueva sección"}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={saveSection}
                        disabled={isBusy}
                        className="rounded-2xl bg-[#25A7CA] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                    >
                        Guardar sección
                    </button>
                    {section.id && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                        >
                            Eliminar
                        </button>
                    )}
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Clave interna</span>
                    <input
                        type="text"
                        value={section.section_key}
                        onChange={(event) => onChange({ ...section, section_key: event.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                    />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                    <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Orden</span>
                        <input
                            type="text"
                            value={section.order || ""}
                            onChange={(event) => onChange({ ...section, order: event.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <input
                            type="checkbox"
                            checked={!!section.is_active}
                            onChange={(event) => onChange({ ...section, is_active: event.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                        />
                        <span className="text-sm font-medium text-slate-700">Sección activa</span>
                    </label>
                </div>
            </div>

            <div className="mt-5 space-y-5">
                <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Título</p>
                    <RichTextEditor
                        value={section.title || ""}
                        onChange={(value) => onChange({ ...section, title: value })}
                        placeholder="Título enriquecido"
                    />
                </div>

                <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Subtítulo</p>
                    <RichTextEditor
                        value={section.subtitle || ""}
                        onChange={(value) => onChange({ ...section, subtitle: value })}
                        placeholder="Subtítulo enriquecido"
                    />
                </div>

                <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Contenido / descripción</p>
                    <RichTextEditor
                        value={section.description || ""}
                        onChange={(value) => onChange({ ...section, description: value })}
                        placeholder="Contenido enriquecido"
                    />
                </div>

                <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Metadata JSON</span>
                    <textarea
                        value={metaText}
                        onChange={(event) => setMetaText(event.target.value)}
                        rows={6}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                    />
                </label>
            </div>

            {section.id && (
                <div className="mt-8 border-t border-slate-100 pt-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Media asociada</h3>
                        <span className="text-xs text-slate-400">Imagen, video local o YouTube</span>
                    </div>

                    <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[180px,minmax(0,1fr)]">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Tipo</label>
                            <select
                                value={mediaType}
                                onChange={(event) => setMediaType(event.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                            >
                                <option value="image">Imagen</option>
                                <option value="video">Video</option>
                                <option value="youtube">YouTube</option>
                            </select>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),220px,auto]">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                    {mediaType === "youtube" ? "URL de YouTube" : "Archivo"}
                                </label>
                                {mediaType === "youtube" ? (
                                    <input
                                        type="url"
                                        value={youtubeUrl}
                                        onChange={(event) => setYoutubeUrl(event.target.value)}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    />
                                ) : (
                                    <input
                                        type="file"
                                        accept={mediaType === "image" ? "image/png,image/jpeg,image/webp,image/gif" : "video/mp4,video/webm,video/ogg,video/quicktime"}
                                        onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-3 file:font-medium file:text-[#25A7CA] hover:file:bg-[#25A7CA]/20"
                                    />
                                )}
                            </div>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-slate-700">Texto alternativo</span>
                                <input
                                    type="text"
                                    value={altText}
                                    onChange={(event) => setAltText(event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </label>

                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={uploadMedia}
                                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                                >
                                    Subir
                                </button>
                            </div>
                        </div>
                    </div>

                    {mediaError && <p className="mt-3 text-sm text-red-500">{mediaError}</p>}

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                        {section.media.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-400">
                                Esta sección todavía no tiene media.
                            </div>
                        )}
                        {section.media.map((media) => (
                            <MediaCard key={media.id} media={media} onDelete={() => deleteMedia(media.id)} />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

export default function PageEditor({ page, pageLabel }) {
    const [pageForm, setPageForm] = useState({
        name: page.name || "",
        slug: page.slug || "",
        meta_title: page.meta_title || "",
        meta_description: page.meta_description || "",
        meta_keywords: page.meta_keywords || "",
        is_active: !!page.is_active,
    });
    const [sections, setSections] = useState(page.sections || []);
    const [busySectionId, setBusySectionId] = useState(null);
    const [statusMessage, setStatusMessage] = useState("");
    const sectionCount = useMemo(() => sections.length, [sections]);

    useEffect(() => {
        setSections(page.sections || []);
        setPageForm({
            name: page.name || "",
            slug: page.slug || "",
            meta_title: page.meta_title || "",
            meta_description: page.meta_description || "",
            meta_keywords: page.meta_keywords || "",
            is_active: !!page.is_active,
        });
    }, [page]);

    const savePage = async () => {
        try {
            await axios.post(`/admin/pages/${page.id}`, pageForm);
            setStatusMessage("Página guardada correctamente.");
            router.reload({ only: ["page", "admin"] });
        } catch (error) {
            setStatusMessage(error?.response?.data?.message || "No se pudo guardar la página.");
        }
    };

    const addSection = () => {
        setSections((current) => [...current, emptySection(nextOrder(current))]);
    };

    const updateSectionState = (index, next) => {
        setSections((current) => current.map((section, currentIndex) => (currentIndex === index ? next : section)));
    };

    const saveSection = async (section) => {
        setBusySectionId(section.id ?? "new");

        try {
            if (section.id) {
                await axios.post(`/admin/sections/${section.id}`, section);
            } else {
                await axios.post("/admin/pages/" + page.id + "/sections", {
                    ...section,
                    page_id: page.id,
                });
            }

            setStatusMessage("Sección guardada correctamente.");
            router.reload({ only: ["page", "admin"] });
        } catch (error) {
            setStatusMessage(error?.response?.data?.message || "No se pudo guardar la sección.");
        } finally {
            setBusySectionId(null);
        }
    };

    const deleteSection = async (section) => {
        if (!section.id) {
            setSections((current) => current.filter((candidate) => candidate !== section));
            return;
        }

        if (!window.confirm("¿Eliminar esta sección?")) return;

        setBusySectionId(section.id);

        try {
            await axios.delete(`/admin/sections/${section.id}`);
            setStatusMessage("Sección eliminada correctamente.");
            router.reload({ only: ["page", "admin"] });
        } finally {
            setBusySectionId(null);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold text-[#25A7CA]">
                                <Icon icon="solar:pen-new-square-outline" width={14} />
                                Editor dinámico
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{pageLabel}</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Todo este contenido sale de base de datos. Esta pantalla administra SEO, secciones y media sin tocar código.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Slug</p>
                                <p className="mt-1 text-sm font-medium text-slate-700">{page.slug}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Secciones</p>
                                <p className="mt-1 text-sm font-medium text-slate-700">{sectionCount}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {statusMessage && (
                    <section className="rounded-[24px] border border-[#25A7CA]/20 bg-[#25A7CA]/8 px-5 py-4 text-sm text-slate-700">
                        {statusMessage}
                    </section>
                )}

                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">SEO y datos base</h2>
                            <p className="mt-1 text-sm text-slate-500">Reutiliza el sistema de metadatos existente y deja la página lista para indexación.</p>
                        </div>
                        <button
                            type="button"
                            onClick={savePage}
                            className="rounded-2xl bg-[#25A7CA] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d96b8]"
                        >
                            Guardar página
                        </button>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Nombre interno</span>
                            <input
                                type="text"
                                value={pageForm.name}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setPageForm((current) => ({ ...current, name: value, slug: slugify(value) }));
                                }}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Meta title</span>
                            <input
                                type="text"
                                value={pageForm.meta_title}
                                onChange={(event) => setPageForm((current) => ({ ...current, meta_title: event.target.value }))}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Meta keywords</span>
                            <input
                                type="text"
                                value={pageForm.meta_keywords}
                                onChange={(event) => setPageForm((current) => ({ ...current, meta_keywords: event.target.value }))}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                        </label>

                        <label className="space-y-2 xl:col-span-2">
                            <span className="text-sm font-medium text-slate-700">Meta description</span>
                            <textarea
                                value={pageForm.meta_description}
                                onChange={(event) => setPageForm((current) => ({ ...current, meta_description: event.target.value }))}
                                rows={4}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                        </label>

                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 xl:col-span-2">
                            <input
                                type="checkbox"
                                checked={pageForm.is_active}
                                onChange={(event) => setPageForm((current) => ({ ...current, is_active: event.target.checked }))}
                                className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                            />
                            <span className="text-sm font-medium text-slate-700">Página activa</span>
                        </label>
                    </div>
                </section>

                <section className="flex flex-col gap-3 rounded-[30px] border border-dashed border-slate-300 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Secciones dinámicas</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Usa tantas secciones como necesites. Home puede llevar hero, banner, resumen y bloques intermedios.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={addSection}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#25A7CA] hover:text-[#25A7CA]"
                    >
                        <Icon icon="solar:add-circle-outline" width={18} />
                        Nueva sección
                    </button>
                </section>

                {sections.map((section, index) => (
                    <SectionEditor
                        key={section.id ?? `draft-${index}`}
                        section={section}
                        onChange={(next) => updateSectionState(index, next)}
                        onSave={saveSection}
                        onDelete={() => deleteSection(section)}
                        isBusy={busySectionId === section.id || busySectionId === "new"}
                    />
                ))}
            </div>
        </AdminLayout>
    );
}

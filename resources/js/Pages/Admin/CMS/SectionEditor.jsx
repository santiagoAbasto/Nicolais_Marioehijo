import AdminLayout from "@/Layouts/AdminLayout";
import ImageUploadField from "@/Components/Admin/ImageUploadField";
import RichTextEditor from "@/Components/Admin/RichTextEditor";
import { emitAdminToast } from "@/lib/adminToast";
import { router } from "@inertiajs/react";
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

function ClientTypeModal({ client, nextOrder, onClose, onSuccess }) {
    const isEdit = !!client;
    const [form, setForm] = useState({
        name: client?.name || "",
        slug: client?.slug || "",
        icon: null,
        icon_width: client?.icon_width || "",
        icon_height: client?.icon_height || "",
        order: client?.order || nextOrder || "A",
        is_active: client?.is_active ?? true,
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        const payload = new FormData();
        payload.append("name", form.name);
        payload.append("slug", slugify(form.name));
        payload.append("order", form.order);
        payload.append("is_active", form.is_active ? "1" : "0");
        payload.append("icon_width", form.icon_width);
        payload.append("icon_height", form.icon_height);
        if (form.icon) payload.append("icon", form.icon);

        try {
            await axios.post(isEdit ? `/admin/client-types/${client.id}` : "/admin/client-types", payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            emitAdminToast(isEdit ? "Tipo de cliente actualizado." : "Tipo de cliente creado.", "success");
            onSuccess();
        } catch (error) {
            if (error?.response?.status === 422) {
                setErrors(error.response.data.errors ?? {});
            }
            emitAdminToast(error?.response?.data?.message ?? "No se pudo guardar el tipo de cliente.", "error");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h2 className="text-base font-semibold text-gray-800">{isEdit ? "Editar tipo de cliente" : "Nuevo tipo de cliente"}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icon icon="solar:close-circle-outline" width={20} />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-5 px-6 py-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Nombre</span>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setForm((current) => ({
                                        ...current,
                                        name: value,
                                        slug: slugify(value),
                                    }));
                                }}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Orden</span>
                            <input
                                type="text"
                                value={form.order}
                                onChange={(event) => setForm((current) => ({ ...current, order: event.target.value.toUpperCase() }))}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                        </label>

                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
                            <span className="text-sm font-medium text-slate-700">Visible en la web</span>
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Ancho del ícono</span>
                            <input
                                type="number"
                                value={form.icon_width}
                                onChange={(event) => setForm((current) => ({ ...current, icon_width: event.target.value }))}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Alto del ícono</span>
                            <input
                                type="number"
                                value={form.icon_height}
                                onChange={(event) => setForm((current) => ({ ...current, icon_height: event.target.value }))}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                        </label>
                    </div>

                    <ImageUploadField
                        label="Ícono"
                        currentUrl={client?.icon_url || null}
                        onChange={(file) => setForm((current) => ({ ...current, icon: file }))}
                        specs={{ maxMB: 2, formats: ["SVG", "PNG", "JPG", "WEBP"] }}
                        error={errors.icon}
                    />

                    <div className="flex justify-end gap-3 border-t border-gray-50 pt-3">
                        <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={processing} className="rounded-xl bg-[#25A7CA] px-5 py-2 text-sm font-medium text-white hover:bg-[#1d96b8] disabled:opacity-60">
                            {processing ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear tipo"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function normalizeMeta(field, value) {
    if (field.type === "list") {
        return Array.isArray(value) ? value.join("\n") : "";
    }

    if (field.type === "phone_list") {
        if (!Array.isArray(value)) return "";

        return value
            .map((item) => {
                if (typeof item === "string") return item;
                const label = item?.label?.trim?.() ?? "";
                const number = item?.number?.trim?.() ?? "";
                return label ? `${label} | ${number}` : number;
            })
            .filter(Boolean)
            .join("\n");
    }

    return value ?? "";
}

function denormalizeMeta(field, value) {
    if (field.type === "number") {
        return value === "" ? null : Number(value);
    }

    if (field.type === "list") {
        return String(value)
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    if (field.type === "phone_list") {
        return String(value)
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
            .map((line) => {
                const [label, ...rest] = line.split("|");
                const number = rest.join("|").trim();

                if (rest.length === 0) {
                    return { label: "", number: label.trim() };
                }

                return { label: label.trim(), number };
            })
            .filter((item) => item.number);
    }

    return value;
}

function buildMetaState(fields, meta) {
    return fields.reduce((accumulator, field) => {
        accumulator[field.key] = normalizeMeta(field, meta?.[field.key] ?? field.default ?? "");
        return accumulator;
    }, {});
}

function renderInput(field, value, onChange) {
    if (field.type === "richtext") {
        return (
            <RichTextEditor
                value={value}
                onChange={onChange}
                placeholder={field.placeholder ?? ""}
            />
        );
    }

    if (field.type === "textarea" || field.type === "list" || field.type === "phone_list") {
        return (
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                rows={field.type === "textarea" ? 5 : 4}
                placeholder={field.placeholder ?? ""}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
            />
        );
    }

    return (
        <input
            type={field.type === "number" ? "number" : "text"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder ?? ""}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
        />
    );
}

function MediaPreview({ media, onDelete }) {
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
                        title={media.alt_text || "Video"}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            )}

            {media.type === "image" && media.file_url && (
                <img
                    src={media.file_url}
                    alt={media.alt_text || "Imagen"}
                    className="h-44 w-full rounded-2xl object-cover"
                />
            )}

            {media.type === "video" && media.file_url && (
                <video src={media.file_url} controls className="h-44 w-full rounded-2xl bg-black object-cover" />
            )}
        </div>
    );
}

function alphaOrderSegments(value) {
    const normalized = String(value || "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "");

    if (!normalized) return [0];

    return normalized.split("").map((char) => char.charCodeAt(0) - 64);
}

function compareAlphaOrder(left, right) {
    const leftSegments = alphaOrderSegments(left);
    const rightSegments = alphaOrderSegments(right);
    const max = Math.max(leftSegments.length, rightSegments.length);

    for (let index = 0; index < max; index += 1) {
        const leftValue = leftSegments[index] ?? 0;
        const rightValue = rightSegments[index] ?? 0;

        if (leftValue === rightValue) continue;

        return leftValue - rightValue;
    }

    return 0;
}

function incrementAlphaOrder(value) {
    const normalized = String(value || "A")
        .toUpperCase()
        .replace(/[^A-Z]/g, "");

    if (!normalized) return "A";

    if (normalized.length === 1) {
        return `${normalized}A`;
    }

    const first = normalized.slice(0, -1);
    const last = normalized.slice(-1);

    if (last !== "Z") {
        return `${first}${String.fromCharCode(last.charCodeAt(0) + 1)}`;
    }

    const prefix = first.length === 1 ? first : incrementAlphaOrder(first);

    return prefix.length === 1 ? prefix : `${prefix}A`;
}

function SlideCard({ slide, onChange, onSave, onDelete, busy }) {
    return (
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{slide.type}</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{slide.title?.replace(/<[^>]+>/g, "") || "Slide sin título"}</p>
                </div>
                <button
                    type="button"
                    onClick={onDelete}
                    className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                >
                    Eliminar
                </button>
            </div>

            {slide.type === "youtube" && slide.youtube_embed && (
                <div className="mb-4 aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-black">
                    <iframe
                        src={slide.youtube_embed}
                        title={slide.title || "Slide"}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            )}

            {slide.type === "image" && slide.file_url && (
                <img src={slide.file_url} alt={slide.alt_text || slide.title || "Slide"} className="mb-4 h-44 w-full rounded-2xl object-cover" />
            )}

            {slide.type === "video" && slide.file_url && (
                <video src={slide.file_url} controls className="mb-4 h-44 w-full rounded-2xl bg-black object-cover" />
            )}

            <div className="grid gap-5">
                <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Título principal</p>
                    <RichTextEditor
                        value={slide.title || ""}
                        onChange={(value) => onChange({ ...slide, title: value })}
                        placeholder="Título del slide"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Texto del botón</span>
                        <input
                            type="text"
                            value={slide.button_text || ""}
                            onChange={(event) => onChange({ ...slide, button_text: event.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                    </label>

                    <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Enlace del botón</span>
                        <input
                            type="text"
                            value={slide.button_url || ""}
                            onChange={(event) => onChange({ ...slide, button_url: event.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                    </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Orden</span>
                        <input
                            type="text"
                            value={slide.order || ""}
                            onChange={(event) => onChange({ ...slide, order: event.target.value.toUpperCase() })}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                    </label>

                    <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Texto alternativo</span>
                        <input
                            type="text"
                            value={slide.alt_text || ""}
                            onChange={(event) => onChange({ ...slide, alt_text: event.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <input
                            type="checkbox"
                            checked={!!slide.is_active}
                            onChange={(event) => onChange({ ...slide, is_active: event.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                        />
                        <span className="text-sm font-medium text-slate-700">Slide activo</span>
                    </label>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={busy}
                        className="rounded-xl bg-[#25A7CA] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                    >
                        Guardar slide
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SectionEditor({ editor, page, section, clientTypes = [] }) {
    const isHomeSliderEditor = editor.page_slug === "home" && editor.editor_slug === "sliders";
    const isSimpleImageBlockEditor = !!editor.image_only_media;
    const isNormasContentEditor = editor.page_slug === "normas" && editor.editor_slug === "contenido";
    const isClientsContentEditor = editor.page_slug === "clientes" && editor.editor_slug === "contenido";
    const isContactFormEditor = editor.page_slug === "contacto" && editor.editor_slug === "formulario";
    const isQuoteFormEditor = editor.page_slug === "presupuesto" && editor.editor_slug === "formulario";
    const [pageForm, setPageForm] = useState({
        name: page.name || "",
        slug: page.slug || "",
        meta_title: page.meta_title || "",
        meta_description: page.meta_description || "",
        meta_keywords: page.meta_keywords || "",
        is_active: !!page.is_active,
    });
    const [sectionForm, setSectionForm] = useState({
        id: section?.id ?? null,
        section_key: section?.section_key ?? editor.section_key ?? "",
        title: section?.title ?? "",
        subtitle: section?.subtitle ?? "",
        description: section?.description ?? "",
        order: section?.order ?? "A",
        is_active: !!section?.is_active,
    });
    const [metaForm, setMetaForm] = useState(buildMetaState(editor.meta_fields ?? [], section?.meta ?? {}));
    const [status, setStatus] = useState("");
    const [mediaType, setMediaType] = useState("image");
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaUrl, setMediaUrl] = useState("");
    const [mediaTitle, setMediaTitle] = useState("");
    const [mediaButtonText, setMediaButtonText] = useState("");
    const [mediaButtonUrl, setMediaButtonUrl] = useState("");
    const [mediaAlt, setMediaAlt] = useState("");
    const [logoAlt, setLogoAlt] = useState("");
    const [busy, setBusy] = useState(false);
    const [clientTypeModalOpen, setClientTypeModalOpen] = useState(false);
    const [editingClientType, setEditingClientType] = useState(null);
    const [mediaItems, setMediaItems] = useState(() =>
        [...(section?.media ?? [])].sort((left, right) => compareAlphaOrder(left.order, right.order)),
    );

    const hasSection = !!editor.section_key;
    const allowsMultipleMedia = editor.media_mode === "multiple";
    const currentSingleMedia = !allowsMultipleMedia ? mediaItems[0] ?? null : null;

    const nextMediaOrder = useMemo(() => {
        if (mediaItems.length === 0) return "A";
        const last = [...mediaItems]
            .map((item) => item.order)
            .filter(Boolean)
            .sort(compareAlphaOrder)
            .at(-1);

        if (!last) return "A";
        return incrementAlphaOrder(last);
    }, [mediaItems]);

    const mainNormasMedia = useMemo(
        () => (isNormasContentEditor ? [...mediaItems].sort((left, right) => compareAlphaOrder(left.order, right.order))[0] ?? null : null),
        [isNormasContentEditor, mediaItems],
    );

    const normasLogos = useMemo(
        () => (isNormasContentEditor
            ? [...mediaItems]
                .sort((left, right) => compareAlphaOrder(left.order, right.order))
                .slice(1)
            : []),
        [isNormasContentEditor, mediaItems],
    );

    const nextClientTypeOrder = useMemo(() => {
        if (!clientTypes.length) return "A";
        const last = [...clientTypes]
            .map((item) => item.order)
            .filter(Boolean)
            .sort(compareAlphaOrder)
            .at(-1);

        return last ? incrementAlphaOrder(last) : "A";
    }, [clientTypes]);

    useEffect(() => {
        setPageForm({
            name: page.name || "",
            slug: page.slug || "",
            meta_title: page.meta_title || "",
            meta_description: page.meta_description || "",
            meta_keywords: page.meta_keywords || "",
            is_active: !!page.is_active,
        });

        setSectionForm({
            id: section?.id ?? null,
            section_key: section?.section_key ?? editor.section_key ?? "",
            title: section?.title ?? "",
            subtitle: section?.subtitle ?? "",
            description: section?.description ?? "",
            order: section?.order ?? "A",
            is_active: !!section?.is_active,
        });

        setMetaForm(buildMetaState(editor.meta_fields ?? [], section?.meta ?? {}));
        setMediaItems([...(section?.media ?? [])].sort((left, right) => compareAlphaOrder(left.order, right.order)));
    }, [page, section, editor]);

    const savePage = async () => {
        setBusy(true);
        setStatus("");

        try {
            await axios.post(`/admin/pages/${page.id}`, pageForm);
            const message = "La página se guardó correctamente.";
            setStatus(message);
            emitAdminToast(message, "success");
            router.reload({ only: ["page", "section", "editor", "admin"] });
        } catch (error) {
            const message = error?.response?.data?.message ?? "No se pudo guardar la página.";
            setStatus(message);
            emitAdminToast(message, "error");
        } finally {
            setBusy(false);
        }
    };

    const saveSection = async () => {
        if (!hasSection) return;

        setBusy(true);
        setStatus("");

        const metaPayload = (editor.meta_fields ?? []).reduce((accumulator, field) => {
            accumulator[field.key] = denormalizeMeta(field, metaForm[field.key]);
            return accumulator;
        }, {});

        const payload = {
            ...sectionForm,
            page_id: page.id,
            meta: metaPayload,
        };

        try {
            if (sectionForm.id) {
                await axios.post(`/admin/sections/${sectionForm.id}`, payload);
            } else {
                await axios.post(`/admin/pages/${page.id}/sections`, payload);
            }

            const message = "La sección se guardó correctamente.";
            setStatus(message);
            emitAdminToast(message, "success");
            router.reload({ only: ["page", "section", "editor", "admin"] });
        } catch (error) {
            const message = error?.response?.data?.message ?? "No se pudo guardar la sección.";
            setStatus(message);
            emitAdminToast(message, "error");
        } finally {
            setBusy(false);
        }
    };

    const uploadMedia = async () => {
        if (!hasSection || !sectionForm.id) {
            const message = "Primero guarda esta sección para poder subir archivos.";
            setStatus(message);
            emitAdminToast(message, "info");
            return;
        }

        setBusy(true);
        setStatus("");

        const payload = new FormData();
        payload.append("type", isSimpleImageBlockEditor ? "image" : mediaType);
        payload.append("title", mediaTitle);
        payload.append("button_text", mediaButtonText);
        payload.append("button_url", mediaButtonUrl);
        payload.append("alt_text", mediaAlt);
        payload.append("order", currentSingleMedia ? currentSingleMedia.order ?? "A" : nextMediaOrder);
        payload.append("is_active", "1");

        if (!isSimpleImageBlockEditor && mediaType === "youtube") {
            payload.append("youtube_url", mediaUrl);
        } else if (mediaFile) {
            payload.append("file", mediaFile);
        }

        try {
            if (!allowsMultipleMedia && currentSingleMedia) {
                payload.append("type", mediaType);
                await axios.post(`/admin/section-media/${currentSingleMedia.id}`, payload, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                await axios.post(`/admin/sections/${sectionForm.id}/media`, payload, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            setMediaFile(null);
            setMediaUrl("");
            setMediaTitle("");
            setMediaButtonText("");
            setMediaButtonUrl("");
            setMediaAlt("");
            const message = "La multimedia se guardó correctamente.";
            setStatus(message);
            emitAdminToast(message, "success");
            router.reload({ only: ["page", "section", "editor", "admin"] });
        } catch (error) {
            const message = error?.response?.data?.message ?? "No se pudo guardar la multimedia.";
            setStatus(message);
            emitAdminToast(message, "error");
        } finally {
            setBusy(false);
        }
    };

    const saveMedia = async (slide) => {
        setBusy(true);
        setStatus("");

        try {
            await axios.post(`/admin/section-media/${slide.id}`, {
                type: slide.type,
                title: slide.title,
                description: slide.description,
                button_text: slide.button_text,
                button_url: slide.button_url,
                alt_text: slide.alt_text,
                order: slide.order,
                youtube_url: slide.type === "youtube" ? slide.youtube_url : null,
                is_active: slide.is_active ? 1 : 0,
            });

            const message = "El slide se guardó correctamente.";
            setStatus(message);
            emitAdminToast(message, "success");
            router.reload({ only: ["page", "section", "editor", "admin"] });
        } catch (error) {
            const message = error?.response?.data?.message ?? "No se pudo guardar el slide.";
            setStatus(message);
            emitAdminToast(message, "error");
        } finally {
            setBusy(false);
        }
    };

    const deleteMedia = async (mediaId) => {
        if (!window.confirm("¿Eliminar este archivo?")) return;

        setBusy(true);
        setStatus("");

        try {
            await axios.delete(`/admin/section-media/${mediaId}`);
            const message = "La multimedia se eliminó correctamente.";
            setStatus(message);
            emitAdminToast(message, "success");
            router.reload({ only: ["page", "section", "editor", "admin"] });
        } catch (error) {
            const message = error?.response?.data?.message ?? "No se pudo eliminar la multimedia.";
            setStatus(message);
            emitAdminToast(message, "error");
        } finally {
            setBusy(false);
        }
    };

    const destroyClientType = async (clientType) => {
        if (!window.confirm(`¿Eliminar "${clientType.name}"?`)) return;
        if (!clientType?.id) {
            emitAdminToast("No se pudo identificar el tipo de cliente a eliminar.", "error");
            return;
        }

        router.delete(`/admin/client-types/${clientType.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                emitAdminToast("Tipo de cliente eliminado.", "success");
                router.reload({ only: ["clientTypes", "page", "section", "editor", "admin"] });
            },
            onError: (errors) => {
                const message = errors?.message || "No se pudo eliminar el tipo de cliente.";
                emitAdminToast(message, "error");
            },
        });
    };

    const uploadNormasMainImage = async () => {
        if (!hasSection || !sectionForm.id) {
            const message = "Primero guarda esta sección para poder subir archivos.";
            setStatus(message);
            emitAdminToast(message, "info");
            return;
        }

        if (!mediaFile) {
            const message = "Selecciona una imagen principal.";
            setStatus(message);
            emitAdminToast(message, "info");
            return;
        }

        setBusy(true);
        setStatus("");

        const payload = new FormData();
        payload.append("type", "image");
        payload.append("file", mediaFile);
        payload.append("alt_text", mediaAlt);
        payload.append("order", "A");
        payload.append("is_active", "1");

        try {
            if (mainNormasMedia) {
                await axios.post(`/admin/section-media/${mainNormasMedia.id}`, payload, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                await axios.post(`/admin/sections/${sectionForm.id}/media`, payload, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            setMediaFile(null);
            setMediaAlt("");
            const message = "La imagen principal se guardó correctamente.";
            setStatus(message);
            emitAdminToast(message, "success");
            router.reload({ only: ["page", "section", "editor", "admin"] });
        } catch (error) {
            const message = error?.response?.data?.message ?? "No se pudo guardar la imagen principal.";
            setStatus(message);
            emitAdminToast(message, "error");
        } finally {
            setBusy(false);
        }
    };

    const uploadNormasLogo = async () => {
        if (!hasSection || !sectionForm.id) {
            const message = "Primero guarda esta sección para poder subir archivos.";
            setStatus(message);
            emitAdminToast(message, "info");
            return;
        }

        if (!mediaFile) {
            const message = "Selecciona un logo.";
            setStatus(message);
            emitAdminToast(message, "info");
            return;
        }

        setBusy(true);
        setStatus("");

        const payload = new FormData();
        payload.append("type", "image");
        payload.append("file", mediaFile);
        payload.append("alt_text", logoAlt);
        payload.append("order", nextMediaOrder);
        payload.append("is_active", "1");

        try {
            await axios.post(`/admin/sections/${sectionForm.id}/media`, payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setMediaFile(null);
            setLogoAlt("");
            const message = "El logo se guardó correctamente.";
            setStatus(message);
            emitAdminToast(message, "success");
            router.reload({ only: ["page", "section", "editor", "admin"] });
        } catch (error) {
            const message = error?.response?.data?.message ?? "No se pudo guardar el logo.";
            setStatus(message);
            emitAdminToast(message, "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold text-[#25A7CA]">
                                <Icon icon="solar:widget-4-outline" width={14} />
                                Vista organizada
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{editor.title}</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">{editor.description}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Página</p>
                                <p className="mt-1 text-sm font-medium text-slate-700">{editor.page_label}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Bloque</p>
                                <p className="mt-1 text-sm font-medium text-slate-700">{editor.section_key ?? "SEO y ajustes"}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {status && (
                    <section className="rounded-[24px] border border-[#25A7CA]/20 bg-[#25A7CA]/8 px-5 py-4 text-sm text-slate-700">
                        {status}
                    </section>
                )}

                {editor.show_page_settings && (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">SEO y ajustes generales</h2>
                                <p className="mt-1 text-sm text-slate-500">Información base de la página.</p>
                            </div>
                            <button
                                type="button"
                                onClick={savePage}
                                disabled={busy}
                                className="rounded-2xl bg-[#25A7CA] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
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
                )}

                {hasSection && (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Contenido del bloque</h2>
                                <p className="mt-1 text-sm text-slate-500">Completa solo los campos que usa esta vista.</p>
                            </div>
                            <button
                                type="button"
                                onClick={saveSection}
                                disabled={busy}
                                className="rounded-2xl bg-[#25A7CA] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                            >
                                Guardar bloque
                            </button>
                        </div>

                        {!isHomeSliderEditor && !editor.hide_section_order && (
                            <div className="grid gap-5 lg:grid-cols-2">
                                <label className="space-y-2">
                                    <span className="text-sm font-medium text-slate-700">Orden</span>
                                    <input
                                        type="text"
                                        value={sectionForm.order}
                                        onChange={(event) => setSectionForm((current) => ({ ...current, order: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                                    />
                                </label>

                                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={sectionForm.is_active}
                                        onChange={(event) => setSectionForm((current) => ({ ...current, is_active: event.target.checked }))}
                                        className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Bloque activo</span>
                                </label>
                            </div>
                        )}

                        {!isHomeSliderEditor && editor.hide_section_order && (
                            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={sectionForm.is_active}
                                    onChange={(event) => setSectionForm((current) => ({ ...current, is_active: event.target.checked }))}
                                    className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                                />
                                <span className="text-sm font-medium text-slate-700">Bloque activo</span>
                            </label>
                        )}

                        {isHomeSliderEditor && (
                            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={sectionForm.is_active}
                                    onChange={(event) => setSectionForm((current) => ({ ...current, is_active: event.target.checked }))}
                                    className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                                />
                                <span className="text-sm font-medium text-slate-700">Bloque activo</span>
                            </label>
                        )}

                        {!isHomeSliderEditor && (
                            <div className="mt-5 space-y-5">
                                {!isQuoteFormEditor && (editor.fields ?? []).map((field) => (
                                    <div key={field.key}>
                                        <p className="mb-2 text-sm font-medium text-slate-700">{field.label}</p>
                                        {field.type === "richtext" ? (
                                            <RichTextEditor
                                                value={sectionForm[field.key] || ""}
                                                onChange={(value) => setSectionForm((current) => ({ ...current, [field.key]: value }))}
                                                placeholder={field.placeholder ?? ""}
                                            />
                                        ) : field.type === "textarea" ? (
                                            <textarea
                                                value={sectionForm[field.key] || ""}
                                                onChange={(event) => setSectionForm((current) => ({ ...current, [field.key]: event.target.value }))}
                                                rows={5}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={sectionForm[field.key] || ""}
                                                onChange={(event) => setSectionForm((current) => ({ ...current, [field.key]: event.target.value }))}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                                            />
                                        )}
                                    </div>
                                ))}

                                {(editor.meta_fields ?? []).length > 0 && (
                                    isContactFormEditor ? (
                                        <div className="grid gap-5 xl:grid-cols-2">
                                            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                                                <div className="mb-5">
                                                    <h3 className="text-lg font-semibold text-slate-900">Datos de contacto</h3>
                                                    <p className="mt-1 text-sm text-slate-500">Información visible al costado del formulario.</p>
                                                </div>

                                                <div className="space-y-5">
                                                    {(editor.meta_fields ?? [])
                                                        .filter((field) => ["email_title", "phone_title", "contact_emails", "contact_phones"].includes(field.key))
                                                        .map((field) => {
                                                            const wrapperClass = "space-y-2";
                                                            const Wrapper = field.type === "richtext" ? "div" : "label";

                                                            return (
                                                                <Wrapper key={field.key} className={wrapperClass}>
                                                                    <span className="text-sm font-medium text-slate-700">{field.label}</span>
                                                                    {renderInput(field, metaForm[field.key] ?? "", (value) =>
                                                                        setMetaForm((current) => ({ ...current, [field.key]: value })),
                                                                    )}
                                                                    {field.help && <p className="text-xs text-slate-400">{field.help}</p>}
                                                                </Wrapper>
                                                            );
                                                        })}
                                                </div>
                                            </div>

                                            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                                                <div className="mb-5">
                                                    <h3 className="text-lg font-semibold text-slate-900">Textos del formulario</h3>
                                                    <p className="mt-1 text-sm text-slate-500">Etiquetas y botón que ve el usuario al completar el formulario.</p>
                                                </div>

                                                <div className="space-y-5">
                                                    {(editor.meta_fields ?? [])
                                                        .filter((field) => !["email_title", "phone_title", "contact_emails", "contact_phones"].includes(field.key))
                                                        .map((field) => {
                                                            const wrapperClass = "space-y-2";
                                                            const Wrapper = field.type === "richtext" ? "div" : "label";

                                                            return (
                                                                <Wrapper key={field.key} className={wrapperClass}>
                                                                    <span className="text-sm font-medium text-slate-700">{field.label}</span>
                                                                    {renderInput(field, metaForm[field.key] ?? "", (value) =>
                                                                        setMetaForm((current) => ({ ...current, [field.key]: value })),
                                                                    )}
                                                                    {field.help && <p className="text-xs text-slate-400">{field.help}</p>}
                                                                </Wrapper>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : isQuoteFormEditor ? (
                                        <div className="space-y-5">
                                            <div className="grid gap-5 xl:grid-cols-2">
                                                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                                                    <div className="mb-5">
                                                        <h3 className="text-lg font-semibold text-slate-900">Bloque de contacto</h3>
                                                        <p className="mt-1 text-sm text-slate-500">Textos principales de la primera columna del formulario.</p>
                                                    </div>

                                                    <div className="space-y-5">
                                                        {(editor.fields ?? [])
                                                            .filter((field) => field.key === "title")
                                                            .map((field) => (
                                                                <label key={field.key} className="space-y-2">
                                                                    <span className="text-sm font-medium text-slate-700">{field.label}</span>
                                                                    {renderInput(field, sectionForm[field.key] || "", (value) =>
                                                                        setSectionForm((current) => ({ ...current, [field.key]: value })),
                                                                    )}
                                                                </label>
                                                            ))}

                                                        {(editor.meta_fields ?? [])
                                                            .filter((field) => ["name_label", "last_name_label", "email_label", "phone_label"].includes(field.key))
                                                            .map((field) => (
                                                                <label key={field.key} className="space-y-2">
                                                                    <span className="text-sm font-medium text-slate-700">{field.label}</span>
                                                                    {renderInput(field, metaForm[field.key] ?? "", (value) =>
                                                                        setMetaForm((current) => ({ ...current, [field.key]: value })),
                                                                    )}
                                                                </label>
                                                            ))}
                                                    </div>
                                                </div>

                                                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                                                    <div className="mb-5">
                                                        <h3 className="text-lg font-semibold text-slate-900">Bloque de consulta</h3>
                                                        <p className="mt-1 text-sm text-slate-500">Textos visibles en la columna derecha del formulario.</p>
                                                    </div>

                                                    <div className="space-y-5">
                                                        {(editor.fields ?? [])
                                                            .filter((field) => field.key === "subtitle")
                                                            .map((field) => (
                                                                <label key={field.key} className="space-y-2">
                                                                    <span className="text-sm font-medium text-slate-700">{field.label}</span>
                                                                    {renderInput(field, sectionForm[field.key] || "", (value) =>
                                                                        setSectionForm((current) => ({ ...current, [field.key]: value })),
                                                                    )}
                                                                </label>
                                                            ))}

                                                        {(editor.meta_fields ?? [])
                                                            .filter((field) => ["service_label", "equipment_label", "message_label", "button_text"].includes(field.key))
                                                            .map((field) => (
                                                                <label key={field.key} className="space-y-2">
                                                                    <span className="text-sm font-medium text-slate-700">{field.label}</span>
                                                                    {renderInput(field, metaForm[field.key] ?? "", (value) =>
                                                                        setMetaForm((current) => ({ ...current, [field.key]: value })),
                                                                    )}
                                                                </label>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid gap-5 xl:grid-cols-2">
                                            {editor.meta_fields.map((field) => {
                                                const wrapperClass = `space-y-2 ${field.type === "textarea" || field.type === "list" || field.type === "phone_list" || field.type === "richtext" ? "xl:col-span-2" : ""}`;
                                                const Wrapper = field.type === "richtext" ? "div" : "label";

                                                return (
                                                <Wrapper
                                                    key={field.key}
                                                    className={wrapperClass}
                                                >
                                                    <span className="text-sm font-medium text-slate-700">{field.label}</span>
                                                    {renderInput(field, metaForm[field.key] ?? "", (value) =>
                                                        setMetaForm((current) => ({ ...current, [field.key]: value })),
                                                    )}
                                                    {field.help && <p className="text-xs text-slate-400">{field.help}</p>}
                                                </Wrapper>
                                            )})}
                                        </div>
                                    )
                                )}

                                {isSimpleImageBlockEditor && (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                                        En este bloque solo puedes cambiar la imagen y decidir si aparece o no en la web.
                                    </div>
                                )}

                                {isClientsContentEditor && (
                                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                                        <div className="mb-5 flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">Tipos de cliente</h3>
                                                <p className="mt-1 text-sm text-slate-500">Administra aquí mismo los rubros que se muestran debajo del título.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingClientType(null);
                                                    setClientTypeModalOpen(true);
                                                }}
                                                className="rounded-2xl bg-[#25A7CA] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d96b8]"
                                            >
                                                Nuevo tipo
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                            <table className="min-w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-slate-500">
                                                    <tr>
                                                        <th className="px-5 py-4 font-medium">Tipo</th>
                                                        <th className="px-5 py-4 font-medium">Slug</th>
                                                        <th className="px-5 py-4 font-medium">Orden</th>
                                                        <th className="px-5 py-4 font-medium">Estado</th>
                                                        <th className="px-5 py-4 text-right font-medium">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {clientTypes.length === 0 && (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">
                                                                No hay tipos de cliente cargados.
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {clientTypes.map((client) => (
                                                        <tr key={client.id} className="transition hover:bg-slate-50">
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                                                                        {client.icon_url ? (
                                                                            <img src={client.icon_url} alt={client.name} className="max-h-8 max-w-8 object-contain" />
                                                                        ) : (
                                                                            <Icon icon="solar:buildings-outline" width={18} className="text-slate-400" />
                                                                        )}
                                                                    </div>
                                                                    <p className="font-medium text-slate-800">{client.name}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 text-slate-500">{client.slug}</td>
                                                            <td className="px-5 py-4 text-slate-500">{client.order}</td>
                                                            <td className="px-5 py-4">
                                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${client.is_active ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}>
                                                                    {client.is_active ? "Activo" : "Inactivo"}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditingClientType(client);
                                                                            setClientTypeModalOpen(true);
                                                                        }}
                                                                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-[#25A7CA] hover:text-[#25A7CA]"
                                                                    >
                                                                        Editar
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => destroyClientType(client)}
                                                                        className="rounded-xl border border-red-100 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50"
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
                                    </div>
                                )}
                            </div>
                        )}

                        {isHomeSliderEditor && (
                            <div className="mt-5 rounded-[24px] border border-[#25A7CA]/15 bg-[#25A7CA]/5 px-5 py-4 text-sm text-slate-600">
                                Cada slide se administra por separado más abajo. Ahí puedes cargar la imagen, el texto, el botón y el orden de aparición.
                            </div>
                        )}
                    </section>
                )}

                {editor.media_mode !== "none" && hasSection && (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {isHomeSliderEditor ? "Slides del Home" : "Imágenes y videos"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {isHomeSliderEditor
                                        ? "Cada slide guarda su propia imagen, contenido, botón y orden."
                                        : allowsMultipleMedia
                                          ? "Puedes cargar varios archivos para esta vista."
                                          : "Esta vista usa un único archivo o video principal."}
                                </p>
                            </div>
                        </div>

                        {isNormasContentEditor ? (
                            <div className="grid gap-5 xl:grid-cols-2">
                                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Imagen principal</p>
                                        <p className="mt-1 text-sm text-slate-600">Esta imagen se muestra a la izquierda del contenido.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/gif"
                                            onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)}
                                            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-3 file:font-medium file:text-[#25A7CA] hover:file:bg-[#25A7CA]/20"
                                        />

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700">Texto alternativo</span>
                                            <input
                                                type="text"
                                                value={mediaAlt}
                                                onChange={(event) => setMediaAlt(event.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                            />
                                        </label>

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={uploadNormasMainImage}
                                                disabled={busy}
                                                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                                            >
                                                {mainNormasMedia ? "Reemplazar imagen" : "Guardar imagen"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        {mainNormasMedia ? (
                                            <MediaPreview media={mainNormasMedia} onDelete={() => deleteMedia(mainNormasMedia.id)} />
                                        ) : (
                                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-400">
                                                Todavía no hay imagen principal cargada.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Logos</p>
                                        <p className="mt-1 text-sm text-slate-600">Estos logos se muestran al lado del texto.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/gif"
                                            onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)}
                                            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-3 file:font-medium file:text-[#25A7CA] hover:file:bg-[#25A7CA]/20"
                                        />

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700">Texto alternativo</span>
                                            <input
                                                type="text"
                                                value={logoAlt}
                                                onChange={(event) => setLogoAlt(event.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                            />
                                        </label>

                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={uploadNormasLogo}
                                                disabled={busy}
                                                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                                            >
                                                Guardar logo
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-4">
                                        {normasLogos.length > 0 ? (
                                            normasLogos.map((media) => (
                                                <MediaPreview key={media.id} media={media} onDelete={() => deleteMedia(media.id)} />
                                            ))
                                        ) : (
                                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-400">
                                                Todavía no hay logos cargados.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                                    <div className="mb-5 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                {isHomeSliderEditor ? "Nuevo slide" : "Nueva multimedia"}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600">
                                                {isHomeSliderEditor
                                                    ? "Crea un slide completo con su archivo y contenido."
                                                    : "Carga el archivo principal de esta vista."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-[180px,minmax(0,1fr)]">
                                        {!isSimpleImageBlockEditor && (
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
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">
                                                {isSimpleImageBlockEditor ? "Imagen" : mediaType === "youtube" ? "URL de YouTube" : "Archivo"}
                                            </label>
                                            {!isSimpleImageBlockEditor && mediaType === "youtube" ? (
                                                <input
                                                    type="url"
                                                    value={mediaUrl}
                                                    onChange={(event) => setMediaUrl(event.target.value)}
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
                                    </div>

                                    {isHomeSliderEditor ? (
                                        <div className="mt-5 grid gap-5">
                                            <div>
                                                <p className="mb-2 text-sm font-medium text-slate-700">Título principal</p>
                                                <RichTextEditor
                                                    value={mediaTitle}
                                                    onChange={setMediaTitle}
                                                    placeholder="Título del slide"
                                                />
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <label className="space-y-2">
                                                    <span className="text-sm font-medium text-slate-700">Texto del botón</span>
                                                    <input
                                                        type="text"
                                                        value={mediaButtonText}
                                                        onChange={(event) => setMediaButtonText(event.target.value)}
                                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                                    />
                                                </label>

                                                <label className="space-y-2">
                                                    <span className="text-sm font-medium text-slate-700">Enlace del botón</span>
                                                    <input
                                                        type="text"
                                                        value={mediaButtonUrl}
                                                        onChange={(event) => setMediaButtonUrl(event.target.value)}
                                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                                    />
                                                </label>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-3">
                                                <label className="space-y-2">
                                                    <span className="text-sm font-medium text-slate-700">Orden sugerido</span>
                                                    <input
                                                        type="text"
                                                        value={nextMediaOrder}
                                                        readOnly
                                                        className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
                                                    />
                                                </label>

                                                <label className="space-y-2 md:col-span-2">
                                                    <span className="text-sm font-medium text-slate-700">Texto alternativo</span>
                                                    <input
                                                        type="text"
                                                        value={mediaAlt}
                                                        onChange={(event) => setMediaAlt(event.target.value)}
                                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ) : isSimpleImageBlockEditor ? null : (
                                        <div className="mt-5 grid gap-4 lg:grid-cols-[220px,220px,auto]">
                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-700">Título del archivo</span>
                                                <input
                                                    type="text"
                                                    value={mediaTitle}
                                                    onChange={(event) => setMediaTitle(event.target.value)}
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                                />
                                            </label>

                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-700">Texto alternativo</span>
                                                <input
                                                    type="text"
                                                    value={mediaAlt}
                                                    onChange={(event) => setMediaAlt(event.target.value)}
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                                />
                                            </label>
                                        </div>
                                    )}

                                    <div className="mt-5 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={uploadMedia}
                                            disabled={busy}
                                            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                                        >
                                            {currentSingleMedia && !allowsMultipleMedia ? "Reemplazar" : isHomeSliderEditor ? "Crear slide" : "Guardar"}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                                    {mediaItems.length === 0 && (
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-400">
                                            Todavía no hay archivos cargados para esta vista.
                                        </div>
                                    )}

                                    {[...mediaItems]
                                        .sort((left, right) => compareAlphaOrder(left.order, right.order))
                                        .map((media) => (
                                            isHomeSliderEditor ? (
                                                <SlideCard
                                                    key={media.id}
                                                    slide={media}
                                                    busy={busy}
                                                    onChange={(next) =>
                                                        setMediaItems((current) =>
                                                            current.map((item) => (item.id === media.id ? next : item)),
                                                        )
                                                    }
                                                    onSave={() => saveMedia(mediaItems.find((item) => item.id === media.id) ?? media)}
                                                    onDelete={() => deleteMedia(media.id)}
                                                />
                                            ) : (
                                                <MediaPreview key={media.id} media={media} onDelete={() => deleteMedia(media.id)} />
                                            )
                                        ))}
                                </div>
                            </>
                        )}
                    </section>
                )}
            </div>
            {isClientsContentEditor && clientTypeModalOpen && (
                <ClientTypeModal
                    client={editingClientType}
                    nextOrder={nextClientTypeOrder}
                    onClose={() => {
                        setClientTypeModalOpen(false);
                        setEditingClientType(null);
                    }}
                    onSuccess={() => {
                        setClientTypeModalOpen(false);
                        setEditingClientType(null);
                        router.reload({ only: ["clientTypes", "page", "section", "editor", "admin"] });
                    }}
                />
            )}
        </AdminLayout>
    );
}

import PublicPreviewModal from "@/Components/Admin/PublicPreviewModal";
import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState } from "react";

function buildYouTubeEmbed(url) {
    const clean = (url || "").trim();

    if (!clean) return "";

    if (
        clean.includes("youtube.com/embed/") ||
        clean.includes("youtube-nocookie.com/embed/")
    ) {
        return clean;
    }

    const match = clean.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/i,
    );

    if (!match) return "";

    return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1`;
}

function htmlToPlainText(value) {
    const input = String(value || "").trim();

    if (!input || !/<[^>]+>/.test(input)) {
        return input;
    }

    if (typeof window !== "undefined" && "DOMParser" in window) {
        const parser = new window.DOMParser();
        const doc = parser.parseFromString(input, "text/html");

        doc.querySelectorAll("br").forEach((node) => {
            node.replaceWith("\n");
        });

        doc.querySelectorAll("p, div, li, blockquote, h1, h2, h3, h4, h5, h6").forEach((node) => {
            if (node.nextSibling) {
                node.insertAdjacentText("afterend", "\n\n");
            }
        });

        return doc.body.textContent
            ?.replace(/\u00a0/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim() ?? "";
    }

    return input
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|blockquote|h[1-6])>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function buildFieldsMap(section) {
    return Object.fromEntries(
        (section?.fields ?? section?.fieldValues ?? section?.field_values ?? []).map(
            (field) => [field.field_key, field],
        ),
    );
}

function buildSection(section) {
    const fields = buildFieldsMap(section);

    return {
        id: section?.id ?? null,
        page_key: section?.page_key ?? "nosotros",
        section_key: section?.section_key ?? "",
        title: section?.title ?? "",
        subtitle: section?.subtitle ?? "",
        description: htmlToPlainText(section?.description ?? ""),
        button_text: section?.button_text ?? "",
        button_url: section?.button_url ?? "",
        media_id: section?.media_id ?? null,
        media_url: section?.media_url ?? "",
        secondary_media_id: section?.secondary_media_id ?? null,
        secondary_media_url: section?.secondary_media_url ?? "",
        image_file: null,
        video_file: null,
        media_type: fields.media_type?.field_value ?? "image",
        youtube_url: fields.youtube_url?.field_value ?? "",
        media_type_field_id: fields.media_type?.id ?? null,
        youtube_field_id: fields.youtube_url?.id ?? null,
        is_active: !!section?.is_active,
        sort_order: section?.sort_order ?? "A",
        fields,
        items: (section?.items ?? []).map((item) => ({
            id: item.id ?? null,
            item_key: item.item_key ?? "",
            title: item.title ?? "",
            description: item.description ?? "",
            media_id: item.media_id ?? null,
            media_url: item.media_url ?? "",
            image_file: null,
            is_active: !!item.is_active,
            sort_order: item.sort_order ?? "A",
        })),
    };
}

function findItemByKeys(items, keys, fallbackIndex = 0) {
    return (
        items.find((item) => keys.includes(item.item_key)) ?? items[fallbackIndex] ?? null
    );
}

function buildMissionVisionSection(section) {
    const base = buildSection(section);
    const missionItem = findItemByKeys(base.items, ["mision", "mission"], 0);
    const visionItem = findItemByKeys(base.items, ["vision"], 1);
    const missionLabel =
        base.fields.mision_label?.field_value ??
        base.fields.mision_title?.field_value ??
        missionItem?.title ??
        section?.title ??
        "Misión";
    const visionLabel =
        base.fields.vision_label?.field_value ??
        base.fields.vision_title?.field_value ??
        visionItem?.title ??
        section?.subtitle ??
        "Visión";

    return {
        ...base,
        mission_label: missionLabel,
        mission_title: missionLabel,
        mission_text:
            htmlToPlainText(
                base.fields.mision?.field_value ??
                    missionItem?.description ??
                    section?.description ??
                    "",
            ),
        vision_label: visionLabel,
        vision_title: visionLabel,
        vision_text:
            htmlToPlainText(
                base.fields.vision?.field_value ??
                    visionItem?.description ??
                    "",
            ),
        mission_label_field_id: base.fields.mision_label?.id ?? null,
        mission_title_field_id: base.fields.mision_title?.id ?? null,
        mission_text_field_id: base.fields.mision?.id ?? null,
        vision_label_field_id: base.fields.vision_label?.id ?? null,
        vision_title_field_id: base.fields.vision_title?.id ?? null,
        vision_text_field_id: base.fields.vision?.id ?? null,
    };
}

function buildValuesSection(section) {
    const base = buildSection(section);
    const valuesLabel =
        base.fields.valores_label?.field_value ??
        base.fields.valores_title?.field_value ??
        section?.title ??
        "Valores";

    return {
        ...base,
        values_label: valuesLabel,
        values_title: valuesLabel,
        values_text:
            htmlToPlainText(
                base.fields.valores?.field_value ??
                    section?.description ??
                    "",
            ),
        values_label_field_id: base.fields.valores_label?.id ?? null,
        values_title_field_id: base.fields.valores_title?.id ?? null,
        values_text_field_id: base.fields.valores?.id ?? null,
    };
}

function buildForm(sections) {
    return {
        intro: buildSection(sections?.intro),
        missionVision: buildMissionVisionSection(sections?.missionVision),
        values: buildValuesSection(sections?.values),
    };
}

function Field({ label, children, hint }) {
    return (
        <div className="block space-y-2">
            <div className="block text-sm font-semibold text-slate-800">
                {label}
            </div>
            {children}
            {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
        </div>
    );
}

function TextInput(props) {
    return (
        <input
            {...props}
            className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10 ${
                props.className ?? ""
            }`}
        />
    );
}

function TextArea(props) {
    return (
        <textarea
            {...props}
            className={`min-h-[160px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10 ${
                props.className ?? ""
            }`}
        />
    );
}

function Toggle({ checked, onChange, label }) {
    return (
        <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
            />
            <span>{label}</span>
        </label>
    );
}

function SectionCard({ icon, badge, title, description, children }) {
    return (
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <div className="border-b border-slate-200 pb-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                    <Icon icon={icon} width={14} />
                    {badge}
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                    {title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    {description}
                </p>
            </div>

            <div className="mt-6 space-y-5">{children}</div>
        </section>
    );
}

export default function AboutIndex({ sections, publicAboutUrl }) {
    const [form, setForm] = useState(() => buildForm(sections));
    const [saving, setSaving] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [introPreview, setIntroPreview] = useState(sections?.intro?.media_url ?? "");

    useEffect(() => {
        setForm(buildForm(sections));
        setIntroPreview(sections?.intro?.media_url ?? "");
    }, [sections]);

    useEffect(() => {
        if (!form.intro.image_file) {
            setIntroPreview(form.intro.media_url || "");
            return undefined;
        }

        const nextUrl = URL.createObjectURL(form.intro.image_file);
        setIntroPreview(nextUrl);

        return () => URL.revokeObjectURL(nextUrl);
    }, [form.intro.image_file, form.intro.media_url]);

    const updateSection = (sectionKey, field, value) => {
        setForm((current) => ({
            ...current,
            [sectionKey]: {
                ...current[sectionKey],
                [field]: value,
            },
        }));
    };

    const uploadMedia = async (file, title) => {
        const payload = new FormData();
        payload.append("file", file);
        payload.append("title", title || "Nosotros");

        const response = await axios.post("/admin/api/media-assets", payload, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data.id;
    };

    const saveSection = (sectionId, payload) =>
        axios.put(`/admin/api/site-sections/${sectionId}`, payload);

    const handleSave = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            let introMediaId = form.intro.media_id;

            if (form.intro.image_file) {
                introMediaId = await uploadMedia(
                    form.intro.image_file,
                    form.intro.title || "Intro Nosotros",
                );
            }

            await saveSection(form.intro.id, {
                page_key: "nosotros",
                section_key: "intro",
                title: form.intro.title || null,
                description: form.intro.description || null,
                media_id: introMediaId,
                sort_order: form.intro.sort_order,
                is_active: form.intro.is_active,
                field_values: [],
                items: [],
            });

            await saveSection(form.missionVision.id, {
                page_key: "nosotros",
                section_key: "mission_vision",
                title: form.missionVision.mission_label || null,
                subtitle: form.missionVision.vision_label || null,
                description: form.missionVision.mission_text || null,
                media_id: null,
                sort_order: form.missionVision.sort_order,
                is_active: form.missionVision.is_active,
                field_values: [
                    {
                        id: form.missionVision.mission_label_field_id,
                        field_key: "mision_label",
                        field_label: "mision_label",
                        field_type: "text",
                        field_value: form.missionVision.mission_label || "",
                        sort_order: "A",
                        is_active: true,
                    },
                    {
                        id: form.missionVision.mission_title_field_id,
                        field_key: "mision_title",
                        field_label: "mision_title",
                        field_type: "text",
                        field_value: form.missionVision.mission_label || "",
                        sort_order: "B",
                        is_active: true,
                    },
                    {
                        id: form.missionVision.mission_text_field_id,
                        field_key: "mision",
                        field_label: "mision",
                        field_type: "richtext",
                        field_value: form.missionVision.mission_text || "",
                        sort_order: "C",
                        is_active: true,
                    },
                    {
                        id: form.missionVision.vision_label_field_id,
                        field_key: "vision_label",
                        field_label: "vision_label",
                        field_type: "text",
                        field_value: form.missionVision.vision_label || "",
                        sort_order: "D",
                        is_active: true,
                    },
                    {
                        id: form.missionVision.vision_title_field_id,
                        field_key: "vision_title",
                        field_label: "vision_title",
                        field_type: "text",
                        field_value: form.missionVision.vision_label || "",
                        sort_order: "E",
                        is_active: true,
                    },
                    {
                        id: form.missionVision.vision_text_field_id,
                        field_key: "vision",
                        field_label: "vision",
                        field_type: "richtext",
                        field_value: form.missionVision.vision_text || "",
                        sort_order: "F",
                        is_active: true,
                    },
                ],
                items: [],
            });

            await saveSection(form.values.id, {
                page_key: "nosotros",
                section_key: "values",
                title: form.values.values_label || null,
                description: form.values.values_text || null,
                media_id: null,
                sort_order: form.values.sort_order,
                is_active: form.values.is_active,
                field_values: [
                    {
                        id: form.values.values_label_field_id,
                        field_key: "valores_label",
                        field_label: "valores_label",
                        field_type: "text",
                        field_value: form.values.values_label || "",
                        sort_order: "A",
                        is_active: true,
                    },
                    {
                        id: form.values.values_title_field_id,
                        field_key: "valores_title",
                        field_label: "valores_title",
                        field_type: "text",
                        field_value: form.values.values_label || "",
                        sort_order: "B",
                        is_active: true,
                    },
                    {
                        id: form.values.values_text_field_id,
                        field_key: "valores",
                        field_label: "valores",
                        field_type: "richtext",
                        field_value: form.values.values_text || "",
                        sort_order: "C",
                        is_active: true,
                    },
                ],
                items: [],
            });

            emitAdminToast("La página Nosotros se actualizó correctamente.");
            router.reload();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar la página Nosotros.",
                "error",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Nosotros" />

            <PublicPreviewModal
                open={previewOpen}
                title="Vista pública de Nosotros"
                url={publicAboutUrl}
                onClose={() => setPreviewOpen(false)}
            />

            <form onSubmit={handleSave} className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.16),_transparent_34%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_44%,#eef7fb_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    <Icon icon="solar:users-group-rounded-outline" width={14} />
                                    Nosotros / Página pública
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Editar Nosotros
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                    Desde acá administrás todo lo que hoy se ve
                                    en la web pública de Nosotros:
                                    presentación, misión, visión y valores.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => setPreviewOpen(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                >
                                    <Icon icon="solar:square-arrow-right-up-outline" width={18} />
                                    Ver página pública
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                >
                                    <Icon icon="solar:diskette-outline" width={18} />
                                    {saving
                                        ? "Guardando cambios..."
                                        : "Guardar página"}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-6">
                        <SectionCard
                            icon="solar:document-text-outline"
                            badge="Contenido"
                            title="Contenido principal"
                            description="Editá el bloque de presentación con su imagen lateral y el texto completo."
                        >
                            <Toggle
                                checked={form.intro.is_active}
                                onChange={(value) =>
                                    updateSection("intro", "is_active", value)
                                }
                                label="Mostrar bloque principal"
                            />

                            <Field label="Título">
                                <TextInput
                                    value={form.intro.title}
                                    onChange={(event) =>
                                        updateSection(
                                            "intro",
                                            "title",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Quienes somos"
                                />
                            </Field>

                            <Field
                                label="Contenido"
                                hint="Separá párrafos dejando una línea en blanco entre uno y otro."
                            >
                                <TextArea
                                    value={form.intro.description}
                                    onChange={(event) =>
                                        updateSection(
                                            "intro",
                                            "description",
                                            event.target.value,
                                        )
                                    }
                                    rows={12}
                                    placeholder="Contenido principal de la empresa..."
                                />
                            </Field>

                            <Field label="Imagen del contenido">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        updateSection(
                                            "intro",
                                            "image_file",
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                />
                                <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-amber-950">
                                        Recomendado: 600px x 600px. Peso máximo:
                                        10 MB.
                                    </p>
                                </div>
                            </Field>

                            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                                {introPreview ? (
                                    <img
                                        src={introPreview}
                                        alt={form.intro.title || "Nosotros"}
                                        className="h-[320px] w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-[320px] items-center justify-center px-6 text-center text-sm text-slate-500">
                                        Subí la imagen del bloque principal.
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        <SectionCard
                            icon="solar:target-outline"
                            badge="Misión y Visión"
                            title="Misión y visión"
                            description="Editá exactamente los dos bloques institucionales que hoy se muestran en la web pública."
                        >
                            <Toggle
                                checked={form.missionVision.is_active}
                                onChange={(value) =>
                                    updateSection(
                                        "missionVision",
                                        "is_active",
                                        value,
                                    )
                                }
                                label="Mostrar sección de misión y visión"
                            />

                            <div className="grid gap-5 xl:grid-cols-2">
                                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                    <h3 className="mb-4 text-lg font-semibold text-slate-900">
                                        Misión
                                    </h3>

                                    <div className="space-y-4">
                                        <Field label="Título">
                                            <TextInput
                                                value={form.missionVision.mission_label}
                                                onChange={(event) =>
                                                    updateSection(
                                                        "missionVision",
                                                        "mission_label",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Misión"
                                            />
                                        </Field>

                                        <Field label="Contenido">
                                            <TextArea
                                                value={form.missionVision.mission_text}
                                                onChange={(event) =>
                                                    updateSection(
                                                        "missionVision",
                                                        "mission_text",
                                                        event.target.value,
                                                    )
                                                }
                                                rows={8}
                                                placeholder="Contenido de misión"
                                            />
                                        </Field>
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                    <h3 className="mb-4 text-lg font-semibold text-slate-900">
                                        Visión
                                    </h3>

                                    <div className="space-y-4">
                                        <Field label="Título">
                                            <TextInput
                                                value={form.missionVision.vision_label}
                                                onChange={(event) =>
                                                    updateSection(
                                                        "missionVision",
                                                        "vision_label",
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Visión"
                                            />
                                        </Field>

                                        <Field label="Contenido">
                                            <TextArea
                                                value={form.missionVision.vision_text}
                                                onChange={(event) =>
                                                    updateSection(
                                                        "missionVision",
                                                        "vision_text",
                                                        event.target.value,
                                                    )
                                                }
                                                rows={8}
                                                placeholder="Contenido de visión"
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard
                            icon="solar:star-outline"
                            badge="Valores"
                            title="Valores"
                            description="Administrá el tercer bloque institucional tal como aparece hoy en la web pública."
                        >
                            <div className="flex flex-wrap items-center gap-3">
                                <Toggle
                                    checked={form.values.is_active}
                                    onChange={(value) =>
                                        updateSection(
                                            "values",
                                            "is_active",
                                            value,
                                        )
                                    }
                                    label="Mostrar sección de valores"
                                />
                            </div>

                            <Field label="Título">
                                <TextInput
                                    value={form.values.values_label}
                                    onChange={(event) =>
                                        updateSection(
                                            "values",
                                            "values_label",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Valores"
                                />
                            </Field>

                            <Field label="Contenido">
                                <TextArea
                                    value={form.values.values_text}
                                    onChange={(event) =>
                                        updateSection(
                                            "values",
                                            "values_text",
                                            event.target.value,
                                        )
                                    }
                                    rows={8}
                                    placeholder="Contenido del bloque de valores"
                                />
                            </Field>
                        </SectionCard>

                    </div>

                    <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Resumen
                            </p>
                            <h2 className="mt-3 text-xl font-semibold text-slate-900">
                                Qué estás editando
                            </h2>
                            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                                <p>
                                    El bloque principal de presentación con su
                                    imagen.
                                </p>
                                <p>Misión, visión y valores.</p>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-6 py-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Vista rápida
                                </p>
                                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                                    Estado actual
                                </h2>
                            </div>

                            <div className="space-y-4 px-6 py-5 text-sm text-slate-600">
                                <div className="flex items-center justify-between gap-4">
                                    <span>Contenido principal</span>
                                    <span className={form.intro.is_active ? "font-semibold text-emerald-600" : "font-semibold text-slate-400"}>
                                        {form.intro.is_active ? "Visible" : "Oculto"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <span>Misión y visión</span>
                                    <span className={form.missionVision.is_active ? "font-semibold text-emerald-600" : "font-semibold text-slate-400"}>
                                        {form.missionVision.is_active ? "Visible" : "Oculto"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <span>Valores</span>
                                    <span className={form.values.is_active ? "font-semibold text-emerald-600" : "font-semibold text-slate-400"}>
                                        {form.values.is_active ? "Visible" : "Oculto"}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 px-6 py-5">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                >
                                    <Icon icon="solar:diskette-outline" width={18} />
                                    {saving
                                        ? "Guardando cambios..."
                                        : "Guardar página"}
                                </button>
                            </div>
                        </section>
                    </aside>
                </div>
            </form>
        </AdminLayout>
    );
}

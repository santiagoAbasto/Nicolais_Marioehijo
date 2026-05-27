import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState } from "react";

const DEFAULT_ITEMS = [
    {
        item_key: "repuestos-transmision",
        title: "Catálogo Repuestos para transmisión",
        sort_order: "A",
    },
    {
        item_key: "tecnotransmissioni",
        title: "Catálogo Tecnotransmissioni",
        sort_order: "B",
    },
];

function normalizeItem(item, fallback, index) {
    return {
        id: item?.id ?? null,
        item_key: item?.item_key ?? fallback.item_key,
        title: item?.title ?? fallback.title,
        media_id: item?.media_id ?? null,
        media_url: item?.media_url ?? "",
        image_file: null,
        file_media_id: item?.file_media_id ?? null,
        file_media_url: item?.file_media_url ?? "",
        file_media_title: item?.file_media_title ?? "",
        file_file: null,
        sort_order: item?.sort_order ?? fallback.sort_order ?? String.fromCharCode(65 + index),
        is_active: item?.is_active ?? true,
    };
}

function buildItems(section) {
    const current = section?.items ?? [];

    return DEFAULT_ITEMS.map((fallback, index) => {
        const match = current.find((item) => item.item_key === fallback.item_key) ?? current[index];
        return normalizeItem(match, fallback, index);
    });
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

function CatalogFileCard({ item, index, onChange }) {
    const coverPreview = item.image_file ? URL.createObjectURL(item.image_file) : item.media_url;
    const fileLabel = item.file_file?.name || item.file_media_title || "Sin archivo cargado";

    return (
        <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="grid gap-0 lg:grid-cols-[183px_1fr]">
                <div className="h-[247px] bg-slate-100">
                    {coverPreview ? (
                        <img
                            src={coverPreview}
                            alt={item.title || "Tapa de catálogo"}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <Icon icon="solar:gallery-outline" width={42} />
                        </div>
                    )}
                </div>

                <div className="space-y-5 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#25A7CA]">
                                Catálogo {index + 1}
                            </p>
                            <h2 className="mt-1 text-xl font-semibold text-slate-950">
                                {item.title || "Sin título"}
                            </h2>
                        </div>
                        <label className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                            <input
                                type="checkbox"
                                checked={item.is_active}
                                onChange={(event) => onChange({ is_active: event.target.checked })}
                                className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                            />
                            Activo
                        </label>
                    </div>

                    <label className="block">
                        <span className="text-sm font-semibold text-slate-700">Título público</span>
                        <input
                            type="text"
                            value={item.title}
                            onChange={(event) => onChange({ title: event.target.value })}
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                <Icon icon="solar:gallery-add-outline" width={18} />
                                Imagen de tapa
                            </span>
                            <span className="mt-1 block text-xs font-semibold text-[#0072BB]">
                                Recomendado: 183px x 247px. Máximo 10 MB.
                            </span>
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                onChange={(event) => onChange({ image_file: event.target.files?.[0] ?? null })}
                                className="mt-3 block w-full text-xs text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-[#25A7CA]/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#117a98]"
                            />
                        </label>

                        <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                <Icon icon="solar:file-text-outline" width={18} />
                                Archivo PDF
                            </span>
                            <span className="mt-1 block truncate text-xs text-slate-500">
                                {fileLabel}
                            </span>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(event) => onChange({ file_file: event.target.files?.[0] ?? null })}
                                className="mt-3 block w-full text-xs text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-[#25A7CA]/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#117a98]"
                            />
                        </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {item.file_media_url ? (
                            <>
                                <a
                                    href={item.file_media_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#0072BB]"
                                >
                                    <Icon icon="solar:eye-outline" width={18} />
                                    Ver archivo actual
                                </a>
                                <a
                                    href={item.file_media_url}
                                    download
                                    className="inline-flex items-center gap-2 rounded-full bg-[#0072BB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#005d98]"
                                >
                                    <Icon icon="solar:download-minimalistic-outline" width={18} />
                                    Descargar
                                </a>
                            </>
                        ) : (
                            <span className="text-sm text-slate-500">
                                Cargá un PDF para activar el ojo y la descarga pública.
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function CatalogIndex({ catalogSection, publicCatalogUrl }) {
    const [items, setItems] = useState(() => buildItems(catalogSection));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setItems(buildItems(catalogSection));
    }, [catalogSection]);

    function updateItem(index, patch) {
        setItems((current) =>
            current.map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...patch } : item,
            ),
        );
    }

    async function handleSave() {
        setSaving(true);

        try {
            const nextItems = [];

            for (const item of items) {
                let mediaId = item.media_id;
                let fileMediaId = item.file_media_id;

                if (item.image_file) {
                    const imageAsset = await uploadAsset(item.image_file, `${item.title} - tapa`);
                    mediaId = imageAsset.id;
                }

                if (item.file_file) {
                    const fileAsset = await uploadAsset(item.file_file, item.title);
                    fileMediaId = fileAsset.id;
                }

                nextItems.push({
                    item_key: item.item_key,
                    title: item.title,
                    media_id: mediaId,
                    meta_json: {
                        file_media_id: fileMediaId,
                    },
                    sort_order: item.sort_order,
                    is_active: item.is_active,
                });
            }

            await axios.put(`/admin/api/site-sections/${catalogSection.id}`, {
                page_key: "catalogo",
                section_key: "catalog_files",
                title: "Catálogos",
                sort_order: "A",
                is_active: true,
                items: nextItems,
            });

            emitAdminToast("Catálogos actualizados correctamente.");
            router.reload({ only: ["catalogSection"] });
        } catch (error) {
            emitAdminToast(
                error.response?.data?.message ?? "No se pudieron guardar los catálogos.",
                "error",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <AdminLayout>
            <Head title="Catálogos" />

            <div className="space-y-6">
                <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#25A7CA]">
                                Página pública
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
                                Catálogos
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Subí las dos tapas y sus PDFs. En la web se muestran como tarjetas con vista en línea y descarga.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <a
                                href={publicCatalogUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#0072BB]"
                            >
                                <Icon icon="solar:eye-outline" width={18} />
                                Ver /catalogo
                            </a>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#0072BB] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,114,187,0.24)] transition hover:bg-[#005d98] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Icon icon={saving ? "solar:refresh-outline" : "solar:diskette-outline"} width={18} />
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6">
                    {items.map((item, index) => (
                        <CatalogFileCard
                            key={item.item_key}
                            item={item}
                            index={index}
                            onChange={(patch) => updateItem(index, patch)}
                        />
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}

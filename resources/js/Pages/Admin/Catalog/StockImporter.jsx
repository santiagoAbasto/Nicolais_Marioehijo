import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useRef, useState } from "react";

function StatCard({ label, value, icon, tone = "cyan" }) {
    const tones = {
        cyan: "bg-[#25A7CA]/10 text-[#117a98]",
        emerald: "bg-emerald-100 text-emerald-700",
        amber: "bg-amber-100 text-amber-700",
    };

    return (
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
                    <Icon icon={icon} width={22} />
                </div>
            </div>
        </article>
    );
}

function formatDate(value) {
    if (!value) return "Sin fecha";

    return new Intl.DateTimeFormat("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(value));
}

function statusLabel(status) {
    const labels = {
        uploaded: "Subido",
        staged: "Procesado",
        needs_mapping: "Con omitidos",
        needs_review: "Revisar",
        ready_to_publish: "Listo",
        published: "Fusionado",
        failed: "Falló",
    };

    return labels[status] ?? status;
}

function statusTone(status) {
    if (status === "published") return "bg-emerald-100 text-emerald-700";
    if (status === "failed") return "bg-rose-100 text-rose-700";
    if (status === "needs_mapping" || status === "needs_review") return "bg-amber-100 text-amber-700";

    return "bg-slate-100 text-slate-600";
}

export default function StockImporter({
    stats = {},
    batches = [],
    latestOmissions = { count: 0, items: [] },
    latestMissingGradeGroups = {
        count: 0,
        summary: { families_count: 0, materials_count: 0, shapes_count: 0 },
        families: [],
        items: [],
    },
}) {
    const fileInputRef = useRef(null);
    const form = useForm({ file: null });
    const flash = usePage().props.flash ?? {};
    const [preview, setPreview] = useState(null);
    const [previewError, setPreviewError] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewFingerprint, setPreviewFingerprint] = useState(null);
    const canExport = Boolean(stats.can_export);

    function fileFingerprint(file) {
        if (!file) return null;

        return [file.name, file.size, file.lastModified].join(":");
    }

    function submit(event) {
        event.preventDefault();

        if (!form.data.file) return;

        if (previewFingerprint !== fileFingerprint(form.data.file)) {
            setPreviewError("Primero generá el preview del archivo actual para revisar qué productos son nuevos y cuáles ya existen.");

            return;
        }

        form.post("/admin/productos/excel-stock", {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset("file");
                setPreview(null);
                setPreviewError("");
                setPreviewFingerprint(null);

                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            },
        });
    }

    function clearSelectedFile() {
        form.clearErrors("file");
        form.setData("file", null);
        setPreview(null);
        setPreviewError("");
        setPreviewFingerprint(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function previewImport() {
        if (!form.data.file) return;

        setPreviewLoading(true);
        setPreviewError("");

        try {
            const payload = new FormData();
            payload.append("file", form.data.file);

            const response = await window.axios.post("/admin/productos/excel-stock/preview", payload, {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "multipart/form-data",
                },
            });

            setPreview(response.data);
            setPreviewFingerprint(fileFingerprint(form.data.file));
        } catch (error) {
            setPreview(null);
            setPreviewFingerprint(null);
            setPreviewError(
                error?.response?.data?.errors?.file?.[0]
                ?? error?.response?.data?.message
                ?? "No pudimos generar el preview del Excel de stock.",
            );
        } finally {
            setPreviewLoading(false);
        }
    }

    function destroyPublishedCatalog() {
        if (!stats.imports && !stats.published_rows) return;
        if (!confirm("Se va a limpiar todo el catálogo de productos: materiales, normas, stock, formas, historial y web pública. Las imágenes se conservan para la próxima carga. ¿Continuar?")) return;

        router.delete("/admin/productos/publicado", {
            preserveScroll: true,
        });
    }

    function reprocessLatest() {
        if (!stats.imports) return;
        if (!confirm("Se va a reprocesar el último lote de stock contra la taxonomía actual para intentar resolver grados que antes no existían. ¿Continuar?")) return;

        router.post("/admin/productos/excel-stock/reprocesar-ultimo", {}, {
            preserveScroll: true,
        });
    }

    return (
        <AdminLayout>
            <Head title="Excel de stock" />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.18),_transparent_34%),linear-gradient(135deg,#ffffff_0%,#f6f9fb_48%,#eef8fb_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#117a98]">
                                    <Icon icon="solar:database-bold-duotone" width={14} />
                                    Productos / stock
                                </div>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Importador de stock por grado
                                </h1>
                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    Subí el Excel de productos en stock. El sistema usa <strong>Nombre Material</strong> como nombre del grado,
                                    acepta valores alfanuméricos y fusiona únicamente las filas cuyo grado ya existe en la base.
                                </p>
                            </div>
                            <div className="rounded-[28px] bg-white/70 p-4 text-[#117a98] shadow-sm ring-1 ring-[#25A7CA]/15">
                                <Icon icon="solar:file-check-bold-duotone" width={42} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <StatCard label="Importaciones" value={stats.imports ?? 0} icon="solar:history-bold-duotone" />
                    <StatCard label="Stock visible en web" value={stats.published_rows ?? 0} icon="solar:check-circle-bold-duotone" tone="emerald" />
                    <StatCard label="Último Excel sin grado" value={stats.pending_grade_rows ?? 0} icon="solar:danger-triangle-bold-duotone" tone="amber" />
                </section>

                {flash.success ? (
                    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800 shadow-sm">
                        {flash.success}
                    </div>
                ) : null}

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Carga masiva</p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Subir Excel de productos en stock</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    El Excel 2026 reconoce columnas como <strong>IDProducto</strong>, <strong>CódigoMaterial</strong>,
                                    <strong>FamiliaForma</strong>, <strong>Material</strong>, <strong>Forma</strong>, <strong>Descripción</strong>,
                                    <strong>A_Pedido</strong>, <strong>Oferta</strong>, <strong>NOPublicar</strong>, <strong>Tipo</strong>,
                                    <strong>Precio lista</strong>, <strong>Precio con descuento</strong>, <strong>Precio venta</strong>,
                                    <strong>Cantidad</strong>, <strong>Subtotal</strong> y <strong>Vista público</strong>.
                                    Si el grado existe, se actualiza el producto asociado del show público. Lo que no venga en el nuevo Excel queda inactivo para no mostrar stock viejo.
                                </p>
                            </div>
                            <div className="rounded-2xl bg-[#25A7CA]/10 p-3 text-[#117a98]">
                                <Icon icon="solar:upload-bold-duotone" width={26} />
                            </div>
                        </div>

                        <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5">
                            <label className="block space-y-3">
                                <span className="text-sm font-semibold text-slate-800">Archivo Excel</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(event) => {
                                        form.setData("file", event.target.files?.[0] ?? null);
                                        setPreview(null);
                                        setPreviewError("");
                                        setPreviewFingerprint(null);
                                    }}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-3 file:font-medium file:text-[#25A7CA]"
                                />
                            </label>
                            {form.errors.file ? <p className="mt-2 text-xs text-rose-500">{form.errors.file}</p> : null}
                            {previewError ? <p className="mt-2 text-xs text-amber-600">{previewError}</p> : null}
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={previewImport}
                                disabled={previewLoading || form.processing || !form.data.file}
                                className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Icon icon="solar:eye-bold-duotone" width={18} />
                                {previewLoading ? "Analizando..." : "Ver preview"}
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing || previewLoading || !form.data.file || previewFingerprint !== fileFingerprint(form.data.file)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition hover:-translate-y-0.5 hover:bg-[#1f8da8] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Icon icon="solar:upload-bold-duotone" width={18} />
                                {form.processing ? "Fusionando..." : "Fusionar stock"}
                            </button>
                            <button
                                type="button"
                                onClick={clearSelectedFile}
                                disabled={!form.data.file || form.processing}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Icon icon="solar:close-circle-bold-duotone" width={18} />
                                Limpiar archivo
                            </button>
                            <button
                                type="button"
                                onClick={reprocessLatest}
                                disabled={!stats.imports || form.processing}
                                className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Icon icon="solar:restart-bold-duotone" width={18} />
                                Reprocesar ultimo lote
                            </button>
                            <a
                                href={canExport ? "/admin/productos/excel-stock/exportar" : undefined}
                                aria-disabled={!canExport}
                                onClick={(event) => {
                                    if (!canExport) event.preventDefault();
                                }}
                                className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                                    canExport
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
                                        : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                                }`}
                            >
                                <Icon icon="solar:download-bold-duotone" width={18} />
                                Exportar Excel actual
                            </a>
                            {!canExport ? (
                                <p className="text-xs text-slate-500">
                                    Si limpiás el catálogo, la exportación queda deshabilitada hasta subir un Excel nuevo.
                                </p>
                            ) : null}
                            <button
                                type="button"
                                onClick={destroyPublishedCatalog}
                                disabled={form.processing || (!stats.imports && !stats.published_rows)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} />
                                Limpiar todo el catálogo
                            </button>
                            <p className="text-xs text-slate-500">
                                Las filas sin grado quedan omitidas para revisión; no se crean grados automáticamente.
                            </p>
                        </div>

                        {preview ? (
                            <section className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/60 p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Preview antes de fusionar</p>
                                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Altas nuevas vs filas existentes</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            Revisá enseguida qué filas son realmente nuevas y cuáles ya existen por stock actual o por historial técnico importado.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Nuevas: {preview.new_rows_count ?? 0}</span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Existentes: {preview.existing_rows_count ?? 0}</span>
                                        <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Duplicadas en archivo: {preview.duplicate_rows_in_file_count ?? 0}</span>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 xl:grid-cols-3">
                                    {[
                                        { title: "Filas nuevas", items: preview.new_rows ?? [], empty: "No se detectaron filas nuevas.", tone: "emerald" },
                                        { title: "Filas ya existentes", items: preview.existing_rows ?? [], empty: "No hay coincidencias previas.", tone: "slate" },
                                        { title: "Duplicadas dentro del archivo", items: preview.duplicate_rows_in_file ?? [], empty: "No se detectaron filas repetidas.", tone: "rose" },
                                    ].map((group) => (
                                        <article key={group.title} className={`rounded-[24px] border p-5 ${
                                            group.tone === "emerald" ? "border-emerald-200 bg-emerald-50/60" :
                                            group.tone === "rose" ? "border-rose-200 bg-rose-50/60" :
                                            "border-slate-200 bg-white/80"
                                        }`}>
                                            <h4 className="text-sm font-semibold text-slate-900">{group.title}</h4>
                                            {group.items.length ? (
                                                <div className="mt-4 space-y-3">
                                                    {group.items.map((item, index) => (
                                                        <div key={`${group.title}-${item.row_number ?? index}-${index}`} className="rounded-2xl border border-white/80 bg-white/90 p-3">
                                                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                                <span>Fila {item.row_number ?? "—"}</span>
                                                                {item.id_producto ? <span>ID {item.id_producto}</span> : null}
                                                            </div>
                                                            <p className="mt-2 text-sm font-semibold text-slate-900">{item.material ?? "Sin material"}</p>
                                                            <p className="mt-1 text-xs text-slate-500">{item.shape ?? "Sin forma"} / {item.dimensions ?? "Sin dimensión"}</p>
                                                            <p className="mt-2 text-xs leading-5 text-slate-600">{item.reason}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="mt-4 text-sm text-slate-500">{group.empty}</p>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            </section>
                        ) : null}
                    </form>

                    <aside className="space-y-6">
                        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Regla de enlace</p>
                            <h2 className="mt-2 text-xl font-semibold text-slate-900">Nombre Material = Grado</h2>
                            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                                <p>Ejemplo: <strong>Incoloy 800H</strong> busca un grado activo con ese nombre o título corto.</p>
                                <p>Puede contener letras y números. Si no existe en la taxonomía, la fila no se publica.</p>
                                <p>La forma se resuelve con el mapeo existente o se crea como forma comercial básica para poder mostrar el producto asociado.</p>
                                <p>Si después cargaste grados nuevos desde el importador de materiales, usá <strong>Reprocesar último lote</strong> para volver a intentar el match sin subir otra vez el Excel.</p>
                                <p>Si necesitás empezar de cero, <strong>Eliminar todo lo publicado</strong> oculta web pública, formas y stock, pero conserva los IDs de imagen para recuperarlos al volver a cargar.</p>
                            </div>
                        </section>

                        <section className="rounded-[28px] border border-amber-200 bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">No visible en la web</p>
                                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Familia, forma y dimensión omitidas</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Esto corresponde a filas del último Excel que no llegaron a la web pública porque faltó mapear grado o forma,
                                        o porque la fila quedó inválida para publicar.
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                                    <Icon icon="solar:danger-triangle-bold-duotone" width={24} />
                                </div>
                            </div>

                            <div className="mt-5 rounded-[22px] border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                                Filas omitidas en el último lote: <strong>{latestOmissions.count ?? 0}</strong>
                            </div>

                            {latestOmissions.items?.length ? (
                                <div className="mt-5 space-y-3">
                                    {latestOmissions.items.map((item, index) => (
                                        <article key={`${item.row_number ?? index}-${index}`} className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                <span>Fila {item.row_number ?? "—"}</span>
                                                <span>{item.family ?? "Sin familia"}</span>
                                            </div>
                                            <p className="mt-2 text-sm font-semibold text-slate-900">
                                                {item.shape ?? "Sin forma"} <span className="font-normal text-slate-500">/ {item.dimensions ?? "Sin dimensión"}</span>
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-slate-500">
                                                Material: {item.material ?? "Sin Nombre Material"}
                                            </p>
                                            <p className="mt-2 text-xs leading-5 text-slate-600">
                                                {item.reason || "La fila no se pudo mostrar en la web pública con el mapeo actual."}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-5 text-sm leading-6 text-slate-500">
                                    El último Excel no dejó familias, formas o dimensiones omitidas para mostrar.
                                </p>
                            )}
                        </section>

                        <section className="rounded-[28px] border border-sky-200 bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Falta grado</p>
                                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Familias y formas que no entraron por Nombre Material</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Agrupamos las filas cuyo <strong>Nombre Material</strong> no encontró un grado activo en la base. Así el admin ve rápido qué familia, material y forma se está quedando afuera de la web pública.
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Si el grado ya existe en la web pero fue creado <strong>después</strong> de importar el stock, este panel puede seguir mostrando el faltante hasta reprocesar el último lote o volver a subir el Excel.
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                                    <Icon icon="solar:info-circle-bold-duotone" width={24} />
                                </div>
                            </div>

                            <div className="mt-5 rounded-[22px] border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
                                Filas del último lote sin grado encontrado: <strong>{latestMissingGradeGroups.count ?? 0}</strong>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-[20px] border border-sky-100 bg-slate-50/70 px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-700">Familias</p>
                                    <p className="mt-1 text-2xl font-semibold text-slate-900">{latestMissingGradeGroups.summary?.families_count ?? 0}</p>
                                </div>
                                <div className="rounded-[20px] border border-sky-100 bg-slate-50/70 px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-700">Materiales</p>
                                    <p className="mt-1 text-2xl font-semibold text-slate-900">{latestMissingGradeGroups.summary?.materials_count ?? 0}</p>
                                </div>
                                <div className="rounded-[20px] border border-sky-100 bg-slate-50/70 px-4 py-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-700">Formas</p>
                                    <p className="mt-1 text-2xl font-semibold text-slate-900">{latestMissingGradeGroups.summary?.shapes_count ?? 0}</p>
                                </div>
                            </div>

                            {latestMissingGradeGroups.families?.length ? (
                                <div className="mt-5 space-y-3">
                                    {latestMissingGradeGroups.families.map((family, index) => (
                                        <article key={`${family.family ?? index}-${index}`} className="rounded-[22px] border border-sky-100 bg-sky-50/40 p-4">
                                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
                                                <span>Desde fila {family.first_row_number ?? "—"}</span>
                                                <span>{family.rows_count ?? 0} fila{family.rows_count !== 1 ? "s" : ""}</span>
                                                <span>{family.materials_count ?? 0} material{family.materials_count !== 1 ? "es" : ""}</span>
                                                <span>{family.shapes_count ?? 0} forma{family.shapes_count !== 1 ? "s" : ""}</span>
                                            </div>
                                            <p className="mt-2 text-sm font-semibold text-slate-900">{family.family ?? "Sin familia"}</p>
                                            {family.sample_shapes?.length ? (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {family.sample_shapes.map((shape, shapeIndex) => (
                                                        <span
                                                            key={`${shape}-${shapeIndex}`}
                                                            className="rounded-full border border-sky-100 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700"
                                                        >
                                                            {shape}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}
                                            {family.sample_materials?.length ? (
                                                <p className="mt-2 text-xs leading-5 text-slate-600">
                                                    Materiales ejemplo: {family.sample_materials.join(", ")}
                                                </p>
                                            ) : null}
                                        </article>
                                    ))}
                                </div>
                            ) : null}

                            {latestMissingGradeGroups.items?.length ? (
                                <div className="mt-5 space-y-3">
                                    {latestMissingGradeGroups.items.map((item, index) => (
                                        <article key={`${item.first_row_number ?? index}-${item.material ?? index}-${index}`} className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                <span>Desde fila {item.first_row_number ?? "—"}</span>
                                                <span>{item.family ?? "Sin familia"}</span>
                                                <span>{item.rows_count ?? 0} fila{item.rows_count !== 1 ? "s" : ""}</span>
                                            </div>
                                            <p className="mt-2 text-sm font-semibold text-slate-900">
                                                {item.material ?? "Sin material"} <span className="font-normal text-slate-500">/ {item.shape ?? "Sin forma"}</span>
                                            </p>
                                            {item.sample_dimensions?.length ? (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {item.sample_dimensions.map((dimension, dimensionIndex) => (
                                                        <span
                                                            key={`${dimension}-${dimensionIndex}`}
                                                            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600"
                                                        >
                                                            {dimension}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}
                                            {item.sample_row_numbers?.length ? (
                                                <p className="mt-2 text-[11px] font-medium text-slate-500">
                                                    Filas ejemplo: {item.sample_row_numbers.join(", ")}
                                                </p>
                                            ) : null}
                                            <p className="mt-2 text-xs leading-5 text-slate-600">{item.reason}</p>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-5 text-sm leading-6 text-slate-500">
                                    El último Excel no dejó familias o formas sin grado para mostrar en este resumen.
                                </p>
                            )}
                        </section>

                        <section className="rounded-[28px] border border-rose-200 bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Zona de peligro</p>
                                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Limpieza total del catálogo</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Ahora el reseteo total vive en un solo botón. Limpia materiales, normas, stock, formas, historial y lo publicado en la web pública, pero conserva las imágenes.
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-rose-100 p-3 text-rose-600">
                                    <Icon icon="solar:trash-bin-trash-bold-duotone" width={24} />
                                </div>
                            </div>

                            <div className="mt-5 rounded-[22px] border border-rose-100 bg-rose-50 p-4 text-sm leading-6 text-rose-800">
                                Importaciones registradas: <strong>{stats.imports ?? 0}</strong>
                                <br />
                                Stock visible desde Excel: <strong>{stats.published_rows ?? 0}</strong>
                            </div>

                        </section>
                    </aside>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="border-b border-slate-100 pb-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Historial</p>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Últimas fusiones</h2>
                    </div>

                    <div className="mt-5 space-y-3">
                        {batches.length ? batches.map((batch) => (
                            <article key={batch.id} className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-slate-900">{batch.file_name}</p>
                                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(batch.status)}`}>
                                                {statusLabel(batch.status)}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            {formatDate(batch.created_at)} · Publicados en web: {batch.summary?.public_visible_rows ?? batch.summary?.published_rows ?? batch.success_rows ?? 0} · Ocultos: {batch.summary?.hidden_from_web_rows ?? 0} · Oferta: {batch.summary?.offer_flag_rows ?? 0} · Desactivados: {batch.summary?.deactivated_rows ?? 0} · Omitidos: {batch.summary?.skipped_rows ?? batch.failed_rows ?? 0}
                                        </p>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-500">{batch.total_rows ?? 0} filas</p>
                                </div>
                            </article>
                        )) : (
                            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                                Todavía no hay importaciones de stock.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

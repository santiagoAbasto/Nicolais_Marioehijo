import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useMemo, useRef, useState } from "react";

function StatCard({ label, value, icon, tone = "cyan" }) {
    const tones = {
        cyan: "bg-[#25A7CA]/10 text-[#117a98]",
        amber: "bg-amber-100 text-amber-700",
        rose: "bg-rose-100 text-rose-700",
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
    if (status === "completed") return "Importado";
    if (status === "processing") return "Procesando";
    if (status === "rolled_back") return "Revertido";
    if (status === "failed") return "Falló";

    return status;
}

function statusTone(status) {
    if (status === "completed") return "bg-emerald-100 text-emerald-700";
    if (status === "processing") return "bg-[#25A7CA]/10 text-[#117a98]";
    if (status === "rolled_back") return "bg-amber-100 text-amber-700";
    if (status === "failed") return "bg-rose-100 text-rose-700";

    return "bg-slate-100 text-slate-600";
}

function DiagnosticList({ title, count = 0, tone = "slate", items = [], emptyText, defaultOpen = false }) {
    const tones = {
        slate: {
            wrapper: "border-slate-200 bg-slate-50/70",
            badge: "bg-slate-100 text-slate-700",
        },
        amber: {
            wrapper: "border-amber-200 bg-amber-50/70",
            badge: "bg-amber-100 text-amber-700",
        },
        rose: {
            wrapper: "border-rose-200 bg-rose-50/70",
            badge: "bg-rose-100 text-rose-700",
        },
    };

    const palette = tones[tone] ?? tones.slate;

    return (
        <details open={defaultOpen} className={`group rounded-[24px] border p-5 ${palette.wrapper}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${palette.badge}`}>
                        {count}
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-white/90 shadow-sm">
                        <Icon
                            icon="solar:alt-arrow-down-outline"
                            width={16}
                            className="text-slate-500 transition-transform duration-200 group-open:rotate-180"
                        />
                    </span>
                </div>
            </summary>

            {items.length ? (
                <div className="mt-4 space-y-3">
                    {items.map((item, index) => (
                        <article key={`${title}-${item.row_number ?? index}-${index}`} className="rounded-2xl border border-white/80 bg-white/80 p-3">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                <span>Fila {item.row_number ?? "—"}</span>
                                <span>Familia: {item.family ?? "—"}</span>
                            </div>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                                {item.grade ?? "Sin grado"} <span className="font-normal text-slate-500">/ {item.series ?? "Sin serie"}</span>
                            </p>
                            {item.composition ? (
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                    Composición química: {item.composition}
                                </p>
                            ) : null}
                            <p className="mt-2 text-xs leading-5 text-slate-600">{item.reason}</p>
                        </article>
                    ))}
                </div>
            ) : (
                <p className="mt-4 text-sm leading-6 text-slate-500">{emptyText}</p>
            )}
        </details>
    );
}

function SummaryPill({ label, value, tone = "slate" }) {
    const tones = {
        slate: "bg-slate-100 text-slate-700",
        cyan: "bg-cyan-100 text-cyan-700",
        sky: "bg-sky-100 text-sky-700",
        emerald: "bg-emerald-100 text-emerald-700",
        amber: "bg-amber-100 text-amber-700",
        rose: "bg-rose-100 text-rose-700",
    };

    return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tones[tone] ?? tones.slate}`}>
            {label}: {value}
        </span>
    );
}

export default function ReferenceImporter({ stats, runs, acceptedFamilies }) {
    const fileInputRef = useRef(null);
    const uploadForm = useForm({
        file: null,
    });
    const [preview, setPreview] = useState(null);
    const [previewError, setPreviewError] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewFingerprint, setPreviewFingerprint] = useState(null);

    const flash = usePage().props.flash ?? {};
    const latestRun = runs?.[0] ?? null;
    const latestSummary = latestRun?.summary ?? {};
    const canExport = Boolean(stats.can_export);
    const latestDiagnosticGroups = useMemo(() => ([
        {
            title: "Filas incompletas",
            count: latestSummary.missing_required_rows ?? 0,
            tone: "rose",
            items: latestSummary.missing_required_samples ?? [],
            emptyText: "La última corrida no dejó filas afuera por falta de familia, serie o grado.",
        },
        {
            title: "Fuera de alcance",
            count: latestSummary.ignored_family_rows ?? 0,
            tone: "amber",
            items: latestSummary.ignored_family_samples ?? [],
            emptyText: "No hubo familias fuera de mapeo o fuera del alcance de importación en la última corrida.",
        },
        {
            title: "Normas sin match",
            count: latestSummary.norma_unmatched_rows ?? 0,
            tone: "slate",
            items: latestSummary.norma_unmatched_samples ?? [],
            emptyText: "La última corrida no dejó normas sin enganchar.",
        },
        {
            title: "Composición que no entró",
            count: latestSummary.composition_skipped_rows ?? 0,
            tone: "slate",
            items: latestSummary.composition_skipped_samples ?? [],
            emptyText: "La última corrida no dejó grados sin composición química por este flujo.",
        },
    ]), [latestSummary]);
    const previewCreationGroups = useMemo(() => (preview ? [
        { title: "Líneas nuevas", count: preview.new_lines_count ?? 0, tone: "cyan", items: preview.new_lines ?? [], emptyText: "No se crearán líneas nuevas." },
        { title: "Series nuevas", count: preview.new_series_count ?? 0, tone: "sky", items: preview.new_series ?? [], emptyText: "No se crearán series nuevas." },
        { title: "Grados nuevos", count: preview.new_grades_count ?? 0, tone: "emerald", items: preview.new_grades ?? [], emptyText: "No se crearán grados nuevos." },
        { title: "Mappings nuevos", count: preview.new_material_mappings_count ?? 0, tone: "amber", items: preview.new_material_mappings ?? [], emptyText: "No se crearán mappings nuevos." },
    ] : []), [preview]);
    const previewExistingGroups = useMemo(() => (preview ? [
        { title: "Líneas existentes", count: preview.existing_lines_count ?? 0, tone: "slate", items: preview.existing_lines ?? [], emptyText: "No hay líneas existentes en este archivo." },
        { title: "Series existentes", count: preview.existing_series_count ?? 0, tone: "slate", items: preview.existing_series ?? [], emptyText: "No hay series existentes en este archivo." },
        { title: "Grados existentes", count: preview.existing_grades_count ?? 0, tone: "slate", items: preview.existing_grades ?? [], emptyText: "No hay grados existentes en este archivo." },
        { title: "Mappings existentes", count: preview.existing_material_mappings_count ?? 0, tone: "slate", items: preview.existing_material_mappings ?? [], emptyText: "No hay mappings existentes en este archivo." },
    ] : []), [preview]);
    const previewDiagnosticGroups = useMemo(() => (preview ? [
        { title: "Filas incompletas", count: preview.missing_required_rows ?? 0, tone: "rose", items: preview.missing_required_samples ?? [], emptyText: "No hay filas incompletas." },
        { title: "Fuera de alcance", count: preview.ignored_family_rows ?? 0, tone: "amber", items: preview.ignored_family_samples ?? [], emptyText: "No hay filas fuera de alcance." },
        { title: "Normas sin match", count: preview.norma_unmatched_rows_count ?? 0, tone: "slate", items: preview.norma_unmatched_samples ?? [], emptyText: "Todas las normas del archivo encontraron match o la fila no traía normas." },
        { title: "Composición que no entra", count: preview.composition_skipped_rows ?? 0, tone: "slate", items: preview.composition_skipped_samples ?? [], emptyText: "Todas las filas con composición marcada traen datos útiles para importarla." },
        { title: "Duplicadas en el archivo", count: preview.duplicate_rows_in_file_count ?? 0, tone: "rose", items: preview.duplicate_rows_in_file ?? [], emptyText: "No hay filas repetidas dentro del archivo." },
    ] : []), [preview]);

    function fileFingerprint(file) {
        if (!file) return null;

        return [file.name, file.size, file.lastModified].join(":");
    }

    function submitImport(event) {
        event.preventDefault();

        if (!uploadForm.data.file) return;

        if (previewFingerprint !== fileFingerprint(uploadForm.data.file)) {
            setPreviewError("Primero generá el preview del archivo actual para revisar qué estructura nueva va a entrar.");

            return;
        }

        uploadForm.post("/admin/productos/importador", {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                uploadForm.reset("file");
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
        uploadForm.clearErrors("file");
        uploadForm.setData("file", null);
        setPreview(null);
        setPreviewError("");
        setPreviewFingerprint(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function handlePreview() {
        if (!uploadForm.data.file) return;

        setPreviewLoading(true);
        setPreviewError("");

        try {
            const payload = new FormData();
            payload.append("file", uploadForm.data.file);

            const response = await window.axios.post("/admin/productos/importador/preview", payload, {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "multipart/form-data",
                },
            });

            setPreview(response.data);
            setPreviewFingerprint(fileFingerprint(uploadForm.data.file));
        } catch (error) {
            setPreview(null);
            setPreviewFingerprint(null);
            setPreviewError(
                error?.response?.data?.errors?.file?.[0]
                ?? error?.response?.data?.message
                ?? "No pudimos generar el preview del Excel de materiales.",
            );
        } finally {
            setPreviewLoading(false);
        }
    }

    function destroyPublishedCatalog() {
        if (!stats.active_imports && !stats.runs) return;
        if (!confirm("Se va a limpiar todo el catálogo de productos: materiales, normas, stock, formas, historial y web pública. Las imágenes se conservan para la próxima carga. ¿Continuar?")) return;

        router.delete("/admin/productos/publicado", {
            preserveScroll: true,
        });
    }

    return (
        <AdminLayout>
            <Head title="Carga masiva de productos" />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.18),_transparent_34%),linear-gradient(135deg,#ffffff_0%,#f6f9fb_48%,#eef8fb_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#117a98]">
                                    <Icon icon="solar:upload-bold-duotone" width={14} />
                                    Carga controlada
                                </div>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Carga masiva de productos
                                </h1>
                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    Esta herramienta toma el Excel ancho de referencia, crea una <strong>línea por familia</strong>,
                                    una <strong>serie por subfamilia</strong> y un <strong>grado por producto</strong>,
                                    agrupando el resultado dentro de <strong>Metálicos</strong> y <strong>No metálicos</strong>.
                                    También deja trazado todo lo que crea o actualiza para poder
                                    revertir únicamente las pruebas.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {flash.success ? (
                    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800 shadow-sm">
                        {flash.success}
                    </div>
                ) : null}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Corridas registradas" value={stats.runs} icon="solar:history-bold-duotone" />
                    <StatCard label="Importaciones activas" value={stats.active_imports} icon="solar:box-bold-duotone" tone="amber" />
                    <StatCard label="Corridas revertidas" value={stats.rolled_back} icon="solar:trash-bin-trash-bold-duotone" tone="rose" />
                    <StatCard label="Filas crudas guardadas" value={stats.raw_rows} icon="solar:database-bold-duotone" />
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    {latestDiagnosticGroups.map((group) => (
                        <DiagnosticList key={group.title} {...group} defaultOpen={group.count > 0} />
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
                    <form onSubmit={submitImport} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Carga</p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Subir Excel</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Usá la planilla de referencia con hoja <strong>Materiales</strong>. Este importador arma
                                    la jerarquía familia/subfamilia/grado del Excel como línea/serie/grado públicos,
                                    además de densidad, UNS, normas, composición y mappings de material.
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {acceptedFamilies.map((family) => (
                                        <span
                                            key={family}
                                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600"
                                        >
                                            {family}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-2xl bg-[#25A7CA]/10 p-3 text-[#117a98]">
                                <Icon icon="solar:file-send-bold-duotone" width={26} />
                            </div>
                        </div>

                        <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5">
                            <label className="block space-y-3">
                                <span className="text-sm font-semibold text-slate-800">Archivo Excel</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(event) => {
                                        uploadForm.setData("file", event.target.files?.[0] ?? null);
                                        setPreview(null);
                                        setPreviewError("");
                                        setPreviewFingerprint(null);
                                    }}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-3 file:font-medium file:text-[#25A7CA]"
                                />
                            </label>
                            {uploadForm.errors.file ? (
                                <p className="mt-2 text-xs text-rose-500">{uploadForm.errors.file}</p>
                            ) : null}
                            {previewError ? <p className="mt-2 text-xs text-amber-600">{previewError}</p> : null}
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={handlePreview}
                                disabled={previewLoading || uploadForm.processing || !uploadForm.data.file}
                                className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Icon icon="solar:eye-bold-duotone" width={18} />
                                {previewLoading ? "Analizando..." : "Ver preview"}
                            </button>
                            <button
                                type="submit"
                                disabled={uploadForm.processing || previewLoading || !uploadForm.data.file || previewFingerprint !== fileFingerprint(uploadForm.data.file)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition hover:-translate-y-0.5 hover:bg-[#1f8da8] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Icon icon="solar:upload-bold-duotone" width={18} />
                                {uploadForm.processing ? "Importando..." : "Importar productos"}
                            </button>
                            <button
                                type="button"
                                onClick={clearSelectedFile}
                                disabled={!uploadForm.data.file || uploadForm.processing}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Icon icon="solar:close-circle-bold-duotone" width={18} />
                                Limpiar archivo
                            </button>
                            <a
                                href={canExport ? "/admin/productos/importador/exportar" : undefined}
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
                                disabled={uploadForm.processing || (!stats.active_imports && !stats.runs)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} />
                                Limpiar todo el catálogo
                            </button>
                            <p className="text-xs text-slate-500">
                                Cada fila aceptada guarda además todas sus columnas originales en crudo para auditoría y futuras ampliaciones del mapeo.
                            </p>
                        </div>

                        {preview ? (
                            <section className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/60 p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Preview antes de importar</p>
                                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Vista previa de altas, reuso y alertas</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            Antes de importar podés ver qué entra nuevo, qué ya existe en el catálogo y qué filas traen problemas de datos, normas o duplicados.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                        <SummaryPill label="Filas válidas" value={preview.processed_rows ?? 0} tone="slate" />
                                        <SummaryPill label="Nuevos grados" value={preview.new_grades_count ?? 0} tone="emerald" />
                                        <SummaryPill label="Grados existentes" value={preview.existing_grades_count ?? 0} tone="slate" />
                                        <SummaryPill label="Normas sin match" value={preview.norma_unmatched_rows_count ?? 0} tone="amber" />
                                        <SummaryPill label="Duplicadas" value={preview.duplicate_rows_in_file_count ?? 0} tone="rose" />
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-5 xl:grid-cols-3">
                                    <div className="space-y-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Entran nuevos</p>
                                        {previewCreationGroups.map((group) => (
                                            <DiagnosticList key={group.title} {...group} defaultOpen={group.count > 0} />
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ya existen</p>
                                        {previewExistingGroups.map((group) => (
                                            <DiagnosticList key={group.title} {...group} defaultOpen={false} />
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">No entran o necesitan revisión</p>
                                        {previewDiagnosticGroups.map((group) => (
                                            <DiagnosticList key={group.title} {...group} defaultOpen={group.count > 0} />
                                        ))}
                                    </div>
                                </div>
                            </section>
                        ) : null}
                    </form>

                    <section className="rounded-[28px] border border-rose-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">Zona de peligro</p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Limpieza total del catálogo</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Ahora el reseteo fuerte vive en un solo botón. Limpia materiales, normas, stock, formas, historial y lo publicado en la web pública, pero conserva las imágenes.
                                </p>
                            </div>
                            <div className="rounded-2xl bg-rose-100 p-3 text-rose-600">
                                <Icon icon="solar:trash-bin-trash-bold-duotone" width={26} />
                            </div>
                        </div>

                            <div className="mt-6 rounded-[24px] border border-rose-100 bg-rose-50 p-4 text-sm leading-6 text-rose-800">
                                Importaciones activas detectadas: <strong>{stats.active_imports}</strong>
                                <br />
                                Corridas registradas: <strong>{stats.runs}</strong>
                            </div>
                    </section>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Historial</p>
                            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Corridas recientes</h2>
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        {runs.length ? (
                            runs.map((run) => (
                                <article key={run.id} className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-semibold text-slate-900">{run.file_name}</p>
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(run.status)}`}>
                                                    {statusLabel(run.status)}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-xs text-slate-500">
                                                Familias: {(run.families ?? []).join(", ") || "Sin filtro"}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Inicio: {formatDate(run.created_at)}
                                            </p>
                                        </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
                                            <div className="rounded-2xl bg-white px-3 py-2">
                                                <strong className="block text-slate-900">{run.summary?.processed_rows ?? 0}</strong>
                                                Filas
                                            </div>
                                            <div className="rounded-2xl bg-white px-3 py-2">
                                                <strong className="block text-slate-900">{run.summary?.grades ?? 0}</strong>
                                                Grados
                                            </div>
                                            <div className="rounded-2xl bg-white px-3 py-2">
                                                <strong className="block text-slate-900">{run.summary?.composition_profiles ?? 0}</strong>
                                                Composición
                                            </div>
                                            <div className="rounded-2xl bg-white px-3 py-2">
                                                <strong className="block text-slate-900">{run.summary?.material_mappings ?? 0}</strong>
                                                Mappings
                                            </div>
                                            <div className="rounded-2xl bg-white px-3 py-2">
                                                <strong className="block text-slate-900">{run.summary?.raw_rows_saved ?? 0}</strong>
                                                Filas crudas
                                            </div>
                                            <div className="rounded-2xl bg-white px-3 py-2">
                                                <strong className="block text-slate-900">{run.headings_count ?? 0}</strong>
                                                Columnas
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                                Todavía no hay corridas del importador.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

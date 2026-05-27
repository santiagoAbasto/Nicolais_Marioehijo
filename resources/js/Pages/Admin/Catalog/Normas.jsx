import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useRef, useState } from "react";

function normalizeCatalogSearch(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function matchesNormaAssignmentSearch(norma, query) {
    const tokens = normalizeCatalogSearch(query)
        .split(/\s+/)
        .filter(Boolean);

    if (tokens.length === 0) {
        return true;
    }

    const haystack = normalizeCatalogSearch([
        norma?.nombre_emisor,
        norma?.norma,
        norma?.descripcion_corta,
    ].filter(Boolean).join(" "));

    return tokens.every((token) => haystack.includes(token));
}

function filterCatalogTree(catalogTree, query) {
    const needle = normalizeCatalogSearch(query);

    if (!needle) {
        return catalogTree;
    }

    return catalogTree.reduce((families, family) => {
        const familyMatches = normalizeCatalogSearch(family.name).includes(needle);
        const lines = (family.lines ?? []).reduce((lineAccumulator, line) => {
            const lineMatches = familyMatches || normalizeCatalogSearch(line.name).includes(needle);
            const series = (line.series ?? []).reduce((seriesAccumulator, series) => {
                const seriesMatches = lineMatches || normalizeCatalogSearch(series.name).includes(needle);
                const grades = (series.grades ?? []).filter((grade) => {
                    return seriesMatches || normalizeCatalogSearch(grade.name).includes(needle);
                });

                if (grades.length === 0) {
                    return seriesAccumulator;
                }

                seriesAccumulator.push({
                    ...series,
                    grades,
                });

                return seriesAccumulator;
            }, []);

            if (series.length === 0) {
                return lineAccumulator;
            }

            lineAccumulator.push({
                ...line,
                series,
            });

            return lineAccumulator;
        }, []);

        if (lines.length === 0) {
            return families;
        }

        families.push({
            ...family,
            lines,
        });

        return families;
    }, []);
}

function countGrades(catalogTree) {
    return catalogTree.reduce(
        (sum, family) => sum + (family.lines ?? []).reduce((lineSum, line) => lineSum + (line.series ?? []).reduce((seriesSum, series) => seriesSum + (series.grades ?? []).length, 0), 0),
        0,
    );
}

function collectLineGradeIds(line) {
    return (line.series ?? []).flatMap((series) => (series.grades ?? []).map((grade) => grade.id));
}

function collectSeriesGradeIds(series) {
    return (series.grades ?? []).map((grade) => grade.id);
}

function TreeCheckbox({ checked, indeterminate = false, onChange, label, hint = null }) {
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);

    return (
        <label className={`flex cursor-pointer items-center gap-2.5 rounded-[14px] border px-3 py-2 text-sm transition ${checked || indeterminate ? "border-[#25A7CA]/40 bg-white text-[#117a98]" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"}`}>
            <input
                ref={inputRef}
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                checked={checked}
                onChange={onChange}
            />
            <span className="min-w-0">
                <span className={`block ${checked || indeterminate ? "font-semibold" : "font-medium"}`}>{label}</span>
                {hint && <span className="block text-[11px] text-slate-400">{hint}</span>}
            </span>
        </label>
    );
}

function TextInput({ label, ...props }) {
    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-xs font-semibold text-slate-600">{label}</label>}
            <input
                {...props}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
            />
        </div>
    );
}

function TextArea({ label, ...props }) {
    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-xs font-semibold text-slate-600">{label}</label>}
            <textarea
                {...props}
                className="min-h-[90px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
            />
        </div>
    );
}

function emptyForm() {
    return {
        nombre_emisor: "",
        norma: "",
        descripcion_corta: "",
        descripcion_larga: "",
        familia: "",
        subfamilia: "",
        tipo: "",
        aplicacion_web_comercial: "",
        keywords_seo: "",
        fuente: "",
        is_active: true,
    };
}

function NormaFormPanel({ title, form, onSubmit, onCancel, submitLabel = "Guardar" }) {
    return (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="mb-4 text-sm font-semibold text-slate-900">{title}</p>
            <div className="grid gap-3 sm:grid-cols-2">
                <TextInput label="Nombre emisor" value={form.data.nombre_emisor} onChange={(e) => form.setData("nombre_emisor", e.target.value)} placeholder="Ej: ASTM, ISO, DIN…" />
                <TextInput label="Norma" value={form.data.norma} onChange={(e) => form.setData("norma", e.target.value)} placeholder="Ej: B265, 9254-1…" />
                <TextInput label="Título visible" value={form.data.descripcion_corta} onChange={(e) => form.setData("descripcion_corta", e.target.value)} placeholder="Resumen breve" />
                <TextInput label="Familia" value={form.data.familia} onChange={(e) => form.setData("familia", e.target.value)} placeholder="Ej: Titanio" />
                <TextInput label="Subfamilia" value={form.data.subfamilia} onChange={(e) => form.setData("subfamilia", e.target.value)} placeholder="Ej: Chapa / tira / placa" />
                <TextInput label="Tipo" value={form.data.tipo} onChange={(e) => form.setData("tipo", e.target.value)} placeholder="Ej: Norma aeroespacial de producto" />
                <div className="sm:col-span-2">
                    <TextArea label="Aplicación web/comercial" value={form.data.aplicacion_web_comercial} onChange={(e) => form.setData("aplicacion_web_comercial", e.target.value)} placeholder="Cómo se usa o vende esta norma en la web…" />
                </div>
                <div className="sm:col-span-2">
                    <TextArea label="Palabras clave SEO" value={form.data.keywords_seo} onChange={(e) => form.setData("keywords_seo", e.target.value)} placeholder="Ej: AMS 4900, titanio CP grado 3, chapa titanio…" />
                </div>
                <div className="sm:col-span-2">
                    <TextArea label="Fuente o enlace" value={form.data.fuente} onChange={(e) => form.setData("fuente", e.target.value)} placeholder="Ej: https://www.sae.org/standards/?search=AMS4900" />
                </div>
                <div className="sm:col-span-2">
                    <TextArea label="Detalle adicional" value={form.data.descripcion_larga} onChange={(e) => form.setData("descripcion_larga", e.target.value)} placeholder="Notas internas u observaciones adicionales…" />
                </div>
                <div>
                    <button
                        type="button"
                        onClick={() => form.setData("is_active", !form.data.is_active)}
                        className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${form.data.is_active ? "border-[#25A7CA]/30 bg-[#25A7CA]/10 text-[#117a98]" : "border-slate-200 bg-white text-slate-600"}`}
                    >
                        <span className={`flex h-6 w-10 items-center rounded-full p-1 transition ${form.data.is_active ? "bg-[#25A7CA]" : "bg-slate-300"}`}>
                            <span className={`h-4 w-4 rounded-full bg-white transition ${form.data.is_active ? "translate-x-4" : "translate-x-0"}`} />
                        </span>
                        Activa
                    </button>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
                {onCancel && (
                    <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        Cancelar
                    </button>
                )}
                <button type="button" onClick={onSubmit} disabled={form.processing} className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition hover:bg-[#1f8da8] disabled:opacity-60">
                    <Icon icon="solar:diskette-outline" width={16} />
                    {submitLabel}
                </button>
            </div>
            {Object.keys(form.errors).length > 0 && (
                <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {Object.values(form.errors).map((err, i) => <p key={i}>{err}</p>)}
                </div>
            )}
        </div>
    );
}

function GradeSelectionTree({ catalogTree, selectedIds, onToggle, onToggleSeries }) {
    const [query, setQuery] = useState("");
    const filteredTree = filterCatalogTree(catalogTree, query);
    const visibleGrades = countGrades(filteredTree);

    if (catalogTree.length === 0) {
        return <p className="text-sm text-slate-500">No hay grados cargados en el catálogo.</p>;
    }

    return (
        <div className="space-y-4">
            <div className="rounded-[18px] border border-slate-200 bg-white/80 p-3 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <label className="relative block md:max-w-md md:flex-1">
                        <Icon icon="solar:magnifer-outline" width={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Buscar grado, serie, subfamilia o familia…"
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                                aria-label="Limpiar búsqueda"
                            >
                                <Icon icon="solar:close-circle-outline" width={18} />
                            </button>
                        )}
                    </label>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                            {visibleGrades} visible{visibleGrades !== 1 ? "s" : ""}
                        </span>
                        <span className="rounded-full bg-[#25A7CA]/10 px-3 py-1 text-[#117a98]">
                            {selectedIds.length} seleccionado{selectedIds.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-h-[30rem] overflow-y-auto rounded-[20px] border border-slate-200 bg-white p-4 pr-3 shadow-inner shadow-slate-100">
                {filteredTree.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        No encontramos grados para <strong>{query}</strong>.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTree.map((family) => (
                            <div key={family.id}>
                                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{family.name}</p>
                                {(family.lines ?? []).map((line) => (
                                    <div key={line.id} className="mb-3">
                                        <p className="mb-1.5 text-xs font-semibold text-slate-600">{line.name}</p>
                                        {(line.series ?? []).map((series) => (
                                            <div key={series.id} className="mb-2">
                                                {(() => {
                                                    const seriesGradeIds = collectSeriesGradeIds(series);
                                                    const selectedCount = seriesGradeIds.filter((gradeId) => selectedIds.includes(gradeId)).length;
                                                    const seriesChecked = seriesGradeIds.length > 0 && selectedCount === seriesGradeIds.length;
                                                    const seriesIndeterminate = selectedCount > 0 && selectedCount < seriesGradeIds.length;

                                                    return (
                                                        <div className="mb-1 pl-2">
                                                            <TreeCheckbox
                                                                checked={seriesChecked}
                                                                indeterminate={seriesIndeterminate}
                                                                onChange={() => onToggleSeries(series)}
                                                                label={series.name}
                                                                hint={`${selectedCount}/${seriesGradeIds.length} grados seleccionados`}
                                                            />
                                                        </div>
                                                    );
                                                })()}
                                                <div className="grid gap-1.5 pl-2 sm:grid-cols-2 lg:grid-cols-3">
                                                    {(series.grades ?? []).map((grade) => {
                                                        const checked = selectedIds.includes(grade.id);
                                                        return (
                                                            <label
                                                                key={grade.id}
                                                                className={`flex cursor-pointer items-center gap-2.5 rounded-[14px] border px-3 py-2 text-sm transition ${checked ? "border-[#25A7CA]/40 bg-white font-semibold text-[#117a98] shadow-sm" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"}`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                                                                    checked={checked}
                                                                    onChange={() => onToggle(grade.id)}
                                                                />
                                                                {grade.name}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function GradeAssignPanel({ norma, catalogTree, onClose }) {
    const initialIds = (norma.grades ?? []).map((g) => g.id);
    const form = useForm({ grade_ids: initialIds });

    function toggle(gradeId) {
        const current = form.data.grade_ids;
        form.setData("grade_ids", current.includes(gradeId) ? current.filter((id) => id !== gradeId) : [...current, gradeId]);
    }

    function toggleSeries(series) {
        const seriesGradeIds = collectSeriesGradeIds(series);
        const current = form.data.grade_ids;
        const allSelected = seriesGradeIds.every((gradeId) => current.includes(gradeId));

        form.setData(
            "grade_ids",
            allSelected
                ? current.filter((gradeId) => !seriesGradeIds.includes(gradeId))
                : [...new Set([...current, ...seriesGradeIds])],
        );
    }

    function submit() {
        form.put(`/admin/productos/normas/${norma.id}/grados`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    const selectedCount = form.data.grade_ids.length;

    return (
        <div className="rounded-[24px] border border-[#25A7CA]/30 bg-[#25A7CA]/5 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-slate-900">Asignar a grados</p>
                    <p className="text-xs text-slate-500">
                        Seleccioná los grados donde aplica{" "}
                        <strong>{norma.nombre_emisor} {norma.norma}</strong>.
                        {selectedCount > 0 && (
                            <span className="ml-1 font-semibold text-[#117a98]">{selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}</span>
                        )}
                    </p>
                </div>
                <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                    Cancelar
                </button>
            </div>

            <GradeSelectionTree catalogTree={catalogTree} selectedIds={form.data.grade_ids} onToggle={toggle} onToggleSeries={toggleSeries} />

            <div className="mt-4 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={() => form.setData("grade_ids", [])}
                    disabled={(form.data.grade_ids ?? []).length === 0}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                >
                    <Icon icon="solar:broom-outline" width={14} />
                    Limpiar
                </button>
                <button
                    type="button"
                    onClick={submit}
                    disabled={form.processing}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition hover:bg-[#1f8da8] disabled:opacity-60"
                >
                    <Icon icon="solar:diskette-outline" width={16} />
                    Guardar asignaciones
                </button>
            </div>
        </div>
    );
}

export default function Normas({ normas = [], catalogTree = [], canExport = false }) {
    const flash = usePage().props.flash ?? {};
    const importFileRef = useRef(null);
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [assigningId, setAssigningId] = useState(null);
    const [normaQuery, setNormaQuery] = useState("");
    const [preview, setPreview] = useState(null);
    const [previewError, setPreviewError] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewFingerprint, setPreviewFingerprint] = useState(null);

    const importForm = useForm({ file: null, grade_ids: [] });
    const createForm = useForm(emptyForm());
    const editForm = useForm(emptyForm());

    function fileFingerprint(file) {
        if (!file) return null;

        return [file.name, file.size, file.lastModified].join(":");
    }

    function handleCreate() {
        createForm.post("/admin/productos/normas", {
            preserveScroll: true,
            onSuccess: () => { createForm.reset(); setShowCreate(false); },
        });
    }

    function startEdit(norma) {
        setEditingId(norma.id);
        setAssigningId(null);
        editForm.setData({
            nombre_emisor: norma.nombre_emisor ?? "",
            norma: norma.norma ?? "",
            descripcion_corta: norma.descripcion_corta ?? "",
            descripcion_larga: norma.descripcion_larga ?? "",
            familia: norma.familia ?? "",
            subfamilia: norma.subfamilia ?? "",
            tipo: norma.tipo ?? "",
            aplicacion_web_comercial: norma.aplicacion_web_comercial ?? "",
            keywords_seo: norma.keywords_seo ?? "",
            fuente: norma.fuente ?? "",
            is_active: norma.is_active ?? true,
        });
    }

    function toggleImportGrade(gradeId) {
        const current = importForm.data.grade_ids ?? [];
        importForm.setData("grade_ids", current.includes(gradeId) ? current.filter((id) => id !== gradeId) : [...current, gradeId]);
    }

    function toggleImportSeries(series) {
        const seriesGradeIds = collectSeriesGradeIds(series);
        const current = importForm.data.grade_ids ?? [];
        const allSelected = seriesGradeIds.every((gradeId) => current.includes(gradeId));

        importForm.setData(
            "grade_ids",
            allSelected
                ? current.filter((gradeId) => !seriesGradeIds.includes(gradeId))
                : [...new Set([...current, ...seriesGradeIds])],
        );
    }

    function clearImportFile() {
        importForm.clearErrors("file");
        importForm.setData("file", null);
        setPreview(null);
        setPreviewError("");
        setPreviewFingerprint(null);

        if (importFileRef.current) {
            importFileRef.current.value = "";
        }
    }

    async function handlePreview() {
        if (!importForm.data.file) return;

        setPreviewLoading(true);
        setPreviewError("");

        try {
            const payload = new FormData();
            payload.append("file", importForm.data.file);
            (importForm.data.grade_ids ?? []).forEach((gradeId) => payload.append("grade_ids[]", gradeId));

            const response = await window.axios.post("/admin/productos/normas/preview", payload, {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "multipart/form-data",
                },
            });

            setPreview(response.data);
            setPreviewFingerprint(fileFingerprint(importForm.data.file));
        } catch (error) {
            setPreview(null);
            setPreviewFingerprint(null);
            setPreviewError(
                error?.response?.data?.errors?.file?.[0]
                ?? error?.response?.data?.message
                ?? "No pudimos generar el preview del Excel.",
            );
        } finally {
            setPreviewLoading(false);
        }
    }

    function handleImport(event) {
        event.preventDefault();

        if (!importForm.data.file) return;

        if (previewFingerprint !== fileFingerprint(importForm.data.file)) {
            setPreviewError("Primero generá el preview del archivo actual para revisar qué es nuevo y qué ya existe.");

            return;
        }

        importForm.post("/admin/productos/normas/importar", {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                clearImportFile();
                importForm.setData("grade_ids", []);
            },
        });
    }

    function handleUpdate(normaId) {
        editForm.put(`/admin/productos/normas/${normaId}`, { preserveScroll: true, onSuccess: () => setEditingId(null) });
    }

    function handleResetCatalog() {
        if (normas.length === 0) return;
        if (!confirm("Se va a limpiar todo el catálogo de productos: materiales, normas, stock, formas, historial y web pública. Las imágenes se conservan para la próxima carga. ¿Continuar?")) return;

        router.delete("/admin/productos/publicado", {
            preserveScroll: true,
        });
    }

    function handleDestroy(normaId, name) {
        if (!confirm(`¿Eliminar la norma "${name}"? Esta acción no se puede deshacer.`)) return;
        router.delete(`/admin/productos/normas/${normaId}`, { preserveScroll: true });
    }

    const visibleNormas = useMemo(
        () => normas.filter((norma) => matchesNormaAssignmentSearch(norma, normaQuery)),
        [normas, normaQuery],
    );

    const grouped = visibleNormas.reduce((acc, n) => {
        const key = n.nombre_emisor || "Sin emisor";
        if (!acc[key]) acc[key] = [];
        acc[key].push(n);
        return acc;
    }, {});

    const totalGrades = catalogTree.reduce(
        (sum, f) => sum + (f.lines ?? []).reduce((s2, l) => s2 + (l.series ?? []).reduce((s3, s) => s3 + (s.grades ?? []).length, 0), 0),
        0,
    );
    const importedNormasCount = normas.filter((norma) => norma.is_imported).length;
    const manualNormasCount = normas.length - importedNormasCount;

    return (
        <AdminLayout>
            <Head title="Normas" />

            <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Catálogo</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Normas</h1>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Biblioteca de normas y referencias. Creá la norma y asignala a los grados que correspondan.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setShowCreate(true); setEditingId(null); setAssigningId(null); }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition hover:bg-[#1f8da8]"
                    >
                        <Icon icon="solar:add-circle-outline" width={18} />
                        Nueva norma
                    </button>
                </div>

                {flash.success && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
                        {flash.success}
                    </div>
                )}

                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
                        <div className="max-w-3xl">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Carga masiva</p>
                            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Importar normas desde Excel</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Subí la planilla de normas para crear o actualizar la biblioteca en bloque. Si elegís grados, cada norma importada se asigna a esos grados sin borrar asignaciones previas.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-[#25A7CA]/10 p-3 text-[#117a98]">
                            <Icon icon="solar:file-send-bold-duotone" width={26} />
                        </div>
                    </div>

                    <form onSubmit={handleImport} className="mt-6 space-y-5">
                        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5">
                            <label className="block space-y-3">
                                <span className="text-sm font-semibold text-slate-800">Archivo Excel</span>
                                <input
                                    ref={importFileRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(event) => {
                                        importForm.setData("file", event.target.files?.[0] ?? null);
                                        setPreview(null);
                                        setPreviewError("");
                                        setPreviewFingerprint(null);
                                    }}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-3 file:font-medium file:text-[#25A7CA]"
                                />
                            </label>
                            {importForm.errors.file ? (
                                <p className="mt-2 text-xs text-rose-500">{importForm.errors.file}</p>
                            ) : (
                                <p className="mt-2 text-xs text-slate-500">
                                    Formato esperado: hoja <strong>Normas</strong> con columnas como Emisor, Norma, Título, Familia, Subfamilia, Tipo, Aplicación web/comercial, Keywords SEO y Fuente.
                                </p>
                            )}
                            {previewError ? <p className="mt-2 text-xs text-amber-600">{previewError}</p> : null}
                        </div>

                        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Limpieza total del catálogo</p>
                                    <p className="mt-1 text-xs leading-5 text-slate-600">
                                        Un solo botón limpia materiales, normas, stock, formas, historial y lo publicado en la web pública, conservando las imágenes.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700 shadow-sm">
                                        {normas.length} norma{normas.length !== 1 ? "s" : ""}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleResetCatalog}
                                        disabled={normas.length === 0}
                                        className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                                    >
                                        <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} />
                                        Limpiar todo el catálogo
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[24px] border border-[#25A7CA]/20 bg-[#25A7CA]/5 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Asignar grados al importar</p>
                                    <p className="text-xs text-slate-500">
                                        Selección opcional. Si marcás grados, todas las normas nuevas o actualizadas se adjuntan también a esos grados.
                                    </p>
                                </div>
                                {(importForm.data.grade_ids ?? []).length > 0 && (
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#117a98] shadow-sm">
                                        {(importForm.data.grade_ids ?? []).length} grado{(importForm.data.grade_ids ?? []).length !== 1 ? "s" : ""} seleccionado{(importForm.data.grade_ids ?? []).length !== 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>

                            <div className="mt-4">
                                <GradeSelectionTree
                                    catalogTree={catalogTree}
                                    selectedIds={importForm.data.grade_ids}
                                    onToggle={toggleImportGrade}
                                    onToggleSeries={toggleImportSeries}
                                />
                            </div>

                            <div className="mt-4 flex flex-wrap justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => importForm.setData("grade_ids", [])}
                                    disabled={(importForm.data.grade_ids ?? []).length === 0}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                >
                                    <Icon icon="solar:broom-outline" width={14} />
                                    Limpiar grados
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={handlePreview}
                                disabled={previewLoading || importForm.processing || !importForm.data.file}
                                className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Icon icon="solar:eye-bold-duotone" width={18} />
                                {previewLoading ? "Analizando..." : "Ver preview"}
                            </button>
                            <button
                                type="submit"
                                disabled={importForm.processing || previewLoading || !importForm.data.file || previewFingerprint !== fileFingerprint(importForm.data.file)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition hover:bg-[#1f8da8] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Icon icon="solar:upload-bold-duotone" width={18} />
                                {importForm.processing ? "Importando..." : "Importar normas"}
                            </button>
                            <button
                                type="button"
                                onClick={clearImportFile}
                                disabled={!importForm.data.file || importForm.processing}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Icon icon="solar:close-circle-bold-duotone" width={18} />
                                Limpiar archivo
                            </button>
                            <a
                                href={canExport ? "/admin/productos/normas/exportar" : undefined}
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
                                    Si limpiás el catálogo, la exportación queda deshabilitada hasta volver a cargar normas.
                                </p>
                            ) : null}
                        </div>

                        {preview && (
                            <section className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/60 p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Preview antes de importar</p>
                                        <h3 className="mt-2 text-xl font-semibold text-slate-900">Solo entra lo nuevo o lo que cambia</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            Revisá acá mismo qué normas nuevas se crearán, cuáles actualizarán datos existentes y cuáles ya están iguales para evitar duplicados.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Nuevas: {preview.new_normas_count ?? 0}</span>
                                        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Actualizan: {preview.updated_normas_count ?? 0}</span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Sin cambios: {preview.unchanged_normas_count ?? 0}</span>
                                        <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Duplicadas en archivo: {preview.duplicate_rows_in_file_count ?? 0}</span>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                                    {[
                                        { title: "Normas nuevas", items: preview.new_normas ?? [], tone: "emerald", empty: "No se detectaron normas nuevas." },
                                        { title: "Normas que actualizarán existentes", items: preview.updated_normas ?? [], tone: "amber", empty: "No hay normas existentes con cambios." },
                                        { title: "Normas ya iguales", items: preview.unchanged_normas ?? [], tone: "slate", empty: "No hay coincidencias exactas." },
                                        { title: "Duplicadas dentro del archivo", items: preview.duplicate_rows_in_file ?? [], tone: "rose", empty: "No se detectaron filas repetidas dentro del Excel." },
                                    ].map((group) => (
                                        <article key={group.title} className={`rounded-[24px] border p-5 ${
                                            group.tone === "emerald" ? "border-emerald-200 bg-emerald-50/60" :
                                            group.tone === "amber" ? "border-amber-200 bg-amber-50/60" :
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
                                                                <span>{item.emisor ?? "Sin emisor"}</span>
                                                            </div>
                                                            <p className="mt-2 text-sm font-semibold text-slate-900">{item.norma ?? "Sin norma"}</p>
                                                            {item.titulo ? <p className="mt-1 text-xs leading-5 text-slate-600">{item.titulo}</p> : null}
                                                            {item.reason ? <p className="mt-2 text-xs leading-5 text-slate-500">{item.reason}</p> : null}
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
                        )}
                    </form>
                </section>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
                    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div><p className="text-sm font-medium text-slate-500">Total normas</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{normas.length}</p></div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]"><Icon icon="solar:document-text-outline" width={22} /></div>
                        </div>
                    </article>
                    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div><p className="text-sm font-medium text-slate-500">Emisores</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{Object.keys(grouped).length}</p></div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><Icon icon="solar:buildings-2-outline" width={22} /></div>
                        </div>
                    </article>
                    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div><p className="text-sm font-medium text-slate-500">Importadas</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{importedNormasCount}</p></div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700"><Icon icon="solar:import-outline" width={22} /></div>
                        </div>
                    </article>
                    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div><p className="text-sm font-medium text-slate-500">Manuales</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{manualNormasCount}</p></div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><Icon icon="solar:pen-new-square-outline" width={22} /></div>
                        </div>
                    </article>
                    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div><p className="text-sm font-medium text-slate-500">Grados en catálogo</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{totalGrades}</p></div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Icon icon="solar:layers-outline" width={22} /></div>
                        </div>
                    </article>
                </div>

                {normas.length > 0 && (
                    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Buscador para asignación de normas</p>
                                <p className="text-xs text-slate-500">
                                    Busca solo por <strong>Emisor</strong>, <strong>Norma</strong> y <strong>Título</strong>. Ejemplo: <strong>ams titanio</strong>.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                                <span className="rounded-full bg-slate-100 px-3 py-1">
                                    {visibleNormas.length} resultado{visibleNormas.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>

                        <label className="relative mt-4 block">
                            <Icon icon="solar:magnifer-outline" width={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={normaQuery}
                                onChange={(event) => setNormaQuery(event.target.value)}
                                placeholder="Buscar por emisor, norma o título. Ej: ams titanio"
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                            {normaQuery && (
                                <button
                                    type="button"
                                    onClick={() => setNormaQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                                    aria-label="Limpiar búsqueda"
                                >
                                    <Icon icon="solar:close-circle-outline" width={18} />
                                </button>
                            )}
                        </label>
                    </section>
                )}

                {showCreate && (
                    <NormaFormPanel title="Nueva norma" form={createForm} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} submitLabel="Crear norma" />
                )}

                {normas.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
                        <Icon icon="solar:document-text-outline" width={40} className="mx-auto text-slate-300" />
                        <p className="mt-4 font-semibold text-slate-500">Todavía no hay normas cargadas.</p>
                        <p className="mt-1 text-sm text-slate-400">Creá la primera con el botón "Nueva norma".</p>
                    </div>
                ) : visibleNormas.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
                        <Icon icon="solar:magnifer-outline" width={40} className="mx-auto text-slate-300" />
                        <p className="mt-4 font-semibold text-slate-500">No encontramos normas para "{normaQuery}".</p>
                        <p className="mt-1 text-sm text-slate-400">La búsqueda toma solo emisor, norma y título.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(grouped).map(([emisor, items]) => (
                            <div key={emisor}>
                                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{emisor}</p>
                                <div className="space-y-2">
                                    {items.map((norma) => (
                                        <div key={norma.id} className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
                                            {/* Norma row */}
                                            <div className="flex items-start justify-between gap-4 px-5 py-4">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{norma.nombre_emisor}</span>
                                                        <span className="text-sm font-semibold text-slate-900">{norma.norma}</span>
                                                        {norma.is_imported && <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">Importada</span>}
                                                        {!norma.is_active && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">Inactiva</span>}
                                                        {(norma.grades ?? []).length > 0 && (
                                                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                                                {norma.grades.length} grado{norma.grades.length !== 1 ? "s" : ""}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {norma.descripcion_corta && <p className="mt-1 text-sm text-slate-600">{norma.descripcion_corta}</p>}
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {norma.familia && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">Familia: {norma.familia}</span>}
                                                        {norma.subfamilia && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">Subfamilia: {norma.subfamilia}</span>}
                                                        {norma.tipo && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">Tipo: {norma.tipo}</span>}
                                                    </div>
                                                    {norma.aplicacion_web_comercial && <p className="mt-2 text-xs text-slate-500"><strong>Uso web/comercial:</strong> {norma.aplicacion_web_comercial}</p>}
                                                    {norma.fuente && <p className="mt-1 text-xs text-slate-400"><strong>Fuente:</strong> {norma.fuente}</p>}
                                                    {norma.descripcion_larga && <p className="mt-1 line-clamp-2 text-xs text-slate-400">{norma.descripcion_larga}</p>}
                                                </div>
                                                <div className="flex shrink-0 flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAssigningId(assigningId === norma.id ? null : norma.id);
                                                            setEditingId(null);
                                                        }}
                                                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${assigningId === norma.id ? "border-[#25A7CA]/40 bg-[#25A7CA]/10 text-[#117a98]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                                                    >
                                                        <Icon icon="solar:layers-outline" width={14} />
                                                        Grados
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { startEdit(norma); setAssigningId(null); }}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                                    >
                                                        <Icon icon="solar:pen-outline" width={14} />
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDestroy(norma.id, `${norma.nombre_emisor} ${norma.norma}`)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                                                    >
                                                        <Icon icon="solar:trash-bin-trash-outline" width={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Inline edit form */}
                                            {editingId === norma.id && (
                                                <div className="border-t border-slate-100 p-4">
                                                    <NormaFormPanel
                                                        title={`Editar: ${norma.nombre_emisor} ${norma.norma}`}
                                                        form={editForm}
                                                        onSubmit={() => handleUpdate(norma.id)}
                                                        onCancel={() => setEditingId(null)}
                                                        submitLabel="Guardar cambios"
                                                    />
                                                </div>
                                            )}

                                            {/* Grade assign panel */}
                                            {assigningId === norma.id && (
                                                <div className="border-t border-slate-100 p-4">
                                                    <GradeAssignPanel
                                                        norma={norma}
                                                        catalogTree={catalogTree}
                                                        onClose={() => setAssigningId(null)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm, Link } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import ImageUploadField from "@/Components/Admin/ImageUploadField";

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative z-10 flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl transition-all">
                <div className="shrink-0 border-b border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#f6f9fb_100%)] px-8 py-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
                        >
                            <Icon icon="solar:close-circle-outline" width={22} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 pt-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

function InputField({ label, ...props }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold tracking-tight text-slate-900">{label}</label>
            <input
                {...props}
                className="block w-full rounded-2xl border-transparent bg-slate-50 px-4 py-3 text-sm transition-all focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
            />
        </div>
    );
}

function TextareaField({ label, ...props }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold tracking-tight text-slate-900">{label}</label>
            <textarea
                {...props}
                className="block w-full rounded-2xl border-transparent bg-slate-50 px-4 py-3 text-sm transition-all focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
            />
        </div>
    );
}

function cleanEditorHtml(value) {
    if (!value) return "";

    return String(value)
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(div|p|li|h[1-6])>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .split(/\r\n|\r|\n/)
        .map((line) => line.replace(/[ \t]+/g, " ").trim())
        .filter(Boolean)
        .join("\n");
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

function Toggle({ id, label, hint, checked, onChange }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                <Icon icon="solar:eye-outline" width={18} className="text-[#25A7CA]" />
            </div>
            <div className="flex-1">
                <label htmlFor={id} className="block text-sm font-semibold text-slate-900">{label}</label>
                {hint && <p className="text-xs text-slate-500">{hint}</p>}
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
                <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
                <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#25A7CA] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#25A7CA]/20"></div>
            </label>
        </div>
    );
}

export default function SeriesIndex({ line }) {
    const [selectedSeries, setSelectedSeries] = useState(null);
    const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [editingGrade, setEditingGrade] = useState(null);

    // Keep selectedSeries in sync with fresh prop data
    useEffect(() => {
        if (line.series.length > 0 && !selectedSeries) {
            setSelectedSeries(line.series[0]);
        } else if (selectedSeries) {
            const updated = line.series.find(s => s.id === selectedSeries.id);
            if (updated) setSelectedSeries(updated);
            else setSelectedSeries(null);
        }
    }, [line.series]);

    // ─── Series Form ──────────────────────────────────────────────────────────
    const seriesForm = useForm({
        id: null,
        name: "",
        slug: "",
        intro_title: "",
        intro_text: "",
        is_active: true,
        sort_order: "",
        hero_media_file: null,
        hero_media_url: null,
    });

    const openSeriesModal = (series = null) => {
        if (series) {
            seriesForm.setData({
                id: series.id,
                name: series.name,
                slug: series.slug || "",
                intro_title: series.intro_title || "",
                intro_text: series.intro_text || "",
                is_active: series.is_active,
                sort_order: series.sort_order || "",
                hero_media_file: null,
                hero_media_url: series.hero_media_url || null,
            });
        } else {
            seriesForm.clearErrors();
            seriesForm.setData({
                id: null, name: "", slug: "", intro_title: "", intro_text: "",
                is_active: true, sort_order: "", hero_media_file: null, hero_media_url: null,
            });
        }
        setIsSeriesModalOpen(true);
    };

    const saveSeries = (e) => {
        e.preventDefault();
        const opts = { onSuccess: () => setIsSeriesModalOpen(false), forceFormData: true };
        if (seriesForm.data.id) {
            seriesForm.transform(data => ({ ...data, _method: 'put' }));
            seriesForm.post(`/admin/productos/taxonomia/series/${seriesForm.data.id}`, opts);
        } else {
            seriesForm.transform(data => { const p = { ...data }; delete p._method; return p; });
            seriesForm.post(`/admin/productos/taxonomia/lineas/${line.id}/series`, opts);
        }
    };

    const deleteSeries = (seriesId) => {
        if (confirm("¿Eliminar esta serie y todos sus grados de forma permanente?")) {
            router.delete(`/admin/productos/taxonomia/series/${seriesId}`);
        }
    };

    // ─── Grade Form ───────────────────────────────────────────────────────────
    const gradeForm = useForm({
        id: null,
        name: "",
        slug: "",
        short_title: "",
        intro_title: "",
        intro_text: "",
        density_value: "",
        density_unit: "g/cm³",
        specific_weight_value: "",
        specific_weight_unit: "kg/dm³",
        uns: "",
        wk_nr: "",
        request_quote_enabled: false,
        show_in_calculator: false,
        is_active: true,
        sort_order: "",
        hero_media_file: null,
        hero_media_url: null,
    });

    const openGradeModal = (grade = null) => {
        if (grade) {
            gradeForm.setData({
                id: grade.id,
                name: grade.name,
                slug: grade.slug || "",
                short_title: grade.short_title || "",
                intro_title: grade.intro_title || "",
                intro_text: cleanEditorHtml(grade.intro_text || ""),
                density_value: grade.density_value ?? "",
                density_unit: grade.density_unit || "g/cm³",
                specific_weight_value: grade.specific_weight_value ?? "",
                specific_weight_unit: grade.specific_weight_unit || "kg/dm³",
                uns: grade.uns || "",
                wk_nr: grade.wk_nr || "",
                request_quote_enabled: grade.request_quote_enabled ?? false,
                show_in_calculator: grade.show_in_calculator ?? false,
                is_active: grade.is_active,
                sort_order: grade.sort_order || "",
                hero_media_file: null,
                hero_media_url: grade.hero_media_url || null,
            });
            setEditingGrade(grade);
        } else {
            gradeForm.clearErrors();
            gradeForm.setData({
                id: null, name: "", slug: "", short_title: "", intro_title: "", intro_text: "",
                density_value: "", density_unit: "g/cm³", specific_weight_value: "", specific_weight_unit: "kg/dm³",
                uns: "", wk_nr: "", request_quote_enabled: false, show_in_calculator: false,
                is_active: true, sort_order: "", hero_media_file: null, hero_media_url: null,
            });
            setEditingGrade(null);
        }
        setIsGradeModalOpen(true);
    };

    const saveGrade = (e) => {
        e.preventDefault();
        const opts = { onSuccess: () => setIsGradeModalOpen(false), forceFormData: true };
        if (gradeForm.data.id) {
            gradeForm.transform(data => ({ ...data, intro_text: cleanEditorHtml(data.intro_text), _method: 'put' }));
            gradeForm.post(`/admin/productos/taxonomia/grados/${gradeForm.data.id}`, opts);
        } else {
            gradeForm.transform(data => {
                const p = { ...data, intro_text: cleanEditorHtml(data.intro_text) };
                delete p._method;
                return p;
            });
            gradeForm.post(`/admin/productos/taxonomia/series/${selectedSeries.id}/grados`, opts);
        }
    };

    const deleteGrade = (gradeId) => {
        if (confirm("¿Eliminar este grado de forma permanente?")) {
            router.delete(`/admin/productos/taxonomia/grados/${gradeId}`);
        }
    };

    return (
        <AdminLayout>
            <Head title={`Series de ${line.name}`} />

            <div className="space-y-6">

                {/* Header */}
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.18),_transparent_34%),linear-gradient(135deg,#ffffff_0%,#f6f9fb_48%,#eef8fb_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-2">
                                    <Link
                                        href="/admin/productos/taxonomia"
                                        className="inline-flex items-center gap-1.5 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#117a98] transition hover:bg-[#25A7CA]/20"
                                    >
                                        <Icon icon="solar:arrow-left-outline" width={12} />
                                        Estructura
                                    </Link>
                                    <span className="text-slate-300">/</span>
                                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                        {line.family?.name}
                                    </span>
                                    <span className="text-slate-300">/</span>
                                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#117a98]">
                                        {line.name}
                                    </span>
                                </div>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Series comerciales y grados
                                </h1>
                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    Acá armás lo que aparece dentro de <strong>{line.name}</strong>: primero las series comerciales como Hastelloy o Incoloy, y dentro de cada una sus grados como B2 o B3.
                                </p>
                            </div>
                            <button
                                onClick={() => openSeriesModal()}
                                className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#1f8da8]"
                            >
                                <Icon icon="solar:add-circle-bold" width={18} />
                                Nueva Serie
                            </button>
                        </div>
                    </div>
                </section>

                <div className="flex flex-col gap-6 lg:flex-row">
                    {/* Series Sidebar */}
                    <div className="w-full lg:w-1/3 xl:w-1/4">
                        <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-4 px-3 flex items-center justify-between">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Series comerciales</h2>
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 border border-slate-200">
                                    {line.series.length}
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                {line.series.map((series) => {
                                    const isActive = selectedSeries?.id === series.id;
                                    return (
                                        <button
                                            key={series.id}
                                            onClick={() => setSelectedSeries(series)}
                                            className={`group relative flex w-full items-center justify-between overflow-hidden rounded-[20px] px-4 py-3.5 text-left font-semibold transition-all ${
                                                isActive
                                                    ? 'bg-[#25A7CA] text-white shadow-md'
                                                    : 'bg-transparent text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="relative z-10 flex items-center gap-3">
                                                <Icon
                                                    icon="solar:layers-bold-duotone"
                                                    width={20}
                                                    className={isActive ? "text-[#9ae6fb]" : "text-slate-400 group-hover:text-[#25A7CA] transition"}
                                                />
                                                <span className="truncate max-w-[140px]">{series.name}</span>
                                            </span>
                                            <div className="relative z-10 flex items-center gap-2">
                                                <span className={`flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-[#1f8da8]/50 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    {series.grades?.length ?? 0}
                                                </span>
                                            </div>
                                            {isActive && (
                                                <div className="absolute right-[-10px] top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-white/10 blur-xl" />
                                            )}
                                        </button>
                                    );
                                })}
                                {line.series.length === 0 && (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                                        <Icon icon="solar:ghost-outline" width={32} className="mb-2 text-slate-300" />
                                        <p className="text-sm font-medium text-slate-500">No hay series</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Panel */}
                    <div className="flex-1">
                        {selectedSeries ? (
                            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">

                                {/* Series Header */}
                                <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-8 md:flex-row md:items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]">
                                            <Icon icon="solar:layers-minimalistic-bold-duotone" width={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{selectedSeries.name}</h2>
                                            <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                                                <code className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600">/{selectedSeries.slug}</code>
                                                {selectedSeries.is_active ? (
                                                    <span className="flex items-center gap-1.5 text-green-600"><span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Visible</span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span> Oculta</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button
                                            onClick={() => openSeriesModal(selectedSeries)}
                                            className="flex-1 justify-center inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 md:flex-none"
                                        >
                                            <Icon icon="solar:pen-outline" width={16} />
                                            Editar Serie
                                        </button>
                                        <button
                                            onClick={() => deleteSeries(selectedSeries.id)}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                                            title="Eliminar Serie"
                                        >
                                            <Icon icon="solar:trash-bin-trash-outline" width={18} />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>

                                {/* Grades Section */}
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="text-lg font-bold tracking-tight text-slate-900">Grados o variantes</h3>
                                    <button
                                        onClick={() => openGradeModal()}
                                        className="inline-flex items-center gap-2 rounded-[18px] bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-800"
                                    >
                                        <Icon icon="solar:add-square-bold" width={18} />
                                        Añadir Grado
                                    </button>
                                </div>

                                {selectedSeries.grades && selectedSeries.grades.length > 0 ? (
                                    <div className="grid gap-3">
                                        {selectedSeries.grades.map((grade) => (
                                            <div key={grade.id} className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-center">
                                                <div className="mb-4 sm:mb-0">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="font-bold text-slate-900">{grade.name}</h4>
                                                        {grade.sort_order && (
                                                            <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
                                                                <Icon icon="solar:sort-from-bottom-to-top-bold" width={12} />
                                                                {grade.sort_order}
                                                            </span>
                                                        )}
                                                        {grade.uns && (
                                                            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
                                                                UNS: {grade.uns}
                                                            </span>
                                                        )}
                                                        {!grade.is_active && (
                                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">Inactivo</span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                                                        <Icon icon="solar:link-circle-outline" width={16} className="text-slate-400" />
                                                        /{grade.slug}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openGradeModal(grade)}
                                                        className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#25A7CA]"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => deleteGrade(grade.id)}
                                                        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white"
                                                    >
                                                        <Icon icon="solar:trash-bin-trash-bold" width={18} />
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-900/5">
                                            <Icon icon="solar:archive-linear" width={32} className="text-slate-400" />
                                        </div>
                                        <h4 className="text-base font-bold text-slate-900">Esta serie está vacía</h4>
                                        <p className="mt-1 max-w-sm text-sm text-slate-500">Aún no hay grados configurados. Presiona "Añadir Grado" para comenzar.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
                                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[32px] bg-slate-50 shadow-inner">
                                    <Icon icon="solar:cursor-square-outline" width={40} className="text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight text-slate-900">Selecciona una Serie</h3>
                                <p className="mt-2 max-w-sm text-sm text-slate-500">
                                    Haz clic sobre una serie de la izquierda para gestionar sus grados.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Series Modal */}
            <Modal isOpen={isSeriesModalOpen} onClose={() => setIsSeriesModalOpen(false)} title={seriesForm.data.id ? "Editar Serie" : "Nueva Serie"}>
                <form onSubmit={saveSeries} className="space-y-5">
                    {seriesForm.data.id && selectedSeries ? (
                        <div className="rounded-2xl border border-[#25A7CA]/20 bg-[#25A7CA]/5 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Datos actuales cargados</p>
                            <div className="mt-3 grid gap-3 md:grid-cols-3">
                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Título actual</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{selectedSeries.intro_title || "Sin título cargado"}</p>
                                </div>
                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Texto actual</p>
                                    <p className="mt-1 line-clamp-3 text-sm text-slate-600">{selectedSeries.intro_text || "Sin texto cargado"}</p>
                                </div>
                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Grados activos</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{selectedSeries.grades?.length ?? 0}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Link
                                    href={`/admin/productos/contenido-tecnico?line=${line.id}&series=${selectedSeries.id}`}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                >
                                    Ver textos actuales
                                </Link>
                                <Link
                                    href={`/admin/productos/composicion-quimica?line=${line.id}&series=${selectedSeries.id}`}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                >
                                    Ver composición actual
                                </Link>
                            </div>
                        </div>
                    ) : null}

                    <div className="mb-4">
                        <ImageUploadField
                            label="Imagen de la tarjeta de la serie"
                            currentUrl={seriesForm.data.hero_media_url}
                            onChange={(file) => seriesForm.setData('hero_media_file', file)}
                            specs={{ width: 392, height: 240, maxMB: 10, recommendedMBText: "entre 2 y 4 MB", formats: ["JPG", "PNG", "WEBP"] }}
                            error={seriesForm.errors.hero_media_file}
                        />
                    </div>
                    <InputField
                        label="Nombre de la serie comercial"
                        placeholder="Ej: Hastelloy®"
                        value={seriesForm.data.name}
                        onChange={(e) => {
                            const value = e.target.value;
                            seriesForm.setData((current) => ({ ...current, name: value, slug: slugify(value) }));
                        }}
                        required
                    />
                    {seriesForm.errors.name && <p className="mt-1 text-xs text-red-500">{seriesForm.errors.name}</p>}
                    <InputField
                        label="Orden Excel"
                        placeholder="10"
                        value={seriesForm.data.sort_order}
                        onChange={(e) => seriesForm.setData("sort_order", e.target.value)}
                    />
                    <InputField
                        label="Título visible al entrar a la serie"
                        placeholder="Ej: Hastelloy"
                        value={seriesForm.data.intro_title}
                        onChange={(e) => seriesForm.setData("intro_title", e.target.value)}
                    />
                    <TextareaField
                        label="Texto debajo del título"
                        rows={3}
                        value={seriesForm.data.intro_text}
                        onChange={(e) => seriesForm.setData("intro_text", e.target.value)}
                    />
                    <Toggle
                        id="s_is_active"
                        label="Visibilidad Pública"
                        hint="Si está activo, esta serie aparece dentro de la pantalla pública"
                        checked={seriesForm.data.is_active}
                        onChange={(e) => seriesForm.setData("is_active", e.target.checked)}
                    />
                    <div className="mt-8 flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsSeriesModalOpen(false)} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Cancelar</button>
                        <button type="submit" disabled={seriesForm.processing} className="rounded-xl bg-[#25A7CA] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#1f8da8] disabled:opacity-50">
                            {seriesForm.processing ? "Guardando..." : "Guardar Serie"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Grade Modal */}
            <Modal isOpen={isGradeModalOpen} onClose={() => setIsGradeModalOpen(false)} title={gradeForm.data.id ? "Editar Grado" : "Nuevo Grado"}>
                <form onSubmit={saveGrade} className="space-y-5">
                    {editingGrade ? (
                        <div className="rounded-2xl border border-[#25A7CA]/20 bg-[#25A7CA]/5 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Datos actuales cargados</p>
                            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Título actual</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{editingGrade.intro_title || editingGrade.name}</p>
                                </div>
                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Texto actual</p>
                                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-slate-600">{cleanEditorHtml(editingGrade.intro_text || "") || "Sin texto cargado"}</p>
                                </div>
                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Densidad / UNS</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {editingGrade.density_value ? `${editingGrade.density_value} ${editingGrade.density_unit || ""}` : "Sin densidad"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">{editingGrade.uns ? `UNS ${editingGrade.uns}` : "Sin UNS"}</p>
                                </div>
                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Módulos relacionados</p>
                                    <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-600">
                                        <span className="rounded-full bg-slate-100 px-2 py-1">Textos</span>
                                        <span className="rounded-full bg-slate-100 px-2 py-1">Normas</span>
                                        <span className="rounded-full bg-slate-100 px-2 py-1">Composición</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Link
                                    href={`/admin/productos/contenido-tecnico?line=${line.id}&series=${selectedSeries?.id}&grade=${editingGrade.id}`}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                >
                                    Ver textos y ficha actual
                                </Link>
                                <Link
                                    href={`/admin/productos/composicion-quimica?line=${line.id}&series=${selectedSeries?.id}&grade=${editingGrade.id}`}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                >
                                    Ver composición actual
                                </Link>
                            </div>
                        </div>
                    ) : null}

                    <div className="mb-4">
                        <ImageUploadField
                            label="Imagen del grado"
                            currentUrl={gradeForm.data.hero_media_url}
                            onChange={(file) => gradeForm.setData('hero_media_file', file)}
                            specs={{ width: 392, height: 240, maxMB: 10, recommendedMBText: "entre 2 y 4 MB", formats: ["JPG", "PNG", "WEBP"] }}
                            error={gradeForm.errors.hero_media_file}
                        />
                    </div>

                    <InputField
                        label="Nombre del grado o variante"
                        placeholder="Ej: B2"
                        value={gradeForm.data.name}
                        onChange={(e) => {
                            const value = e.target.value;
                            gradeForm.setData((current) => ({ ...current, name: value, slug: slugify(value) }));
                        }}
                        required
                    />
                    {gradeForm.errors.name && <p className="mt-1 text-xs text-red-500">{gradeForm.errors.name}</p>}

                    <InputField
                        label="Orden Excel"
                        placeholder="10"
                        value={gradeForm.data.sort_order}
                        onChange={(e) => gradeForm.setData("sort_order", e.target.value)}
                    />

                    <InputField
                        label="Nombre corto para tarjeta"
                        placeholder="Para cards y listados"
                        value={gradeForm.data.short_title}
                        onChange={(e) => gradeForm.setData("short_title", e.target.value)}
                    />

                    <InputField
                        label="Título grande de la página"
                        placeholder="Título para la página de detalle"
                        value={gradeForm.data.intro_title}
                        onChange={(e) => gradeForm.setData("intro_title", e.target.value)}
                    />

                    <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <label className="block text-sm font-semibold tracking-tight text-slate-900">Texto descriptivo</label>
                            <button
                                type="button"
                                onClick={() => gradeForm.setData("intro_text", cleanEditorHtml(gradeForm.data.intro_text))}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                <Icon icon="solar:broom-outline" width={14} />
                                Limpiar HTML
                            </button>
                        </div>
                        <textarea
                            rows={5}
                            placeholder="Descripción del grado..."
                            value={gradeForm.data.intro_text}
                            onChange={(e) => gradeForm.setData("intro_text", e.target.value)}
                            className="block w-full rounded-2xl border-transparent bg-slate-50 px-4 py-3 text-sm transition-all focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                            Si pegás desde un editor externo, este campo se guarda como texto limpio, sin spans/divs ni estilos inline.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Propiedades físicas</p>
                        <div className="grid grid-cols-2 gap-3">
                            <InputField
                                label="Densidad"
                                type="number"
                                step="0.0001"
                                placeholder="8.22"
                                value={gradeForm.data.density_value}
                                onChange={(e) => gradeForm.setData("density_value", e.target.value)}
                            />
                            <InputField
                                label="Unidad densidad"
                                placeholder="g/cm³"
                                value={gradeForm.data.density_unit}
                                onChange={(e) => gradeForm.setData("density_unit", e.target.value)}
                            />
                            <InputField
                                label="Peso específico"
                                type="number"
                                step="0.0001"
                                placeholder="8.22"
                                value={gradeForm.data.specific_weight_value}
                                onChange={(e) => gradeForm.setData("specific_weight_value", e.target.value)}
                            />
                            <InputField
                                label="Unidad peso"
                                placeholder="kg/dm³"
                                value={gradeForm.data.specific_weight_unit}
                                onChange={(e) => gradeForm.setData("specific_weight_unit", e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <InputField
                                label="UNS"
                                placeholder="N10665"
                                value={gradeForm.data.uns}
                                onChange={(e) => gradeForm.setData("uns", e.target.value)}
                            />
                            <InputField
                                label="Wk Nr"
                                placeholder="2.4617"
                                value={gradeForm.data.wk_nr}
                                onChange={(e) => gradeForm.setData("wk_nr", e.target.value)}
                            />
                        </div>
                    </div>

                    <Toggle
                        id="g_quote"
                        label="Habilitar Solicitud de Presupuesto"
                        hint="Muestra el botón de presupuesto en la web"
                        checked={gradeForm.data.request_quote_enabled}
                        onChange={(e) => gradeForm.setData("request_quote_enabled", e.target.checked)}
                    />
                    <Toggle
                        id="g_calc"
                        label="Mostrar en Calculadora"
                        hint="Este grado aparece en la calculadora de pesos"
                        checked={gradeForm.data.show_in_calculator}
                        onChange={(e) => gradeForm.setData("show_in_calculator", e.target.checked)}
                    />
                    <Toggle
                        id="g_is_active"
                        label="Visibilidad Pública"
                        hint="Si está activo, este grado se muestra en la web"
                        checked={gradeForm.data.is_active}
                        onChange={(e) => gradeForm.setData("is_active", e.target.checked)}
                    />

                    <div className="mt-8 flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsGradeModalOpen(false)} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Cancelar</button>
                        <button type="submit" disabled={gradeForm.processing} className="rounded-xl bg-[#25A7CA] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#1f8da8] disabled:opacity-50">
                            {gradeForm.processing ? "Guardando..." : "Guardar Grado"}
                        </button>
                    </div>
                </form>
            </Modal>

        </AdminLayout>
    );
}

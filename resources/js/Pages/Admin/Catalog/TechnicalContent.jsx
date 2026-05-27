import AdminLayout from "@/Layouts/AdminLayout";
import RichTextEditor from "@/Components/Admin/RichTextEditor";
import { filterCatalogNormasBySearch } from "@/lib/catalogNormaSearch";
import { Head, useForm, usePage } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";

function TextInput(props) {
    return (
        <input
            {...props}
            className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10 ${props.className ?? ""}`}
        />
    );
}

function TextArea(props) {
    return (
        <textarea
            {...props}
            className={`min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10 ${props.className ?? ""}`}
        />
    );
}

function Toggle({ checked, onChange, label }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                checked
                    ? "border-[#25A7CA]/30 bg-[#25A7CA]/10 text-[#117a98]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
        >
            <span className={`flex h-6 w-10 items-center rounded-full p-1 transition ${checked ? "bg-[#25A7CA]" : "bg-slate-300"}`}>
                <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-4" : "translate-x-0"}`} />
            </span>
            <span>{label}</span>
        </button>
    );
}

function SectionTitle({ eyebrow, title, description }) {
    return (
        <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        </div>
    );
}

function makeLineForm(line) {
    return {
        intro_title: line?.intro_title ?? "",
        intro_text: line?.intro_text ?? "",
    };
}

function makeSeriesForm(series) {
    return {
        intro_title: series?.intro_title ?? "",
        intro_text: series?.intro_text ?? "",
        content_sections: (series?.content_sections ?? []).map((section, index) => ({
            section_key: section.section_key ?? `section-${index + 1}`,
            title: section.title ?? "",
            content: section.content ?? "",
            sort_order: section.sort_order ?? index + 1,
            is_active: section.is_active ?? true,
        })),
    };
}

function makeGradeForm(grade, series = null, line = null) {
    const gradeSections = (grade?.content_sections ?? []).map((section, index) => ({
        section_key: section.section_key ?? `section-${index + 1}`,
        title: section.title ?? "",
        content: section.content ?? "",
        sort_order: section.sort_order ?? index + 1,
        is_active: section.is_active ?? true,
    }));

    return {
        short_title: grade?.short_title ?? "",
        intro_title: grade?.intro_title ?? "",
        intro_text: grade?.intro_text ?? "",
        request_quote_enabled: grade?.request_quote_enabled ?? true,
        content_sections: gradeSections,
        feature_items: (grade?.feature_items ?? []).map((item, index) => ({
            text: item.text ?? "",
            sort_order: item.sort_order ?? index + 1,
            is_active: item.is_active ?? true,
        })),
        application_ids: (grade?.applications ?? []).map((item) => item.id),
        norma_ids: (grade?.normas ?? []).map((n) => n.id),
        standards: (grade?.standards ?? []).map((item, index) => ({
            code: item.code ?? "",
            title: item.title ?? "",
            description: item.description ?? "",
            sort_order: item.sort_order ?? index + 1,
            is_active: item.is_active ?? true,
        })),
    };
}

function addRow(form, key, template) {
    form.setData(key, [...form.data[key], template(form.data[key].length)]);
}

function removeRow(form, key, index) {
    form.setData(key, form.data[key].filter((_, currentIndex) => currentIndex !== index));
}

function clearRows(form, key, message) {
    if ((form.data[key] ?? []).length === 0) return;

    if (confirm(message)) {
        form.setData(key, []);
    }
}

function toggleApplication(form, applicationId) {
    const currentIds = form.data.application_ids ?? [];
    const nextIds = currentIds.includes(applicationId)
        ? currentIds.filter((id) => id !== applicationId)
        : [...currentIds, applicationId];

    form.setData("application_ids", nextIds);
}

export default function TechnicalContent({ families, applications = [], catalogNormas = [] }) {
    const { url } = usePage();
    const params = new URLSearchParams(url.split("?")[1] ?? "");
    const initialLineId = Number(params.get("line")) || null;
    const initialSeriesId = Number(params.get("series")) || null;
    const initialGradeId = Number(params.get("grade")) || null;
    const [normaQuery, setNormaQuery] = useState("");

    const [selectedFamilyId, setSelectedFamilyId] = useState(families[0]?.id ?? null);
    const selectedFamily = useMemo(
        () => families.find((family) => family.id === selectedFamilyId) ?? families[0] ?? null,
        [families, selectedFamilyId],
    );

    const allLines = useMemo(() => families.flatMap((family) => family.lines ?? []), [families]);
    const [selectedLineId, setSelectedLineId] = useState(initialLineId || allLines[0]?.id || null);
    const selectedLine = useMemo(
        () => allLines.find((line) => line.id === selectedLineId) ?? selectedFamily?.lines?.[0] ?? null,
        [allLines, selectedLineId, selectedFamily],
    );

    const allSeries = selectedLine?.series ?? [];
    const [selectedSeriesId, setSelectedSeriesId] = useState(initialSeriesId || allSeries[0]?.id || null);
    const selectedSeries = useMemo(
        () => allSeries.find((series) => series.id === selectedSeriesId) ?? allSeries[0] ?? null,
        [allSeries, selectedSeriesId],
    );

    const allGrades = selectedSeries?.grades ?? [];
    const [selectedGradeId, setSelectedGradeId] = useState(initialGradeId || allGrades[0]?.id || null);
    const selectedGrade = useMemo(
        () => allGrades.find((grade) => grade.id === selectedGradeId) ?? allGrades[0] ?? null,
        [allGrades, selectedGradeId],
    );

    const lineForm = useForm(makeLineForm(selectedLine));
    const seriesForm = useForm(makeSeriesForm(selectedSeries));
    const gradeForm = useForm(makeGradeForm(selectedGrade, selectedSeries, selectedLine));

    useEffect(() => {
        if (!selectedFamilyId && families[0]?.id) {
            setSelectedFamilyId(families[0].id);
        }
    }, [families, selectedFamilyId]);

    useEffect(() => {
        if (!selectedLine && selectedFamily?.lines?.[0]) {
            setSelectedLineId(selectedFamily.lines[0].id);
        } else if (selectedLine && selectedFamily && !selectedFamily.lines.some((line) => line.id === selectedLine.id)) {
            setSelectedLineId(selectedFamily.lines[0]?.id ?? null);
        }
    }, [selectedFamily, selectedLine]);

    useEffect(() => {
        if (!selectedSeries && allSeries[0]) {
            setSelectedSeriesId(allSeries[0].id);
        } else if (selectedSeries && !allSeries.some((series) => series.id === selectedSeries.id)) {
            setSelectedSeriesId(allSeries[0]?.id ?? null);
        }
    }, [allSeries, selectedSeries]);

    useEffect(() => {
        if (!selectedGrade && allGrades[0]) {
            setSelectedGradeId(allGrades[0].id);
        } else if (selectedGrade && !allGrades.some((grade) => grade.id === selectedGrade.id)) {
            setSelectedGradeId(allGrades[0]?.id ?? null);
        }
    }, [allGrades, selectedGrade]);

    useEffect(() => {
        setSelectedFamilyId(
            families.find((family) => family.lines.some((line) => line.id === selectedLine?.id))?.id ?? families[0]?.id ?? null,
        );
    }, [families, selectedLine?.id]);

    useEffect(() => {
        lineForm.setData(makeLineForm(selectedLine));
    }, [selectedLine]);

    useEffect(() => {
        seriesForm.setData(makeSeriesForm(selectedSeries));
    }, [selectedSeries]);

    useEffect(() => {
        gradeForm.setData(makeGradeForm(selectedGrade, selectedSeries, selectedLine));
    }, [selectedGrade, selectedSeries, selectedLine]);

    const saveSeries = (event) => {
        event.preventDefault();
        if (!selectedSeries) return;
        seriesForm.put(`/admin/productos/contenido-tecnico/series/${selectedSeries.id}`, {
            preserveScroll: true,
        });
    };

    const saveLine = (event) => {
        event.preventDefault();
        if (!selectedLine) return;
        lineForm.put(`/admin/productos/contenido-tecnico/lineas/${selectedLine.id}`, {
            preserveScroll: true,
        });
    };

    const saveGrade = (event) => {
        event.preventDefault();
        if (!selectedGrade) return;
        gradeForm.put(`/admin/productos/contenido-tecnico/grados/${selectedGrade.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Contenido técnico" />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.18),_transparent_34%),linear-gradient(135deg,#ffffff_0%,#f6f9fb_48%,#eef8fb_100%)] px-6 py-8 md:px-8">
                        <SectionTitle
                            eyebrow="Productos / Textos Web"
                            title="Contenido técnico"
                            description="Editá en orden lo que ve el usuario en la web: primero la pantalla de entrada de cada línea, después las series comerciales que aparecen dentro, y por último los grados o variantes."
                        />
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-4">
                        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                            <h2 className="px-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Pantallas del catálogo</h2>
                            <div className="mt-4 space-y-1.5">
                                {families.map((family) => (
                                    <div key={family.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFamilyId(family.id)}
                                            className={`flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left text-sm font-semibold transition ${
                                                selectedFamily?.id === family.id
                                                    ? "bg-slate-900 text-white"
                                                    : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <span className="truncate">{family.name}</span>
                                            <span className={`rounded px-2 py-1 text-[11px] ${selectedFamily?.id === family.id ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>
                                                {family.lines.length}
                                            </span>
                                        </button>

                                        {selectedFamily?.id === family.id ? (
                                            <div className="mt-2 space-y-1 pl-3">
                                                {family.lines.map((line) => (
                                                    <button
                                                        key={line.id}
                                                        type="button"
                                                        onClick={() => setSelectedLineId(line.id)}
                                                        className={`flex w-full items-center justify-between rounded-[16px] px-3 py-2 text-left text-sm transition ${
                                                            selectedLine?.id === line.id
                                                                ? "bg-[#25A7CA]/10 font-semibold text-[#117a98]"
                                                                : "text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <span className="truncate">{line.name}</span>
                                                        <Icon icon="solar:arrow-right-outline" width={14} />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">
                                        Pantalla de entrada
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                        {selectedLine?.name || "Seleccioná una línea"}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Esto es lo que se ve cuando el usuario entra desde el index a una tarjeta como
                                        {" "}
                                        <strong>Níquel y sus aleaciones</strong>.
                                    </p>
                                </div>
                            </div>

                            {selectedLine ? (
                                <form onSubmit={saveLine} className="mt-6 space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-900">
                                            Título visible en esa pantalla
                                        </label>
                                        <TextInput
                                            value={lineForm.data.intro_title}
                                            onChange={(event) => lineForm.setData("intro_title", event.target.value)}
                                            placeholder="Ej: Aleaciones de níquel"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-900">
                                            Texto debajo del título
                                        </label>
                                        <TextArea
                                            value={lineForm.data.intro_text}
                                            onChange={(event) => lineForm.setData("intro_text", event.target.value)}
                                            placeholder="Ej: La combinación del Titanio con otros metales permite obtener..."
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={lineForm.processing}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition hover:bg-[#1f8da8] disabled:opacity-60"
                                        >
                                            <Icon icon="solar:diskette-outline" width={18} />
                                            Guardar pantalla
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                                    Seleccioná una línea para editar el título y subtítulo de esa pantalla.
                                </div>
                            )}
                        </section>

                        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">
                                        Series comerciales
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                        {selectedSeries?.name || "Seleccioná una serie"}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Acá editás cada tarjeta que aparece dentro de esa pantalla. Ejemplos:
                                        {" "}
                                        <strong>Hastelloy</strong>, <strong>Incoloy</strong>, <strong>Alloy 20</strong>.
                                    </p>
                                </div>
                                {selectedLine?.series?.length ? (
                                    <select
                                        value={selectedSeriesId ?? ""}
                                        onChange={(event) => setSelectedSeriesId(Number(event.target.value))}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    >
                                        {selectedLine.series.map((series) => (
                                            <option key={series.id} value={series.id}>
                                                {series.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : null}
                            </div>

                            {selectedSeries ? (
                                <form onSubmit={saveSeries} className="mt-6 space-y-4">
                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-900">Título visible al entrar a la serie</label>
                                            <TextInput
                                                value={seriesForm.data.intro_title}
                                                onChange={(event) => seriesForm.setData("intro_title", event.target.value)}
                                                placeholder="Ej: Hastelloy"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-900">Slug público</label>
                                            <TextInput value={selectedSeries.slug} disabled className="bg-slate-50 text-slate-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-900">Texto debajo del título</label>
                                            <TextArea
                                                value={seriesForm.data.intro_text}
                                                onChange={(event) => seriesForm.setData("intro_text", event.target.value)}
                                                placeholder="Texto introductorio de la serie comercial..."
                                            />
                                        </div>

                                    <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900">Bloques extra debajo de la grilla</h3>
                                                <p className="text-xs text-slate-500">Opcional. Sirve para agregar texto adicional después de las tarjetas.</p>
                                            </div>
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => clearRows(seriesForm, "content_sections", "¿Limpiar todos los bloques extra de esta serie?")}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                                    disabled={(seriesForm.data.content_sections ?? []).length === 0}
                                                >
                                                    <Icon icon="solar:broom-outline" width={16} />
                                                    Limpiar bloques
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addRow(seriesForm, "content_sections", (index) => ({
                                                            section_key: `section-${index + 1}`,
                                                            title: "",
                                                            content: "",
                                                            sort_order: index + 1,
                                                            is_active: true,
                                                        }))
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                                >
                                                    <Icon icon="solar:add-circle-outline" width={16} />
                                                    Añadir bloque
                                                </button>
                                            </div>
                                        </div>

                                        {seriesForm.data.content_sections.map((section, index) => (
                                            <div key={`${section.section_key}-${index}`} className="rounded-[20px] border border-slate-200 bg-white p-4">
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Bloque {index + 1}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRow(seriesForm, "content_sections", index)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                                                    >
                                                        <Icon icon="solar:trash-bin-trash-outline" width={14} />
                                                        Eliminar
                                                    </button>
                                                </div>
                                                <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
                                                    <TextInput
                                                        value={section.section_key}
                                                        onChange={(event) => {
                                                            const next = [...seriesForm.data.content_sections];
                                                            next[index].section_key = event.target.value;
                                                            seriesForm.setData("content_sections", next);
                                                        }}
                                                        placeholder="section_key"
                                                    />
                                                    <TextInput
                                                        value={section.title}
                                                        onChange={(event) => {
                                                            const next = [...seriesForm.data.content_sections];
                                                            next[index].title = event.target.value;
                                                            seriesForm.setData("content_sections", next);
                                                        }}
                                                        placeholder="Título del bloque"
                                                    />
                                                </div>
                                                <TextArea
                                                    className="mt-3"
                                                    value={section.content}
                                                    onChange={(event) => {
                                                        const next = [...seriesForm.data.content_sections];
                                                        next[index].content = event.target.value;
                                                        seriesForm.setData("content_sections", next);
                                                    }}
                                                    placeholder="Contenido"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={seriesForm.processing}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition hover:bg-[#1f8da8] disabled:opacity-60"
                                        >
                                            <Icon icon="solar:diskette-outline" width={18} />
                                            Guardar serie comercial
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                                    Esta pantalla todavía no tiene series comerciales cargadas.
                                </div>
                            )}
                        </section>

                        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">
                                        Grados o variantes
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                        {selectedGrade?.name || "Seleccioná un grado"}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Acá editás lo que se ve dentro de una serie como <strong>Hastelloy</strong>:
                                        {" "}
                                        por ejemplo <strong>B2</strong>, <strong>B3</strong> o <strong>C22</strong>.
                                    </p>
                                </div>
                                {selectedSeries?.grades?.length ? (
                                    <select
                                        value={selectedGradeId ?? ""}
                                        onChange={(event) => setSelectedGradeId(Number(event.target.value))}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    >
                                        {selectedSeries.grades.map((grade) => (
                                            <option key={grade.id} value={grade.id}>
                                                {grade.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : null}
                            </div>

                            {selectedGrade ? (
                                <form onSubmit={saveGrade} className="mt-6 space-y-5">
                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-900">Nombre corto para la tarjeta</label>
                                            <TextInput
                                                value={gradeForm.data.short_title}
                                                onChange={(event) => gradeForm.setData("short_title", event.target.value)}
                                                placeholder="B2"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-900">Título grande de la página</label>
                                            <TextInput
                                                value={gradeForm.data.intro_title}
                                                onChange={(event) => gradeForm.setData("intro_title", event.target.value)}
                                                placeholder="B2"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-900">Texto descriptivo con formato</label>
                                        <RichTextEditor
                                            value={gradeForm.data.intro_text}
                                            onChange={(value) => gradeForm.setData("intro_text", value)}
                                            placeholder="Escribí cada punto o párrafo tal como debe verse junto a la imagen..."
                                        />
                                        <p className="mt-2 text-xs text-slate-500">
                                            Este contenido aparece al lado de la imagen del grado en la web pública.
                                        </p>
                                    </div>

                                    <Toggle
                                        checked={gradeForm.data.request_quote_enabled}
                                        onChange={(value) => gradeForm.setData("request_quote_enabled", value)}
                                        label="Mostrar botón Solicitar presupuesto"
                                    />

                                    <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900">Puntos destacados</h3>
                                                <p className="text-xs text-slate-500">Son los textos cortos que aparecen al lado de la imagen.</p>
                                            </div>
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => clearRows(gradeForm, "feature_items", "¿Limpiar todos los puntos destacados de este grado?")}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                                    disabled={(gradeForm.data.feature_items ?? []).length === 0}
                                                >
                                                    <Icon icon="solar:broom-outline" width={16} />
                                                    Limpiar puntos
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addRow(gradeForm, "feature_items", (index) => ({
                                                            text: "",
                                                            sort_order: index + 1,
                                                            is_active: true,
                                                        }))
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                                >
                                                    <Icon icon="solar:add-circle-outline" width={16} />
                                                    Añadir punto
                                                </button>
                                            </div>
                                        </div>
                                        {gradeForm.data.feature_items.map((item, index) => (
                                            <div key={`feature-${index}`} className="flex items-start gap-2">
                                                <TextArea
                                                    value={item.text}
                                                    onChange={(event) => {
                                                        const next = [...gradeForm.data.feature_items];
                                                        next[index].text = event.target.value;
                                                        gradeForm.setData("feature_items", next);
                                                    }}
                                                    placeholder="Texto del bullet"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(gradeForm, "feature_items", index)}
                                                    className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100"
                                                    title="Eliminar punto"
                                                >
                                                    <Icon icon="solar:trash-bin-trash-outline" width={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900">Bloques de texto extra</h3>
                                                <p className="text-xs text-slate-500">
                                                    Este bloque controla el título y subtítulo que aparecen debajo del encabezado del show público del grado.
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => clearRows(gradeForm, "content_sections", "¿Limpiar todos los bloques extra de este grado?")}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                                    disabled={(gradeForm.data.content_sections ?? []).length === 0}
                                                >
                                                    <Icon icon="solar:broom-outline" width={16} />
                                                    Limpiar bloques
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addRow(gradeForm, "content_sections", (index) => ({
                                                            section_key: `section-${index + 1}`,
                                                            title: "",
                                                            content: "",
                                                            sort_order: index + 1,
                                                            is_active: true,
                                                        }))
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                                >
                                                    <Icon icon="solar:add-circle-outline" width={16} />
                                                    Añadir bloque
                                                </button>
                                            </div>
                                        </div>

                                        {gradeForm.data.content_sections.map((section, index) => (
                                            <div key={`section-${index}`} className="rounded-[20px] border border-slate-200 bg-white p-4">
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Bloque {index + 1}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRow(gradeForm, "content_sections", index)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                                                    >
                                                        <Icon icon="solar:trash-bin-trash-outline" width={14} />
                                                        Eliminar
                                                    </button>
                                                </div>
                                                <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
                                                    <TextInput
                                                        value={section.section_key}
                                                        onChange={(event) => {
                                                            const next = [...gradeForm.data.content_sections];
                                                            next[index].section_key = event.target.value;
                                                            gradeForm.setData("content_sections", next);
                                                        }}
                                                        placeholder="section_key"
                                                    />
                                                    <TextInput
                                                        value={section.title}
                                                        onChange={(event) => {
                                                            const next = [...gradeForm.data.content_sections];
                                                            next[index].title = event.target.value;
                                                            gradeForm.setData("content_sections", next);
                                                        }}
                                                        placeholder="Título del bloque"
                                                    />
                                                </div>
                                                <TextArea
                                                    className="mt-3"
                                                    value={section.content}
                                                    onChange={(event) => {
                                                        const next = [...gradeForm.data.content_sections];
                                                        next[index].content = event.target.value;
                                                        gradeForm.setData("content_sections", next);
                                                    }}
                                                    placeholder="Contenido"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid gap-4 xl:grid-cols-2">
                                        <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-slate-900">Aplicaciones</h3>
                                                    <p className="text-xs text-slate-500">Asigná las aplicaciones que se mostrarán en la ficha pública del grado.</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => gradeForm.setData("application_ids", [])}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                                    disabled={(gradeForm.data.application_ids ?? []).length === 0}
                                                >
                                                    <Icon icon="solar:broom-outline" width={16} />
                                                    Limpiar
                                                </button>
                                            </div>
                                            {applications.length ? (
                                                <div className="grid gap-2">
                                                    {applications.map((application) => {
                                                        const checked = (gradeForm.data.application_ids ?? []).includes(application.id);

                                                        return (
                                                            <label
                                                                key={application.id}
                                                                className={`flex cursor-pointer items-start gap-3 rounded-[18px] border p-3 transition ${
                                                                    checked
                                                                        ? "border-[#25A7CA]/40 bg-white shadow-sm"
                                                                        : "border-slate-200 bg-white/70 hover:bg-white"
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                                                                    checked={checked}
                                                                    onChange={() => toggleApplication(gradeForm, application.id)}
                                                                />
                                                                <span className="min-w-0">
                                                                    <span className="block text-sm font-semibold text-slate-900">{application.title}</span>
                                                                    {application.description ? (
                                                                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">
                                                                            {application.description}
                                                                        </span>
                                                                    ) : null}
                                                                    {!application.is_active ? (
                                                                        <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                                                            Inactiva en web pública
                                                                        </span>
                                                                    ) : null}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="rounded-[18px] border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                                                    Todavía no hay aplicaciones creadas. Cargalas desde el módulo Aplicaciones para poder asignarlas.
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="text-sm font-semibold text-slate-900">Normas y referencias</h3>
                                                <div className="flex flex-wrap justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => clearRows(gradeForm, "standards", "¿Limpiar todas las normas de este grado?")}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                                        disabled={(gradeForm.data.standards ?? []).length === 0}
                                                    >
                                                        <Icon icon="solar:broom-outline" width={16} />
                                                        Limpiar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            addRow(gradeForm, "standards", (index) => ({
                                                                code: "",
                                                                title: "",
                                                                description: "",
                                                                sort_order: index + 1,
                                                                is_active: true,
                                                            }))
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                                    >
                                                        <Icon icon="solar:add-circle-outline" width={16} />
                                                        Añadir norma
                                                    </button>
                                                </div>
                                            </div>
                                            {gradeForm.data.standards.map((item, index) => (
                                                <div key={`standard-${index}`} className="rounded-[20px] border border-slate-200 bg-white p-4">
                                                    <div className="mb-3 flex items-center justify-between gap-3">
                                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Norma {index + 1}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRow(gradeForm, "standards", index)}
                                                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                                                        >
                                                            <Icon icon="solar:trash-bin-trash-outline" width={14} />
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                    <div className="grid gap-3">
                                                        <TextInput
                                                            value={item.code}
                                                            onChange={(event) => {
                                                                const next = [...gradeForm.data.standards];
                                                                next[index].code = event.target.value;
                                                                gradeForm.setData("standards", next);
                                                            }}
                                                            placeholder="Código"
                                                        />
                                                        <TextInput
                                                            value={item.title}
                                                            onChange={(event) => {
                                                                const next = [...gradeForm.data.standards];
                                                                next[index].title = event.target.value;
                                                                gradeForm.setData("standards", next);
                                                            }}
                                                            placeholder="Título"
                                                        />
                                                        <TextArea
                                                            value={item.description}
                                                            onChange={(event) => {
                                                                const next = [...gradeForm.data.standards];
                                                                next[index].description = event.target.value;
                                                                gradeForm.setData("standards", next);
                                                            }}
                                                            placeholder="Descripción"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Normas de biblioteca */}
                                    {catalogNormas.length > 0 && (() => {
                                        const filteredNormas = filterCatalogNormasBySearch(
                                            catalogNormas.filter((norma) => norma.is_active),
                                            normaQuery,
                                        );

                                        const grouped = filteredNormas.reduce((acc, n) => {
                                            const key = n.nombre_emisor || "Sin emisor";
                                            if (!acc[key]) acc[key] = [];
                                            acc[key].push(n);
                                            return acc;
                                        }, {});

                                        return (
                                            <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-slate-900">Normas de biblioteca</h3>
                                                        <p className="text-xs text-slate-500">
                                                            Seleccioná las normas del catálogo que aplican a este grado.
                                                            {(gradeForm.data.norma_ids ?? []).length > 0 && (
                                                                <span className="ml-2 font-semibold text-[#117a98]">
                                                                    {(gradeForm.data.norma_ids ?? []).length} seleccionada{(gradeForm.data.norma_ids ?? []).length !== 1 ? "s" : ""}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => gradeForm.setData("norma_ids", [])}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                                        disabled={(gradeForm.data.norma_ids ?? []).length === 0}
                                                    >
                                                        <Icon icon="solar:broom-outline" width={16} />
                                                        Limpiar
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="relative block">
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
                                                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                                                        <span className="rounded-full bg-white px-3 py-1 shadow-sm">
                                                            {filteredNormas.length} visible{filteredNormas.length !== 1 ? "s" : ""}
                                                        </span>
                                                        {normaQuery && (
                                                            <span className="rounded-full bg-[#25A7CA]/10 px-3 py-1 text-[#117a98]">
                                                                búsqueda inteligente activa
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {filteredNormas.length === 0 ? (
                                                    <div className="rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                                                        No encontramos normas para <strong>{normaQuery}</strong>.
                                                    </div>
                                                ) : (
                                                    Object.entries(grouped).map(([emisor, items]) => (
                                                        <div key={emisor}>
                                                            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{emisor}</p>
                                                            <div className="grid gap-2 sm:grid-cols-2">
                                                                {items.map((norma) => {
                                                                    const checked = (gradeForm.data.norma_ids ?? []).includes(norma.id);
                                                                    return (
                                                                        <label
                                                                            key={norma.id}
                                                                            className={`flex cursor-pointer items-start gap-3 rounded-[18px] border p-3 transition ${
                                                                                checked
                                                                                    ? "border-[#25A7CA]/40 bg-white shadow-sm"
                                                                                    : "border-slate-200 bg-white/70 hover:bg-white"
                                                                            }`}
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                                                                                checked={checked}
                                                                                onChange={() => {
                                                                                    const current = gradeForm.data.norma_ids ?? [];
                                                                                    gradeForm.setData(
                                                                                        "norma_ids",
                                                                                        checked
                                                                                            ? current.filter((id) => id !== norma.id)
                                                                                            : [...current, norma.id],
                                                                                    );
                                                                                }}
                                                                            />
                                                                            <span className="min-w-0">
                                                                                <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#117a98]">
                                                                                    {norma.nombre_emisor}
                                                                                </span>
                                                                                <span className="mt-0.5 block text-sm font-semibold text-slate-900">{norma.norma}</span>
                                                                                {norma.descripcion_corta && (
                                                                                    <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-slate-500">
                                                                                        {norma.descripcion_corta}
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        );
                                    })()}

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={gradeForm.processing}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition hover:bg-[#1f8da8] disabled:opacity-60"
                                        >
                                            <Icon icon="solar:diskette-outline" width={18} />
                                            Guardar grado
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                                    Esta serie todavía no tiene grados cargados.
                                </div>
                            )}
                        </section>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

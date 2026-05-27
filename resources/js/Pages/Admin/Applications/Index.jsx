import PublicPreviewModal from "@/Components/Admin/PublicPreviewModal";
import RichTextEditor from "@/Components/Admin/RichTextEditor";
import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function createClientKey(prefix = "application") {
    if (globalThis.crypto?.randomUUID) {
        return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildFieldsMap(section) {
    return Object.fromEntries(
        (section?.fields ?? []).map((field) => [field.field_key, field]),
    );
}

function orderCode(index) {
    return String.fromCharCode(65 + index);
}

function normalizeSearchValue(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function sortProductsAlphabetically(items = []) {
    return [...items].sort((left, right) =>
        String(left?.name || "").localeCompare(String(right?.name || ""), "es", {
            sensitivity: "base",
        }),
    );
}

function sortProductsSelectedFirst(items = [], selectedIds = []) {
    const selectedIdSet = new Set((selectedIds || []).map((value) => Number(value)));

    return [...items].sort((left, right) => {
        const leftSelected = selectedIdSet.has(Number(left?.id));
        const rightSelected = selectedIdSet.has(Number(right?.id));

        if (leftSelected !== rightSelected) {
            return leftSelected ? -1 : 1;
        }

        return String(left?.name || "").localeCompare(String(right?.name || ""), "es", {
            sensitivity: "base",
        });
    });
}

function matchesProductSearch(item, query, extraValues = []) {
    const normalizedQuery = normalizeSearchValue(query);

    if (!normalizedQuery) {
        return true;
    }

    return [item?.name, ...extraValues].some((value) =>
        normalizeSearchValue(value).includes(normalizedQuery),
    );
}

function uniqueNumberIds(values = []) {
    return [...new Set((values || []).map((value) => Number(value)).filter(Boolean))];
}

function normalizeRelatedSelections(
    relatedLineIds = [],
    relatedSeriesIds = [],
    relatedGradeIds = [],
    excludedSeriesIds = [],
    excludedGradeIds = [],
    catalogLines = [],
    catalogSeries = [],
    catalogGrades = [],
) {
    const validLineIds = new Set(catalogLines.map((line) => Number(line.id)));
    const validSeriesIds = new Set(catalogSeries.map((series) => Number(series.id)));
    const validGradeIds = new Set(catalogGrades.map((grade) => Number(grade.id)));

    return {
        relatedLineIds: uniqueNumberIds(relatedLineIds).filter((id) => validLineIds.has(id)),
        relatedSeriesIds: uniqueNumberIds(relatedSeriesIds).filter((id) => validSeriesIds.has(id)),
        relatedGradeIds: uniqueNumberIds(relatedGradeIds).filter((id) => validGradeIds.has(id)),
        excludedSeriesIds: uniqueNumberIds(excludedSeriesIds).filter((id) =>
            validSeriesIds.has(id),
        ),
        excludedGradeIds: uniqueNumberIds(excludedGradeIds).filter((id) =>
            validGradeIds.has(id),
        ),
    };
}

function pruneSelectionState(
    relatedLineIds = [],
    relatedSeriesIds = [],
    relatedGradeIds = [],
    excludedSeriesIds = [],
    excludedGradeIds = [],
    catalogSeries = [],
    catalogGrades = [],
) {
    const lineIds = uniqueNumberIds(relatedLineIds);
    const seriesMap = new Map(
        catalogSeries.map((currentSeries) => [Number(currentSeries.id), currentSeries]),
    );
    const gradeMap = new Map(
        catalogGrades.map((currentGrade) => [Number(currentGrade.id), currentGrade]),
    );
    const seriesIds = uniqueNumberIds(relatedSeriesIds).filter((seriesId) => {
        const currentSeries = seriesMap.get(seriesId);
        return currentSeries ? !lineIds.includes(Number(currentSeries.line_id)) : false;
    });
    const excludedSeriesSet = new Set(
        uniqueNumberIds(excludedSeriesIds).filter((seriesId) => {
            const currentSeries = seriesMap.get(seriesId);

            if (!currentSeries) {
                return false;
            }

            return (
                lineIds.includes(Number(currentSeries.line_id)) &&
                !seriesIds.includes(seriesId)
            );
        }),
    );
    const gradeIds = uniqueNumberIds(relatedGradeIds).filter((gradeId) => {
        const currentGrade = gradeMap.get(gradeId);

        if (!currentGrade) {
            return false;
        }

        if (
            lineIds.includes(Number(currentGrade.line_id)) &&
            !excludedSeriesSet.has(Number(currentGrade.series_id))
        ) {
            return false;
        }

        if (seriesIds.includes(Number(currentGrade.series_id))) {
            return false;
        }

        return true;
    });
    const excludedGradeSet = new Set(
        uniqueNumberIds(excludedGradeIds).filter((gradeId) => {
            const currentGrade = gradeMap.get(gradeId);

            if (!currentGrade) {
                return false;
            }

            if (gradeIds.includes(gradeId)) {
                return false;
            }

            if (excludedSeriesSet.has(Number(currentGrade.series_id))) {
                return false;
            }

            const coveredByLine =
                lineIds.includes(Number(currentGrade.line_id)) &&
                !excludedSeriesSet.has(Number(currentGrade.series_id));
            const coveredBySeries = seriesIds.includes(Number(currentGrade.series_id));

            return coveredByLine || coveredBySeries;
        }),
    );

    return {
        relatedLineIds: lineIds,
        relatedSeriesIds: seriesIds,
        relatedGradeIds: gradeIds,
        excludedSeriesIds: [...excludedSeriesSet],
        excludedGradeIds: [...excludedGradeSet],
    };
}

function deriveEffectiveSelections(
    relatedLineIds = [],
    relatedSeriesIds = [],
    relatedGradeIds = [],
    excludedSeriesIds = [],
    excludedGradeIds = [],
    catalogSeries = [],
    catalogGrades = [],
) {
    const explicit = pruneSelectionState(
        relatedLineIds,
        relatedSeriesIds,
        relatedGradeIds,
        excludedSeriesIds,
        excludedGradeIds,
        catalogSeries,
        catalogGrades,
    );
    const lineIds = explicit.relatedLineIds;
    const seriesIds = uniqueNumberIds([
        ...explicit.relatedSeriesIds,
        ...catalogSeries
            .filter(
                (currentSeries) =>
                    lineIds.includes(Number(currentSeries.line_id)) &&
                    !explicit.excludedSeriesIds.includes(Number(currentSeries.id)),
            )
            .map((currentSeries) => currentSeries.id),
    ]);
    const gradeIds = uniqueNumberIds([
        ...explicit.relatedGradeIds,
        ...catalogGrades
            .filter((grade) => {
                if (explicit.excludedGradeIds.includes(Number(grade.id))) {
                    return false;
                }

                if (explicit.excludedSeriesIds.includes(Number(grade.series_id))) {
                    return false;
                }

                return (
                    lineIds.includes(Number(grade.line_id)) ||
                    seriesIds.includes(Number(grade.series_id))
                );
            })
            .map((grade) => grade.id),
    ]);

    return {
        lineIds,
        seriesIds,
        gradeIds,
        excludedSeriesIds: explicit.excludedSeriesIds,
        excludedGradeIds: explicit.excludedGradeIds,
    };
}

function getSeriesForLine(catalogSeries = [], lineId) {
    return catalogSeries.filter((currentSeries) => currentSeries.line_id === lineId);
}

function getGradesForLine(catalogGrades = [], lineId) {
    return catalogGrades.filter((grade) => grade.line_id === lineId);
}

function getGradesForSeries(catalogGrades = [], seriesId) {
    return catalogGrades.filter((grade) => grade.series_id === seriesId);
}

function deriveDisplaySelectionCounts(
    relatedLineIds = [],
    relatedSeriesIds = [],
    relatedGradeIds = [],
    excludedSeriesIds = [],
    excludedGradeIds = [],
    catalogLines = [],
    catalogSeries = [],
    catalogGrades = [],
) {
    const normalizedSelection = normalizeRelatedSelections(
        relatedLineIds,
        relatedSeriesIds,
        relatedGradeIds,
        excludedSeriesIds,
        excludedGradeIds,
        catalogLines,
        catalogSeries,
        catalogGrades,
    );
    const prunedSelection = pruneSelectionState(
        normalizedSelection.relatedLineIds,
        normalizedSelection.relatedSeriesIds,
        normalizedSelection.relatedGradeIds,
        normalizedSelection.excludedSeriesIds,
        normalizedSelection.excludedGradeIds,
        catalogSeries,
        catalogGrades,
    );

    return {
        lineIds: prunedSelection.relatedLineIds,
        seriesIds: prunedSelection.relatedSeriesIds,
        gradeIds: prunedSelection.relatedGradeIds,
        excludedSeriesIds: prunedSelection.excludedSeriesIds,
        excludedGradeIds: prunedSelection.excludedGradeIds,
    };
}

function derivePublicCardSelections(
    relatedLineIds = [],
    relatedSeriesIds = [],
    relatedGradeIds = [],
    excludedSeriesIds = [],
    excludedGradeIds = [],
    catalogLines = [],
    catalogSeries = [],
    catalogGrades = [],
) {
    const explicitSelection = deriveDisplaySelectionCounts(
        relatedLineIds,
        relatedSeriesIds,
        relatedGradeIds,
        excludedSeriesIds,
        excludedGradeIds,
        catalogLines,
        catalogSeries,
        catalogGrades,
    );
    const seriesIdsWithGradeExceptions = new Set(
        catalogGrades
            .filter(
                (grade) =>
                    explicitSelection.excludedGradeIds.includes(Number(grade.id)) &&
                    explicitSelection.seriesIds.includes(Number(grade.series_id)),
            )
            .map((grade) => Number(grade.series_id)),
    );
    const derivedGradeIds = uniqueNumberIds([
        ...explicitSelection.gradeIds,
        ...catalogGrades
            .filter((grade) => {
                const gradeId = Number(grade.id);
                const seriesId = Number(grade.series_id);

                if (!seriesIdsWithGradeExceptions.has(seriesId)) {
                    return false;
                }

                return !explicitSelection.excludedGradeIds.includes(gradeId);
            })
            .map((grade) => grade.id),
    ]);

    return {
        lineIds: explicitSelection.lineIds,
        seriesIds: explicitSelection.seriesIds,
        gradeIds: derivedGradeIds,
        excludedSeriesIds: explicitSelection.excludedSeriesIds,
        excludedGradeIds: explicitSelection.excludedGradeIds,
    };
}

function emptyHeroForm(hero) {
    const fields = buildFieldsMap(hero);

    return {
        id: hero?.id ?? null,
        title: hero?.title ?? "Aplicaciones",
        media_id: hero?.media_id ?? null,
        media_url: hero?.media_url ?? "",
        image_file: null,
        secondary_media_id: hero?.secondary_media_id ?? null,
        secondary_media_url: hero?.secondary_media_url ?? "",
        video_file: null,
        media_type: fields.media_type?.field_value ?? "image",
        media_type_field_id: fields.media_type?.id ?? null,
        youtube_url: fields.youtube_url?.field_value ?? "",
        youtube_field_id: fields.youtube_url?.id ?? null,
        sort_order: hero?.sort_order ?? "A",
        is_active: hero?.is_active ?? true,
    };
}

function emptyApplicationItemForm(item = null, index = 0) {
    const meta = item?.meta_json ?? {};

    return {
        client_key: item?.id ? `application-${item.id}` : createClientKey(),
        id: item?.id ?? null,
        item_key: item?.item_key ?? "",
        title: item?.title ?? "",
        subtitle: item?.subtitle ?? "",
        description: item?.description ?? "",
        media_id: item?.media_id ?? null,
        media_url: item?.media_url ?? "",
        image_file: null,
        detail_media_id: meta?.detail_media_id ?? null,
        detail_media_url: meta?.detail_media_url ?? "",
        detail_image_file: null,
        detail_title: meta?.detail_title ?? "",
        link_url: item?.link_url ?? "",
        accent_color: item?.accent_color ?? "",
        show_in_home: meta?.show_in_home ?? true,
        related_line_ids: Array.isArray(meta?.related_line_ids)
            ? meta.related_line_ids.map((id) => Number(id))
            : Array.isArray(meta?.related_catalog_line_ids)
              ? meta.related_catalog_line_ids.map((id) => Number(id))
              : [],
        related_series_ids: Array.isArray(meta?.related_series_ids)
            ? meta.related_series_ids.map((id) => Number(id))
            : [],
        related_grade_ids: Array.isArray(meta?.related_grade_ids)
            ? meta.related_grade_ids.map((id) => Number(id))
            : [],
        excluded_series_ids: Array.isArray(meta?.excluded_series_ids)
            ? meta.excluded_series_ids.map((id) => Number(id))
            : [],
        excluded_grade_ids: Array.isArray(meta?.excluded_grade_ids)
            ? meta.excluded_grade_ids.map((id) => Number(id))
            : [],
        sort_order: item?.sort_order ?? orderCode(index),
        is_active: item?.is_active ?? true,
    };
}

function emptyApplicationsForm(section) {
    const meta = section?.meta_json ?? {};

    return {
        id: section?.id ?? null,
        title: section?.title ?? "Aplicaciones",
        subtitle: section?.subtitle ?? "",
        button_text: section?.button_text ?? "Ver todas",
        button_url: section?.button_url ?? "/aplicaciones",
        show_on_home: meta?.show_on_home ?? true,
        sort_order: section?.sort_order ?? "F",
        is_active: section?.is_active ?? true,
        items: (section?.items ?? []).map((item, index) =>
            emptyApplicationItemForm(item, index),
        ),
    };
}

function createEmptyApplicationItem(index = 0) {
    return emptyApplicationItemForm(null, index);
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

function Field({ label, hint = null, children }) {
    return (
        <div className="block space-y-2">
            <div>
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
            </div>
            {children}
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

function Toggle({ label, checked, onChange }) {
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
            <span
                className={`flex h-6 w-10 items-center rounded-full p-1 transition ${
                    checked ? "bg-[#25A7CA]" : "bg-slate-300"
                }`}
            >
                <span
                    className={`h-4 w-4 rounded-full bg-white transition ${
                        checked ? "translate-x-4" : "translate-x-0"
                    }`}
                />
            </span>
            <span>{label}</span>
        </button>
    );
}

function StatCard({ label, value, icon }) {
    return (
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                        {value}
                    </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]">
                    <Icon icon={icon} width={22} />
                </div>
            </div>
        </article>
    );
}

function ProductCheckbox({ item, checked, onToggle, subtitle }) {
    return (
        <label
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition cursor-pointer ${
                checked
                    ? "border-[#25A7CA]/40 bg-[#25A7CA]/8"
                    : "border-slate-200 bg-white hover:border-slate-300"
            }`}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={onToggle}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
            />
            <span className="min-w-0">
                <span className="block font-semibold text-slate-800">{item.name}</span>
                <span className="block text-xs text-slate-500">{subtitle || "—"}</span>
            </span>
        </label>
    );
}

function ProductSelector({
    lines,
    series,
    grades,
    selectedLineIds,
    selectedSeriesIds,
    selectedGradeIds,
    effectiveLineIds = [],
    effectiveSeriesIds = [],
    effectiveGradeIds = [],
    displayLineIds = [],
    displaySeriesIds = [],
    displayGradeIds = [],
    publicCardLineIds = [],
    publicCardSeriesIds = [],
    publicCardGradeIds = [],
    onToggle,
    actionSlot = null,
}) {
    const [tab, setTab] = useState("line");
    const [queries, setQueries] = useState({
        line: "",
        series: "",
        grade: "",
    });

    const tabs = [
        { key: "line", label: "Línea", count: effectiveLineIds.length },
        { key: "series", label: "Serie", count: effectiveSeriesIds.length },
        { key: "grade", label: "Grado", count: effectiveGradeIds.length },
    ];

    const sortedLines = useMemo(() => sortProductsAlphabetically(lines), [lines]);
    const sortedSeries = useMemo(() => sortProductsAlphabetically(series), [series]);
    const sortedGrades = useMemo(() => sortProductsAlphabetically(grades), [grades]);

    const filteredLines = useMemo(
        () =>
            sortProductsSelectedFirst(
                sortedLines.filter((line) =>
                    matchesProductSearch(line, queries.line, [line.family_name]),
                ),
                effectiveLineIds,
            ),
        [effectiveLineIds, queries.line, sortedLines],
    );
    const filteredSeries = useMemo(
        () =>
            sortProductsSelectedFirst(
                sortedSeries.filter((currentSeries) =>
                    matchesProductSearch(currentSeries, queries.series, [
                        currentSeries.line_name,
                        currentSeries.family_name,
                    ]),
                ),
                effectiveSeriesIds,
            ),
        [effectiveSeriesIds, queries.series, sortedSeries],
    );
    const filteredGrades = useMemo(
        () =>
            sortProductsSelectedFirst(
                sortedGrades.filter((grade) =>
                    matchesProductSearch(grade, queries.grade, [
                        grade.series_name,
                        grade.line_name,
                    ]),
                ),
                effectiveGradeIds,
            ),
        [effectiveGradeIds, queries.grade, sortedGrades],
    );

    const searchValue = queries[tab];
    const setSearchValue = (value) =>
        setQueries((current) => ({
            ...current,
            [tab]: value,
        }));

    return (
        <div>
            <div className="mb-4 flex gap-1 rounded-2xl bg-slate-100 p-1">
                {tabs.map(({ key, label, count }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setTab(key)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                            tab === key
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {label}
                        {count > 0 && (
                            <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#25A7CA] px-1.5 py-0.5 text-xs text-white">
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="mb-4 space-y-3">
                <label className="relative block">
                    <Icon
                        icon="solar:magnifer-outline"
                        width={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="search"
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        placeholder={
                            tab === "line"
                                ? "Buscar línea o familia"
                                : tab === "series"
                                  ? "Buscar serie"
                                  : "Buscar grado"
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                    />
                    {searchValue ? (
                        <button
                            type="button"
                            onClick={() => setSearchValue("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                            aria-label="Limpiar búsqueda"
                        >
                            <Icon icon="solar:close-circle-outline" width={18} />
                        </button>
                    ) : null}
                </label>

                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="rounded-full bg-white px-3 py-1 shadow-sm">
                        {tab === "line"
                            ? `${filteredLines.length} visible${filteredLines.length === 1 ? "" : "s"}`
                            : tab === "series"
                              ? `${filteredSeries.length} visible${filteredSeries.length === 1 ? "" : "s"}`
                              : `${filteredGrades.length} visible${filteredGrades.length === 1 ? "" : "s"}`}
                    </span>
                    {searchValue ? (
                        <span className="rounded-full bg-[#25A7CA]/10 px-3 py-1 text-[#117a98]">
                            búsqueda activa
                        </span>
                    ) : null}
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        La pública muestra estas cards: {publicCardLineIds.length} línea{publicCardLineIds.length === 1 ? "" : "s"} · {publicCardSeriesIds.length} serie{publicCardSeriesIds.length === 1 ? "" : "s"} · {publicCardGradeIds.length} grado{publicCardGradeIds.length === 1 ? "" : "s"}
                    </span>
                </div>

                {actionSlot ? <div className="flex justify-start">{actionSlot}</div> : null}
            </div>

            {tab === "line" && (
                <div className="grid gap-3 md:grid-cols-2">
                    {lines.length === 0 && (
                        <p className="col-span-2 text-sm text-slate-400">No hay líneas activas.</p>
                    )}
                    {lines.length > 0 && filteredLines.length === 0 && (
                        <p className="col-span-2 text-sm text-slate-400">
                            No encontramos líneas para <strong>{queries.line}</strong>.
                        </p>
                    )}
                    {filteredLines.map((line) => (
                        <ProductCheckbox
                            key={line.id}
                            item={line}
                            checked={effectiveLineIds.includes(line.id)}
                            onToggle={() => onToggle("line", line.id)}
                            subtitle={line.family_name || "Sin familia"}
                        />
                    ))}
                </div>
            )}

            {tab === "series" && (
                <div className="grid gap-3 md:grid-cols-2">
                    {series.length === 0 && (
                        <p className="col-span-2 text-sm text-slate-400">No hay series activas.</p>
                    )}
                    {series.length > 0 && filteredSeries.length === 0 && (
                        <p className="col-span-2 text-sm text-slate-400">
                            No encontramos series para <strong>{queries.series}</strong>.
                        </p>
                    )}
                    {filteredSeries.map((s) => (
                        <ProductCheckbox
                            key={s.id}
                            item={s}
                            checked={effectiveSeriesIds.includes(s.id)}
                            onToggle={() => onToggle("series", s.id)}
                            subtitle={[s.line_name, s.family_name].filter(Boolean).join(" · ")}
                        />
                    ))}
                </div>
            )}

            {tab === "grade" && (
                <div className="grid gap-3 md:grid-cols-2">
                    {grades.length === 0 && (
                        <p className="col-span-2 text-sm text-slate-400">No hay grados activos.</p>
                    )}
                    {grades.length > 0 && filteredGrades.length === 0 && (
                        <p className="col-span-2 text-sm text-slate-400">
                            No encontramos grados para <strong>{queries.grade}</strong>.
                        </p>
                    )}
                    {filteredGrades.map((g) => (
                        <ProductCheckbox
                            key={g.id}
                            item={g}
                            checked={effectiveGradeIds.includes(g.id)}
                            onToggle={() => onToggle("grade", g.id)}
                            subtitle={[g.series_name, g.line_name].filter(Boolean).join(" · ")}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ApplicationsIndex({
    hero,
    applicationsSection,
    catalogLines,
    catalogSeries,
    catalogGrades,
    publicApplicationsUrl,
}) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [heroForm, setHeroForm] = useState(emptyHeroForm(hero));
    const [applicationsForm, setApplicationsForm] = useState(
        emptyApplicationsForm(applicationsSection),
    );
    const [persistedApplicationsForm, setPersistedApplicationsForm] = useState(
        emptyApplicationsForm(applicationsSection),
    );
    const [heroSaving, setHeroSaving] = useState(false);
    const [sectionSaving, setSectionSaving] = useState(false);
    const [savingCardKey, setSavingCardKey] = useState(null);
    const [removingCardKey, setRemovingCardKey] = useState(null);
    const [pendingScrollCardKey, setPendingScrollCardKey] = useState(null);
    const [expandedItemKey, setExpandedItemKey] = useState(null);
    const itemRefs = useRef(new Map());

    useEffect(() => {
        setHeroForm(emptyHeroForm(hero));
    }, [hero]);

    useEffect(() => {
        const nextForm = emptyApplicationsForm(applicationsSection);
        nextForm.items = nextForm.items.map((item) => {
            const normalizedSelection = normalizeRelatedSelections(
                item.related_line_ids,
                item.related_series_ids,
                item.related_grade_ids,
                item.excluded_series_ids,
                item.excluded_grade_ids,
                catalogLines,
                catalogSeries,
                catalogGrades,
            );
            const explicitSelection = pruneSelectionState(
                normalizedSelection.relatedLineIds,
                normalizedSelection.relatedSeriesIds,
                normalizedSelection.relatedGradeIds,
                normalizedSelection.excludedSeriesIds,
                normalizedSelection.excludedGradeIds,
                catalogSeries,
                catalogGrades,
            );

            return {
                ...item,
                related_line_ids: explicitSelection.relatedLineIds,
                related_series_ids: explicitSelection.relatedSeriesIds,
                related_grade_ids: explicitSelection.relatedGradeIds,
                excluded_series_ids: explicitSelection.excludedSeriesIds,
                excluded_grade_ids: explicitSelection.excludedGradeIds,
            };
        });
        setApplicationsForm(nextForm);
        setPersistedApplicationsForm(nextForm);
    }, [applicationsSection, catalogGrades, catalogLines, catalogSeries]);

    useEffect(() => {
        setExpandedItemKey((current) => {
            if (current && applicationsForm.items.some((item) => item.client_key === current)) {
                return current;
            }

            return applicationsForm.items[0]?.client_key ?? null;
        });
    }, [applicationsForm.items]);

    useEffect(() => {
        if (!pendingScrollCardKey) {
            return;
        }

        const frame = window.requestAnimationFrame(() => {
            const targetCard = itemRefs.current.get(pendingScrollCardKey);

            if (!targetCard) {
                return;
            }

            targetCard.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });

            window.setTimeout(() => {
                targetCard
                    .querySelector('input[type="text"], input:not([type]), textarea, [contenteditable="true"]')
                    ?.focus();
            }, 250);
        });

        setPendingScrollCardKey(null);

        return () => window.cancelAnimationFrame(frame);
    }, [applicationsForm.items, pendingScrollCardKey]);

    const activeItemsCount = useMemo(
        () => applicationsForm.items.filter((item) => item.is_active).length,
        [applicationsForm.items],
    );

    const detailItemsCount = useMemo(
        () =>
            applicationsForm.items.filter(
                (item) =>
                    String(item.description || "").trim() !== "" ||
                    item.related_line_ids.length > 0 ||
                    item.related_series_ids.length > 0 ||
                    item.related_grade_ids.length > 0 ||
                    item.excluded_series_ids.length > 0 ||
                    item.excluded_grade_ids.length > 0,
            ).length,
        [applicationsForm.items],
    );

    const homeItemsCount = useMemo(
        () =>
            applicationsForm.items.filter(
                (item) => item.is_active && item.show_in_home,
            ).length,
        [applicationsForm.items],
    );

    const reloadPage = () => {
        router.reload();
    };

    const syncApplicationsForms = (sectionData) => {
        const nextForm = emptyApplicationsForm(sectionData);
        nextForm.items = nextForm.items.map((item) => {
            const normalizedSelection = normalizeRelatedSelections(
                item.related_line_ids,
                item.related_series_ids,
                item.related_grade_ids,
                item.excluded_series_ids,
                item.excluded_grade_ids,
                catalogLines,
                catalogSeries,
                catalogGrades,
            );
            const explicitSelection = pruneSelectionState(
                normalizedSelection.relatedLineIds,
                normalizedSelection.relatedSeriesIds,
                normalizedSelection.relatedGradeIds,
                normalizedSelection.excludedSeriesIds,
                normalizedSelection.excludedGradeIds,
                catalogSeries,
                catalogGrades,
            );

            return {
                ...item,
                related_line_ids: explicitSelection.relatedLineIds,
                related_series_ids: explicitSelection.relatedSeriesIds,
                related_grade_ids: explicitSelection.relatedGradeIds,
                excluded_series_ids: explicitSelection.excludedSeriesIds,
                excluded_grade_ids: explicitSelection.excludedGradeIds,
            };
        });
        setApplicationsForm(nextForm);
        setPersistedApplicationsForm(nextForm);
    };

    const buildApplicationsSectionPayload = (baseForm, items) => ({
        page_key: "home",
        section_key: "applications",
        title: baseForm.title || "Aplicaciones",
        subtitle: baseForm.subtitle || null,
        button_text: baseForm.button_text || "Ver todas",
        button_url: baseForm.button_url || "/aplicaciones",
        meta_json: {
            show_on_home: baseForm.show_on_home,
        },
        sort_order: baseForm.sort_order || "F",
        is_active: baseForm.is_active,
        field_values: [],
        items,
    });

    const serializeApplicationItem = async (item, index) => {
        const title = item.title.trim();

        if (!title) {
            return null;
        }

        let mediaId = item.media_id;
        let detailMediaId = item.detail_media_id;

        if (item.image_file) {
            const uploaded = await uploadAsset(
                item.image_file,
                title || `Aplicación ${index + 1}`,
            );
            mediaId = uploaded.id;
        }

        if (item.detail_image_file) {
            const uploaded = await uploadAsset(
                item.detail_image_file,
                `${title || `Aplicación ${index + 1}`} detalle`,
            );
            detailMediaId = uploaded.id;
        }

        const normalizedSelection = normalizeRelatedSelections(
            item.related_line_ids,
            item.related_series_ids,
            item.related_grade_ids,
            item.excluded_series_ids,
            item.excluded_grade_ids,
            catalogLines,
            catalogSeries,
            catalogGrades,
        );
        const explicitSelection = pruneSelectionState(
            normalizedSelection.relatedLineIds,
            normalizedSelection.relatedSeriesIds,
            normalizedSelection.relatedGradeIds,
            normalizedSelection.excludedSeriesIds,
            normalizedSelection.excludedGradeIds,
            catalogSeries,
            catalogGrades,
        );

        return {
            id: item.id,
            item_key: item.item_key?.trim() || slugify(title),
            title,
            subtitle: item.subtitle?.trim() || null,
            description: item.description?.trim() || null,
            media_id: mediaId || null,
            link_url: item.link_url?.trim() || null,
            accent_color: item.accent_color?.trim() || null,
            sort_order: item.sort_order?.trim() || orderCode(index),
            is_active: item.is_active,
            meta_json: {
                show_in_home: item.show_in_home,
                detail_title: item.detail_title?.trim() || null,
                detail_media_id: detailMediaId || null,
                related_line_ids: explicitSelection.relatedLineIds,
                related_series_ids: explicitSelection.relatedSeriesIds,
                related_grade_ids: explicitSelection.relatedGradeIds,
                excluded_series_ids: explicitSelection.excludedSeriesIds,
                excluded_grade_ids: explicitSelection.excludedGradeIds,
            },
        };
    };

    const saveHero = async () => {
        setHeroSaving(true);

        try {
            let mediaId = heroForm.media_id;
            let secondaryMediaId = heroForm.secondary_media_id;

            if (heroForm.image_file) {
                const uploaded = await uploadAsset(
                    heroForm.image_file,
                    heroForm.title || "Aplicaciones banner",
                );
                mediaId = uploaded.id;
            }

            if (heroForm.video_file) {
                const uploaded = await uploadAsset(
                    heroForm.video_file,
                    heroForm.title || "Aplicaciones video",
                );
                secondaryMediaId = uploaded.id;
            }

            await axios.put(`/admin/api/site-sections/${heroForm.id}`, {
                page_key: "aplicaciones",
                section_key: "hero",
                title: heroForm.title || "Aplicaciones",
                media_id: mediaId,
                secondary_media_id:
                    heroForm.media_type === "video" ? secondaryMediaId : null,
                sort_order: heroForm.sort_order || "A",
                is_active: heroForm.is_active,
                field_values: [
                    {
                        id: heroForm.media_type_field_id,
                        field_key: "media_type",
                        field_label: "media_type",
                        field_type: "text",
                        field_value: heroForm.media_type,
                        sort_order: "A",
                        is_active: true,
                    },
                    {
                        id: heroForm.youtube_field_id,
                        field_key: "youtube_url",
                        field_label: "youtube_url",
                        field_type: "text",
                        field_value:
                            heroForm.media_type === "youtube"
                                ? heroForm.youtube_url || ""
                                : "",
                        sort_order: "B",
                        is_active: true,
                    },
                ],
                items: [],
            });

            emitAdminToast("El banner de Aplicaciones se actualizó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar el banner de Aplicaciones.",
                "error",
            );
        } finally {
            setHeroSaving(false);
        }
    };

    const saveApplicationsSettings = async () => {
        setSectionSaving(true);

        try {
            const currentItems = [];

            for (const [index, item] of applicationsForm.items.entries()) {
                const payload = await serializeApplicationItem(item, index);

                if (payload) {
                    currentItems.push(payload);
                }
            }

            const response = await axios.put(
                `/admin/api/site-sections/${applicationsForm.id}`,
                buildApplicationsSectionPayload(applicationsForm, currentItems),
            );

            syncApplicationsForms(response.data);
            emitAdminToast("La configuración de Home se guardó correctamente.");
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar la configuración de Home.",
                "error",
            );
        } finally {
            setSectionSaving(false);
        }
    };

    const updateItem = (index, patch) => {
        setApplicationsForm((current) => ({
            ...current,
            items: current.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...patch } : item,
            ),
        }));
    };

    const toggleRelatedProduct = (index, type, productId) => {
        setApplicationsForm((current) => ({
            ...current,
            items: current.items.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                const normalizedSelection = normalizeRelatedSelections(
                    item.related_line_ids,
                    item.related_series_ids,
                    item.related_grade_ids,
                    item.excluded_series_ids,
                    item.excluded_grade_ids,
                    catalogLines,
                    catalogSeries,
                    catalogGrades,
                );
                const explicitSelection = pruneSelectionState(
                    normalizedSelection.relatedLineIds,
                    normalizedSelection.relatedSeriesIds,
                    normalizedSelection.relatedGradeIds,
                    normalizedSelection.excludedSeriesIds,
                    normalizedSelection.excludedGradeIds,
                    catalogSeries,
                    catalogGrades,
                );
                const lineIds = new Set(explicitSelection.relatedLineIds);
                const seriesIds = new Set(explicitSelection.relatedSeriesIds);
                const gradeIds = new Set(explicitSelection.relatedGradeIds);
                const excludedSeriesIds = new Set(explicitSelection.excludedSeriesIds);
                const excludedGradeIds = new Set(explicitSelection.excludedGradeIds);

                if (type === "line") {
                    const exists = lineIds.has(productId);

                    if (exists) {
                        lineIds.delete(productId);
                        getSeriesForLine(catalogSeries, productId).forEach((currentSeries) => {
                            excludedSeriesIds.delete(currentSeries.id);
                        });
                        getGradesForLine(catalogGrades, productId).forEach((grade) => {
                            excludedGradeIds.delete(grade.id);
                        });
                    } else {
                        lineIds.add(productId);
                        getSeriesForLine(catalogSeries, productId).forEach((currentSeries) => {
                            seriesIds.delete(currentSeries.id);
                            excludedSeriesIds.delete(currentSeries.id);
                        });
                        getGradesForLine(catalogGrades, productId).forEach((grade) => {
                            gradeIds.delete(grade.id);
                            excludedGradeIds.delete(grade.id);
                        });
                    }
                }

                if (type === "series") {
                    const selectedSeries = catalogSeries.find(
                        (currentSeries) => currentSeries.id === productId,
                    );
                    const parentLineId = Number(selectedSeries?.line_id || 0);
                    const existsExplicitly = seriesIds.has(productId);
                    const existsViaLine = parentLineId > 0 && lineIds.has(parentLineId);
                    const excludedViaLine = excludedSeriesIds.has(productId);

                    if (existsViaLine) {
                        if (excludedViaLine) {
                            excludedSeriesIds.delete(productId);
                        } else {
                            excludedSeriesIds.add(productId);
                            getGradesForSeries(catalogGrades, productId).forEach((grade) => {
                                gradeIds.delete(grade.id);
                                excludedGradeIds.delete(grade.id);
                            });
                        }

                        seriesIds.delete(productId);
                    } else {
                        if (existsExplicitly) {
                            seriesIds.delete(productId);
                            getGradesForSeries(catalogGrades, productId).forEach((grade) => {
                                excludedGradeIds.delete(grade.id);
                            });
                        } else {
                            seriesIds.add(productId);
                            excludedSeriesIds.delete(productId);
                            getGradesForSeries(catalogGrades, productId).forEach((grade) => {
                                gradeIds.delete(grade.id);
                                excludedGradeIds.delete(grade.id);
                            });
                        }
                    }
                }

                if (type === "grade") {
                    const selectedGrade = catalogGrades.find(
                        (grade) => grade.id === productId,
                    );
                    const parentLineId = Number(selectedGrade?.line_id || 0);
                    const parentSeriesId = Number(selectedGrade?.series_id || 0);
                    const existsExplicitly = gradeIds.has(productId);
                    const excludedExplicitly = excludedGradeIds.has(productId);
                    const seriesExcluded = excludedSeriesIds.has(parentSeriesId);
                    const existsViaLine =
                        parentLineId > 0 &&
                        lineIds.has(parentLineId) &&
                        !seriesExcluded;
                    const existsViaSeries = parentSeriesId > 0 && seriesIds.has(parentSeriesId);

                    if (existsViaLine || existsViaSeries) {
                        if (excludedExplicitly) {
                            excludedGradeIds.delete(productId);
                        } else {
                            excludedGradeIds.add(productId);
                            gradeIds.delete(productId);
                        }
                    } else {
                        if (existsExplicitly) {
                            gradeIds.delete(productId);
                        } else {
                            gradeIds.add(productId);
                        }

                        excludedGradeIds.delete(productId);
                    }
                }

                const nextSelection = pruneSelectionState(
                    [...lineIds],
                    [...seriesIds],
                    [...gradeIds],
                    [...excludedSeriesIds],
                    [...excludedGradeIds],
                    catalogSeries,
                    catalogGrades,
                );

                return {
                    ...item,
                    related_line_ids: nextSelection.relatedLineIds,
                    related_series_ids: nextSelection.relatedSeriesIds,
                    related_grade_ids: nextSelection.relatedGradeIds,
                    excluded_series_ids: nextSelection.excludedSeriesIds,
                    excluded_grade_ids: nextSelection.excludedGradeIds,
                };
            }),
        }));
    };

    const addItem = () => {
        const newItem = createEmptyApplicationItem(applicationsForm.items.length);

        setApplicationsForm((current) => ({
            ...current,
            items: [...current.items, newItem],
        }));
        setPendingScrollCardKey(newItem.client_key);
        setExpandedItemKey(newItem.client_key);
    };

    const saveApplicationCard = async (index) => {
        const targetItem = applicationsForm.items[index];

        if (!targetItem) {
            return;
        }

        setSavingCardKey(targetItem.client_key);

        try {
            const serializedTarget = await serializeApplicationItem(targetItem, index);

            if (!serializedTarget) {
                emitAdminToast("La card necesita al menos un título para guardarse.", "error");
                return;
            }

            const persistedIndex = persistedApplicationsForm.items.findIndex(
                (item) =>
                    item.client_key === targetItem.client_key ||
                    (item.id && item.id === targetItem.id),
            );

            const nextItems = [];

            for (const [persistedItemIndex, persistedItem] of persistedApplicationsForm.items.entries()) {
                if (persistedItemIndex === persistedIndex) {
                    nextItems.push(serializedTarget);
                    continue;
                }

                const payload = await serializeApplicationItem(
                    persistedItem,
                    persistedItemIndex,
                );

                if (payload) {
                    nextItems.push(payload);
                }
            }

            if (persistedIndex === -1) {
                nextItems.push(serializedTarget);
            }

            const response = await axios.put(
                `/admin/api/site-sections/${applicationsForm.id}`,
                buildApplicationsSectionPayload(persistedApplicationsForm, nextItems),
            );

            syncApplicationsForms(response.data);
            emitAdminToast("La card se guardó correctamente.");
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar la card.",
                "error",
            );
        } finally {
            setSavingCardKey(null);
        }
    };

    const removeItem = async (index) => {
        const targetItem = applicationsForm.items[index];

        if (!targetItem) {
            return;
        }

        if (!targetItem.id) {
            setApplicationsForm((current) => ({
                ...current,
                items: current.items.filter((_, itemIndex) => itemIndex !== index),
            }));
            return;
        }

        setRemovingCardKey(targetItem.client_key);

        try {
            const nextItems = [];

            for (const [persistedItemIndex, persistedItem] of persistedApplicationsForm.items.entries()) {
                if (persistedItem.id === targetItem.id) {
                    continue;
                }

                const payload = await serializeApplicationItem(
                    persistedItem,
                    persistedItemIndex,
                );

                if (payload) {
                    nextItems.push(payload);
                }
            }

            const response = await axios.put(
                `/admin/api/site-sections/${applicationsForm.id}`,
                buildApplicationsSectionPayload(persistedApplicationsForm, nextItems),
            );

            syncApplicationsForms(response.data);
            emitAdminToast("La card se eliminó correctamente.");
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo eliminar la card.",
                "error",
            );
        } finally {
            setRemovingCardKey(null);
        }
    };

    return (
        <AdminLayout>
            <Head title="Aplicaciones" />

            <PublicPreviewModal
                open={previewOpen}
                title="Vista pública de Aplicaciones"
                url={publicApplicationsUrl}
                onClose={() => setPreviewOpen(false)}
            />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.16),_transparent_34%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_44%,#eef7fb_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    <Icon icon="solar:widget-5-outline" width={14} />
                                    Aplicaciones / Home + detalle interno
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Gestión de Aplicaciones
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                    Desde acá administrás el banner del slug
                                    <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                                        /aplicaciones
                                    </code>
                                    y definís qué cards aparecen en Home, incluyendo
                                    el detalle interno de cada card.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPreviewOpen(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                            >
                                <Icon icon="solar:square-arrow-right-up-outline" width={18} />
                                Ver página pública
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        label="Aplicaciones activas"
                        value={activeItemsCount}
                        icon="solar:layers-outline"
                    />
                    <StatCard
                        label="Detalles configurados"
                        value={detailItemsCount}
                        icon="solar:document-text-outline"
                    />
                    <StatCard
                        label="Visibles en Home"
                        value={homeItemsCount}
                        icon="solar:home-angle-outline"
                    />
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-slate-900">
                                Banner del slug
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Configura el título y el soporte multimedia del hero
                                público de Aplicaciones.
                            </p>
                        </div>

                        <div className="space-y-5">
                            <Field label="Título">
                                <TextInput
                                    type="text"
                                    value={heroForm.title}
                                    onChange={(event) =>
                                        setHeroForm((current) => ({
                                            ...current,
                                            title: event.target.value,
                                        }))
                                    }
                                />
                            </Field>

                            <Field label="Tipo multimedia">
                                <select
                                    value={heroForm.media_type}
                                    onChange={(event) =>
                                        setHeroForm((current) => ({
                                            ...current,
                                            media_type: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                >
                                    <option value="image">Imagen</option>
                                    <option value="video">Video local</option>
                                    <option value="youtube">YouTube</option>
                                </select>
                            </Field>

                            <Field label="Imagen principal">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        setHeroForm((current) => ({
                                            ...current,
                                            image_file: event.target.files?.[0] ?? null,
                                        }))
                                    }
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                />
                                <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-amber-950">
                                        Recomendado: banner 1366 x 237 px · imagen entre
                                        2 y 4 MB · JPG, PNG o WEBP.
                                    </p>
                                </div>
                                {heroForm.media_url ? (
                                    <img
                                        src={heroForm.media_url}
                                        alt={heroForm.title || "Aplicaciones"}
                                        className="mt-3 h-48 w-full rounded-2xl border border-slate-200 object-cover"
                                    />
                                ) : null}
                            </Field>

                            {heroForm.media_type === "video" ? (
                                <Field label="Video local">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={(event) =>
                                            setHeroForm((current) => ({
                                                ...current,
                                                video_file:
                                                    event.target.files?.[0] ?? null,
                                            }))
                                        }
                                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                    />
                                    <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
                                        <p className="text-sm font-semibold text-amber-950">
                                            Si cargás video, usá MP4 y hasta 20 MB.
                                        </p>
                                    </div>
                                    {heroForm.secondary_media_url ? (
                                        <video
                                            controls
                                            className="mt-3 h-48 w-full rounded-2xl border border-slate-200 bg-slate-950 object-cover"
                                        >
                                            <source src={heroForm.secondary_media_url} />
                                        </video>
                                    ) : null}
                                </Field>
                            ) : null}

                            {heroForm.media_type === "youtube" ? (
                                <Field label="URL de YouTube">
                                    <TextInput
                                        type="text"
                                        value={heroForm.youtube_url}
                                        onChange={(event) =>
                                            setHeroForm((current) => ({
                                                ...current,
                                                youtube_url: event.target.value,
                                            }))
                                        }
                                        placeholder="https://www.youtube.com/watch?v=..."
                                    />
                                </Field>
                            ) : null}

                            <Toggle
                                label="Banner activo"
                                checked={heroForm.is_active}
                                onChange={(value) =>
                                    setHeroForm((current) => ({
                                        ...current,
                                        is_active: value,
                                    }))
                                }
                            />

                            <div className="flex justify-end border-t border-slate-200 pt-5">
                                <button
                                    type="button"
                                    onClick={saveHero}
                                    disabled={heroSaving}
                                    className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                >
                                    {heroSaving ? "Guardando..." : "Guardar banner"}
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-slate-900">
                                Apagar en Home
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Si apagás esta opción, desaparece toda la sección
                                de Aplicaciones del Home. El slug público sigue
                                disponible y no pierde sus cards ni sus detalles.
                            </p>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                            <p className="text-sm text-slate-600">
                                Estado actual en Home:
                                <span className="ml-2 font-semibold text-slate-900">
                                    {applicationsForm.show_on_home
                                        ? `${homeItemsCount} card${homeItemsCount === 1 ? "" : "s"} visibles`
                                        : "sección apagada"}
                                </span>
                            </p>

                            <div className="mt-4 flex flex-wrap gap-3">
                                <Toggle
                                    label="Mostrar sección en home"
                                    checked={applicationsForm.show_on_home}
                                    onChange={(value) =>
                                        setApplicationsForm((current) => ({
                                            ...current,
                                            show_on_home: value,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                            <Toggle
                                label="Sección activa para /aplicaciones"
                                checked={applicationsForm.is_active}
                                onChange={(value) =>
                                    setApplicationsForm((current) => ({
                                        ...current,
                                        is_active: value,
                                    }))
                                }
                            />
                        </div>

                        <div className="mt-5 flex justify-end border-t border-slate-200 pt-5">
                            <button
                                type="button"
                                onClick={saveApplicationsSettings}
                                disabled={sectionSaving}
                                className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                            >
                                {sectionSaving
                                    ? "Guardando..."
                                    : "Guardar Home"}
                            </button>
                        </div>
                    </section>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900">
                                CRUD de cards y detalle interno
                            </h2>
                            <p className="mt-2 max-w-3xl text-sm text-slate-500">
                                Cada card del bloque padre puede tener su propio
                                slug, bullets y productos relacionados para la vista
                                interna tipo Química.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-4 py-3 text-sm font-semibold text-[#117a98] transition hover:bg-[#25A7CA]/15"
                        >
                            <Icon icon="solar:add-circle-outline" width={18} />
                            Agregar aplicación
                        </button>
                    </div>

                    <div className="mt-6 space-y-6">
                        {applicationsForm.items.length === 0 ? (
                            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                                Todavía no hay aplicaciones cargadas. Crea la primera desde el botón <strong>Agregar aplicación</strong>.
                            </div>
                        ) : null}

                        {applicationsForm.items.map((item, index) => {
                            const isExpanded = expandedItemKey === item.client_key;
                            const displaySelection = deriveDisplaySelectionCounts(
                                item.related_line_ids,
                                item.related_series_ids,
                                item.related_grade_ids,
                                item.excluded_series_ids,
                                item.excluded_grade_ids,
                                catalogLines,
                                catalogSeries,
                                catalogGrades,
                            );
                            const effectiveSelection = deriveEffectiveSelections(
                                item.related_line_ids,
                                item.related_series_ids,
                                item.related_grade_ids,
                                item.excluded_series_ids,
                                item.excluded_grade_ids,
                                catalogSeries,
                                catalogGrades,
                            );
                            const publicCardSelection = derivePublicCardSelections(
                                item.related_line_ids,
                                item.related_series_ids,
                                item.related_grade_ids,
                                item.excluded_series_ids,
                                item.excluded_grade_ids,
                                catalogLines,
                                catalogSeries,
                                catalogGrades,
                            );
                            const exceptionSummary = [
                                displaySelection.excludedSeriesIds.length > 0
                                    ? `${displaySelection.excludedSeriesIds.length} serie${displaySelection.excludedSeriesIds.length === 1 ? "" : "s"} excluida${displaySelection.excludedSeriesIds.length === 1 ? "" : "s"}`
                                    : null,
                                displaySelection.excludedGradeIds.length > 0
                                    ? `${displaySelection.excludedGradeIds.length} grado${displaySelection.excludedGradeIds.length === 1 ? "" : "s"} excluido${displaySelection.excludedGradeIds.length === 1 ? "" : "s"}`
                                    : null,
                            ]
                                .filter(Boolean)
                                .join(" · ");
                            const selectionSummary = [
                                publicCardSelection.lineIds.length > 0
                                    ? `${publicCardSelection.lineIds.length} línea${publicCardSelection.lineIds.length === 1 ? "" : "s"}`
                                    : null,
                                publicCardSelection.seriesIds.length > 0
                                    ? `${publicCardSelection.seriesIds.length} serie${publicCardSelection.seriesIds.length === 1 ? "" : "s"}`
                                    : null,
                                publicCardSelection.gradeIds.length > 0
                                    ? `${publicCardSelection.gradeIds.length} grado${publicCardSelection.gradeIds.length === 1 ? "" : "s"}`
                                    : null,
                            ]
                                .filter(Boolean)
                                .join(" · ");

                            return (
                                <article
                                    key={item.client_key}
                                    ref={(node) => {
                                        if (node) {
                                            itemRefs.current.set(item.client_key, node);
                                        } else {
                                            itemRefs.current.delete(item.client_key);
                                        }
                                    }}
                                    className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"
                                >
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedItemKey(isExpanded ? null : item.client_key)}
                                            className="flex min-w-0 flex-1 items-center justify-between gap-4 rounded-[22px] bg-white px-4 py-4 text-left"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Aplicación {index + 1}
                                                </p>
                                                <h3 className="mt-1 truncate text-lg font-semibold text-slate-900">
                                                    {item.title || "Nueva aplicación"}
                                                </h3>
                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                                                    <span className={`rounded-full px-3 py-1 ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                                        {item.is_active ? "Activa" : "Inactiva"}
                                                    </span>
                                                    <span className={`rounded-full px-3 py-1 ${item.show_in_home ? "bg-[#25A7CA]/10 text-[#117a98]" : "bg-slate-100 text-slate-500"}`}>
                                                        {item.show_in_home ? "Visible en home" : "Oculta en home"}
                                                    </span>
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">
                                                        {selectionSummary || "Sin asignaciones"}
                                                    </span>
                                                    {exceptionSummary ? (
                                                        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                                                            {exceptionSummary}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <span className="flex items-center gap-3 text-slate-400">
                                                <span className="hidden text-xs font-semibold text-slate-500 md:inline">
                                                    {isExpanded ? "Ocultar" : "Editar"}
                                                </span>
                                                <Icon
                                                    icon="solar:alt-arrow-down-outline"
                                                    width={20}
                                                    className={`transition ${isExpanded ? "rotate-180" : ""}`}
                                                />
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            disabled={removingCardKey === item.client_key}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                                        >
                                            <Icon icon="solar:trash-bin-trash-outline" width={16} />
                                            {removingCardKey === item.client_key
                                                ? "Eliminando..."
                                                : "Eliminar"}
                                        </button>
                                    </div>

                                    {isExpanded ? (
                                        <div className="mt-5 border-t border-slate-200 pt-5">
                                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                                                <Field label="Texto exacto de la card">
                                                    <TextInput
                                                        type="text"
                                                        value={item.title}
                                                        onChange={(event) => {
                                                            const value = event.target.value;
                                                            updateItem(index, {
                                                                title: value,
                                                                item_key: slugify(value),
                                                            });
                                                        }}
                                                    />
                                                </Field>

                                                <Field label="Orden">
                                                    <TextInput
                                                        type="text"
                                                        value={item.sort_order}
                                                        onChange={(event) =>
                                                            updateItem(index, {
                                                                sort_order:
                                                                    event.target.value.toUpperCase(),
                                                            })
                                                        }
                                                    />
                                                </Field>

                                                <div className="flex items-end">
                                                    <div className="flex flex-wrap gap-3">
                                                        <Toggle
                                                            label="Card activa"
                                                            checked={item.is_active}
                                                            onChange={(value) =>
                                                                updateItem(index, {
                                                                    is_active: value,
                                                                })
                                                            }
                                                        />
                                                        <Toggle
                                                            label="Mostrar en home"
                                                            checked={item.show_in_home}
                                                            onChange={(value) =>
                                                                updateItem(index, {
                                                                    show_in_home: value,
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-5 grid gap-5 xl:grid-cols-2">
                                                <Field label="Imagen de la card">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(event) =>
                                                            updateItem(index, {
                                                                image_file:
                                                                    event.target.files?.[0] ??
                                                                    null,
                                                            })
                                                        }
                                                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                                    />
                                                    <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
                                                        <p className="text-sm font-semibold text-amber-950">
                                                            Recomendado: imagen 288 x 288 px · entre
                                                            2 y 4 MB · JPG, PNG o WEBP.
                                                        </p>
                                                    </div>
                                                    {item.media_url ? (
                                                        <img
                                                            src={item.media_url}
                                                            alt={item.title || "Aplicación"}
                                                            className="mt-3 h-44 w-full rounded-2xl border border-slate-200 object-cover"
                                                        />
                                                    ) : null}
                                                </Field>

                                                <Field label="Imagen del detalle" hint="Si la dejás vacía, el detalle usa la misma imagen de la card.">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(event) =>
                                                            updateItem(index, {
                                                                detail_image_file:
                                                                    event.target.files?.[0] ??
                                                                    null,
                                                            })
                                                        }
                                                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                                    />
                                                    <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
                                                        <p className="text-sm font-semibold text-amber-950">
                                                            Recomendado: imagen 600 x 600 px · entre
                                                            2 y 4 MB · JPG, PNG o WEBP.
                                                        </p>
                                                    </div>
                                                    {item.detail_media_url ? (
                                                        <img
                                                            src={item.detail_media_url}
                                                            alt={item.detail_title || item.title || "Detalle"}
                                                            className="mt-3 h-44 w-full rounded-2xl border border-slate-200 object-cover"
                                                        />
                                                    ) : null}
                                                </Field>
                                            </div>

                                            <div className="mt-5 grid gap-5 md:grid-cols-2">
                                                <Field label="Título interno del detalle">
                                                    <TextInput
                                                        type="text"
                                                        value={item.detail_title}
                                                        onChange={(event) =>
                                                            updateItem(index, {
                                                                detail_title: event.target.value,
                                                            })
                                                        }
                                                        placeholder={item.title || "Química"}
                                                    />
                                                </Field>

                                                <Field label="URL manual de la card" hint="Opcional. Si queda vacía, la card abre su detalle interno.">
                                                    <TextInput
                                                        type="text"
                                                        value={item.link_url}
                                                        onChange={(event) =>
                                                            updateItem(index, {
                                                                link_url: event.target.value,
                                                            })
                                                        }
                                                        placeholder="/aplicaciones/quimica"
                                                    />
                                                </Field>
                                            </div>

                                            <div className="mt-5">
                                                <Field
                                                    label="Texto complementario del detalle"
                                                    hint="Editor enriquecido. Si cargás varios párrafos o líneas, la vista pública los toma como lista estilo Química."
                                                >
                                                    <RichTextEditor
                                                        value={item.description}
                                                        onChange={(value) =>
                                                            updateItem(index, {
                                                                description: value,
                                                            })
                                                        }
                                                        placeholder="Escribe el contenido del detalle..."
                                                    />
                                                </Field>
                                            </div>

                                            <div className="mt-5">
                                                <Field
                                                    label="Productos relacionados"
                                                    hint="Podés marcar una línea completa, una serie completa o un solo grado. Si una línea o serie no aplica a todo, desmarcá las series o grados puntuales como excepción."
                                                >
                                                    <ProductSelector
                                                        lines={catalogLines}
                                                        series={catalogSeries}
                                                        grades={catalogGrades}
                                                        selectedLineIds={item.related_line_ids}
                                                        selectedSeriesIds={item.related_series_ids}
                                                        selectedGradeIds={item.related_grade_ids}
                                                        effectiveLineIds={effectiveSelection.lineIds}
                                                        effectiveSeriesIds={effectiveSelection.seriesIds}
                                                        effectiveGradeIds={effectiveSelection.gradeIds}
                                                        displayLineIds={displaySelection.lineIds}
                                                        displaySeriesIds={displaySelection.seriesIds}
                                                        displayGradeIds={displaySelection.gradeIds}
                                                        publicCardLineIds={publicCardSelection.lineIds}
                                                        publicCardSeriesIds={publicCardSelection.seriesIds}
                                                        publicCardGradeIds={publicCardSelection.gradeIds}
                                                        onToggle={(type, productId) =>
                                                            toggleRelatedProduct(index, type, productId)
                                                        }
                                                        actionSlot={
                                                            <button
                                                                type="button"
                                                                onClick={() => saveApplicationCard(index)}
                                                                disabled={savingCardKey === item.client_key}
                                                                className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                                            >
                                                                {savingCardKey === item.client_key
                                                                    ? "Guardando..."
                                                                    : "Guardar card"}
                                                            </button>
                                                        }
                                                    />
                                                </Field>
                                            </div>

                                        </div>
                                    ) : null}
                                </article>
                            );
                        })}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

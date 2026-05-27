import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useRef, useState } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function TextInput(props) {
    return (
        <input
            {...props}
            className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10 ${props.className ?? ""}`}
        />
    );
}

function buildProfiles(profiles) {
    return (profiles ?? []).map((profile, pi) => ({
        title: profile.title ?? "",
        subtitle: profile.subtitle ?? "",
        sort_order: profile.sort_order ?? pi + 1,
        is_active: profile.is_active ?? true,
        standards: (profile.standards ?? []).map((std, si) => ({
            label: std.label ?? "",
            subtitle: std.subtitle ?? "",
            sort_order: std.sort_order ?? si + 1,
            is_active: std.is_active ?? true,
            items: (std.items ?? []).map((item, ii) => ({
                catalog_chemical_element_id: item.catalog_chemical_element_id ?? item.element?.id ?? "",
                display_label: item.display_label ?? "",
                min_percent: item.min_percent ?? "",
                max_percent: item.max_percent ?? "",
                nominal_percent: item.nominal_percent ?? "",
                display_percent: item.display_percent ?? "",
                sort_order: item.sort_order ?? ii + 1,
                is_balance: item.is_balance ?? false,
            })),
        })),
    }));
}

// ── Public composition preview: same one-line rule as the public website ─────
const TRACK_W = 1224;
const MIN_SEGMENT_W = 22;

function formatPercent(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number.parseFloat(value);
    if (Number.isNaN(n)) return null;

    return `${n.toFixed(4).replace(/\.?0+$/, "")}%`;
}

function formatTooltipPercent(value) {
    const formatted = formatPercent(value);
    if (!formatted) return null;

    return formatted.includes(".") ? formatted : formatted.replace("%", ".0%");
}

function buildTooltipText(item) {
    const label = item.display_label || item._el?.symbol || "?";
    const minText = formatTooltipPercent(item.min_percent);
    const maxText = formatTooltipPercent(item.max_percent);
    const displayText = formatPercent(resolveDisplayPercent(item)) || "0%";
    const isBalance = Boolean(item.is_balance);

    if (minText && maxText) return `${label}: ${minText === maxText ? minText : `${minText} ~ ${maxText}`}`;
    if (maxText) return `${label}: ≤ ${maxText}`;
    if (minText) return `${label}: ≥ ${minText}`;

    return isBalance ? `${label}: balance · ${displayText}` : `${label}: ${displayText}`;
}

function resolveDisplayPercent(item) {
    if (item.display_percent !== null && item.display_percent !== undefined && item.display_percent !== "") {
        return Number.parseFloat(item.display_percent);
    }

    const min = item.min_percent !== null && item.min_percent !== undefined && item.min_percent !== ""
        ? Number.parseFloat(item.min_percent)
        : null;
    const max = item.max_percent !== null && item.max_percent !== undefined && item.max_percent !== ""
        ? Number.parseFloat(item.max_percent)
        : null;

    if (min !== null && max !== null) return (min + max) / 2;
    if (item.nominal_percent !== null && item.nominal_percent !== undefined && item.nominal_percent !== "") {
        return Number.parseFloat(item.nominal_percent);
    }
    if (min !== null) return min;
    if (max !== null) return max;

    return 0;
}

function adjustSegmentWidths(segments, maxWidth = TRACK_W, minimumWidth = MIN_SEGMENT_W) {
    if (!segments.length) return segments;

    let adjusted = segments.map((segment) => ({ ...segment, w: segment.rawW }));
    let extraNeeded = 0;
    let availableToReduce = 0;

    adjusted.forEach((segment) => {
        if (segment.rawW < minimumWidth) {
            extraNeeded += minimumWidth - segment.rawW;
        } else {
            availableToReduce += segment.rawW - minimumWidth;
        }
    });

    adjusted = adjusted.map((segment) => {
        if (segment.rawW < minimumWidth) return { ...segment, w: minimumWidth };

        if (extraNeeded > 0 && availableToReduce > 0) {
            const reductionRatio = Math.min(1, extraNeeded / availableToReduce);
            const reducible = segment.rawW - minimumWidth;

            return { ...segment, w: segment.rawW - reducible * reductionRatio };
        }

        return segment;
    });

    const totalAdjusted = adjusted.reduce((sum, segment) => sum + segment.w, 0);
    if (totalAdjusted > maxWidth && totalAdjusted > 0) {
        const scale = maxWidth / totalAdjusted;
        adjusted = adjusted.map((segment) => ({ ...segment, w: segment.w * scale }));
    }

    return adjusted;
}

function buildPublicSegments(items, elements) {
    const elMap = Object.fromEntries(elements.map((e) => [String(e.id), e]));

    const orderedItems = (items ?? [])
        .map((it, index) => ({
            ...it,
            _index: index,
            _el: elMap[String(it.catalog_chemical_element_id)],
        }))
        .filter((it) => it._el && resolveDisplayPercent(it) > 0)
        .sort((a, b) => {
            const aBalance = a.is_balance ? 1 : 0;
            const bBalance = b.is_balance ? 1 : 0;

            if (aBalance !== bBalance) return aBalance - bBalance;

            return (Number(a.sort_order) || a._index + 1) - (Number(b.sort_order) || b._index + 1);
        });

    const segments = orderedItems
        .map((it) => {
            const pct = resolveDisplayPercent(it);
            return {
                item: it,
                rawW: pct,
            };
        })
        .filter((segment) => segment.rawW > 0);

    const totalPercent = segments.reduce((sum, segment) => sum + segment.rawW, 0);
    const unitW = totalPercent > 0 ? TRACK_W / totalPercent : 0;
    const adjusted = adjustSegmentWidths(segments.map((segment) => ({ ...segment, rawW: segment.rawW * unitW })));
    let cursor = 0;

    return adjusted.map((segment, index) => {
        const width = segment.w;
        const item = segment.item;
        const center = cursor + width / 2;
        const left = cursor;
        const label = item.display_label || item._el.symbol || "?";
        cursor += width;

        return {
            label,
            color: item._el.display_color || "#94A3B8",
            percentText: formatPercent(resolveDisplayPercent(item)) || "0%",
            tooltipText: buildTooltipText(item),
            leftPct: (left / TRACK_W) * 100,
            widthPct: (width / TRACK_W) * 100,
            tooltipAlign: center > TRACK_W * 0.78 ? "right" : center < TRACK_W * 0.22 ? "left" : "center",
            nameSize: width >= 180 ? 18 : width >= 108 ? 15 : width >= 66 ? 12 : 10,
            percentSize: width >= 180 ? 11 : width >= 108 ? 9 : width >= 66 ? 8 : 7,
            isFirst: index === 0,
            layer: index + 1,
        };
    });
}

const COMPO_BAR_KEYFRAMES = `
@keyframes admin-compo-enter {
    from { opacity: 0; transform: translate3d(0, 10px, 0) scale3d(1, 0.94, 1); }
    to   { opacity: 1; transform: translate3d(0, 0, 0) scale3d(1, 1, 1); }
}
@keyframes admin-compo-halo-pulse {
    0%, 100% { opacity: 0.58; transform: scale3d(1, 1, 1); }
    50%       { opacity: 0.95; transform: scale3d(1.08, 1.08, 1); }
}
@keyframes admin-border-color-pulse {
    0%, 100% { opacity: 0.58; transform: scale3d(1, 1, 1); }
    50%       { opacity: 0.92; transform: scale3d(1.02, 1.08, 1); }
}
@-webkit-keyframes admin-compo-enter {
    from { opacity: 0; -webkit-transform: translate3d(0, 10px, 0) scale3d(1, 0.94, 1); transform: translate3d(0, 10px, 0) scale3d(1, 0.94, 1); }
    to   { opacity: 1; -webkit-transform: translate3d(0, 0, 0) scale3d(1, 1, 1); transform: translate3d(0, 0, 0) scale3d(1, 1, 1); }
}
@-webkit-keyframes admin-compo-halo-pulse {
    0%, 100% { opacity: 0.58; -webkit-transform: scale3d(1, 1, 1); transform: scale3d(1, 1, 1); }
    50%       { opacity: 0.95; -webkit-transform: scale3d(1.08, 1.08, 1); transform: scale3d(1.08, 1.08, 1); }
}
@-webkit-keyframes admin-border-color-pulse {
    0%, 100% { opacity: 0.58; -webkit-transform: scale3d(1, 1, 1); transform: scale3d(1, 1, 1); }
    50%       { opacity: 0.92; -webkit-transform: scale3d(1.02, 1.08, 1); transform: scale3d(1.02, 1.08, 1); }
}
`;

let _compoStyleInjected = false;
function injectCompoStyle() {
    if (_compoStyleInjected || typeof document === "undefined") return;
    _compoStyleInjected = true;
    const style = document.createElement("style");
    style.textContent = COMPO_BAR_KEYFRAMES;
    document.head.appendChild(style);
}

function buildSegmentClipPath(isFirst) {
    return isFirst
        ? "polygon(0% 100%, calc(100% - 14px) 100%, 100% 0%, 0% 0%)"
        : "polygon(0% 100%, calc(100% - 14px) 100%, 100% 0%, 14px 0%)";
}

function AdminCompoSegment({ segment, index, visible, onSegmentHover }) {
    const [hovered, setHovered] = useState(false);

    function handleMouseEnter() {
        setHovered(true);
        onSegmentHover(segment.color);
    }

    function handleMouseLeave() {
        setHovered(false);
    }

    return (
        <div
            className="group absolute top-0 bottom-0"
            style={{
                left: `${segment.leftPct}%`,
                width: `${segment.widthPct}%`,
                zIndex: hovered ? 20 : segment.layer,
                opacity: visible ? undefined : 0,
                animation: visible
                    ? `admin-compo-enter 0.52s cubic-bezier(.22,1,.36,1) ${index * 40}ms both`
                    : "none",
                WebkitAnimation: visible
                    ? `admin-compo-enter 0.52s cubic-bezier(.22,1,.36,1) ${index * 40}ms both`
                    : "none",
                transformOrigin: "center bottom",
                willChange: "transform, opacity",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Pulsating halo — uses the segment's own color */}
            {hovered && (
                <span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: "-10px -24px",
                        background: `radial-gradient(ellipse 80% 80% at 50% 55%, ${segment.color} 0%, transparent 68%)`,
                        filter: "blur(14px)",
                        WebkitFilter: "blur(14px)",
                        opacity: 0.55,
                        pointerEvents: "none",
                        animation: "admin-compo-halo-pulse 2s ease-in-out infinite",
                        WebkitAnimation: "admin-compo-halo-pulse 2s ease-in-out infinite",
                        transform: "translateZ(0)",
                        WebkitTransform: "translateZ(0)",
                        willChange: "transform, opacity",
                    }}
                />
            )}
            <div
                className="absolute inset-y-0 right-0 flex items-center justify-center overflow-hidden"
                style={{
                    left: segment.isFirst ? 0 : -14,
                    background: segment.color,
                    clipPath: buildSegmentClipPath(segment.isFirst),
                    WebkitClipPath: buildSegmentClipPath(segment.isFirst),
                    transform: hovered ? "translateY(-4px) scale(1.018)" : "translateY(0) scale(1)",
                    WebkitTransform: hovered ? "translateY(-4px) scale(1.018)" : "translateY(0) scale(1)",
                    filter: hovered
                        ? "saturate(1.14) brightness(1.07) drop-shadow(0 12px 24px rgba(0,0,0,0.32))"
                        : "none",
                    WebkitFilter: hovered
                        ? "saturate(1.14) brightness(1.07) drop-shadow(0 12px 24px rgba(0,0,0,0.32))"
                        : "none",
                    transition: "transform 0.24s ease, filter 0.24s ease",
                    WebkitTransition: "-webkit-transform 0.24s ease, -webkit-filter 0.24s ease",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    willChange: "transform, filter",
                }}
            >
                <span className="relative flex flex-col items-center justify-center gap-1 px-1 text-center font-bold leading-none tracking-[-0.04em] text-white">
                    <span style={{ fontSize: segment.nameSize }}>{segment.label}</span>
                    <span className="opacity-95" style={{ fontSize: segment.percentSize }}>{segment.percentText}</span>
                </span>
            </div>
            <span
                className={`pointer-events-none absolute -top-10 z-30 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 opacity-0 shadow-lg ring-1 ring-slate-200 transition group-hover:opacity-100 ${
                    segment.tooltipAlign === "right"
                        ? "right-0"
                        : segment.tooltipAlign === "left"
                        ? "left-0"
                        : "left-1/2 -translate-x-1/2"
                }`}
            >
                {segment.tooltipText}
            </span>
        </div>
    );
}

function CompositionBar({ items, elements, height = 58 }) {
    const segments = buildPublicSegments(items, elements);
    const trackRef = useRef(null);
    const [visible, setVisible] = useState(false);
    const [trackGlowColor, setTrackGlowColor] = useState(null);

    useEffect(() => { injectCompoStyle(); }, []);

    useEffect(() => {
        setVisible(false);
        if (!trackRef.current) return;
        const el = trackRef.current;
        const prefersReduced = typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) { setVisible(true); return; }

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
        }, { threshold: 0.1 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [items]);

    if (!segments.length) return null;

    function handleSegmentHover(color) {
        setTrackGlowColor(color);
    }

    return (
        <div
            ref={trackRef}
            className="relative w-full"
            style={{ height, isolation: "isolate" }}
            onMouseLeave={() => setTrackGlowColor(null)}
        >
            {/* Magic glowing border — color matches the hovered segment */}
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: -5,
                    borderRadius: 6,
                    background: trackGlowColor ?? "#25a7ca",
                    filter: "blur(14px)",
                    WebkitFilter: "blur(14px)",
                    opacity: trackGlowColor ? 0.85 : 0,
                    zIndex: -1,
                    pointerEvents: "none",
                    transition: "opacity 0.45s ease, background 0.3s ease",
                    WebkitTransition: "opacity 0.45s ease, background 0.3s ease",
                    animation: trackGlowColor ? "admin-border-color-pulse 2s ease-in-out infinite" : "none",
                    WebkitAnimation: trackGlowColor ? "admin-border-color-pulse 2s ease-in-out infinite" : "none",
                    transform: "translateZ(0)",
                    WebkitTransform: "translateZ(0)",
                    willChange: "transform, opacity",
                }}
            />
            {segments.map((segment, i) => (
                <AdminCompoSegment
                    key={`${segment.label}-${segment.leftPct}`}
                    segment={segment}
                    index={i}
                    visible={visible}
                    onSegmentHover={handleSegmentHover}
                />
            ))}
        </div>
    );
}

function CompositionPreview({ items, elements }) {
    const segments = buildPublicSegments(items, elements);

    if (!segments.length) return null;

    return (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Vista pública real
                </p>
                <p className="text-[11px] text-slate-400">Una sola línea, igual que la web pública</p>
            </div>
            <CompositionBar items={items} elements={elements} />
        </div>
    );
}

function firstStandardWithItems(grade) {
    return (grade?.composition_profiles ?? [])
        .filter((profile) => profile.is_active !== false)
        .flatMap((profile) => profile.standards ?? [])
        .find((standard) => standard.is_active !== false && (standard.items ?? []).length > 0);
}

function gradePublicHref(line, series, grade) {
    if (!line?.slug || !series?.slug || !grade?.slug) return null;

    return `/productos/${line.slug}/${series.slug}/${grade.slug}`;
}

function collectGradeCompositionRows(line, series = null) {
    const sourceSeries = (series ? [series] : line?.series ?? []).filter((currentSeries) => currentSeries?.is_active !== false);

    return sourceSeries.flatMap((currentSeries) =>
        (currentSeries.grades ?? [])
            .filter((grade) => grade.is_active !== false)
            .map((grade) => {
                const standard = firstStandardWithItems(grade);
                if (!standard) return null;

                return {
                    label: grade.short_title || grade.name,
                    href: gradePublicHref(line, currentSeries, grade),
                    items: standard.items ?? [],
                };
            })
            .filter(Boolean),
    );
}

function PublicCompositionRows({ rows, elements }) {
    if (!rows.length) {
        return (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Esta pantalla todavía no tiene composiciones visibles en la web pública.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {rows.map((row) => (
                <div key={`${row.label}-${row.href ?? ""}`} className="grid items-center gap-4 lg:grid-cols-[150px_minmax(0,1fr)]">
                    {row.href ? (
                        <a
                            href={row.href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-bold leading-tight text-slate-900 underline-offset-4 hover:text-[#117a98] hover:underline"
                        >
                            {row.label}
                        </a>
                    ) : (
                        <span className="text-sm font-bold leading-tight text-slate-900">{row.label}</span>
                    )}
                    <CompositionBar items={row.items} elements={elements} height={52} />
                </div>
            ))}
        </div>
    );
}

// ── ElementsPanel ─────────────────────────────────────────────────────────────
function ElementsPanel({ elements }) {
    const [editingId, setEditingId] = useState(null);
    const [showAdd, setShowAdd] = useState(false);

    const addForm = useForm({
        symbol: "",
        name: "",
        display_color: "#aaaaaa",
        is_base_element: false,
        sort_order: String((elements.length + 1) * 10),
    });

    const editForm = useForm({
        symbol: "",
        name: "",
        display_color: "#aaaaaa",
        is_base_element: false,
        sort_order: "10",
    });

    function startEdit(el) {
        setEditingId(el.id);
        editForm.setData({
            symbol: el.symbol,
            name: el.name,
            display_color: el.display_color || "#aaaaaa",
            is_base_element: !!el.is_base_element,
            sort_order: String(el.sort_order),
        });
    }

    function submitAdd(e) {
        e.preventDefault();
        addForm.post("/admin/productos/composicion-quimica/elementos", {
            preserveScroll: true,
            onSuccess: () => { addForm.reset(); setShowAdd(false); },
        });
    }

    function submitEdit(e, id) {
        e.preventDefault();
        editForm.put(`/admin/productos/composicion-quimica/elementos/${id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    }

    function destroyEl(id) {
        if (!confirm("¿Eliminar este elemento? Los ítems de composición que lo usen perderán su referencia.")) return;
        router.delete(`/admin/productos/composicion-quimica/elementos/${id}`, { preserveScroll: true });
    }

    const ElementRow = ({ form, onCancel }) => (
        <div className="rounded-[20px] border border-[#25A7CA]/30 bg-[#25A7CA]/5 p-4">
            <div className="grid gap-3 sm:grid-cols-[72px_1fr_140px_80px_40px]">
                <TextInput value={form.data.symbol} onChange={(e) => form.setData("symbol", e.target.value)} placeholder="Símbolo" required maxLength={20} />
                <TextInput value={form.data.name} onChange={(e) => form.setData("name", e.target.value)} placeholder="Nombre del elemento" required />
                <label className="flex cursor-pointer items-center gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <input type="color" value={form.data.display_color} onChange={(e) => form.setData("display_color", e.target.value)} className="h-7 w-7 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0" />
                    <span className="flex-1 truncate font-mono text-xs text-slate-600">{form.data.display_color}</span>
                </label>
                <TextInput type="number" value={form.data.sort_order} onChange={(e) => form.setData("sort_order", e.target.value)} placeholder="Orden" min={1} />
                <button type="submit" disabled={form.processing} className="flex h-full items-center justify-center rounded-2xl bg-[#25A7CA] text-white transition hover:bg-[#1f8da8] disabled:opacity-60">
                    <Icon icon="solar:diskette-outline" width={17} />
                </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={form.data.is_base_element} onChange={(e) => form.setData("is_base_element", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]" />
                    Elemento base del material
                </label>
                {onCancel ? (
                    <button type="button" onClick={onCancel} className="ml-auto text-xs text-slate-500 underline">
                        Cancelar
                    </button>
                ) : null}
            </div>
            {form.errors.symbol ? <p className="mt-1 text-xs text-red-500">{form.errors.symbol}</p> : null}
        </div>
    );

    return (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Catálogo global</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">Elementos químicos</h2>
                    <p className="mt-1 text-sm text-slate-500">Definí los elementos con su color. La vista pública usa estos colores en una sola barra continua.</p>
                </div>
                {!showAdd ? (
                    <button
                        type="button"
                        onClick={() => setShowAdd(true)}
                        className="ml-4 inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#25A7CA] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f8da8]"
                    >
                        <Icon icon="solar:add-circle-outline" width={16} />
                        Nuevo elemento
                    </button>
                ) : null}
            </div>

            <div className="mt-5 space-y-2">
                {showAdd ? (
                    <form onSubmit={submitAdd}>
                        <ElementRow form={addForm} onCancel={() => setShowAdd(false)} />
                    </form>
                ) : null}

                {elements.length === 0 && !showAdd ? (
                    <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        No hay elementos. Añadí los que vas a usar: H, N, C, O, Fe, Ti…
                    </div>
                ) : null}

                {elements.map((el) =>
                    editingId === el.id ? (
                        <form key={el.id} onSubmit={(e) => submitEdit(e, el.id)}>
                            <ElementRow form={editForm} onCancel={() => setEditingId(null)} />
                        </form>
                    ) : (
                        <div key={el.id} className="flex items-center gap-3 rounded-[20px] border border-slate-100 bg-white px-4 py-3 transition hover:border-slate-200">
                            <span className="h-8 w-8 shrink-0 rounded-xl border border-white/30 shadow-sm" style={{ background: el.display_color || "#aaa" }} />
                            <span className="w-12 shrink-0 font-mono text-sm font-bold text-slate-900">{el.symbol}</span>
                            <span className="flex-1 truncate text-sm text-slate-700">{el.name}</span>
                            <span className="font-mono text-xs text-slate-400">{el.display_color}</span>
                            {el.is_base_element ? (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Base</span>
                            ) : null}
                            <span className="w-8 text-right text-xs text-slate-400">#{el.sort_order}</span>
                            <button type="button" onClick={() => startEdit(el)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50">
                                <Icon icon="solar:pen-outline" width={14} />
                            </button>
                            <button type="button" onClick={() => destroyEl(el.id)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100">
                                <Icon icon="solar:trash-bin-trash-outline" width={14} />
                            </button>
                        </div>
                    ),
                )}
            </div>
        </section>
    );
}

// ── CompositionEditor ─────────────────────────────────────────────────────────
function CompositionEditor({ form, setFormData, elements, onSubmit, processing }) {
    return (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {/* Profiles header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">Perfiles de composición</h3>
                    <p className="text-xs text-slate-500">Cada perfil contiene estándares con sus elementos. La previsualización replica la barra pública actual.</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                    <button
                        type="button"
                        disabled={(form.data.profiles ?? []).length === 0}
                        onClick={() => {
                            if (confirm("¿Limpiar toda la composición química de este grado?")) {
                                setFormData("profiles", []);
                            }
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                        <Icon icon="solar:broom-outline" width={16} /> Limpiar todo
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData("profiles", [...form.data.profiles, { title: "", subtitle: "", sort_order: form.data.profiles.length + 1, is_active: true, standards: [] }])}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <Icon icon="solar:add-circle-outline" width={16} /> Añadir perfil
                    </button>
                </div>
            </div>

            {form.data.profiles.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                    No hay perfiles. Hacé clic en «Añadir perfil» para empezar.
                </div>
            ) : null}

            {form.data.profiles.map((profile, pi) => (
                <div key={`profile-${pi}`} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="grid flex-1 gap-3 lg:grid-cols-2">
                            <TextInput value={profile.title} onChange={(e) => { const n = [...form.data.profiles]; n[pi].title = e.target.value; setFormData("profiles", n); }} placeholder="Título del perfil" />
                            <TextInput value={profile.subtitle} onChange={(e) => { const n = [...form.data.profiles]; n[pi].subtitle = e.target.value; setFormData("profiles", n); }} placeholder="Subtítulo opcional" />
                        </div>
                        <button type="button" onClick={() => setFormData("profiles", form.data.profiles.filter((_, i) => i !== pi))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100">
                            <Icon icon="solar:trash-bin-trash-outline" width={15} />
                        </button>
                    </div>

                    {/* Standards */}
                    <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">Estándares</p>
                            <div className="flex flex-wrap justify-end gap-2">
                                <button
                                    type="button"
                                    disabled={(profile.standards ?? []).length === 0}
                                    onClick={() => {
                                        const n = [...form.data.profiles];
                                        n[pi].standards = [];
                                        setFormData("profiles", n);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                >
                                    <Icon icon="solar:broom-outline" width={16} /> Limpiar estándares
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { const n = [...form.data.profiles]; n[pi].standards = [...(n[pi].standards ?? []), { label: "", subtitle: "", sort_order: (n[pi].standards?.length ?? 0) + 1, is_active: true, items: [] }]; setFormData("profiles", n); }}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    <Icon icon="solar:add-circle-outline" width={16} /> Añadir estándar
                                </button>
                            </div>
                        </div>

                        {(profile.standards ?? []).map((std, si) => (
                            <div key={`std-${pi}-${si}`} className="rounded-[20px] border border-slate-200 bg-white p-4">
                                <div className="flex items-center gap-3">
                                    <div className="grid flex-1 gap-3 lg:grid-cols-2">
                                        <TextInput value={std.label} onChange={(e) => { const n = [...form.data.profiles]; n[pi].standards[si].label = e.target.value; setFormData("profiles", n); }} placeholder="ASTM 1" />
                                        <TextInput value={std.subtitle} onChange={(e) => { const n = [...form.data.profiles]; n[pi].standards[si].subtitle = e.target.value; setFormData("profiles", n); }} placeholder="Subtítulo opcional" />
                                    </div>
                                    <button type="button" onClick={() => { const n = [...form.data.profiles]; n[pi].standards = n[pi].standards.filter((_, i) => i !== si); setFormData("profiles", n); }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100">
                                        <Icon icon="solar:trash-bin-trash-outline" width={15} />
                                    </button>
                                </div>

                                {/* Items */}
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Elementos de este estándar</p>
                                        <div className="flex flex-wrap justify-end gap-2">
                                            <button
                                                type="button"
                                                disabled={(std.items ?? []).length === 0}
                                                onClick={() => {
                                                    const n = [...form.data.profiles];
                                                    n[pi].standards[si].items = [];
                                                    setFormData("profiles", n);
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                            >
                                                <Icon icon="solar:broom-outline" width={14} /> Limpiar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { const n = [...form.data.profiles]; const items = n[pi].standards[si].items ?? []; n[pi].standards[si].items = [...items, { catalog_chemical_element_id: "", display_label: "", min_percent: "", max_percent: "", nominal_percent: "", display_percent: "", sort_order: items.length + 1, is_balance: false }]; setFormData("profiles", n); }}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                            >
                                                <Icon icon="solar:add-circle-outline" width={14} /> Añadir elemento
                                            </button>
                                        </div>
                                    </div>

                                    {(std.items ?? []).map((item, ii) => {
                                        const selEl = elements.find((e) => String(e.id) === String(item.catalog_chemical_element_id));
                                        return (
                                            <div key={`item-${pi}-${si}-${ii}`} className="flex items-start gap-2 rounded-[16px] border border-slate-100 bg-slate-50 p-3">
                                                <span className="mt-3 h-4 w-4 shrink-0 rounded-full border border-white shadow" style={{ background: selEl?.display_color || "#ccc" }} />
                                                <div className="grid flex-1 gap-2 sm:grid-cols-[150px_92px_90px_90px_90px_90px_82px]">
                                                    <select value={item.catalog_chemical_element_id} onChange={(e) => { const n = [...form.data.profiles]; n[pi].standards[si].items[ii].catalog_chemical_element_id = e.target.value; setFormData("profiles", n); }} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10">
                                                        <option value="">Elemento</option>
                                                        {elements.map((el) => (
                                                            <option key={el.id} value={el.id}>{el.symbol} — {el.name}</option>
                                                        ))}
                                                    </select>
                                                    <TextInput value={item.display_label} onChange={(e) => { const n = [...form.data.profiles]; n[pi].standards[si].items[ii].display_label = e.target.value; setFormData("profiles", n); }} placeholder="Label" />
                                                    <TextInput value={item.display_percent} onChange={(e) => { const n = [...form.data.profiles]; n[pi].standards[si].items[ii].display_percent = e.target.value; setFormData("profiles", n); }} placeholder="Visual %" />
                                                    <TextInput value={item.min_percent} onChange={(e) => { const n = [...form.data.profiles]; n[pi].standards[si].items[ii].min_percent = e.target.value; setFormData("profiles", n); }} placeholder="Min %" />
                                                    <TextInput value={item.max_percent} onChange={(e) => { const n = [...form.data.profiles]; n[pi].standards[si].items[ii].max_percent = e.target.value; setFormData("profiles", n); }} placeholder="Max %" />
                                                    <TextInput value={item.nominal_percent} onChange={(e) => { const n = [...form.data.profiles]; n[pi].standards[si].items[ii].nominal_percent = e.target.value; setFormData("profiles", n); }} placeholder="Nominal %" />
                                                    <label className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!item.is_balance}
                                                            onChange={(e) => { const n = [...form.data.profiles]; n[pi].standards[si].items[ii].is_balance = e.target.checked; setFormData("profiles", n); }}
                                                            className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                                                        />
                                                        Resto
                                                    </label>
                                                </div>
                                                <button type="button" onClick={() => { const n = [...form.data.profiles]; n[pi].standards[si].items = n[pi].standards[si].items.filter((_, i) => i !== ii); setFormData("profiles", n); }} className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100">
                                                    <Icon icon="solar:trash-bin-trash-outline" width={14} />
                                                </button>
                                            </div>
                                        );
                                    })}

                                    {/* Live bar preview per standard */}
                                    <CompositionPreview items={std.items ?? []} elements={elements} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="flex justify-end pt-2">
                <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition hover:bg-[#1f8da8] disabled:opacity-60">
                    <Icon icon="solar:diskette-outline" width={18} /> Guardar composición
                </button>
            </div>
        </form>
    );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
    { key: "line",   label: "Línea",   icon: "solar:layers-minimalistic-outline" },
    { key: "series", label: "Serie",   icon: "solar:folder-2-outline" },
    { key: "grade",  label: "Grado",   icon: "solar:atom-outline" },
];

function TabBar({ active, onChange }) {
    return (
        <div className="flex gap-1 rounded-[20px] border border-slate-200 bg-slate-50 p-1">
            {TABS.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    onClick={() => onChange(tab.key)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-[16px] px-4 py-2.5 text-sm font-semibold transition ${
                        active === tab.key
                            ? "bg-white shadow-sm text-slate-900"
                            : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                    <Icon icon={tab.icon} width={16} />
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb({ parts }) {
    return (
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
            {parts.filter(Boolean).map((part, i, arr) => (
                <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <Icon icon="solar:alt-arrow-right-outline" width={12} className="text-slate-300" />}
                    <span className={i === arr.length - 1 ? "font-semibold text-slate-800" : ""}>{part}</span>
                </span>
            ))}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Composition({ families, chemicalElements }) {
    const { url } = usePage();
    const params = new URLSearchParams(url.split("?")[1] ?? "");
    const initialLineId = Number(params.get("line")) || null;
    const initialSeriesId = Number(params.get("series")) || null;
    const initialGradeId = Number(params.get("grade")) || null;

    // ── Selection state ────────────────────────────────────────────────────────
    const [selectedFamilyId, setSelectedFamilyId] = useState(families[0]?.id ?? null);
    const selectedFamily = useMemo(
        () => families.find((f) => f.id === selectedFamilyId) ?? families[0] ?? null,
        [families, selectedFamilyId],
    );

    const allLines = useMemo(() => families.flatMap((f) => f.lines ?? []), [families]);
    const [selectedLineId, setSelectedLineId] = useState(initialLineId || allLines[0]?.id || null);
    const selectedLine = useMemo(
        () => allLines.find((l) => l.id === selectedLineId) ?? selectedFamily?.lines?.[0] ?? null,
        [allLines, selectedLineId, selectedFamily],
    );

    const allSeries = selectedLine?.series ?? [];
    const [selectedSeriesId, setSelectedSeriesId] = useState(initialSeriesId || allSeries[0]?.id || null);
    const selectedSeries = useMemo(
        () => allSeries.find((s) => s.id === selectedSeriesId) ?? allSeries[0] ?? null,
        [allSeries, selectedSeriesId],
    );

    const allGrades = selectedSeries?.grades ?? [];
    const [selectedGradeId, setSelectedGradeId] = useState(initialGradeId || allGrades[0]?.id || null);
    const selectedGrade = useMemo(
        () => allGrades.find((g) => g.id === selectedGradeId) ?? allGrades[0] ?? null,
        [allGrades, selectedGradeId],
    );

    // ── Active tab ─────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("line");

    // ── Forms ──────────────────────────────────────────────────────────────────
    const gradeForm  = useForm({ profiles: buildProfiles(selectedGrade?.composition_profiles) });
    const lineCompositionRows = useMemo(() => collectGradeCompositionRows(selectedLine), [selectedLine]);
    const seriesCompositionRows = useMemo(() => collectGradeCompositionRows(selectedLine, selectedSeries), [selectedLine, selectedSeries]);

    // ── Effects ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!selectedLine && selectedFamily?.lines?.[0]) setSelectedLineId(selectedFamily.lines[0].id);
    }, [selectedFamily, selectedLine]);

    useEffect(() => {
        if (!selectedSeries && allSeries[0]) setSelectedSeriesId(allSeries[0].id);
    }, [allSeries, selectedSeries]);

    useEffect(() => {
        if (!selectedGrade && allGrades[0]) setSelectedGradeId(allGrades[0].id);
    }, [allGrades, selectedGrade]);

    useEffect(() => {
        setSelectedFamilyId(
            families.find((f) => f.lines.some((l) => l.id === selectedLine?.id))?.id ?? families[0]?.id ?? null,
        );
    }, [families, selectedLine?.id]);

    useEffect(() => {
        gradeForm.setData({ profiles: buildProfiles(selectedGrade?.composition_profiles) });
    }, [selectedGrade]);

    // ── Breadcrumb parts per tab ───────────────────────────────────────────────
    const breadcrumbParts = {
        line:   [selectedFamily?.name, selectedLine?.name],
        series: [selectedFamily?.name, selectedLine?.name, selectedSeries?.name],
        grade:  [selectedFamily?.name, selectedLine?.name, selectedSeries?.name, selectedGrade?.name],
    };

    return (
        <AdminLayout>
            <Head title="Composición química" />
            <div className="space-y-6">

                {/* Page header */}
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.18),_transparent_34%),linear-gradient(135deg,#ffffff_0%,#f6f9fb_48%,#eef8fb_100%)] px-6 py-8 md:px-8">
                        <div className="max-w-3xl">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Productos / Composición</p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Composición química</h1>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                La vista de línea y serie refleja exactamente la web pública: se arma desde las composiciones de sus grados. La edición de porcentajes vive en <strong>Grado</strong>.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Elements panel */}
                <ElementsPanel elements={chemicalElements} />

                {/* Catalog tree + composition editors */}
                <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">

                    {/* ── Left tree ─────────────────────────────────────────── */}
                    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                        <h2 className="px-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Árbol de catálogo</h2>
                        <p className="mt-1 px-3 text-xs text-slate-400">Seleccioná una línea para editar su composición.</p>
                        <div className="mt-4 space-y-1.5">
                            {families.map((family) => (
                                <div key={family.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedFamilyId(family.id)}
                                        className={`flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left text-sm font-semibold transition ${selectedFamily?.id === family.id ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
                                    >
                                        <span className="truncate">{family.name}</span>
                                        <span className={`rounded px-2 py-1 text-[11px] ${selectedFamily?.id === family.id ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>{family.lines.length}</span>
                                    </button>
                                    {selectedFamily?.id === family.id ? (
                                        <div className="mt-2 space-y-1 pl-3">
                                            {family.lines.map((line) => (
                                                <button
                                                    key={line.id}
                                                    type="button"
                                                    onClick={() => setSelectedLineId(line.id)}
                                                    className={`flex w-full items-center justify-between rounded-[16px] px-3 py-2 text-left text-sm transition ${selectedLine?.id === line.id ? "bg-[#25A7CA]/10 font-semibold text-[#117a98]" : "text-slate-600 hover:bg-slate-50"}`}
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

                    {/* ── Right editor ──────────────────────────────────────── */}
                    <div className="min-w-0">
                        {selectedLine ? (
                            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">

                                {/* Breadcrumb + tab bar */}
                                <div className="border-b border-slate-100 pb-5">
                                    <Breadcrumb parts={breadcrumbParts[activeTab]} />
                                    <div className="mt-4">
                                        <TabBar active={activeTab} onChange={setActiveTab} />
                                    </div>
                                </div>

                                {/* ── TAB: Línea ──────────────────────────────── */}
                                {activeTab === "line" ? (
                                    <div>
                                        <div className="mt-5 flex items-start gap-3 rounded-[20px] border border-[#25A7CA]/20 bg-[#25A7CA]/5 px-5 py-4">
                                            <Icon icon="solar:layers-minimalistic-outline" width={20} className="mt-0.5 shrink-0 text-[#25A7CA]" />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{selectedLine.name}</p>
                                                <p className="mt-0.5 text-xs text-slate-500">Esto refleja la composición pública de la línea: una fila por cada grado visible dentro de sus series.</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-slate-900">Vista pública real de la línea</h3>
                                                    <p className="mt-1 text-xs text-slate-500">Si falta una fila, editá la composición del grado correspondiente.</p>
                                                </div>
                                            </div>
                                            <PublicCompositionRows rows={lineCompositionRows} elements={chemicalElements} />
                                        </div>
                                    </div>
                                ) : null}

                                {/* ── TAB: Serie ──────────────────────────────── */}
                                {activeTab === "series" ? (
                                    <div>
                                        {/* Series picker */}
                                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                                            <div className="flex items-start gap-3 flex-1 rounded-[20px] border border-[#25A7CA]/20 bg-[#25A7CA]/5 px-5 py-4">
                                                <Icon icon="solar:folder-2-outline" width={20} className="mt-0.5 shrink-0 text-[#25A7CA]" />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{selectedSeries?.name || "—"}</p>
                                                    <p className="mt-0.5 text-xs text-slate-500">Composición de esta serie comercial específica.</p>
                                                </div>
                                            </div>
                                            {allSeries.length > 0 ? (
                                                <select
                                                    value={selectedSeriesId ?? ""}
                                                    onChange={(e) => setSelectedSeriesId(Number(e.target.value))}
                                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                                >
                                                    {allSeries.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            ) : null}
                                        </div>

                                        {selectedSeries ? (
                                            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-slate-900">Vista pública real de la serie</h3>
                                                        <p className="mt-1 text-xs text-slate-500">La serie muestra las composiciones de sus grados, tal como en el slug público.</p>
                                                    </div>
                                                </div>
                                                <PublicCompositionRows rows={seriesCompositionRows} elements={chemicalElements} />
                                            </div>
                                        ) : (
                                            <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                                                Esta línea no tiene series cargadas.
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                {/* ── TAB: Grado ──────────────────────────────── */}
                                {activeTab === "grade" ? (
                                    <div>
                                        {/* Series + Grade pickers */}
                                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                            {allSeries.length > 0 ? (
                                                <div>
                                                    <p className="mb-1.5 px-1 text-xs font-semibold text-slate-500">Serie</p>
                                                    <select
                                                        value={selectedSeriesId ?? ""}
                                                        onChange={(e) => setSelectedSeriesId(Number(e.target.value))}
                                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                                    >
                                                        {allSeries.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                            ) : null}
                                            {allGrades.length > 0 ? (
                                                <div>
                                                    <p className="mb-1.5 px-1 text-xs font-semibold text-slate-500">Grado / variante</p>
                                                    <select
                                                        value={selectedGradeId ?? ""}
                                                        onChange={(e) => setSelectedGradeId(Number(e.target.value))}
                                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                                    >
                                                        {allGrades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                    </select>
                                                </div>
                                            ) : null}
                                        </div>

                                        {selectedGrade ? (
                                            <>
                                                <div className="mt-3 flex items-start gap-3 rounded-[20px] border border-[#25A7CA]/20 bg-[#25A7CA]/5 px-5 py-4">
                                                    <Icon icon="solar:atom-outline" width={20} className="mt-0.5 shrink-0 text-[#25A7CA]" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{selectedGrade.name}</p>
                                                        <p className="mt-0.5 text-xs text-slate-500">Composición específica de este grado o variante. Puede diferir de la composición de la serie.</p>
                                                    </div>
                                                </div>
                                                <CompositionEditor
                                                    form={gradeForm}
                                                    setFormData={gradeForm.setData}
                                                    elements={chemicalElements}
                                                    onSubmit={(e) => { e.preventDefault(); gradeForm.put(`/admin/productos/composicion-quimica/grados/${selectedGrade.id}`, { preserveScroll: true }); }}
                                                    processing={gradeForm.processing}
                                                />
                                            </>
                                        ) : (
                                            <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                                                {allSeries.length === 0
                                                    ? "Esta línea no tiene series cargadas."
                                                    : allGrades.length === 0
                                                    ? "Esta serie no tiene grados cargados."
                                                    : "Seleccioná un grado para editar su composición."}
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-16 text-center">
                                <div>
                                    <Icon icon="solar:layers-minimalistic-outline" width={40} className="mx-auto text-slate-300" />
                                    <p className="mt-4 text-sm font-semibold text-slate-500">Seleccioná una línea del árbol para comenzar.</p>
                                </div>
                            </div>
                        )}
                    </div>

                </section>
            </div>
        </AdminLayout>
    );
}

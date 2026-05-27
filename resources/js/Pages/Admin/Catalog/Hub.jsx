import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";

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
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                        {value}
                    </p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
                    <Icon icon={icon} width={22} />
                </div>
            </div>
        </article>
    );
}

function ActionCard({ title, description, href, icon, cta }) {
    return (
        <Link
            href={href}
            className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#25A7CA]/30 hover:shadow-md"
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]">
                <Icon icon={icon} width={22} />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#117a98]">
                <span>{cta}</span>
                <Icon icon="solar:arrow-right-outline" width={16} className="transition group-hover:translate-x-1" />
            </div>
        </Link>
    );
}

export default function CatalogHub({ families, stats, publicIndexUrl }) {
    const [selectedFamilyId, setSelectedFamilyId] = useState(families[0]?.id ?? null);
    const selectedFamily = useMemo(
        () => families.find((family) => family.id === selectedFamilyId) ?? families[0] ?? null,
        [families, selectedFamilyId],
    );

    return (
        <AdminLayout>
            <Head title="Productos" />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.18),_transparent_34%),linear-gradient(135deg,#ffffff_0%,#f6f9fb_48%,#eef8fb_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#117a98]">
                                    <Icon icon="solar:box-bold-duotone" width={14} />
                                    Panel de productos
                                </div>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Productos conectados con la web pública
                                </h1>
                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    Desde acá ves cómo quedó organizado el catálogo público y entrás directo a la sección correcta para editar
                                    líneas, series, grados, textos y composición.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <a
                                    href={publicIndexUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                >
                                    <Icon icon="solar:eye-outline" width={18} />
                                    Ver web pública
                                </a>
                                <Link
                                    href="/admin/productos/taxonomia"
                                    className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition hover:-translate-y-0.5 hover:bg-[#1f8da8]"
                                >
                                    <Icon icon="solar:pen-new-square-bold" width={18} />
                                    Editar estructura
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <StatCard label="Familias" value={stats.families} icon="solar:box-bold-duotone" />
                    <StatCard label="Líneas" value={stats.lines} icon="solar:folder-with-files-bold-duotone" />
                    <StatCard label="Series" value={stats.series} icon="solar:layers-minimalistic-bold-duotone" />
                    <StatCard label="Grados" value={stats.grades} icon="solar:notes-bold-duotone" />
                    <StatCard
                        label="Series sin composición"
                        value={stats.series_without_composition}
                        icon="solar:test-tube-bold-duotone"
                        tone="amber"
                    />
                    <StatCard
                        label="Grados sin features"
                        value={stats.grades_without_features}
                        icon="solar:danger-circle-bold-duotone"
                        tone="rose"
                    />
                </section>

                <section className="grid gap-4 xl:grid-cols-4">
                    <ActionCard
                        title="Familias, líneas, series y grados"
                        description="Revisá y corregí solo la estructura activa que hoy se publica y que alimentan los importadores."
                        href="/admin/productos/taxonomia"
                        icon="solar:sitemap-bold-duotone"
                        cta="Abrir estructura actual"
                    />
                    <ActionCard
                        title="Textos y fichas de la web"
                        description="Editá títulos, textos, bloques, propiedades y normas que hoy ven las fichas activas del catálogo."
                        href="/admin/productos/contenido-tecnico"
                        icon="solar:document-text-bold-duotone"
                        cta="Abrir fichas actuales"
                    />
                    <ActionCard
                        title="Composición química"
                        description="Editá la composición vigente de líneas, series y grados activos, tal como la trae el importador."
                        href="/admin/productos/composicion-quimica"
                        icon="solar:test-tube-bold-duotone"
                        cta="Abrir composición actual"
                    />
                    <ActionCard
                        title="Carga masiva desde Excel"
                        description="Subí la planilla base para cargar o actualizar productos de forma controlada y con trazabilidad."
                        href="/admin/productos/importador"
                        icon="solar:upload-bold-duotone"
                        cta="Abrir carga masiva"
                    />
                </section>

                <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-4 px-3">
                            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                                Familias
                            </h2>
                        </div>
                        <div className="space-y-1.5">
                            {families.map((family) => {
                                const active = selectedFamily?.id === family.id;

                                return (
                                    <button
                                        key={family.id}
                                        type="button"
                                        onClick={() => setSelectedFamilyId(family.id)}
                                        className={`flex w-full items-center justify-between rounded-[20px] px-4 py-3 text-left text-sm font-semibold transition ${
                                            active
                                                ? "bg-[#25A7CA] text-white shadow-sm"
                                                : "bg-transparent text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <span className="truncate">{family.name}</span>
                                        <span className={`rounded px-2 py-1 text-[11px] ${active ? "bg-[#1f8da8]/40" : "bg-slate-100 text-slate-500"}`}>
                                            {family.lines.length}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        {selectedFamily ? (
                            <>
                                <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">
                                            Estructura pública
                                        </p>
                                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                            {selectedFamily.name}
                                        </h2>
                                    </div>
                                    <Link
                                        href="/admin/productos/taxonomia"
                                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                    >
                                        <Icon icon="solar:settings-outline" width={18} />
                                        Gestionar estructura
                                    </Link>
                                </div>

                                <div className="mt-6 space-y-5">
                                    {selectedFamily.lines.length ? (
                                        selectedFamily.lines.map((line) => (
                                            <article key={line.id} className="rounded-[24px] border border-slate-200 bg-slate-50/60 p-5">
                                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-slate-900">{line.name}</h3>
                                                        <p className="mt-1 text-sm text-slate-500">/{line.slug}</p>
                                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                                            {line.intro_title || "Sin título de intro todavía"}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Link
                                                            href={`/admin/productos/contenido-tecnico?line=${line.id}`}
                                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                                        >
                                                            Contenido técnico
                                                        </Link>
                                                        <Link
                                                            href={`/admin/productos/composicion-quimica?line=${line.id}`}
                                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                                        >
                                                            Composición
                                                        </Link>
                                                    </div>
                                                </div>

                                                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                                                    {line.series.map((series) => (
                                                        <div key={series.id} className="rounded-[20px] border border-slate-200 bg-white p-4">
                                                            {(() => {
                                                                const hasPublicComposition = (series.grades ?? []).some(
                                                                    (grade) => Number(grade.composition_profiles_count ?? 0) > 0,
                                                                );

                                                                return (
                                                                    <>
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-900">{series.name}</p>
                                                                    <p className="mt-1 text-xs text-slate-500">/{line.slug}/{series.slug}</p>
                                                                </div>
                                                                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                                                    hasPublicComposition
                                                                        ? "bg-emerald-100 text-emerald-700"
                                                                        : "bg-amber-100 text-amber-700"
                                                                }`}>
                                                                    {hasPublicComposition ? "Con composición" : "Sin composición"}
                                                                </span>
                                                            </div>
                                                            <div className="mt-3 text-xs text-slate-500">
                                                                {series.grades.length} grado(s)
                                                            </div>
                                                            <div className="mt-4 flex flex-wrap gap-2">
                                                                <Link
                                                                    href={`/admin/productos/contenido-tecnico?line=${line.id}&series=${series.id}`}
                                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                                                                >
                                                                    Editar serie
                                                                </Link>
                                                                <Link
                                                                    href={`/admin/productos/composicion-quimica?line=${line.id}&series=${series.id}`}
                                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                                                >
                                                                    Editar composición
                                                                </Link>
                                                            </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    ))}
                                                </div>
                                            </article>
                                        ))
                                    ) : (
                                        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                                            Esta familia todavía no tiene líneas cargadas.
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                                No hay familias cargadas todavía.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

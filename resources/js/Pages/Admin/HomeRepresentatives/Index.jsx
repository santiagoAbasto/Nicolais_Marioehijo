import PublicPreviewModal from "@/Components/Admin/PublicPreviewModal";
import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useMemo, useState } from "react";

function normalizeSort(value, fallback) {
    const next = (value || "").toString().trim().toUpperCase();
    return next || fallback;
}

function sortPartners(partners) {
    return [...partners].sort((a, b) =>
        (a.sort_order || "").localeCompare(b.sort_order || "", undefined, {
            numeric: true,
            sensitivity: "base",
        }),
    );
}

function RepresentativesPreview({ section, partners }) {
    const visiblePartners = useMemo(
        () =>
            sortPartners(
                partners.filter((partner) => partner.show_on_home && partner.is_active),
            ),
        [partners],
    );

    return (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="bg-[rgba(9,62,102,0.05)] px-8 py-12">
                <div className="grid gap-8 xl:grid-cols-[max-content_minmax(0,1fr)] xl:items-center">
                    <h2 className="font-['Montserrat'] text-[32px] font-semibold leading-[1.2] text-[#1A181C]">
                        {section.title || "Representantes exclusivos"}
                    </h2>

                    <div className="flex flex-wrap items-center gap-8">
                        {visiblePartners.length > 0 ? (
                            visiblePartners.map((partner) => (
                                <div
                                    key={partner.id}
                                    className="flex h-16 min-w-[120px] items-center justify-center"
                                >
                                    {partner.logo_url ? (
                                        <img
                                            src={partner.logo_url}
                                            alt={partner.name}
                                            className="max-h-[54px] w-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-sm font-semibold text-slate-500">
                                            {partner.name}
                                        </span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-sm text-slate-500">
                                No hay representadas visibles en home todavía.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function HomeRepresentativesIndex({
    section,
    partners: initialPartners,
    publicHomeUrl,
}) {
    const [sectionForm, setSectionForm] = useState({
        id: section.id,
        title: section.title ?? "",
        is_active: !!section.is_active,
        sort_order: section.sort_order ?? "A",
    });
    const [partners, setPartners] = useState(initialPartners ?? []);
    const [saving, setSaving] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    const updatePartner = (id, key, value) => {
        setPartners((current) =>
            current.map((partner) =>
                partner.id === id ? { ...partner, [key]: value } : partner,
            ),
        );
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            await axios.put(`/admin/api/site-sections/${sectionForm.id}`, {
                page_key: "home",
                section_key: "representantes",
                title: sectionForm.title || null,
                description: null,
                button_text: null,
                button_url: null,
                sort_order: sectionForm.sort_order || "A",
                is_active: sectionForm.is_active,
                field_values: [],
                items: [],
            });

            await Promise.all(
                partners.map((partner) =>
                    axios.put(`/admin/api/partners/${partner.id}`, {
                        name: partner.name,
                        website_url: partner.website_url || null,
                        partner_type: "representada",
                        logo_media_id: partner.logo_media_id ?? null,
                        sort_order: normalizeSort(partner.sort_order, "A"),
                        is_active: !!partner.is_active,
                        show_on_home: !!partner.show_on_home,
                        show_on_page: !!partner.show_on_page,
                    }),
                ),
            );

            setPartners((current) =>
                sortPartners(
                    current.map((partner) => ({
                        ...partner,
                        sort_order: normalizeSort(partner.sort_order, "A"),
                    })),
                ),
            );

            emitAdminToast(
                "Los representantes exclusivos de la home se actualizaron correctamente.",
            );
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudieron guardar los representantes exclusivos.",
                "error",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Representantes exclusivos Home" />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.18),_transparent_38%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_45%,#eff6ff_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    <Icon icon="solar:users-group-two-rounded-outline" width={14} />
                                    Home / Representantes exclusivos
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Representantes exclusivos home
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                    Editá el título del bloque y definí qué
                                    representadas aparecen en la home pública.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPreviewOpen(true)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                            >
                                <Icon icon="solar:square-arrow-right-up-outline" width={18} />
                                Ver home pública
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
                    <RepresentativesPreview
                        section={sectionForm}
                        partners={partners}
                    />

                    <form
                        onSubmit={handleSave}
                        className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <div className="border-b border-slate-200 pb-5">
                            <h2 className="text-xl font-semibold text-slate-900">
                                Editar bloque
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Controlá el título y la visibilidad de cada logo en
                                la franja de representadas.
                            </p>
                        </div>

                        <div className="mt-6 space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-800">
                                    Título del bloque
                                </label>
                                <input
                                    type="text"
                                    value={sectionForm.title}
                                    onChange={(event) =>
                                        setSectionForm((current) => ({
                                            ...current,
                                            title: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    placeholder="Representantes exclusivos"
                                />
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                                        Orden del bloque
                                    </label>
                                    <input
                                        type="text"
                                        value={sectionForm.sort_order}
                                        onChange={(event) =>
                                            setSectionForm((current) => ({
                                                ...current,
                                                sort_order: event.target.value
                                                    .toUpperCase()
                                                    .slice(0, 16),
                                            }))
                                        }
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                        placeholder="A"
                                    />
                                </div>

                                <div className="flex items-end">
                                    <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={sectionForm.is_active}
                                            onChange={(event) =>
                                                setSectionForm((current) => ({
                                                    ...current,
                                                    is_active: event.target.checked,
                                                }))
                                            }
                                            className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                                        />
                                        Bloque activo en home
                                    </label>
                                </div>
                            </div>

                            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-3">
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Logos disponibles
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Activá las marcas que querés mostrar en la
                                        home y definí su orden.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {sortPartners(partners).map((partner) => (
                                        <div
                                            key={partner.id}
                                            className="rounded-[22px] border border-slate-200 bg-white p-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                                                    {partner.logo_url ? (
                                                        <img
                                                            src={partner.logo_url}
                                                            alt={partner.name}
                                                            className="max-h-10 w-full object-contain"
                                                        />
                                                    ) : (
                                                        <Icon
                                                            icon="solar:image-outline"
                                                            width={18}
                                                            className="text-slate-400"
                                                        />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {partner.name}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs text-slate-500">
                                                        {partner.website_url || "Sin URL"}
                                                    </p>

                                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                        <label className="inline-flex items-center gap-3 text-sm text-slate-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!partner.show_on_home}
                                                                onChange={(event) =>
                                                                    updatePartner(
                                                                        partner.id,
                                                                        "show_on_home",
                                                                        event.target.checked,
                                                                    )
                                                                }
                                                                className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                                                            />
                                                            Mostrar en home
                                                        </label>

                                                        <label className="inline-flex items-center gap-3 text-sm text-slate-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!partner.is_active}
                                                                onChange={(event) =>
                                                                    updatePartner(
                                                                        partner.id,
                                                                        "is_active",
                                                                        event.target.checked,
                                                                    )
                                                                }
                                                                className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                                                            />
                                                            Marca activa
                                                        </label>
                                                    </div>

                                                    <div className="mt-3 max-w-[150px]">
                                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                            Orden
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={partner.sort_order || ""}
                                                            onChange={(event) =>
                                                                updatePartner(
                                                                    partner.id,
                                                                    "sort_order",
                                                                    event.target.value
                                                                        .toUpperCase()
                                                                        .slice(0, 16),
                                                                )
                                                            }
                                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                                            placeholder="A"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <Icon icon="solar:diskette-outline" width={18} />
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    </form>
                </section>
            </div>

            <PublicPreviewModal
                open={previewOpen}
                title="Home pública"
                url={publicHomeUrl}
                onClose={() => setPreviewOpen(false)}
            />
        </AdminLayout>
    );
}

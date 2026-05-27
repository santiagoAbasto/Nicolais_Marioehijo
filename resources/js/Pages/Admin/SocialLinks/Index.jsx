import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState } from "react";

const PLATFORM_META = {
    instagram: {
        label: "Instagram",
        icon: "ri:instagram-fill",
        color: "text-pink-500",
        bg: "bg-pink-50",
        border: "border-pink-200",
    },
    facebook: {
        label: "Facebook",
        icon: "ri:facebook-fill",
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
    },
    youtube: {
        label: "YouTube",
        icon: "ri:youtube-fill",
        color: "text-red-500",
        bg: "bg-red-50",
        border: "border-red-200",
    },
    linkedin: {
        label: "LinkedIn",
        icon: "ri:linkedin-fill",
        color: "text-sky-700",
        bg: "bg-sky-50",
        border: "border-sky-200",
    },
};

const PLATFORM_OPTIONS = [
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
    { value: "youtube", label: "YouTube" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "x", label: "X / Twitter" },
    { value: "tiktok", label: "TikTok" },
];

function getPlatformMeta(platform) {
    return PLATFORM_META[platform?.toLowerCase()] ?? {
        label: platform,
        icon: "solar:link-outline",
        color: "text-slate-500",
        bg: "bg-slate-50",
        border: "border-slate-200",
    };
}

export default function SocialLinksIndex({ links: initialLinks }) {
    const [links, setLinks] = useState(initialLinks ?? []);
    const [savingId, setSavingId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [newLink, setNewLink] = useState({
        platform: "instagram",
        label: "Instagram",
        url: "",
    });

    useEffect(() => {
        setLinks(initialLinks ?? []);
    }, [initialLinks]);

    const updateField = (id, key, value) => {
        setLinks((prev) =>
            prev.map((l) => (l.id === id ? { ...l, [key]: value } : l)),
        );
    };

    const setNewField = (key, value) => {
        setNewLink((current) => ({
            ...current,
            [key]: value,
            ...(key === "platform"
                ? { label: PLATFORM_OPTIONS.find((option) => option.value === value)?.label ?? current.label }
                : {}),
        }));
    };

    const create = async () => {
        setCreating(true);

        try {
            await axios.post("/admin/api/social-links", {
                platform: newLink.platform,
                label: newLink.label,
                url: newLink.url,
            });

            emitAdminToast("Red social agregada al footer.");
            setNewLink({ platform: "instagram", label: "Instagram", url: "" });
            router.reload();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message || "No se pudo agregar la red social.",
                "error",
            );
        } finally {
            setCreating(false);
        }
    };

    const save = async (item) => {
        setSavingId(item.id);

        try {
            await axios.put(`/admin/api/social-links/${item.id}`, {
                platform:  item.platform,
                label:     item.label,
                url:       item.url,
                icon:      item.platform,
                is_active: item.is_active,
            });

            emitAdminToast(`${getPlatformMeta(item.platform).label} actualizado correctamente.`);
            router.reload();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message || "No se pudo guardar el enlace.",
                "error",
            );
        } finally {
            setSavingId(null);
        }
    };

    return (
        <AdminLayout>
            <Head title="Redes sociales" />

            <div className="space-y-6">
                {/* Header */}
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.16),_transparent_34%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_44%,#eef7fb_100%)] px-6 py-8 md:px-8">
                        <div className="max-w-3xl">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                <Icon icon="solar:share-outline" width={14} />
                                Extras / Redes sociales
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                Redes sociales
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                Editá los enlaces de las redes sociales que aparecen
                                en el footer de todas las páginas de la web.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-slate-900">
                            Enlaces del footer
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Cada cambio se guarda de forma individual.
                        </p>
                    </div>

                    <div className="mb-6 rounded-[24px] border border-dashed border-[#25A7CA]/35 bg-[#25A7CA]/5 p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25A7CA] text-white">
                                <Icon icon="solar:add-circle-outline" width={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                    Añadir red social
                                </h3>
                                <p className="text-sm text-slate-500">
                                    El footer hereda automáticamente el SVG correspondiente a la plataforma.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[180px_220px_minmax(0,1fr)_auto] lg:items-end">
                            <label className="space-y-2">
                                <span className="text-sm font-semibold text-slate-900">Plataforma</span>
                                <select
                                    value={newLink.platform}
                                    onChange={(e) => setNewField("platform", e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                >
                                    {PLATFORM_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-semibold text-slate-900">Nombre visible</span>
                                <input
                                    type="text"
                                    value={newLink.label}
                                    onChange={(e) => setNewField("label", e.target.value)}
                                    placeholder="Instagram"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-semibold text-slate-900">URL</span>
                                <input
                                    type="url"
                                    value={newLink.url}
                                    onChange={(e) => setNewField("url", e.target.value)}
                                    placeholder="https://instagram.com/nicolaismarioehijo"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </label>

                            <button
                                type="button"
                                onClick={create}
                                disabled={creating}
                                className="rounded-2xl bg-[#25A7CA] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                            >
                                {creating ? "Agregando..." : "Añadir"}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {links.map((item) => {
                            const meta = getPlatformMeta(item.platform);

                            return (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-4 rounded-[24px] border border-slate-200 p-5 sm:flex-row sm:items-center"
                                >
                                    {/* Platform icon */}
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${meta.bg} ${meta.border}`}
                                    >
                                        <Icon icon={meta.icon} width={22} className={meta.color} />
                                    </div>

                                    {/* Label + input */}
                                    <div className="grid flex-1 gap-3 lg:grid-cols-[160px_180px_minmax(0,1fr)]">
                                        <label className="space-y-1.5">
                                            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Plataforma</span>
                                            <input
                                                type="text"
                                                value={item.platform}
                                                onChange={(e) => updateField(item.id, "platform", e.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                            />
                                        </label>

                                        <label className="space-y-1.5">
                                            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Nombre</span>
                                            <input
                                                type="text"
                                                value={item.label ?? meta.label}
                                                onChange={(e) => updateField(item.id, "label", e.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                            />
                                        </label>

                                        <label className="space-y-1.5">
                                            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">URL</span>
                                            <input
                                                type="url"
                                                value={item.url}
                                                onChange={(e) => updateField(item.id, "url", e.target.value)}
                                                placeholder={`https://${item.platform}.com/...`}
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                            />
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-2 sm:shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => updateField(item.id, "is_active", !item.is_active)}
                                            className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                                                item.is_active
                                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                            }`}
                                        >
                                            {item.is_active ? "Visible" : "Oculta"}
                                        </button>
                                        {item.url ? (
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                                title="Abrir enlace"
                                            >
                                                <Icon icon="solar:square-arrow-right-up-outline" width={16} />
                                            </a>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => save(item)}
                                            disabled={savingId === item.id}
                                            className="rounded-2xl bg-[#25A7CA] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                        >
                                            {savingId === item.id ? "Guardando..." : "Guardar"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

import AdminLayout from "@/Layouts/AdminLayout";
import { router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

export default function SubmissionsIndex({ submissions, filters, types, unreadCount, viewTitle, viewDescription, basePath, lockedType }) {
    const [search, setSearch] = useState(filters?.search ?? "");
    const [selectedType, setSelectedType] = useState(filters?.type ?? "");

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                basePath,
                lockedType
                    ? {
                        search,
                    }
                    : {
                        search,
                        type: selectedType,
                    },
                {
                    preserveState: true,
                    replace: true,
                    preserveScroll: true,
                },
            );
        }, 250);

        return () => clearTimeout(timer);
    }, [search, selectedType, basePath, lockedType]);

    const rows = submissions?.data ?? [];
    const links = submissions?.links ?? [];

    const formatDate = (value) => {
        if (!value) return "-";

        return new Intl.DateTimeFormat("es-AR", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    };

    const visit = (url) => {
        if (!url) return;
        router.visit(url, { preserveScroll: true, preserveState: true });
    };

    const destroy = (submissionId) => {
        if (!window.confirm("¿Eliminar esta solicitud? Esta acción no se puede deshacer.")) {
            return;
        }

        router.delete(`/admin/submissions/${submissionId}`, {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold text-[#25A7CA]">
                                <Icon icon="solar:letter-unread-outline" width={14} />
                                {unreadCount} sin leer
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{viewTitle}</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                {viewDescription}
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr),220px]">
                            <label className="relative">
                                <Icon icon="solar:magnifer-outline" width={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Buscar en datos o navegador"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm text-slate-700 outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </label>

                            <select
                                value={selectedType}
                                onChange={(event) => setSelectedType(event.target.value)}
                                disabled={!!lockedType}
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                            >
                                <option value="">Todos los tipos</option>
                                {types.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-medium">Estado</th>
                                    <th className="px-5 py-4 font-medium">Tipo</th>
                                    <th className="px-5 py-4 font-medium">Persona</th>
                                    <th className="px-5 py-4 font-medium">Correo</th>
                                    <th className="px-5 py-4 font-medium">Referencia</th>
                                    <th className="px-5 py-4 font-medium">Fecha</th>
                                    <th className="px-5 py-4 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <Icon icon="solar:inbox-outline" width={36} className="mx-auto mb-3 text-slate-300" />
                                            <p className="text-sm font-medium text-slate-500">No hay solicitudes para estos filtros.</p>
                                        </td>
                                    </tr>
                                )}

                                {rows.map((submission) => (
                                    <tr
                                        key={submission.id}
                                        className={`transition hover:bg-slate-50 ${submission.is_read ? "" : "bg-[#25A7CA]/[0.04]"}`}
                                    >
                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                                    submission.is_read
                                                        ? "bg-slate-100 text-slate-500"
                                                        : "bg-emerald-100 text-emerald-700"
                                                }`}
                                            >
                                                <span
                                                    className={`h-2 w-2 rounded-full ${
                                                        submission.is_read ? "bg-slate-400" : "bg-emerald-500"
                                                    }`}
                                                />
                                                {submission.is_read ? "Leída" : "Nueva"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">
                                                {submission.type_label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="min-w-[180px]">
                                                <p className="font-medium text-slate-800">{submission.contact_name ?? "Sin nombre"}</p>
                                                {submission.contact_phone && (
                                                    <p className="mt-1 text-xs text-slate-500">{submission.contact_phone}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">{submission.contact_email ?? "-"}</td>
                                        <td className="max-w-[320px] px-5 py-4 text-slate-600">{submission.subject ?? submission.summary}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-slate-500">{formatDate(submission.created_at)}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => router.visit(`/admin/submissions/${submission.id}`)}
                                                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-[#25A7CA] hover:text-[#25A7CA]"
                                                >
                                                    Ver detalle
                                                </button>
                                                <button
                                                    onClick={() => destroy(submission.id)}
                                                    className="rounded-xl border border-red-100 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-400">
                            Vista paginada para no saturar el panel y mantenerlo estable en hosting compartido.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            {links.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    onClick={() => visit(link.url)}
                                    disabled={!link.url || link.active}
                                    className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                                        link.active
                                            ? "bg-[#25A7CA] text-white"
                                            : link.url
                                              ? "border border-slate-200 text-slate-600 hover:border-[#25A7CA] hover:text-[#25A7CA]"
                                              : "cursor-not-allowed border border-slate-100 text-slate-300"
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

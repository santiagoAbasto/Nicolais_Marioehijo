import AdminLayout from "@/Layouts/AdminLayout";
import { router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";

export default function ServicesIndex({ services }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return services;

        return services.filter((service) =>
            [service.title, service.slug, service.subtitle]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query)),
        );
    }, [search, services]);

    const destroy = (service) => {
        if (!window.confirm(`¿Eliminar el servicio "${service.title}"?`)) return;
        router.delete(`/admin/services/${service.id}`);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Servicios</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Gestioná el catálogo de servicios y su visibilidad en la Home.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <label className="relative min-w-[260px]">
                                <Icon icon="solar:magnifer-outline" width={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Buscar servicio"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </label>

                            <button
                                onClick={() => router.visit("/admin/services/create")}
                                className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1d96b8]"
                            >
                                Nuevo servicio
                            </button>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-medium">Servicio</th>
                                    <th className="px-5 py-4 font-medium">Slug</th>
                                    <th className="px-5 py-4 font-medium">Orden</th>
                                    <th className="px-5 py-4 font-medium">Home</th>
                                    <th className="px-5 py-4 font-medium">Estado</th>
                                    <th className="px-5 py-4 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-400">
                                            No hay servicios para mostrar.
                                        </td>
                                    </tr>
                                )}

                                {filtered.map((service) => (
                                    <tr key={service.id} className="transition hover:bg-slate-50">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={service.image_url}
                                                    alt={service.title}
                                                    className="h-12 w-12 rounded-2xl border border-slate-200 object-cover"
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-slate-800">{service.title}</p>
                                                    <p className="truncate text-xs text-slate-400">{service.subtitle || "Sin subtítulo"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500">{service.slug}</td>
                                        <td className="px-5 py-4 text-slate-500">{service.order}</td>
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => router.patch(`/admin/services/${service.id}/toggle-home`)}
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                    service.show_in_home
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-slate-100 text-slate-500"
                                                }`}
                                            >
                                                {service.show_in_home ? "Visible" : "Oculto"}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                service.is_active ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"
                                            }`}>
                                                {service.is_active ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => router.visit(`/admin/services/${service.id}/edit`)}
                                                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-[#25A7CA] hover:text-[#25A7CA]"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => destroy(service)}
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
                </section>
            </div>
        </AdminLayout>
    );
}

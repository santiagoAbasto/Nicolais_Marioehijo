import AdminLayout from "@/Layouts/AdminLayout";
import { router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";

function SwitchButton({ checked, onClick, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={onClick}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                checked ? "bg-emerald-500" : "bg-slate-300"
            }`}
        >
            <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    checked ? "translate-x-6" : "translate-x-1"
                }`}
            />
        </button>
    );
}

export default function EquipmentsIndex({ equipments, categories }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return equipments;

        return equipments.filter((equipment) =>
            [equipment.title, equipment.slug, equipment.category?.name]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query)),
        );
    }, [search, equipments]);

    const destroy = (equipment) => {
        if (!window.confirm(`¿Eliminar el equipo "${equipment.title}"?`)) return;
        router.delete(`/admin/equipments/${equipment.id}`);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Productos de equipos</h1>
                            <p className="mt-2 text-sm text-slate-500">Administra los productos que verá el cliente dentro de cada categoría.</p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <label className="relative min-w-[260px]">
                                <Icon icon="solar:magnifer-outline" width={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar equipo" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10" />
                            </label>
                            <button onClick={() => router.visit("/admin/equipments/create")} className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1d96b8]">
                                Nuevo equipo
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Total</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{equipments.length}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">En Home</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">
                                {equipments.filter((equipment) => equipment.show_in_home).length}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Categorías</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{categories.length}</p>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-medium">Equipo</th>
                                    <th className="px-5 py-4 font-medium">Categoría</th>
                                    <th className="px-5 py-4 font-medium">Home</th>
                                    <th className="px-5 py-4 font-medium">Estado</th>
                                    <th className="px-5 py-4 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">No hay equipos para mostrar.</td>
                                    </tr>
                                )}
                                {filtered.map((equipment) => (
                                    <tr key={equipment.id} className="transition hover:bg-slate-50">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={equipment.main_image_url} alt={equipment.title} className="h-12 w-12 rounded-2xl border border-slate-200 bg-white object-contain p-1" />
                                                <div>
                                                    <p className="font-medium text-slate-800">{equipment.title}</p>
                                                    <p className="text-xs text-slate-400">{equipment.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500">{equipment.category?.name || "Sin categoría"}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <SwitchButton
                                                    checked={equipment.show_in_home}
                                                    onClick={() => router.patch(`/admin/equipments/${equipment.id}/toggle-home`)}
                                                    label={`Mostrar ${equipment.title} en Home`}
                                                />
                                                <span className={`text-xs font-semibold ${equipment.show_in_home ? "text-emerald-700" : "text-slate-500"}`}>
                                                    {equipment.show_in_home ? "Visible" : "Oculto"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${equipment.is_active ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}>
                                                {equipment.is_active ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => router.visit(`/admin/equipments/${equipment.id}/edit`)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-[#25A7CA] hover:text-[#25A7CA]">
                                                    Editar
                                                </button>
                                                <button onClick={() => destroy(equipment)} className="rounded-xl border border-red-100 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50">
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

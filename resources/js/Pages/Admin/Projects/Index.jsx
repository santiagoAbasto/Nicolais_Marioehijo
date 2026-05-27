import AdminLayout from "@/Layouts/AdminLayout";
import { Icon } from "@iconify/react";
import { router } from "@inertiajs/react";
import { useMemo, useState } from "react";

export default function ProjectsIndex({ projects }) {
    const [search, setSearch] = useState("");
    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return projects;
        return projects.filter((project) => [project.title, project.slug].filter(Boolean).some((value) => value.toLowerCase().includes(query)));
    }, [search, projects]);

    return (
        <AdminLayout>
            <div className="space-y-6">
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Proyectos</h1>
                            <p className="mt-2 text-sm text-slate-500">Administrá trabajos realizados y su galería.</p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <label className="relative min-w-[260px]">
                                <Icon icon="solar:magnifer-outline" width={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar proyecto" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10" />
                            </label>
                            <button onClick={() => router.visit("/admin/projects/create")} className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1d96b8]">Nuevo proyecto</button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Total</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{projects.length}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">En Home</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">
                                {projects.filter((project) => project.show_in_home).length}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Activos</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">
                                {projects.filter((project) => project.is_active).length}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-medium">Proyecto</th>
                                    <th className="px-5 py-4 font-medium">Slug</th>
                                    <th className="px-5 py-4 font-medium">Home</th>
                                    <th className="px-5 py-4 font-medium">Estado</th>
                                    <th className="px-5 py-4 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 && <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">No hay proyectos para mostrar.</td></tr>}
                                {filtered.map((project) => (
                                    <tr key={project.id} className="transition hover:bg-slate-50">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={project.cover_image_url} alt={project.title} className="h-12 w-12 rounded-2xl border border-slate-200 object-cover" />
                                                <div>
                                                    <p className="font-medium text-slate-800">{project.title}</p>
                                                    <p className="text-xs text-slate-400">{project.images.length} imagen(es)</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500">{project.slug || "Sin slug"}</td>
                                        <td className="px-5 py-4">
                                            <button onClick={() => router.patch(`/admin/projects/${project.id}/toggle-home`)} className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${project.show_in_home ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                                {project.show_in_home ? "Visible" : "Oculto"}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${project.is_active ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}>
                                                {project.is_active ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => router.visit(`/admin/projects/${project.id}/edit`)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-[#25A7CA] hover:text-[#25A7CA]">Editar</button>
                                                <button onClick={() => {
                                                    if (!window.confirm(`¿Eliminar el proyecto "${project.title}"?`)) return;
                                                    router.delete(`/admin/projects/${project.id}`);
                                                }} className="rounded-xl border border-red-100 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50">Eliminar</button>
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

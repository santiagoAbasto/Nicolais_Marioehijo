import AdminLayout from "@/Layouts/AdminLayout";
import ImageUploadField from "@/Components/Admin/ImageUploadField";
import { router, useForm } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function ClientTypeModal({ client, onClose }) {
    const isEdit = !!client;
    const { data, setData, post, processing, errors, reset } = useForm({
        name: client?.name || "",
        slug: client?.slug || "",
        icon: null,
        icon_width: client?.icon_width || "",
        icon_height: client?.icon_height || "",
        order: client?.order || "A",
        is_active: client?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();

        setData("slug", slugify(data.name));

        post(isEdit ? `/admin/client-types/${client.id}` : "/admin/client-types", {
            forceFormData: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h2 className="text-base font-semibold text-gray-800">
                        {isEdit ? "Editar tipo de cliente" : "Nuevo tipo de cliente"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icon icon="solar:close-circle-outline" width={20} />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-5 px-6 py-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Nombre</span>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setData("name", value);
                                    setData("slug", slugify(value));
                                }}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Orden</span>
                            <input
                                type="text"
                                value={data.order}
                                onChange={(event) => setData("order", event.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                            {errors.order && <p className="text-xs text-red-500">{errors.order}</p>}
                        </label>

                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(event) => setData("is_active", event.target.checked)}
                            />
                            <span className="text-sm font-medium text-slate-700">Visible en la web</span>
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Ancho del ícono</span>
                            <input
                                type="number"
                                value={data.icon_width}
                                onChange={(event) => setData("icon_width", event.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">Alto del ícono</span>
                            <input
                                type="number"
                                value={data.icon_height}
                                onChange={(event) => setData("icon_height", event.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                            />
                        </label>
                    </div>

                    <ImageUploadField
                        label="Ícono"
                        currentUrl={client?.icon_url || null}
                        onChange={(file) => setData("icon", file)}
                        specs={{ maxMB: 2, formats: ["PNG", "JPG", "WEBP"] }}
                        error={errors.icon}
                    />

                    <div className="flex justify-end gap-3 border-t border-gray-50 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-[#25A7CA] px-5 py-2 text-sm font-medium text-white hover:bg-[#1d96b8] disabled:opacity-60"
                        >
                            {processing ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear tipo"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ClientTypesIndex({ clients }) {
    const [search, setSearch] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [editClient, setEditClient] = useState(null);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return clients;

        return clients.filter((client) =>
            [client.name, client.slug]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query)),
        );
    }, [search, clients]);

    const destroy = (client) => {
        if (!window.confirm(`¿Eliminar "${client.name}"?`)) return;
        router.delete(`/admin/client-types/${client.id}`);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Tipos de cliente</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Administra los rubros o categorías que se muestran en la página de clientes.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <label className="relative min-w-[260px]">
                                <Icon icon="solar:magnifer-outline" width={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Buscar tipo de cliente"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </label>
                            <button
                                onClick={() => setCreateOpen(true)}
                                className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1d96b8]"
                            >
                                Nuevo tipo
                            </button>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-medium">Tipo</th>
                                    <th className="px-5 py-4 font-medium">Slug</th>
                                    <th className="px-5 py-4 font-medium">Orden</th>
                                    <th className="px-5 py-4 font-medium">Estado</th>
                                    <th className="px-5 py-4 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">
                                            No hay tipos de cliente para mostrar.
                                        </td>
                                    </tr>
                                )}

                                {filtered.map((client) => (
                                    <tr key={client.id} className="transition hover:bg-slate-50">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                                                    {client.icon_url ? (
                                                        <img src={client.icon_url} alt={client.name} className="max-h-8 max-w-8 object-contain" />
                                                    ) : (
                                                        <Icon icon="solar:buildings-outline" width={18} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{client.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500">{client.slug}</td>
                                        <td className="px-5 py-4 text-slate-500">{client.order}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${client.is_active ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}>
                                                {client.is_active ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditClient(client)}
                                                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-[#25A7CA] hover:text-[#25A7CA]"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => destroy(client)}
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

            {createOpen && <ClientTypeModal onClose={() => setCreateOpen(false)} />}
            {editClient && <ClientTypeModal client={editClient} onClose={() => setEditClient(null)} />}
        </AdminLayout>
    );
}

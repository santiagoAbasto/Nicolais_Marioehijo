import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

function Stat({ label, value }) {
    return (
        <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </article>
    );
}

function FileIcon() {
    return (
        <span className="flex h-[58px] w-[58px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#0072BB]">
            <Icon icon="solar:document-text-outline" width={30} />
        </span>
    );
}

function ClientSelector({ clients = [], value = [], onChange, error, compact = false }) {
    const selected = new Set((value || []).map((id) => Number(id)));
    const toggle = (clientId) => {
        const next = new Set(selected);

        if (next.has(clientId)) {
            next.delete(clientId);
        } else {
            next.add(clientId);
        }

        onChange(Array.from(next));
    };

    return (
        <div>
            <div className={`${compact ? "max-h-40" : "max-h-56"} overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-2`}>
                {clients.length ? (
                    clients.map((client) => (
                        <label
                            key={client.id}
                            className="mb-2 flex cursor-pointer items-start gap-3 rounded-xl bg-white px-3 py-2 text-sm transition last:mb-0 hover:bg-sky-50"
                        >
                            <input
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0072BB] focus:ring-[#0072BB]"
                                type="checkbox"
                                checked={selected.has(client.id)}
                                onChange={() => toggle(client.id)}
                            />
                            <span className="min-w-0">
                                <span className="block truncate font-semibold text-slate-900">{client.name}</span>
                                <span className="block truncate text-xs text-slate-500">
                                    {[client.company, client.email].filter(Boolean).join(" · ")}
                                </span>
                            </span>
                        </label>
                    ))
                ) : (
                    <p className="px-3 py-4 text-sm text-slate-500">No hay clientes aprobados para asignar.</p>
                )}
            </div>
            {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        </div>
    );
}

function PriceListRow({ file, clients = [] }) {
    const [editing, setEditing] = useState(false);
    const form = useForm({
        name: file.name || "",
        sort_code: file.sort_code || "A",
        is_active: Boolean(file.is_active),
        client_ids: file.client_ids || [],
    });
    const deleteForm = useForm({});

    const submit = (event) => {
        event.preventDefault();
        form.put(file.update_url, {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    const remove = () => {
        if (!window.confirm(`Eliminar ${file.name}?`)) {
            return;
        }

        deleteForm.delete(file.delete_url, { preserveScroll: true });
    };

    return (
        <tr className="border-t border-slate-100">
            <td className="px-5 py-4">
                <FileIcon />
            </td>
            <td className="px-5 py-4">
                {editing ? (
                    <div className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_minmax(320px,1fr)]">
                        <input
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                            value={form.data.name}
                            onChange={(event) => form.setData("name", event.target.value)}
                        />
                        <ClientSelector
                            clients={clients}
                            value={form.data.client_ids}
                            onChange={(next) => form.setData("client_ids", next)}
                            error={form.errors.client_ids}
                            compact
                        />
                    </div>
                ) : (
                    <div>
                        <p className="font-semibold text-slate-900">{file.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{file.original_name}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {(file.clients || []).length ? (
                                file.clients.map((client) => (
                                    <span key={client.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                        {client.name}
                                    </span>
                                ))
                            ) : (
                                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">Sin clientes asignados</span>
                            )}
                        </div>
                    </div>
                )}
            </td>
            <td className="px-5 py-4">
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-[#0072BB]">{file.format}</span>
            </td>
            <td className="px-5 py-4 text-sm text-slate-600">{file.size}</td>
            <td className="px-5 py-4">
                {editing ? (
                    <input
                        className="w-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        value={form.data.sort_code}
                        onChange={(event) => form.setData("sort_code", event.target.value.toUpperCase())}
                        placeholder="A"
                    />
                ) : (
                    <span className="text-sm font-semibold text-slate-700">{file.sort_code}</span>
                )}
            </td>
            <td className="px-5 py-4">
                {editing ? (
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                            className="h-4 w-4 rounded border-slate-300 text-[#0072BB] focus:ring-[#0072BB]"
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(event) => form.setData("is_active", event.target.checked)}
                        />
                        Visible
                    </label>
                ) : (
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${file.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {file.is_active ? "Activo" : "Oculto"}
                    </span>
                )}
            </td>
            <td className="px-5 py-4">
                <div className="flex flex-wrap justify-end gap-2">
                    {editing ? (
                        <>
                            <button
                                className="inline-flex items-center justify-center rounded-2xl bg-[#25A7CA] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                                type="button"
                                onClick={submit}
                                disabled={form.processing}
                            >
                                Guardar
                            </button>
                            <button
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                type="button"
                                onClick={() => setEditing(false)}
                            >
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <a className="inline-flex items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-semibold text-[#0072BB] transition hover:bg-sky-100" href={file.view_url} target="_blank" rel="noreferrer">
                                <Icon icon="solar:eye-outline" width={17} />
                                Ver
                            </a>
                            <a className="inline-flex items-center gap-2 rounded-2xl bg-[#0072BB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#005c96]" href={file.download_url}>
                                <Icon icon="solar:download-minimalistic-outline" width={17} />
                                Descargar
                            </a>
                            <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50" type="button" onClick={() => setEditing(true)}>
                                <Icon icon="solar:pen-outline" width={17} />
                                Editar
                            </button>
                            <button className="inline-flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100" type="button" onClick={remove} disabled={deleteForm.processing}>
                                <Icon icon="solar:trash-bin-trash-outline" width={17} />
                                Eliminar
                            </button>
                        </>
                    )}
                </div>
                {form.errors.name ? <p className="mt-2 text-xs text-red-600">{form.errors.name}</p> : null}
            </td>
        </tr>
    );
}

export default function ClientZonePriceLists({ files = [], clients = [], stats = {}, storeUrl }) {
    const createForm = useForm({
        name: "",
        file: null,
        sort_code: "A",
        is_active: true,
        client_ids: [],
    });

    const submit = (event) => {
        event.preventDefault();
        createForm.post(storeUrl, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => createForm.reset("name", "file", "sort_code", "client_ids"),
        });
    };

    return (
        <AdminLayout>
            <Head title="Zona Cliente - Lista de precios" />

            <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Zona Cliente</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Lista de precios</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                            Cargá archivos PDF o Excel visibles para los clientes dentro de la sección privada Lista de precios.
                        </p>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#25A7CA]/10 text-[#117a98]">
                        <Icon icon="solar:file-text-outline" width={28} />
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Stat label="Archivos" value={stats.total ?? files.length} />
                <Stat label="Activos" value={stats.active ?? 0} />
                <Stat label="PDF" value={stats.pdf ?? 0} />
                <Stat label="Excel" value={stats.excel ?? 0} />
            </section>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Nuevo archivo</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Subir lista de precios</h2>
                </div>

                <form className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_420px]" onSubmit={submit}>
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">Nombre</span>
                            <input
                                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                value={createForm.data.name}
                                onChange={(event) => createForm.setData("name", event.target.value)}
                                placeholder="Lista de precios - Abril 2026"
                            />
                            {createForm.errors.name ? <span className="mt-1 block text-xs text-red-600">{createForm.errors.name}</span> : null}
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">Archivo</span>
                            <input
                                className="h-12 w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#0072BB]"
                                type="file"
                                accept=".pdf,.xlsx,.xls,.csv"
                                onChange={(event) => createForm.setData("file", event.target.files?.[0] ?? null)}
                            />
                            {createForm.errors.file ? <span className="mt-1 block text-xs text-red-600">{createForm.errors.file}</span> : null}
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">Orden</span>
                            <input
                                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                value={createForm.data.sort_code}
                                onChange={(event) => createForm.setData("sort_code", event.target.value.toUpperCase())}
                                placeholder="A, AA, AB..."
                            />
                            {createForm.errors.sort_code ? <span className="mt-1 block text-xs text-red-600">{createForm.errors.sort_code}</span> : null}
                        </label>

                        <div className="flex items-end gap-3">
                            <label className="flex h-12 flex-1 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700">
                                <input
                                    className="h-4 w-4 rounded border-slate-300 text-[#0072BB] focus:ring-[#0072BB]"
                                    type="checkbox"
                                    checked={createForm.data.is_active}
                                    onChange={(event) => createForm.setData("is_active", event.target.checked)}
                                />
                                Visible
                            </label>
                            <button
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#25A7CA] px-5 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                type="submit"
                                disabled={createForm.processing}
                            >
                                <Icon icon="solar:upload-outline" width={18} />
                                Cargar
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Clientes habilitados</span>
                            <span className="text-xs font-semibold text-slate-400">{createForm.data.client_ids.length} seleccionados</span>
                        </div>
                        <ClientSelector
                            clients={clients}
                            value={createForm.data.client_ids}
                            onChange={(next) => createForm.setData("client_ids", next)}
                            error={createForm.errors.client_ids}
                        />
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-100 p-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Archivos disponibles</h2>
                        <p className="mt-1 text-sm text-slate-500">{files.length} listas cargadas</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[1100px] w-full text-left">
                        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                            <tr>
                                <th className="px-5 py-4">Archivo</th>
                                <th className="px-5 py-4">Nombre</th>
                                <th className="px-5 py-4">Formato</th>
                                <th className="px-5 py-4">Peso</th>
                                <th className="px-5 py-4">Orden</th>
                                <th className="px-5 py-4">Estado</th>
                                <th className="px-5 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {files.length ? (
                                files.map((file) => <PriceListRow key={file.id} file={file} clients={clients} />)
                            ) : (
                                <tr>
                                    <td className="px-5 py-8 text-center text-sm text-slate-500" colSpan={7}>
                                        Todavía no hay listas cargadas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </AdminLayout>
    );
}

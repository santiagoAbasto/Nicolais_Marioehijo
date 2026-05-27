import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm } from "@inertiajs/react";
import { Icon } from "@iconify/react";

const statuses = {
    pending: "Pendiente",
    invoiced: "Facturado",
    dispatched: "Despachado",
    delivered: "Entregado",
};

function fmt(value) {
    return value ? new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}

function money(value) {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(value || 0));
}

function Stat({ label, value }) {
    return (
        <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </article>
    );
}

function OrderAdminControls({ order }) {
    const { data, setData, patch, processing, recentlySuccessful } = useForm({
        status: order.status || "pending",
        delivered_at: order.delivered_date || "",
    });

    const submit = (event) => {
        event.preventDefault();
        patch(order.update_url, {
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={submit} className="grid gap-2 md:min-w-[320px]">
            <div className="grid gap-2 md:grid-cols-[150px_150px]">
                <label className="grid gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Estado</span>
                    <select
                        value={data.status}
                        onChange={(event) => setData("status", event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#25A7CA] focus:ring-2 focus:ring-[#25A7CA]/20"
                    >
                        {Object.entries(statuses).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </label>

                <label className="grid gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Fecha entrega</span>
                    <input
                        type="date"
                        value={data.delivered_at}
                        onChange={(event) => setData("delivered_at", event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#25A7CA] focus:ring-2 focus:ring-[#25A7CA]/20"
                    />
                </label>
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center rounded-xl bg-[#0072BB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#005f9d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? "Guardando..." : "Guardar cambios"}
                </button>
                {recentlySuccessful && <span className="text-xs font-semibold text-emerald-600">Guardado</span>}
            </div>
        </form>
    );
}

export default function ClientZoneOrders({ orders = [], stats = {} }) {
    return (
        <AdminLayout>
            <Head title="Zona Cliente - Carrito" />

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Zona Cliente</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Carrito y Pedidos</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">Pedidos generados desde el carrito privado de clientes, con vista online y PDF profesional.</p>
            </section>

            <div className="grid gap-4 md:grid-cols-4">
                <Stat label="Total" value={stats.total ?? 0} />
                <Stat label="Pendientes" value={stats.pending ?? 0} />
                <Stat label="Facturados" value={stats.invoiced ?? 0} />
                <Stat label="Entregados" value={stats.delivered ?? 0} />
            </div>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">Pedidos recibidos</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Pedido</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Items</th>
                                <th className="px-4 py-3">Importe</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3">Fecha entrega</th>
                                <th className="px-4 py-3">Gestión</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td className="px-4 py-4 font-semibold text-slate-900">{order.order_number}</td>
                                    <td className="px-4 py-4">
                                        <span className="block font-medium text-slate-800">{order.client || "-"}</span>
                                        <span className="block text-xs text-slate-500">{order.email}</span>
                                    </td>
                                    <td className="px-4 py-4 text-slate-500">{fmt(order.created_at)}</td>
                                    <td className="px-4 py-4 text-slate-600">{order.items_count}</td>
                                    <td className="px-4 py-4 font-semibold text-slate-900">{money(order.total)}</td>
                                    <td className="px-4 py-4">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{statuses[order.status] || order.status}</span>
                                    </td>
                                    <td className="px-4 py-4 text-slate-500">{order.delivered_at ? fmt(order.delivered_at) : "-"}</td>
                                    <td className="px-4 py-4">
                                        <OrderAdminControls order={order} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-end gap-2">
                                            <a href={order.show_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-2 text-xs font-semibold text-[#117a98]">
                                                <Icon icon="solar:eye-outline" width={16} />
                                                Ver online
                                            </a>
                                            <a href={order.pdf_url} className="inline-flex items-center gap-2 rounded-xl bg-[#0072BB] px-3 py-2 text-xs font-semibold text-white">
                                                <Icon icon="solar:download-minimalistic-outline" width={16} />
                                                PDF
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {orders.length === 0 && (
                                <tr>
                                    <td className="px-4 py-10 text-center text-slate-500" colSpan="9">Todavía no hay pedidos generados desde el carrito.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </AdminLayout>
    );
}

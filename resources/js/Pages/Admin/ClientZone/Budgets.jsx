import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import { Icon } from "@iconify/react";

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

export default function ClientZoneBudgets({ budgets = [], stats = {} }) {
    return (
        <AdminLayout>
            <Head title="Zona Cliente - Presupuesto" />

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Zona Cliente</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Presupuestos</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    Presupuestos guardados automáticamente cuando el cliente exporta o imprime. Si exporta e imprime el mismo presupuesto, se actualiza el mismo registro.
                </p>
            </section>

            <div className="grid gap-4 md:grid-cols-4">
                <Stat label="Presupuestos" value={stats.total ?? 0} />
                <Stat label="Productos" value={stats.products ?? 0} />
                <Stat label="Servicios" value={stats.services ?? 0} />
                <Stat label="Importe total" value={money(stats.amount ?? 0)} />
            </div>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">Presupuestos guardados</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Presupuesto</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Guardado</th>
                                <th className="px-4 py-3">Items</th>
                                <th className="px-4 py-3">Importe</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {budgets.map((budget) => (
                                <tr key={budget.id}>
                                    <td className="px-4 py-4 font-semibold text-slate-900">{budget.number}</td>
                                    <td className="px-4 py-4">
                                        <span className="block font-medium text-slate-800">{budget.client || "-"}</span>
                                        <span className="block text-xs text-slate-500">{budget.email}</span>
                                    </td>
                                    <td className="px-4 py-4 text-slate-500">{fmt(budget.updated_at || budget.created_at)}</td>
                                    <td className="px-4 py-4 text-slate-600">
                                        {budget.products_count} prod. · {budget.services_count} serv.
                                    </td>
                                    <td className="px-4 py-4 font-semibold text-slate-900">{money(budget.total)}</td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-end gap-2">
                                            <a href={budget.show_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-2 text-xs font-semibold text-[#117a98]">
                                                <Icon icon="solar:eye-outline" width={16} />
                                                Ver online
                                            </a>
                                            <a href={budget.pdf_url} className="inline-flex items-center gap-2 rounded-xl bg-[#0072BB] px-3 py-2 text-xs font-semibold text-white">
                                                <Icon icon="solar:download-minimalistic-outline" width={16} />
                                                PDF
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {budgets.length === 0 && (
                                <tr>
                                    <td className="px-4 py-10 text-center text-slate-500" colSpan="6">
                                        Todavía no hay presupuestos exportados o impresos por clientes.
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

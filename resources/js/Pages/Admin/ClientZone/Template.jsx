import AdminLayout from "@/Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import { Icon } from "@iconify/react";

const moduleNotes = {
    productos: "El catálogo, descuentos y productos vendidos se gestionan desde Productos de Zona Cliente.",
    carrito: "Los pedidos generados por clientes se administran desde Carrito y Pedidos.",
    presupuesto: "Los servicios del presupuesto los carga cada cliente desde su vista privada. No se administran servicios globales desde este panel.",
    pedidos: "Los pedidos se revisan desde el módulo Carrito y Pedidos.",
    "lista-de-precios": "Espacio reservado para la lista privada de precios.",
    "info-de-pagos": "Espacio reservado para información de pagos visible para clientes.",
    margenes: "Los márgenes son definidos por cada cliente desde su zona privada.",
};

export default function ClientZoneTemplate({ module, title }) {
    return (
        <AdminLayout>
            <Head title={`Zona Cliente - ${title}`} />

            <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Zona Cliente</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    {moduleNotes[module] ?? `Plantilla administrativa lista para desarrollar la gestión de ${title.toLowerCase()} dentro del área privada de clientes.`}
                </p>
            </section>

            <section className="grid gap-5 lg:grid-cols-3">
                {["Configuración", "Contenido visible", "Permisos"].map((item) => (
                    <article key={item} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]">
                            <Icon icon="solar:box-outline" width={21} />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">{item}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">Espacio reservado para los campos y reglas del módulo.</p>
                    </article>
                ))}
            </section>

            {module === "presupuesto" ? (
                <section className="rounded-[28px] border border-sky-100 bg-sky-50/70 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#117a98] shadow-sm">
                            <Icon icon="solar:clipboard-list-outline" width={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Servicios creados por el cliente</h2>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                                Este módulo no tiene carga administrativa de servicios. Cada cliente agrega servicios manualmente dentro de su Presupuesto, y esos ítems quedan solo en su presupuesto actual.
                            </p>
                        </div>
                    </div>
                </section>
            ) : null}
        </AdminLayout>
    );
}

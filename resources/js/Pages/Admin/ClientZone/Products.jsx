import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useMemo, useState } from "react";

function normalize(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function numberValue(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}

function money(value) {
    const number = numberValue(value);

    if (number === null) {
        return "-";
    }

    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(number);
}

function percent(value) {
    const number = numberValue(value);

    if (number === null) {
        return "-";
    }

    return `${new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(number)}%`;
}

function discountPrice(price, discountPercent) {
    const listPrice = numberValue(price);
    const percentValue = numberValue(discountPercent);

    if (listPrice === null || percentValue === null) {
        return null;
    }

    return Math.max(0, listPrice * (1 - percentValue / 100));
}

function Stat({ label, value }) {
    return (
        <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </article>
    );
}

export default function ClientZoneProducts({
    products = [],
    soldProducts = [],
    stats = {},
    catalogUrl = "/admin/productos",
    catalogImportUrl = "/admin/productos?tab=import",
}) {
    const [query, setQuery] = useState("");
    const [rows, setRows] = useState(products);
    const [savingIds, setSavingIds] = useState([]);
    const [globalDiscount, setGlobalDiscount] = useState("");
    const [savingGlobal, setSavingGlobal] = useState(false);

    const currentStats = useMemo(() => ({
        total: rows.length,
        active: rows.filter((product) => Boolean(product.is_active)).length,
        with_discount: rows.filter((product) => {
            const price = numberValue(product.price);
            const discount = numberValue(product.discount_price);

            return price !== null && price > 0 && discount !== null && discount < price;
        }).length,
    }), [rows]);

    const filteredProducts = useMemo(() => {
        const search = normalize(query);

        if (!search) {
            return rows;
        }

        return rows.filter((product) =>
            normalize([
                product.name,
                product.sku,
                product.brand,
                product.family_name,
                product.subfamily_name,
                product.original_code,
                product.equivalence_code,
                product.oem_code,
            ].filter(Boolean).join(" ")).includes(search),
        );
    }, [rows, query]);

    const updateLocalDiscount = (productId, value) => {
        setRows((current) =>
            current.map((product) => {
                if (product.id !== productId) {
                    return product;
                }

                return {
                    ...product,
                    discount_percent: value,
                    discount_price: discountPrice(product.price, value),
                };
            }),
        );
    };

    const saveDiscount = async (product) => {
        if (savingIds.includes(product.id)) {
            return;
        }

        setSavingIds((current) => [...current, product.id]);

        try {
            const response = await axios.patch(`/admin/zona-cliente/productos/${product.id}/descuento`, {
                discount_percent:
                    product.discount_percent === "" || product.discount_percent === null
                        ? null
                        : Number(product.discount_percent),
            });

            setRows((current) =>
                current.map((item) =>
                    item.id === product.id ? response.data.product : item,
                ),
            );
            emitAdminToast("Descuento actualizado para Zona Cliente.");
        } catch (error) {
            emitAdminToast(error?.response?.data?.message || "No se pudo actualizar el descuento.", "error");
        } finally {
            setSavingIds((current) => current.filter((id) => id !== product.id));
        }
    };

    const applyGlobalDiscount = async (event) => {
        event.preventDefault();

        if (savingGlobal) {
            return;
        }

        const value = globalDiscount === "" ? null : Number(globalDiscount);

        if (value !== null && (value < 0 || value > 100)) {
            emitAdminToast("El descuento global debe estar entre 0 y 100.", "error");
            return;
        }

        const message = value === null
            ? "¿Limpiar el descuento de todo el catálogo de Zona Cliente?"
            : `¿Aplicar ${globalDiscount}% de descuento a todo el catálogo de Zona Cliente?`;

        if (!window.confirm(message)) {
            return;
        }

        setSavingGlobal(true);

        try {
            const response = await axios.patch("/admin/zona-cliente/productos/descuento-global", {
                discount_percent: value,
            });

            setRows(response.data.products ?? []);
            emitAdminToast("Descuento global aplicado al catálogo.");
        } catch (error) {
            emitAdminToast(error?.response?.data?.message || "No se pudo aplicar el descuento global.", "error");
        } finally {
            setSavingGlobal(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Zona Cliente - Productos" />

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Zona Cliente</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Productos</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                            Listado de productos que alimenta la vista privada de clientes. El descuento lo maneja admin y el margen del cliente se aplica después sobre el precio venta.
                        </p>
                    </div>

                    <a
                        href={catalogImportUrl}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                    >
                        <Icon icon="solar:upload-outline" width={18} />
                        Importador masivo
                    </a>
                </div>
            </section>

            <div className="grid gap-4 md:grid-cols-3">
                <Stat label="Productos" value={stats.total ?? currentStats.total} />
                <Stat label="Activos" value={currentStats.active} />
                <Stat label="Con descuento" value={currentStats.with_discount} />
            </div>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Productos vendidos</p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900">Ventas en Zona Privada</h2>
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                            Este listado sale de los pedidos realizados por clientes. El importador masivo sigue estando en el icono padre Productos y Zona Cliente solo consume ese catálogo.
                        </p>
                    </div>

                    <a
                        href={catalogUrl}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                    >
                        <Icon icon="solar:pen-new-square-outline" width={18} />
                        Editar catálogo
                    </a>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
                    <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Producto</th>
                                <th className="px-4 py-3">Código</th>
                                <th className="px-4 py-3">Familia</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3 text-right">Cant. vendida</th>
                                <th className="px-4 py-3 text-right">Pedidos</th>
                                <th className="px-4 py-3 text-right">Importe</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {soldProducts.length ? soldProducts.map((product) => (
                                <tr key={`${product.product_id || product.code}-${product.description}`} className="align-top">
                                    <td className="px-4 py-4 font-semibold text-slate-900">{product.description || "-"}</td>
                                    <td className="px-4 py-4 text-slate-600">{product.code || "-"}</td>
                                    <td className="px-4 py-4 text-slate-600">{product.family || "-"}</td>
                                    <td className="px-4 py-4 text-slate-600">{product.type || "-"}</td>
                                    <td className="px-4 py-4 text-right text-slate-700">{product.total_quantity ?? 0}</td>
                                    <td className="px-4 py-4 text-right text-slate-700">{product.orders_count ?? 0}</td>
                                    <td className="px-4 py-4 text-right font-semibold text-slate-900">{money(product.total_amount)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={7}>
                                        Todavía no hay productos vendidos en Zona Privada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="rounded-[28px] border border-[#25A7CA]/20 bg-white p-5 shadow-sm">
                <form onSubmit={applyGlobalDiscount} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Descuento global</p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900">Aplicar a todo el catálogo</h2>
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                            Este porcentaje actualiza el precio con descuento de todos los productos. Los descuentos individuales pueden editarse después por fila.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label className="flex h-12 w-[150px] items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={globalDiscount}
                                onChange={(event) => setGlobalDiscount(event.target.value)}
                                placeholder="0"
                                className="h-full min-w-0 flex-1 border-0 px-4 text-right text-sm font-semibold text-[#308C05] outline-none"
                                aria-label="Descuento global"
                            />
                            <span className="border-l border-slate-200 px-3 text-sm font-semibold text-slate-400">%</span>
                        </label>

                        <button
                            type="submit"
                            disabled={savingGlobal}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#25A7CA] px-5 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-50"
                        >
                            <Icon icon="solar:check-circle-outline" width={18} />
                            {savingGlobal ? "Aplicando..." : "Aplicar global"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Listado Zona Cliente</h2>
                        <p className="mt-1 text-sm text-slate-500">{filteredProducts.length} de {rows.length} productos</p>
                    </div>

                    <label className="relative block w-full lg:w-[420px]">
                        <Icon
                            icon="solar:magnifer-outline"
                            width={20}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Buscar producto, marca, código, OEM..."
                            className="h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                    </label>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[1420px] divide-y divide-slate-100 text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Producto</th>
                                <th className="px-4 py-3">Familia</th>
                                <th className="px-4 py-3">Subfamilia</th>
                                <th className="px-4 py-3">SKU</th>
                                <th className="px-4 py-3">Marca</th>
                                <th className="px-4 py-3">Original</th>
                                <th className="px-4 py-3">Equivalencia</th>
                                <th className="px-4 py-3">OEM</th>
                                <th className="px-4 py-3 text-right">Precio lista</th>
                                <th className="px-4 py-3 text-right">Desc. (%)</th>
                                <th className="px-4 py-3 text-right">Precio con desc.</th>
                                <th className="px-4 py-3 text-right">Guardar</th>
                                <th className="px-4 py-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="align-top">
                                    <td className="px-4 py-4">
                                        <p className="font-semibold text-slate-900">{product.name}</p>
                                    </td>
                                    <td className="px-4 py-4 text-slate-600">{product.family_name || "-"}</td>
                                    <td className="px-4 py-4 text-slate-600">{product.subfamily_name || "-"}</td>
                                    <td className="px-4 py-4 text-slate-600">{product.sku || "-"}</td>
                                    <td className="px-4 py-4 text-slate-600">{product.brand || "-"}</td>
                                    <td className="px-4 py-4 text-slate-600">{product.original_code || "-"}</td>
                                    <td className="px-4 py-4 text-slate-600">{product.equivalence_code || "-"}</td>
                                    <td className="px-4 py-4 text-slate-600">{product.oem_code || "-"}</td>
                                    <td className="px-4 py-4 text-right text-slate-700">{money(product.price)}</td>
                                    <td className="px-4 py-4 text-right">
                                        <label className="ml-auto flex h-10 w-[104px] items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={product.discount_percent ?? ""}
                                                disabled={numberValue(product.price) === null}
                                                onChange={(event) => updateLocalDiscount(product.id, event.target.value)}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter") {
                                                        event.preventDefault();
                                                        saveDiscount(product);
                                                    }
                                                }}
                                                className="h-full min-w-0 flex-1 border-0 px-3 text-right text-sm font-semibold text-[#308C05] outline-none disabled:bg-slate-50 disabled:text-slate-300"
                                                aria-label={`Descuento de ${product.name}`}
                                            />
                                            <span className="border-l border-slate-200 px-2 text-xs font-semibold text-slate-400">%</span>
                                        </label>
                                    </td>
                                    <td className="px-4 py-4 text-right text-slate-700">{money(product.discount_price)}</td>
                                    <td className="px-4 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => saveDiscount(product)}
                                            disabled={savingIds.includes(product.id)}
                                            className="inline-flex h-10 items-center justify-center rounded-xl border border-[#25A7CA]/30 px-3 text-xs font-semibold text-[#117a98] transition hover:bg-[#25A7CA]/10 disabled:opacity-50"
                                        >
                                            {savingIds.includes(product.id) ? "..." : "Guardar"}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${product.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                            {product.is_active ? "Activo" : "Oculto"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!filteredProducts.length ? (
                    <div className="px-5 py-12 text-center text-sm text-slate-500">
                        No hay productos para mostrar.
                    </div>
                ) : null}
            </section>
        </AdminLayout>
    );
}

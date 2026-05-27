import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";

function money(value) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
    }).format(Number(value || 0));
}

function Stat({ label, value }) {
    return (
        <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </article>
    );
}

function statusClasses(status) {
    return {
        pending: "bg-amber-50 text-amber-700",
        verified: "bg-sky-50 text-sky-700",
        paid: "bg-emerald-50 text-emerald-700",
        rejected: "bg-red-50 text-red-700",
    }[status] || "bg-slate-100 text-slate-600";
}

function ReceiptRow({ receipt, statuses }) {
    const form = useForm({
        status: receipt.status,
        admin_notes: receipt.admin_notes || "",
    });
    const [editing, setEditing] = useState(false);

    const submit = (event) => {
        event.preventDefault();
        form.patch(receipt.update_url, {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    return (
        <tr className="border-t border-slate-100 align-top">
            <td className="px-5 py-4">
                <p className="font-semibold text-slate-900">{receipt.client}</p>
                <p className="text-xs text-slate-500">{[receipt.company, receipt.email].filter(Boolean).join(" · ")}</p>
            </td>
            <td className="px-5 py-4 text-sm text-slate-600">
                <p>{receipt.paid_at_label}</p>
                <p className="mt-1 font-semibold text-slate-900">{money(receipt.amount)}</p>
            </td>
            <td className="px-5 py-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{receipt.bank}</p>
                <p>Sucursal: {receipt.branch}</p>
                {receipt.invoices ? <p>Facturas: {receipt.invoices}</p> : null}
            </td>
            <td className="px-5 py-4">
                {editing ? (
                    <form className="grid min-w-[260px] gap-3" onSubmit={submit}>
                        <select
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                            value={form.data.status}
                            onChange={(event) => form.setData("status", event.target.value)}
                        >
                            {statuses.map((status) => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                        </select>
                        <textarea
                            className="min-h-20 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                            placeholder="Nota interna para seguimiento"
                            value={form.data.admin_notes}
                            onChange={(event) => form.setData("admin_notes", event.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                            <button className="rounded-2xl bg-[#25A7CA] px-4 py-2 text-sm font-semibold text-white" type="submit" disabled={form.processing}>
                                Guardar
                            </button>
                            <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600" type="button" onClick={() => setEditing(false)}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                ) : (
                    <div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClasses(receipt.status)}`}>
                            {receipt.status_label}
                        </span>
                        {receipt.admin_notes ? <p className="mt-2 max-w-[260px] text-sm text-slate-500">{receipt.admin_notes}</p> : null}
                        {receipt.reviewer ? <p className="mt-2 text-xs text-slate-400">Revisado por {receipt.reviewer}</p> : null}
                    </div>
                )}
            </td>
            <td className="px-5 py-4">
                <a className="inline-flex items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-semibold text-[#0072BB] transition hover:bg-sky-100" href={receipt.download_url}>
                    <Icon icon="solar:paperclip-rounded-outline" width={17} />
                    Archivo
                </a>
                <p className="mt-2 max-w-[180px] truncate text-xs text-slate-500">{receipt.attachment_name}</p>
                <p className="text-xs text-slate-400">{receipt.attachment_size}</p>
            </td>
            <td className="px-5 py-4 text-right">
                {!editing ? (
                    <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50" type="button" onClick={() => setEditing(true)}>
                        <Icon icon="solar:pen-outline" width={17} />
                        Revisar
                    </button>
                ) : null}
            </td>
        </tr>
    );
}

function ReceiptCard({ receipt, statuses }) {
    const form = useForm({
        status: receipt.status,
        admin_notes: receipt.admin_notes || "",
    });
    const [editing, setEditing] = useState(false);

    const submit = (event) => {
        event.preventDefault();
        form.patch(receipt.update_url, {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    return (
        <article className="min-w-[360px] max-w-[360px] rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="font-semibold text-slate-900">{receipt.client}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{[receipt.company, receipt.email].filter(Boolean).join(" · ")}</p>
                </div>
                <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusClasses(receipt.status)}`}>
                    {receipt.status_label}
                </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Fecha</p>
                    <p className="mt-1 font-medium text-slate-900">{receipt.paid_at_label}</p>
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Importe</p>
                    <p className="mt-1 font-semibold text-slate-900">{money(receipt.amount)}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Banco</p>
                    <p className="mt-1 font-medium text-slate-900">{receipt.bank} / {receipt.branch}</p>
                    {receipt.invoices ? <p className="mt-1 text-xs text-slate-500">Facturas: {receipt.invoices}</p> : null}
                </div>
            </div>

            {receipt.observations ? (
                <p className="mt-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                    <span className="font-semibold text-slate-900">Comentario cliente:</span> {receipt.observations}
                </p>
            ) : null}

            {editing ? (
                <form className="mt-4 grid gap-3" onSubmit={submit}>
                    <select
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        value={form.data.status}
                        onChange={(event) => form.setData("status", event.target.value)}
                    >
                        {statuses.map((status) => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                    </select>
                    <textarea
                        className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        placeholder="Observación visible para el cliente"
                        value={form.data.admin_notes}
                        onChange={(event) => form.setData("admin_notes", event.target.value)}
                    />
                    <div className="flex gap-2">
                        <button className="rounded-2xl bg-[#25A7CA] px-4 py-2 text-sm font-semibold text-white" type="submit" disabled={form.processing}>
                            Guardar
                        </button>
                        <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600" type="button" onClick={() => setEditing(false)}>
                            Cancelar
                        </button>
                    </div>
                </form>
            ) : (
                <div className="mt-4">
                    {receipt.admin_notes ? (
                        <p className="rounded-2xl bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-800">
                            <span className="font-semibold">Observación enviada:</span> {receipt.admin_notes}
                        </p>
                    ) : null}
                    {receipt.reviewer ? <p className="mt-2 text-xs text-slate-400">Revisado por {receipt.reviewer}</p> : null}
                </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <a className="inline-flex items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-semibold text-[#0072BB] transition hover:bg-sky-100" href={receipt.download_url}>
                    <Icon icon="solar:paperclip-rounded-outline" width={17} />
                    Archivo
                </a>
                {!editing ? (
                    <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50" type="button" onClick={() => setEditing(true)}>
                        <Icon icon="solar:pen-outline" width={17} />
                        Revisar
                    </button>
                ) : null}
            </div>
            <p className="mt-2 truncate text-xs text-slate-500">{receipt.attachment_name}</p>
        </article>
    );
}

export default function PaymentInfo({ settings = {}, receipts = [], statuses = [], stats = {}, settingsUrl }) {
    const settingsForm = useForm({
        bank_title: settings.bank_title || "",
        bank_details: settings.bank_details || "",
        terms_title: settings.terms_title || "",
        terms_details: settings.terms_details || "",
        receipt_note: settings.receipt_note || "",
    });

    const pendingReceipts = useMemo(() => receipts.filter((receipt) => receipt.status === "pending"), [receipts]);

    const saveSettings = (event) => {
        event.preventDefault();
        settingsForm.put(settingsUrl, { preserveScroll: true });
    };

    return (
        <AdminLayout theme="light">
            <Head title="Info de pagos | Zona Cliente" />

            <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0072BB]">Zona Cliente</p>
                        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Info de pagos</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                            Configurá las cuentas visibles para clientes y revisá cada comprobante recibido.
                        </p>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                        <Icon icon="solar:bell-bing-outline" width={18} />
                        {pendingReceipts.length} pendientes
                    </span>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
                <Stat label="Comprobantes" value={stats.total || 0} />
                <Stat label="Pendientes" value={stats.pending || 0} />
                <Stat label="Verificados" value={stats.verified || 0} />
                <Stat label="Pagados" value={stats.paid || 0} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(360px,0.9fr)_minmax(620px,1.2fr)]">
                <form className="rounded-[24px] border border-slate-200 bg-white shadow-sm" onSubmit={saveSettings}>
                    <div className="border-b border-slate-100 p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0072BB]">Configuración</p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900">Datos visibles para el cliente</h2>
                    </div>
                    <div className="grid gap-4 p-6">
                        {[
                            ["bank_title", "Título de cuentas"],
                            ["bank_details", "Datos bancarios"],
                            ["terms_title", "Título de condiciones"],
                            ["terms_details", "Condiciones de pago"],
                            ["receipt_note", "Nota del formulario"],
                        ].map(([field, label]) => (
                            <label key={field} className="grid gap-2 text-sm font-semibold text-slate-700">
                                {label}
                                {field.includes("details") || field === "receipt_note" ? (
                                    <textarea
                                        className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal leading-6 text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                        value={settingsForm.data[field]}
                                        onChange={(event) => settingsForm.setData(field, event.target.value)}
                                    />
                                ) : (
                                    <input
                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                        value={settingsForm.data[field]}
                                        onChange={(event) => settingsForm.setData(field, event.target.value)}
                                    />
                                )}
                                {settingsForm.errors[field] ? <span className="text-xs text-red-600">{settingsForm.errors[field]}</span> : null}
                            </label>
                        ))}
                        <button className="inline-flex h-12 w-fit items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 text-sm font-bold text-white transition hover:bg-[#1d96b8]" type="submit" disabled={settingsForm.processing}>
                            <Icon icon="solar:diskette-outline" width={18} />
                            Guardar información
                        </button>
                    </div>
                </form>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0072BB]">Comprobantes</p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900">Pagos recibidos</h2>
                    </div>
                    <p className="text-sm text-slate-500">Revisá estado, archivo y observaciones de cada pago.</p>
                </div>
                {receipts.length ? (
                    <div className="mt-6 flex gap-4 overflow-x-auto pb-3">
                        {receipts.map((receipt) => (
                            <ReceiptCard key={receipt.id} receipt={receipt} statuses={statuses} />
                        ))}
                    </div>
                ) : (
                    <p className="mt-6 rounded-2xl bg-slate-50 px-5 py-6 text-sm text-slate-500">Todavía no hay comprobantes cargados.</p>
                )}
            </section>
        </AdminLayout>
    );
}

import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";

const statuses = {
    pending: "Pendiente",
    approved: "Aprobado",
    rejected: "Rechazado",
    deactivated: "Dado de baja",
};

function fmt(value) {
    return value ? new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}

function Stat({ label, value }) {
    return (
        <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </article>
    );
}

function Detail({ label, value }) {
    return (
        <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</dt>
            <dd className="mt-1 break-words text-sm text-slate-700">{value || "-"}</dd>
        </div>
    );
}

function ConfirmDialog({ action, onClose, onConfirm }) {
    const open = Boolean(action);
    const isDanger = action?.tone === "danger";

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
                    <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isDanger ? "bg-red-50 text-red-600" : "bg-[#25A7CA]/10 text-[#117a98]"}`}>
                            <Icon icon={isDanger ? "solar:danger-triangle-outline" : "solar:shield-check-outline"} width={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold text-slate-900">{action?.title}</DialogTitle>
                            <p className="mt-2 text-sm leading-6 text-slate-500">{action?.description}</p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${isDanger ? "bg-red-600 hover:bg-red-700" : "bg-[#25A7CA] hover:bg-[#1d96b8]"}`}
                        >
                            {action?.confirmLabel || "Confirmar"}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}

export default function ClientZoneUsers({ requests = [], filters = {}, stats = {} }) {
    const [selected, setSelected] = useState(requests[0] ?? null);
    const [credentialsItem, setCredentialsItem] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmAction, setConfirmAction] = useState(null);
    const visibleSelected = useMemo(() => requests.find((item) => item.id === selected?.id) ?? requests[0] ?? null, [requests, selected]);

    const visitStatus = (status) => {
        router.visit(`/admin/zona-cliente/usuarios${status === "all" ? "" : `?status=${status}`}`, {
            preserveScroll: true,
        });
    };

    const approve = (item) => {
        setConfirmAction({
            title: "Aprobar solicitud",
            description: `Se aprobará a ${item.full_name} y se enviarán sus credenciales por correo.`,
            confirmLabel: "Aprobar",
            onConfirm: () => router.post(`/admin/zona-cliente/usuarios/${item.id}/aprobar`, {}, { preserveScroll: true }),
        });
    };

    const reject = (item) => {
        setConfirmAction({
            title: "Rechazar solicitud",
            description: `La solicitud de ${item.full_name} quedará rechazada y no podrá ingresar a Zona Cliente.`,
            confirmLabel: "Rechazar",
            tone: "danger",
            onConfirm: () => router.post(`/admin/zona-cliente/usuarios/${item.id}/rechazar`, {}, { preserveScroll: true }),
        });
    };

    const resetPassword = (item) => {
        setConfirmAction({
            title: "Reenviar credenciales",
            description: `Se generará una nueva contraseña y se enviará a ${item.email}.`,
            confirmLabel: "Reenviar",
            onConfirm: () => router.post(`/admin/zona-cliente/usuarios/${item.id}/restablecer`, {}, { preserveScroll: true }),
        });
    };

    const deactivate = (item) => {
        setConfirmAction({
            title: "Dar de baja usuario",
            description: `${item.full_name} no podrá ingresar a Zona Cliente hasta que administración lo reactive o apruebe nuevamente.`,
            confirmLabel: "Dar de baja",
            tone: "danger",
            onConfirm: () => router.post(`/admin/zona-cliente/usuarios/${item.id}/baja`, {}, { preserveScroll: true }),
        });
    };

    const openCredentials = (item) => {
        setNewPassword("");
        setCredentialsItem(item);
    };

    const updatePassword = (item) => {
        if (newPassword.trim().length < 8) {
            emitAdminToast("La nueva clave debe tener al menos 8 caracteres.", "error");
            return;
        }

        router.post(
            `/admin/zona-cliente/usuarios/${item.id}/actualizar-clave`,
            { password: newPassword.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCredentialsItem(null);
                    setNewPassword("");
                },
            },
        );
    };

    return (
        <AdminLayout>
            <Head title="Zona Cliente - Usuarios" />

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Zona Cliente</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Usuarios</h1>
                        <p className="mt-2 text-sm leading-6 text-slate-500">Aprobá o rechazá solicitudes y restablecé contraseñas de clientes.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {["all", "pending", "approved", "rejected", "deactivated"].map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => visitStatus(status)}
                                className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${filters.status === status ? "border-[#25A7CA] bg-[#25A7CA]/10 text-[#117a98]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                            >
                                {status === "all" ? "Todos" : statuses[status]}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <div className="grid gap-4 md:grid-cols-5">
                <Stat label="Total" value={stats.total ?? 0} />
                <Stat label="Pendientes" value={stats.pending ?? 0} />
                <Stat label="Aprobados" value={stats.approved ?? 0} />
                <Stat label="Rechazados" value={stats.rejected ?? 0} />
                <Stat label="Dados de baja" value={stats.deactivated ?? 0} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4">
                        <h2 className="text-lg font-semibold text-slate-900">Solicitudes recibidas</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-sm">
                            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                                <tr>
                                    <th className="px-4 py-3">Cliente</th>
                                    <th className="px-4 py-3">Empresa</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.map((item) => (
                                    <tr key={item.id} className={visibleSelected?.id === item.id ? "bg-sky-50/60" : "bg-white"}>
                                        <td className="px-4 py-4">
                                            <button type="button" onClick={() => setSelected(item)} className="text-left">
                                                <span className="block font-semibold text-slate-900">{item.full_name}</span>
                                                <span className="block text-xs text-slate-500">{item.email}</span>
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-slate-600">{item.company || "-"}</td>
                                        <td className="px-4 py-4">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{statuses[item.status]}</span>
                                        </td>
                                        <td className="px-4 py-4 text-slate-500">{fmt(item.created_at)}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-end gap-2">
                                                {item.status !== "approved" && (
                                                    <button type="button" onClick={() => approve(item)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Aprobar</button>
                                                )}
                                                {item.status !== "rejected" && item.status !== "deactivated" && (
                                                    <button type="button" onClick={() => reject(item)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">Rechazar</button>
                                                )}
                                                {item.status === "approved" && (
                                                    <button type="button" onClick={() => resetPassword(item)} className="rounded-xl border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-2 text-xs font-semibold text-[#117a98]">Reenviar credenciales</button>
                                                )}
                                                {item.status === "approved" && (
                                                    <button type="button" onClick={() => openCredentials(item)} className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">Ver Credenciales</button>
                                                )}
                                                {item.status === "approved" && (
                                                    <button type="button" onClick={() => deactivate(item)} className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">Dar de baja</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {requests.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-10 text-center text-slate-500" colSpan="5">No hay solicitudes para este filtro.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    {visibleSelected ? (
                        <>
                            <div className="mb-5 flex items-start gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]">
                                    <Icon icon="solar:users-group-rounded-outline" width={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">{visibleSelected.full_name}</h2>
                                    <p className="text-sm text-slate-500">{statuses[visibleSelected.status]}</p>
                                </div>
                            </div>

                            <dl className="grid gap-4">
                                <Detail label="Nombre" value={visibleSelected.first_name} />
                                <Detail label="Apellido" value={visibleSelected.last_name} />
                                <Detail label="Correo" value={visibleSelected.email} />
                                <Detail label="Teléfono" value={visibleSelected.phone} />
                                <Detail label="Empresa" value={visibleSelected.company} />
                                <Detail label="CUIT / DNI (opcional)" value={visibleSelected.tax_id} />
                                <Detail label="Mensaje" value={visibleSelected.message} />
                                <Detail label="Último envío de credenciales" value={fmt(visibleSelected.last_credentials_sent_at)} />
                                <Detail label="Fecha de baja" value={fmt(visibleSelected.deactivated_at)} />
                            </dl>
                        </>
                    ) : (
                        <p className="text-sm text-slate-500">Seleccioná una solicitud para ver todos los campos.</p>
                    )}
                </aside>
            </div>

            {credentialsItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8">
                    <section className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Zona Cliente</p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Credenciales</h2>
                                <p className="mt-1 text-sm text-slate-500">{credentialsItem.full_name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCredentialsItem(null)}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                                aria-label="Cerrar"
                            >
                                <Icon icon="solar:close-circle-outline" width={22} />
                            </button>
                        </div>

                        <dl className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <Detail label="Usuario" value={credentialsItem.user?.email || credentialsItem.email} />
                            <Detail label="Correo registrado" value={credentialsItem.email} />
                            <Detail label="Contraseña" value={credentialsItem.last_plain_password || "No hay una clave visible guardada. Generá o actualizá una nueva."} />
                            <Detail label="Último envío" value={fmt(credentialsItem.last_credentials_sent_at)} />
                        </dl>

                        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                            <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400" htmlFor="client-zone-new-password">
                                Actualizar clave
                            </label>
                            <input
                                id="client-zone-new-password"
                                type="text"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                placeholder="Nueva clave del cliente"
                                autoComplete="off"
                            />
                            <p className="mt-2 text-xs leading-5 text-slate-500">Al actualizarla, se enviará por correo al cliente y quedará visible acá para administración.</p>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setCredentialsItem(null)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                            >
                                Cerrar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    resetPassword(credentialsItem);
                                }}
                                className="rounded-xl bg-[#25A7CA] px-4 py-2 text-sm font-semibold text-white"
                            >
                                Reenviar credenciales
                            </button>
                            <button
                                type="button"
                                onClick={() => updatePassword(credentialsItem)}
                                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                            >
                                Actualizar clave
                            </button>
                        </div>
                    </section>
                </div>
            )}

            <ConfirmDialog
                action={confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={() => {
                    confirmAction?.onConfirm?.();
                    setConfirmAction(null);
                    if (credentialsItem) {
                        setCredentialsItem(null);
                        setNewPassword("");
                    }
                }}
            />
        </AdminLayout>
    );
}

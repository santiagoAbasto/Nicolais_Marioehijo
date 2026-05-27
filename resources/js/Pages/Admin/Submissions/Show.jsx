import AdminLayout from "@/Layouts/AdminLayout";
import { router } from "@inertiajs/react";
import { Icon } from "@iconify/react";

export default function SubmissionShow({ submission, backUrl }) {
    const fields = submission?.fields ?? [];

    const formatDate = (value) => {
        if (!value) return "-";

        return new Intl.DateTimeFormat("es-AR", {
            dateStyle: "full",
            timeStyle: "short",
        }).format(new Date(value));
    };

    const destroy = () => {
        if (!window.confirm("¿Eliminar esta solicitud?")) return;

        router.delete(`/admin/submissions/${submission.id}`, {
            onSuccess: () => router.visit(backUrl || "/admin/submissions"),
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-3">
                            <button
                                onClick={() => router.visit(backUrl || "/admin/submissions")}
                                className="mt-1 rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:border-[#25A7CA] hover:text-[#25A7CA]"
                            >
                                <Icon icon="solar:arrow-left-outline" width={18} />
                            </button>
                            <div>
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">
                                        {submission.type_label}
                                    </span>
                                    {!submission.is_read && (
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                            Nueva
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                                    Solicitud #{submission.id}
                                </h1>
                                <p className="mt-2 text-sm text-slate-500">
                                    Recibida el {formatDate(submission.created_at)}
                                </p>
                                {(submission.contact_name || submission.contact_email) && (
                                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                                        {submission.contact_name && (
                                            <span className="rounded-full bg-slate-100 px-3 py-1">{submission.contact_name}</span>
                                        )}
                                        {submission.contact_email && (
                                            <span className="rounded-full bg-slate-100 px-3 py-1">{submission.contact_email}</span>
                                        )}
                                        {submission.contact_phone && (
                                            <span className="rounded-full bg-slate-100 px-3 py-1">{submission.contact_phone}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {submission.reply_url && (
                                <a
                                    href={submission.reply_url}
                                    className="rounded-2xl border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-4 py-2.5 text-sm font-medium text-[#25A7CA] transition hover:bg-[#25A7CA]/15"
                                >
                                    Responder por correo
                                </a>
                            )}
                            {!submission.is_read && (
                                <button
                                    onClick={() => router.patch(`/admin/submissions/${submission.id}/read`)}
                                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                                >
                                    Marcar como leída
                                </button>
                            )}
                            <button
                                onClick={destroy}
                                className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),320px]">
                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 text-lg font-semibold text-slate-900">Datos capturados</h2>
                        <div className="space-y-4">
                            {fields.length === 0 && (
                                <p className="text-sm text-slate-500">No se registraron campos para esta solicitud.</p>
                            )}

                            {fields.map((field) => (
                                <div key={field.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{field.label}</p>
                                    <div className="whitespace-pre-wrap break-words text-sm text-slate-700">{field.value}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Gestión rápida
                            </h2>
                            <dl className="space-y-4 text-sm">
                                <div>
                                    <dt className="font-medium text-slate-500">Tipo</dt>
                                    <dd className="mt-1 text-slate-800">{submission.type_label}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">Estado</dt>
                                    <dd className="mt-1 text-slate-800">{submission.is_read ? "Leída" : "Nueva"}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">Referencia</dt>
                                    <dd className="mt-1 text-slate-800">{submission.subject ?? "Sin referencia"}</dd>
                                </div>
                                {submission.reply_email && (
                                    <div>
                                        <dt className="font-medium text-slate-500">Correo para responder</dt>
                                        <dd className="mt-1 break-all text-slate-800">{submission.reply_email}</dd>
                                    </div>
                                )}
                            </dl>
                        </section>

                        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Contexto técnico
                            </h2>
                            <dl className="space-y-4 text-sm">
                                <div>
                                    <dt className="font-medium text-slate-500">IP</dt>
                                    <dd className="mt-1 break-all text-slate-800">{submission.ip ?? "-"}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">User Agent</dt>
                                    <dd className="mt-1 break-words text-slate-800">{submission.user_agent ?? "-"}</dd>
                                </div>
                            </dl>
                        </section>
                    </aside>
                </div>
            </div>
        </AdminLayout>
    );
}

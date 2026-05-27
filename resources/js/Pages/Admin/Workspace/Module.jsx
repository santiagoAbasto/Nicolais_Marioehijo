import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";

function Bullet({ text }) {
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#25A7CA]/10 text-[#117a98]">
                <Icon icon="solar:check-circle-bold" width={14} />
            </div>
            <p className="text-sm leading-6 text-slate-600">{text}</p>
        </div>
    );
}

function ActionCard({ card }) {
    return (
        <button
            type="button"
            onClick={() => router.visit(card.href)}
            className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#25A7CA]/35 hover:shadow-md"
        >
            <div className="flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-slate-900">{card.title}</p>
                {card.status ? (
                    <span className="rounded-full bg-[#25A7CA]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#117a98]">
                        {card.status}
                    </span>
                ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">{card.description}</p>
        </button>
    );
}

export default function Module({ title, eyebrow, description, bullets = [], cards = [] }) {
    return (
        <AdminLayout>
            <Head title={title} />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.18),_transparent_34%),linear-gradient(135deg,#ffffff_0%,#f6f9fb_48%,#eef8fb_100%)] px-6 py-8 md:px-8">
                        <div className="max-w-4xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                <Icon icon="solar:folder-open-outline" width={14} />
                                {eyebrow}
                            </div>
                            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                {title}
                            </h1>
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                                {description}
                            </p>
                        </div>
                    </div>
                </section>

                {cards.length > 0 ? (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Área preparada
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Estos frentes ya quedaron ubicados para construir el CRUD sin volver a reordenar el panel.
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]">
                                <Icon icon="solar:widget-2-outline" width={20} />
                            </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            {cards.map((card) => (
                                <ActionCard key={card.href} card={card} />
                            ))}
                        </div>
                    </section>
                ) : null}

                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">Estado actual</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        El módulo quedó estable dentro del nuevo panel y listo para seguir con la implementación real.
                    </p>

                    <div className="mt-5 space-y-3">
                        {bullets.map((bullet) => (
                            <Bullet key={bullet} text={bullet} />
                        ))}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

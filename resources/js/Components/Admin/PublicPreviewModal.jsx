import { Icon } from "@iconify/react";

export default function PublicPreviewModal({
    open,
    title = "Vista pública",
    url,
    onClose,
}) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4">
            <button
                type="button"
                aria-label="Cerrar vista previa"
                className="absolute inset-0"
                onClick={onClose}
            />

            <div className="relative z-[121] flex h-[min(88vh,920px)] w-full max-w-[1380px] flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.3)]">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Vista previa
                        </p>
                        <h3 className="text-base font-semibold text-slate-900">
                            {title}
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                        aria-label="Cerrar"
                    >
                        <Icon icon="solar:close-circle-outline" width={20} />
                    </button>
                </div>

                <iframe
                    src={url}
                    title={title}
                    className="min-h-0 w-full flex-1 bg-white"
                />
            </div>
        </div>
    );
}

export default function TablePagination({
    page,
    total,
    perPage,
    onPageChange,
    itemLabel = "registros",
}) {
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const start = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const end = Math.min(total, currentPage * perPage);

    const rawPages = [1, currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2, totalPages]
        .filter((value) => value >= 1 && value <= totalPages);
    const pages = [...new Set(rawPages)].sort((left, right) => left - right);

    const goToPage = (nextPage) => {
        onPageChange(Math.min(Math.max(nextPage, 1), totalPages));
    };

    if (total === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-semibold text-slate-900">{start}-{end}</span> de{" "}
                <span className="font-semibold text-slate-900">{total}</span> {itemLabel}
            </p>

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#25A7CA] hover:text-[#117a98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Anterior
                </button>

                {pages.map((pageNumber, index) => (
                    <span key={pageNumber} className="flex items-center gap-2">
                        {index > 0 && pageNumber - pages[index - 1] > 1 ? (
                            <span className="px-1 text-xs font-semibold text-slate-300">...</span>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => goToPage(pageNumber)}
                            className={`h-9 min-w-9 rounded-xl px-3 text-xs font-semibold transition ${
                                pageNumber === currentPage
                                    ? "bg-[#25A7CA] text-white shadow-sm"
                                    : "border border-slate-200 text-slate-600 hover:border-[#25A7CA] hover:text-[#117a98]"
                            }`}
                            aria-current={pageNumber === currentPage ? "page" : undefined}
                        >
                            {pageNumber}
                        </button>
                    </span>
                ))}

                <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#25A7CA] hover:text-[#117a98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
}

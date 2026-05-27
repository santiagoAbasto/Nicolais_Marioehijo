import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useRef, useState } from "react";

const hasValue = (value) => {
    if (typeof value === "string") {
        return value.trim().length > 0;
    }

    return Boolean(value);
};

const hasAnySeoData = (page) =>
    hasValue(page.title) ||
    hasValue(page.description) ||
    hasValue(page.keywords) ||
    hasValue(page.og_image_url);

const isSeoConfigured = (page) =>
    hasValue(page.title) &&
    hasValue(page.description) &&
    hasValue(page.keywords);

function SeoChecklist({ page }) {
    const checks = [
        {
            label: "Título cargado",
            done: hasValue(page.title),
        },
        {
            label: "Descripción cargada",
            done: hasValue(page.description),
        },
        {
            label: "Palabras clave cargadas",
            done: hasValue(page.keywords),
        },
        {
            label: "Imagen social",
            done: hasValue(page.og_image_url),
            optional: true,
        },
    ];

    return (
        <div className="grid gap-2 sm:grid-cols-2">
            {checks.map((item) => (
                <div
                    key={item.label}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs ${
                        item.done
                            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                            : item.optional
                                ? "border-slate-200 bg-slate-50 text-slate-500"
                                : "border-amber-100 bg-amber-50 text-amber-700"
                    }`}
                >
                    <Icon
                        icon={item.done ? "solar:check-circle-bold" : "solar:close-circle-outline"}
                        width={14}
                    />
                    <span>{item.label}</span>
                    {item.optional && !item.done ? (
                        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                            Opcional
                        </span>
                    ) : null}
                </div>
            ))}
        </div>
    );
}

function MetaForm({ page }) {
    const [open, setOpen] = useState(false);
    const fileInputRef = useRef(null);
    const { data, setData, post, processing, errors, transform } = useForm({
        page: page.key,
        title: page.title || "",
        description: page.description || "",
        keywords: page.keywords || "",
        og_image: null,
        remove_og_image: false,
    });
    const [previewOg, setPreviewOg] = useState(page.og_image_url || null);

    const submitPayload = (payload, { closeOnSuccess = true } = {}) => {
        const identity = (current) => current;

        transform(() => payload);
        post("/admin/metadatos", {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                transform(identity);

                if (closeOnSuccess) {
                    setOpen(false);
                }
            },
            onFinish: () => transform(identity),
        });
    };

    const submit = (event) => {
        event.preventDefault();
        submitPayload(data);
    };

    const clearSelectedImage = () => {
        setPreviewOg(null);
        setData((current) => ({
            ...current,
            og_image: null,
            remove_og_image: true,
        }));

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const clearSection = () => {
        const clearedData = {
            page: page.key,
            title: "",
            description: "",
            keywords: "",
            og_image: null,
            remove_og_image: true,
        };

        setPreviewOg(null);
        setData(clearedData);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        submitPayload(clearedData);
    };

    const isConfigured = isSeoConfigured(page);
    const hasPartialData = hasAnySeoData(page);
    const statusTone = isConfigured
        ? "bg-emerald-500"
        : hasPartialData
            ? "bg-amber-400"
            : "bg-slate-300";
    const statusBadgeClass = isConfigured
        ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
        : hasPartialData
            ? "border border-amber-100 bg-amber-50 text-amber-700"
            : "border border-slate-200 bg-slate-50 text-slate-500";
    const statusLabel = isConfigured
        ? "Configurado"
        : hasPartialData
            ? "Incompleto"
            : "Sin configurar";
    const statusSummary = isConfigured
        ? page.title
        : hasPartialData
            ? "Faltan completar campos importantes"
            : "Todavía no se cargó SEO en esta página";

    return (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50/80"
            >
                <div className="min-w-0 flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusTone}`} />
                    <span className="truncate text-sm font-semibold text-slate-800">
                        {page.label}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass}`}>
                        {statusLabel}
                    </span>
                    <span className="hidden truncate text-xs text-slate-400 sm:block">
                        {statusSummary}
                    </span>
                </div>

                <Icon
                    icon={open ? "solar:alt-arrow-up-outline" : "solar:alt-arrow-down-outline"}
                    width={18}
                    className="shrink-0 text-slate-400"
                />
            </button>

            {open ? (
                <form onSubmit={submit} className="space-y-5 border-t border-slate-100 px-5 py-5">
                    <div className="rounded-[24px] border border-[#25A7CA]/15 bg-[#25A7CA]/5 p-4">
                        <p className="text-sm font-semibold text-slate-800">
                            Enfoque recomendado para {page.label}
                        </p>
                        <div className="mt-3 grid gap-3 lg:grid-cols-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    Título
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                    {page.recommended_title}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    Descripción
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                    {page.recommended_description}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    Palabras clave
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                    {page.recommended_keywords}
                                </p>
                            </div>
                        </div>
                    </div>

                    <SeoChecklist
                        page={{
                            ...page,
                            title: data.title,
                            description: data.description,
                            keywords: data.keywords,
                            og_image_url: previewOg,
                        }}
                    />

                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                            Título de la página
                        </label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(event) => setData("title", event.target.value)}
                            maxLength={160}
                            placeholder={`Ej: ${page.label} | Nicolais Mario e Hijo`}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#25A7CA] focus:ring-2 focus:ring-[#25A7CA]/20"
                        />
                        <div className="mt-1 flex items-start justify-between gap-3">
                            <p className="text-xs leading-relaxed text-slate-400">
                                Es el texto azul que normalmente muestra Google. Intentá que explique bien la página y no pase de 60 letras.
                            </p>
                            <span className={`shrink-0 text-xs ${data.title.length > 60 ? "text-amber-500" : "text-slate-300"}`}>
                                {data.title.length}/60
                            </span>
                        </div>
                        {errors.title ? <p className="mt-1 text-xs text-red-500">{errors.title}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                            Descripción
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(event) => setData("description", event.target.value)}
                            maxLength={320}
                            rows={4}
                            placeholder="Explicá brevemente qué va a encontrar una persona en esta página y por qué le sirve."
                            className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#25A7CA] focus:ring-2 focus:ring-[#25A7CA]/20"
                        />
                        <div className="mt-1 flex items-start justify-between gap-3">
                            <p className="text-xs leading-relaxed text-slate-400">
                                Este texto suele aparecer debajo del título en Google. Lo ideal es entre 120 y 160 letras, claro y directo.
                            </p>
                            <span className={`shrink-0 text-xs ${data.description.length > 160 ? "text-amber-500" : "text-slate-300"}`}>
                                {data.description.length}/160
                            </span>
                        </div>
                        {errors.description ? <p className="mt-1 text-xs text-red-500">{errors.description}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                            Palabras clave
                        </label>
                        <input
                            type="text"
                            value={data.keywords}
                            onChange={(event) => setData("keywords", event.target.value)}
                            maxLength={500}
                            placeholder="productos, industria, soluciones, calidad, fabricación"
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#25A7CA] focus:ring-2 focus:ring-[#25A7CA]/20"
                        />
                        <div className="mt-1 flex items-start justify-between gap-3">
                            <p className="text-xs leading-relaxed text-slate-400">
                                Separalas con comas. Usá palabras que realmente buscaría un cliente para llegar a esta página.
                            </p>
                            <span className={`shrink-0 text-xs ${data.keywords.length > 400 ? "text-amber-500" : "text-slate-300"}`}>
                                {data.keywords.length}/500
                            </span>
                        </div>
                        {errors.keywords ? <p className="mt-1 text-xs text-red-500">{errors.keywords}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                            Imagen para compartir
                        </label>

                        {previewOg ? (
                            <div className="mb-3 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 p-3">
                                <img
                                    src={previewOg}
                                    className="h-32 w-full rounded-[18px] object-cover"
                                    alt={`Vista previa SEO de ${page.label}`}
                                />
                                <p className="mt-2 text-xs text-slate-400">
                                    Esta imagen se usa cuando comparten el link en WhatsApp, LinkedIn o Facebook.
                                </p>
                            </div>
                        ) : null}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;

                                if (!file) {
                                    return;
                                }

                                setData((current) => ({
                                    ...current,
                                    og_image: file,
                                    remove_og_image: false,
                                }));
                                setPreviewOg(URL.createObjectURL(file));
                            }}
                            className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#117a98]"
                        />

                        <div className="mt-2 flex items-center justify-between gap-3">
                            <p className="text-xs leading-relaxed text-slate-400">
                                Tamaño ideal: 1200 x 630 px. Si no cargás imagen, la página igual funciona, pero se comparte menos atractiva.
                            </p>
                            {previewOg ? (
                                <button
                                    type="button"
                                    onClick={clearSelectedImage}
                                    className="shrink-0 text-xs font-semibold text-red-500 transition hover:text-red-600"
                                >
                                    Quitar imagen
                                </button>
                            ) : null}
                        </div>
                        {errors.og_image ? <p className="mt-1 text-xs text-red-500">{errors.og_image}</p> : null}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={clearSection}
                            disabled={processing}
                            className="rounded-2xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-60"
                        >
                            Limpiar esta sección
                        </button>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                            >
                                {processing ? (
                                    <>
                                        <Icon icon="svg-spinners:ring-resize" width={14} />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="solar:check-circle-outline" width={16} />
                                        Guardar SEO
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            ) : null}
        </div>
    );
}

export default function SeoIndex({ pages = [], summary = {} }) {
    const configured = pages.filter(isSeoConfigured).length;
    const incomplete = pages.filter((page) => hasAnySeoData(page) && !isSeoConfigured(page)).length;
    const socialReady = Number(summary.social_ready_pages || 0);

    return (
        <AdminLayout>
            <Head title="SEO de la web" />

            <div className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">
                        SEO de la web
                    </h1>
                    <p className="mt-1 max-w-3xl text-sm text-slate-500">
                        Desde acá definís cómo se ve cada página en Google y cuando alguien comparte un link por WhatsApp o redes. Si una sección está completa, se marca en verde.
                    </p>
                </div>

                <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]">
                                <Icon icon="solar:chart-2-outline" width={22} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Estado general del SEO
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    {configured} de {pages.length} páginas ya están listas.
                                    {incomplete > 0 ? ` ${incomplete} todavía están incompletas.` : " No quedan secciones a medio hacer."}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${pages.length ? (configured / pages.length) * 100 : 0}%` }}
                            />
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                            <Icon icon="solar:check-circle-bold" width={16} />
                            Cuándo queda bien configurado
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-emerald-700">
                            Una sección pasa a verde cuando tiene título, descripción y palabras clave. La imagen para compartir suma mucho, pero la dejamos opcional para no trabar la carga.
                        </p>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Páginas con imagen social</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-900">{socialReady}</p>
                        <p className="mt-2 text-sm text-slate-500">
                            Son las que ya van a verse mejor cuando se compartan por WhatsApp, LinkedIn o Facebook.
                        </p>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Dirección del sitio</p>
                        <p className="mt-3 break-all text-sm font-semibold text-slate-900">{summary.public_base_url || "-"}</p>
                        <p className="mt-2 text-sm text-slate-500">
                            Es la dirección principal que Google y las redes usan para reconocer los enlaces de la web.
                        </p>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Respaldo visual al compartir</p>
                        <p className="mt-3 text-sm font-semibold text-slate-900">
                            {summary.default_share_image ? "Logo / imagen por defecto detectada" : "Sin imagen de respaldo detectada"}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                            Si una página no tiene imagen propia, se usa esta base para que el link no viaje vacío.
                        </p>
                    </div>
                </div>

                <div className="mb-6 overflow-hidden rounded-[30px] border border-[#0072BB]/15 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-[linear-gradient(135deg,rgba(0,114,187,.08),rgba(255,255,255,.95))] p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0072BB]">
                            SEO profesional guiado
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-950">
                            Qué estás cargando y para qué sirve
                        </h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            Cada sección tiene una recomendación propia. Esta guía te ayuda a entender el impacto de cada campo para que la web se vea mejor en Google, WhatsApp, Facebook, LinkedIn y buscadores.
                        </p>
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                        {[
                            {
                                icon: "solar:document-text-outline",
                                title: "Título SEO",
                                body: "Es el título que Google muestra como resultado principal. Conviene que diga qué sección es y mencione la marca o el rubro.",
                            },
                            {
                                icon: "solar:text-field-focus-outline",
                                title: "Descripción",
                                body: "Es el resumen debajo del título en buscadores. Debe explicar con claridad qué encuentra el usuario y por qué le sirve.",
                            },
                            {
                                icon: "solar:hashtag-outline",
                                title: "Palabras clave",
                                body: "Ayudan a ordenar intención y lenguaje comercial. Usá términos reales: productos, marcas, códigos, autopartes, transmisión.",
                            },
                            {
                                icon: "solar:gallery-wide-outline",
                                title: "Imagen social",
                                body: "Es opcional, pero mejora cómo se ve el link al compartirlo. Ideal 1200 x 630 px con marca y producto visibles.",
                            },
                        ].map((item) => (
                            <article key={item.title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#0072BB] shadow-sm">
                                    <Icon icon={item.icon} width={18} />
                                </div>
                                <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                            </article>
                        ))}
                    </div>

                    <div className="grid gap-4 border-t border-slate-100 bg-slate-50/70 p-5 lg:grid-cols-3">
                        <div className="rounded-[22px] border border-white bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0072BB]">Google</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Usá títulos claros y descripciones completas para que cada página tenga más chances de aparecer con un resultado entendible.
                            </p>
                        </div>
                        <div className="rounded-[22px] border border-white bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0072BB]">Redes y WhatsApp</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                El título, la descripción y la imagen social definen cómo se ve el enlace cuando alguien lo comparte.
                            </p>
                        </div>
                        <div className="rounded-[22px] border border-white bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0072BB]">Contenido útil</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Escribí pensando en lo que busca el cliente: producto, marca, código, servicio, ubicación o necesidad concreta.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {pages.map((page) => (
                        <MetaForm key={page.key} page={page} />
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}

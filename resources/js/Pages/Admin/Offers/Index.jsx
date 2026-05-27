import PublicPreviewModal from "@/Components/Admin/PublicPreviewModal";
import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router, useForm } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function emptyOffer() {
    return {
        id: null,
        title: "",
        slug: "",
        description: "",
        badge_text: "",
        media_id: null,
        media_url: "",
        image_file: null,
        sort_order: "A",
        is_active: true,
        grade_product_ids: [],
        product_variant_ids: [],
    };
}

function offerToForm(offer) {
    return {
        id: offer.id,
        title: offer.title ?? "",
        slug: offer.slug ?? "",
        description: offer.description ?? "",
        badge_text: offer.badge_text ?? "",
        media_id: offer.media_id ?? null,
        media_url: offer.media_url ?? "",
        image_file: null,
        sort_order: offer.sort_order ?? "A",
        is_active: offer.is_active ?? true,
        grade_product_ids: offer.grade_product_ids ?? [],
        product_variant_ids: offer.product_variant_ids ?? [],
    };
}

async function uploadAsset(file, title) {
    const payload = new FormData();
    payload.append("file", file);
    payload.append("title", title || file.name);

    const response = await axios.post("/admin/api/media-assets", payload, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
}

function Field({ label, hint = null, children }) {
    return (
        <div className="space-y-2">
            <div>
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
            </div>
            {children}
        </div>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                checked
                    ? "border-[#25A7CA]/30 bg-[#25A7CA]/10 text-[#117a98]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
        >
            <span className={`flex h-6 w-10 items-center rounded-full p-1 transition ${checked ? "bg-[#25A7CA]" : "bg-slate-300"}`}>
                <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-4" : "translate-x-0"}`} />
            </span>
            {label}
        </button>
    );
}

function StatCard({ label, value, icon }) {
    return (
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]">
                    <Icon icon={icon} width={22} />
                </div>
            </div>
        </article>
    );
}

function ProductAssignment({ products, selectedProductIds, selectedVariantIds, onProductsChange, onVariantsChange }) {
    const [query, setQuery] = useState("");
    const [lineFilter, setLineFilter] = useState("all");
    const [expandedIds, setExpandedIds] = useState([]);
    const [scope, setScope] = useState("offers");
    const selectedProductSet = useMemo(() => new Set(selectedProductIds), [selectedProductIds]);
    const selectedVariantSet = useMemo(() => new Set(selectedVariantIds), [selectedVariantIds]);
    const expandedSet = useMemo(() => new Set(expandedIds), [expandedIds]);

    const lines = useMemo(() => {
        return Array.from(new Set(products.map((product) => product.line).filter(Boolean))).sort();
    }, [products]);

    function variantsForProduct(product, currentScope = "all") {
        const variants = product.variants ?? [];

        if (currentScope === "offers") {
            return variants.filter((variant) => variant.is_offer);
        }

        return variants;
    }

    function variantIdsForProduct(product, currentScope = "all") {
        return variantsForProduct(product, currentScope).map((variant) => variant.id);
    }

    function allVariantIdsForProduct(product) {
        return variantIdsForProduct(product, "all");
    }

    const scopedProducts = useMemo(() => {
        if (scope === "offers") {
            return products.filter((product) => product.offer_variants_count > 0);
        }

        return products;
    }, [products, scope]);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();

        return scopedProducts.filter((product) => {
            const lineMatches = lineFilter === "all" || product.line === lineFilter;
            const text = [
                product.label,
                product.shape,
                product.grade,
                product.series,
                product.line,
                product.family,
                product.shape_family,
            ].filter(Boolean).join(" ").toLowerCase();

            return lineMatches && (needle === "" || text.includes(needle));
        });
    }, [scopedProducts, query, lineFilter]);

    function hasAnySelectedVariant(product) {
        return allVariantIdsForProduct(product).some((id) => selectedVariantSet.has(id));
    }

    function selectedScopedVariantIds(product) {
        return variantIdsForProduct(product, scope).filter((id) => selectedVariantSet.has(id));
    }

    function isOfferGroupSelected(product) {
        const scopedIds = variantIdsForProduct(product, "offers");

        return scopedIds.length > 0 && scopedIds.every((id) => selectedVariantSet.has(id));
    }

    function isAllGroupSelected(product) {
        return selectedProductSet.has(product.id) && !hasAnySelectedVariant(product);
    }

    const visibleIds = filtered.map((product) => product.id);
    const visibleVariantIds = filtered.flatMap((product) => variantIdsForProduct(product, scope));
    const selectedVisibleCount = filtered.filter((product) => {
        return scope === "offers" ? isOfferGroupSelected(product) || selectedScopedVariantIds(product).length > 0 : selectedProductSet.has(product.id);
    }).length;

    function toggleProduct(product) {
        const scopedVariantIds = variantIdsForProduct(product, scope);
        const allVariantIds = allVariantIdsForProduct(product);

        if (scope === "offers") {
            const nextVariants = new Set(selectedVariantIds);
            const allSelected = scopedVariantIds.length > 0 && scopedVariantIds.every((id) => nextVariants.has(id));

            if (allSelected) {
                scopedVariantIds.forEach((id) => nextVariants.delete(id));
            } else {
                scopedVariantIds.forEach((id) => nextVariants.add(id));
            }

            const hasAnyRemainingForProduct = allVariantIds.some((id) => nextVariants.has(id));
            const nextProducts = new Set(selectedProductIds);

            if (hasAnyRemainingForProduct) {
                nextProducts.add(product.id);
            } else {
                nextProducts.delete(product.id);
            }

            onProductsChange(Array.from(nextProducts));
            onVariantsChange(Array.from(nextVariants));
            return;
        }

        const nextProducts = new Set(selectedProductIds);
        const nextVariants = new Set(selectedVariantIds);
        const currentlyAllSelected = isAllGroupSelected(product);

        if (currentlyAllSelected) {
            nextProducts.delete(product.id);
            allVariantIds.forEach((id) => nextVariants.delete(id));
        } else {
            nextProducts.add(product.id);
            allVariantIds.forEach((id) => nextVariants.delete(id));
            setExpandedIds((current) => current.filter((id) => id !== product.id));
        }

        onProductsChange(Array.from(nextProducts));
        onVariantsChange(Array.from(nextVariants));
    }

    function toggleVariant(product, variantId) {
        const nextVariants = new Set(selectedVariantIds);
        const nextProducts = new Set(selectedProductIds);
        const allVariantIds = allVariantIdsForProduct(product);

        if (nextVariants.has(variantId)) {
            nextVariants.delete(variantId);
        } else {
            nextVariants.add(variantId);
        }

        const hasAnyRemainingForProduct = allVariantIds.some((id) => nextVariants.has(id));

        if (hasAnyRemainingForProduct) {
            nextProducts.add(product.id);
        } else {
            nextProducts.delete(product.id);
        }

        onProductsChange(Array.from(nextProducts));
        onVariantsChange(Array.from(nextVariants));
    }

    function toggleMeasures(productId) {
        setExpandedIds((current) =>
            current.includes(productId)
                ? current.filter((id) => id !== productId)
                : [...current, productId],
        );
    }

    function selectVisible() {
        const nextProducts = new Set(selectedProductIds);
        const nextVariants = new Set(selectedVariantIds);

        if (scope === "offers") {
            filtered.forEach((product) => {
                nextProducts.add(product.id);
                variantIdsForProduct(product, "offers").forEach((id) => nextVariants.add(id));
            });
        } else {
            filtered.forEach((product) => {
                nextProducts.add(product.id);
                allVariantIdsForProduct(product).forEach((id) => nextVariants.delete(id));
            });
        }

        onProductsChange(Array.from(nextProducts));
        onVariantsChange(Array.from(nextVariants));
    }

    function clearVisible() {
        const visible = new Set(visibleIds);
        const visibleVariants = new Set(visibleVariantIds);

        onProductsChange(selectedProductIds.filter((id) => !visible.has(id)));
        onVariantsChange(selectedVariantIds.filter((id) => !visibleVariants.has(id)));
        setExpandedIds((current) => current.filter((id) => !visible.has(id)));
    }

    return (
        <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-900">Productos disponibles en stock</p>
                    <p className="mt-1 text-xs text-slate-500">
                        `Ofertas` muestra solo variantes marcadas con X en Oferta. `Todos` muestra todo el stock activo. Las variantes con `No publicar` siguen disponibles acá para armar ofertas internas sin soltarlas a la web pública.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setScope("offers")}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${scope === "offers" ? "bg-[#25A7CA] text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-[#25A7CA] hover:text-[#117a98]"}`}
                    >
                        Ofertas
                    </button>
                    <button
                        type="button"
                        onClick={() => setScope("all")}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${scope === "all" ? "bg-[#25A7CA] text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-[#25A7CA] hover:text-[#117a98]"}`}
                    >
                        Todos
                    </button>
                    <button type="button" onClick={selectVisible} disabled={filtered.length === 0} className="rounded-xl bg-[#25A7CA] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
                        Seleccionar visibles
                    </button>
                    <button type="button" onClick={clearVisible} disabled={selectedVisibleCount === 0} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40">
                        Limpiar visibles
                    </button>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_240px]">
                <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar por grado, forma, familia o línea..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                />
                <select
                    value={lineFilter}
                    onChange={(event) => setLineFilter(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                >
                    <option value="all">Todas las líneas</option>
                    {lines.map((line) => <option key={line} value={line}>{line}</option>)}
                </select>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">{selectedProductIds.length} forma{selectedProductIds.length !== 1 ? "s" : ""}</span>
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">{selectedVariantIds.length} medida{selectedVariantIds.length !== 1 ? "s" : ""} específica{selectedVariantIds.length !== 1 ? "s" : ""}</span>
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">{scope === "offers" ? "Modo ofertas" : "Modo todos"}</span>
                <span>{filtered.length} visible{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="mt-4 max-h-[430px] overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                        No hay productos para ese filtro.
                    </p>
                ) : (
                    <div className="grid gap-2 lg:grid-cols-2">
                        {filtered.map((product) => {
                            const checked = selectedProductSet.has(product.id);
                            const hasSpecificMeasures = selectedScopedVariantIds(product).length > 0;
                            const scopeVariants = variantsForProduct(product, scope);
                            const fullOfferSelected = scope === "offers" && isOfferGroupSelected(product);
                            const allGroupSelected = scope === "all" ? isAllGroupSelected(product) : fullOfferSelected;
                            const expanded = expandedSet.has(product.id) && !allGroupSelected;
                            const selectedMeasuresCount = selectedScopedVariantIds(product).length;

                            return (
                                <article
                                    key={product.id}
                                    className={`rounded-2xl border bg-white p-3 text-sm transition ${
                                        checked || hasSpecificMeasures
                                            ? "border-[#25A7CA]/45 shadow-sm ring-4 ring-[#25A7CA]/10"
                                            : "border-slate-200 hover:border-[#25A7CA]/30"
                                    }`}
                                >
                                    <label className="flex cursor-pointer items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={allGroupSelected}
                                            onChange={() => toggleProduct(product)}
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-semibold text-slate-900">{product.grade}</span>
                                            <span className="mt-0.5 block text-slate-700">{product.shape}</span>
                                            <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                                <span>{[product.line, product.series].filter(Boolean).join(" / ")}</span>
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">
                                                    {product.active_variants_count} medida{product.active_variants_count !== 1 ? "s" : ""}
                                                </span>
                                                <span className="rounded-full bg-[#25A7CA]/10 px-2 py-0.5 font-semibold text-[#117a98]">
                                                    {product.offer_variants_count} oferta{product.offer_variants_count !== 1 ? "s" : ""}
                                                </span>
                                                {product.public_variants_count < product.active_variants_count ? (
                                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                                                        {product.active_variants_count - product.public_variants_count} no publica{product.active_variants_count - product.public_variants_count !== 1 ? "s" : ""}
                                                    </span>
                                                ) : null}
                                                {hasSpecificMeasures && !allGroupSelected ? (
                                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                                                        {selectedMeasuresCount} elegida{selectedMeasuresCount !== 1 ? "s" : ""}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </span>
                                    </label>

                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${allGroupSelected ? "bg-[#25A7CA]/10 text-[#117a98]" : hasSpecificMeasures ? "bg-amber-50 text-amber-700" : "bg-white text-slate-400"}`}>
                                            {allGroupSelected
                                                ? scope === "offers" ? "Oferta completa" : "Forma completa"
                                                : hasSpecificMeasures ? "Medidas personalizadas" : "Sin elegir"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => toggleMeasures(product.id)}
                                            disabled={scopeVariants.length === 0}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#25A7CA] hover:text-[#117a98] disabled:cursor-not-allowed disabled:opacity-45"
                                        >
                                            <Icon icon={expanded ? "solar:alt-arrow-up-outline" : "solar:alt-arrow-down-outline"} width={14} />
                                            {expanded ? "Ocultar medidas" : scope === "offers" ? "Elegir ofertas" : "Elegir medidas"}
                                        </button>
                                    </div>

                                    {expanded ? (
                                        <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                            <div className="grid gap-1.5 sm:grid-cols-2">
                                                {scopeVariants.map((variant) => {
                                                    const variantChecked = selectedVariantSet.has(variant.id);

                                                    return (
                                                        <label
                                                            key={variant.id}
                                                            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-xs transition ${
                                                                variantChecked
                                                                    ? "border-[#25A7CA]/30 bg-white font-semibold text-[#117a98]"
                                                                    : "border-slate-200 bg-white/70 text-slate-600 hover:bg-white"
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={variantChecked}
                                                                onChange={() => toggleVariant(product, variant.id)}
                                                                className="h-3.5 w-3.5 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
                                                            />
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold">
                                                                    {variant.dimension || variant.description || "Sin medida"}
                                                                </span>
                                                                <span className="mt-1 flex flex-wrap gap-1">
                                                                    {variant.is_offer ? (
                                                                        <span className="rounded-full bg-[#25A7CA]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#117a98]">
                                                                            Oferta
                                                                        </span>
                                                                    ) : null}
                                                                    {!variant.is_public_visible ? (
                                                                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                                                                            No publicar
                                                                        </span>
                                                                    ) : null}
                                                                </span>
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : null}
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}

export default function OffersIndex({ hero, offers = [], assignableProducts = [], stats = {}, publicOffersUrl }) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [heroSaving, setHeroSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [heroForm, setHeroForm] = useState({
        id: hero?.id ?? null,
        title: hero?.title ?? "Ofertas",
        media_id: hero?.media_id ?? null,
        media_url: hero?.media_url ?? "",
        image_file: null,
        sort_order: hero?.sort_order ?? "A",
        is_active: hero?.is_active ?? true,
    });
    const offerForm = useForm(emptyOffer());

    useEffect(() => {
        setHeroForm({
            id: hero?.id ?? null,
            title: hero?.title ?? "Ofertas",
            media_id: hero?.media_id ?? null,
            media_url: hero?.media_url ?? "",
            image_file: null,
            sort_order: hero?.sort_order ?? "A",
            is_active: hero?.is_active ?? true,
        });
    }, [hero]);

    function startCreate() {
        setEditingId(null);
        offerForm.setData(emptyOffer());
        offerForm.clearErrors();
    }

    function startEdit(offer) {
        setEditingId(offer.id);
        offerForm.setData(offerToForm(offer));
        offerForm.clearErrors();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function saveHero() {
        setHeroSaving(true);

        try {
            let mediaId = heroForm.media_id;

            if (heroForm.image_file) {
                const uploaded = await uploadAsset(heroForm.image_file, heroForm.title || "Ofertas banner");
                mediaId = uploaded.id;
            }

            await axios.put(`/admin/api/site-sections/${heroForm.id}`, {
                page_key: "ofertas",
                section_key: "offers_banner",
                title: heroForm.title || "Ofertas",
                media_id: mediaId,
                sort_order: heroForm.sort_order || "A",
                is_active: heroForm.is_active,
                field_values: [],
                items: [],
            });

            emitAdminToast("El banner de ofertas se actualizó correctamente.");
            router.reload();
        } catch (error) {
            emitAdminToast(error?.response?.data?.message || "No se pudo guardar el banner de ofertas.", "error");
        } finally {
            setHeroSaving(false);
        }
    }

    async function submitOffer() {
        try {
            let mediaId = offerForm.data.media_id;

            if (offerForm.data.image_file) {
                const uploaded = await uploadAsset(offerForm.data.image_file, offerForm.data.title || "Oferta");
                mediaId = uploaded.id;
            }

            offerForm.transform((data) => ({ ...data, media_id: mediaId, image_file: null }));

            const options = {
                preserveScroll: true,
                onSuccess: () => {
                    startCreate();
                    router.reload({ only: ["offers", "stats"] });
                },
            };

            if (editingId) {
                offerForm.put(`/admin/ofertas/${editingId}`, options);
            } else {
                offerForm.post("/admin/ofertas", options);
            }
        } catch (error) {
            emitAdminToast(error?.response?.data?.message || "No se pudo subir la imagen de la oferta.", "error");
        } finally {
            offerForm.transform((data) => data);
        }
    }

    function destroyOffer(offer) {
        if (!confirm(`¿Eliminar la oferta "${offer.title}"?`)) return;
        router.delete(`/admin/ofertas/${offer.id}`, { preserveScroll: true });
    }

    return (
        <AdminLayout>
            <Head title="Ofertas" />

            <PublicPreviewModal open={previewOpen} title="Vista pública de Ofertas" url={publicOffersUrl} onClose={() => setPreviewOpen(false)} />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.16),_transparent_34%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_44%,#eef7fb_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    <Icon icon="solar:tag-price-outline" width={14} />
                                    Ofertas
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Gestión de ofertas
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                    Creá cards públicos con imagen, descripción y productos de stock asignados desde el Excel. La asignación no duplica productos: solo muestra el stock activo existente.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPreviewOpen(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                            >
                                <Icon icon="solar:square-arrow-right-up-outline" width={18} />
                                Ver página pública
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <StatCard label="Ofertas" value={stats.offers ?? offers.length} icon="solar:tag-outline" />
                    <StatCard label="Activas" value={stats.active_offers ?? offers.filter((offer) => offer.is_active).length} icon="solar:check-circle-outline" />
                    <StatCard label="Stock asignable" value={stats.assignable_products ?? assignableProducts.length} icon="solar:box-outline" />
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <div className="space-y-6">
                        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold text-slate-900">Banner de /ofertas</h2>
                                <p className="mt-2 text-sm text-slate-500">Usa la misma mecánica visual del slug calidad.</p>
                            </div>
                            <div className="space-y-5">
                                <Field label="Título">
                                    <input
                                        value={heroForm.title}
                                        onChange={(event) => setHeroForm((current) => ({ ...current, title: event.target.value }))}
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    />
                                </Field>
                                <Field label="Imagen del banner">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => setHeroForm((current) => ({ ...current, image_file: event.target.files?.[0] ?? null }))}
                                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98]"
                                    />
                                    <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
                                        <p className="text-sm font-semibold text-amber-950">
                                            Recomendado: banner 1366 x 227 px · imagen entre
                                            2 y 4 MB · JPG, PNG o WEBP.
                                        </p>
                                    </div>
                                    {heroForm.media_url ? <img src={heroForm.media_url} alt={heroForm.title || "Ofertas"} className="mt-3 h-48 w-full rounded-2xl border border-slate-200 object-cover" /> : null}
                                </Field>
                                <div className="flex items-center justify-between gap-3">
                                    <Toggle label="Banner activo" checked={heroForm.is_active} onChange={(value) => setHeroForm((current) => ({ ...current, is_active: value }))} />
                                    <button type="button" onClick={saveHero} disabled={heroSaving} className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition hover:bg-[#1f8da8] disabled:opacity-60">
                                        <Icon icon="solar:diskette-outline" width={18} />
                                        {heroSaving ? "Guardando..." : "Guardar banner"}
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900">Cards creados</h2>
                                    <p className="mt-2 text-sm text-slate-500">Ordená con el campo orden y activá solo lo público.</p>
                                </div>
                                <button type="button" onClick={startCreate} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#25A7CA] hover:text-[#117a98]">
                                    Nuevo
                                </button>
                            </div>
                            <div className="space-y-3">
                                {offers.length === 0 ? (
                                    <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                                        Todavía no hay ofertas.
                                    </p>
                                ) : offers.map((offer) => (
                                    <article key={offer.id} className={`rounded-2xl border p-3 transition ${editingId === offer.id ? "border-[#25A7CA]/40 bg-[#25A7CA]/5" : "border-slate-200 bg-white"}`}>
                                        <div className="flex gap-3">
                                            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                                {offer.media_url ? <img src={offer.media_url} alt={offer.title} className="h-full w-full object-cover" /> : null}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{offer.title}</p>
                                                        <p className="mt-1 text-xs text-slate-500">{offer.grade_products_count} producto{offer.grade_products_count !== 1 ? "s" : ""} · Orden {offer.sort_order}</p>
                                                    </div>
                                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${offer.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                                        {offer.is_active ? "Activa" : "Inactiva"}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => startEdit(offer)} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[#25A7CA] hover:text-[#117a98]">
                                                        Editar
                                                    </button>
                                                    <button type="button" onClick={() => destroyOffer(offer)} className="rounded-xl border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    </div>

                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">{editingId ? "Editar oferta" : "Nueva oferta"}</h2>
                                <p className="mt-2 text-sm text-slate-500">El card público muestra imagen y título; el detalle muestra la descripción y el stock asignado.</p>
                            </div>
                            {editingId ? (
                                <button type="button" onClick={startCreate} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                                    Cancelar edición
                                </button>
                            ) : null}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Nombre">
                                <input
                                    value={offerForm.data.title}
                                    onChange={(event) => {
                                        const nextTitle = event.target.value;
                                        offerForm.setData((data) => ({
                                            ...data,
                                            title: nextTitle,
                                            slug: slugify(nextTitle),
                                        }));
                                    }}
                                    placeholder="Ej: Atmosféricos"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>
                            <Field label="Badge" hint="Ej: -30%. Opcional.">
                                <input
                                    value={offerForm.data.badge_text}
                                    onChange={(event) => offerForm.setData("badge_text", event.target.value)}
                                    placeholder="-30%"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>
                            <Field label="Orden" hint="Usá letras: A, AA, AB, AC... AZ, B, BA, BB.">
                                <input
                                    value={offerForm.data.sort_order}
                                    onChange={(event) => offerForm.setData("sort_order", event.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                                    placeholder="A"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>
                            <div className="md:col-span-2">
                                <Field label="Descripción">
                                    <textarea
                                        value={offerForm.data.description}
                                        onChange={(event) => offerForm.setData("description", event.target.value)}
                                        placeholder="Detalle que se verá al abrir Más info..."
                                        className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                    />
                                </Field>
                            </div>
                            <div className="md:col-span-2">
                                <Field label="Imagen del card">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => offerForm.setData("image_file", event.target.files?.[0] ?? null)}
                                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98]"
                                    />
                                    <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
                                        <p className="text-sm font-semibold text-amber-950">
                                            Recomendado: imagen 392 x 240 px · entre
                                            2 y 4 MB · JPG, PNG o WEBP.
                                        </p>
                                    </div>
                                    {offerForm.data.media_url ? <img src={offerForm.data.media_url} alt={offerForm.data.title || "Oferta"} className="mt-3 h-56 w-full rounded-2xl border border-slate-200 object-cover" /> : null}
                                </Field>
                            </div>
                            <div className="md:col-span-2">
                                <Toggle label="Oferta activa" checked={offerForm.data.is_active} onChange={(value) => offerForm.setData("is_active", value)} />
                            </div>
                        </div>

                        <div className="mt-6">
                            <ProductAssignment
                                products={assignableProducts}
                                selectedProductIds={offerForm.data.grade_product_ids}
                                selectedVariantIds={offerForm.data.product_variant_ids}
                                onProductsChange={(ids) => offerForm.setData("grade_product_ids", ids)}
                                onVariantsChange={(ids) => offerForm.setData("product_variant_ids", ids)}
                            />
                        </div>

                        {Object.keys(offerForm.errors).length > 0 ? (
                            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {Object.values(offerForm.errors).map((error, index) => <p key={index}>{error}</p>)}
                            </div>
                        ) : null}

                        <div className="mt-6 flex justify-end">
                            <button type="button" onClick={submitOffer} disabled={offerForm.processing} className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition hover:bg-[#1f8da8] disabled:opacity-60">
                                <Icon icon="solar:diskette-outline" width={18} />
                                {offerForm.processing ? "Guardando..." : editingId ? "Guardar cambios" : "Crear oferta"}
                            </button>
                        </div>
                    </section>
                </section>
            </div>
        </AdminLayout>
    );
}

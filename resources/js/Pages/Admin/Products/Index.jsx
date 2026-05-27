import PublicPreviewModal from "@/Components/Admin/PublicPreviewModal";
import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";

function mediaUrlFromAsset(asset) {
    if (!asset?.path) {
        return "";
    }

    return `/media/${asset.path}`;
}

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function normalizeSearch(value) {
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

function formatMoney(value) {
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

function formatPercent(value) {
    const number = numberValue(value);

    if (number === null) {
        return "";
    }

    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(number);
}

function discountPercentFromPrices(price, discountPrice) {
    const listPrice = numberValue(price);
    const discounted = numberValue(discountPrice);

    if (!listPrice || discounted === null) {
        return "";
    }

    return Math.max(0, (1 - discounted / listPrice) * 100).toFixed(2);
}

function discountPriceFromPercent(price, discountPercent) {
    const listPrice = numberValue(price);
    const percent = numberValue(discountPercent);

    if (listPrice === null || percent === null) {
        return "";
    }

    return Math.max(0, listPrice * (1 - percent / 100)).toFixed(2);
}

function emptyHeroForm(hero) {
    return {
        id: hero?.id ?? null,
        title: hero?.title ?? "",
        media_id: hero?.media_id ?? null,
        media_url: hero?.media_url ?? "",
        image_file: null,
        is_active: !!hero?.is_active,
        sort_order: hero?.sort_order ?? "A",
    };
}

function emptyFamilyForm(family = null) {
    return {
        id: family?.id ?? null,
        name: family?.name ?? "",
        slug: family?.slug ?? "",
        description: family?.description ?? "",
        cover_media_id: family?.cover_media_id ?? null,
        cover_media_url: family?.cover_media_url ?? "",
        cover_file: null,
        accent_color: family?.accent_color ?? "",
        sort_order: family?.sort_order ?? "A",
        is_active: family?.is_active ?? true,
        show_on_products_page: family?.show_on_products_page ?? true,
        show_on_home: family?.show_on_home ?? false,
    };
}

function emptySubfamilyForm(subfamily = null) {
    return {
        id: subfamily?.id ?? null,
        product_family_id: subfamily?.product_family_id ?? "",
        name: subfamily?.name ?? "",
        slug: subfamily?.slug ?? "",
        short_description: subfamily?.short_description ?? "",
        description: subfamily?.description ?? "",
        accent_color: subfamily?.accent_color ?? "",
        sort_order: subfamily?.sort_order ?? "A",
        is_active: subfamily?.is_active ?? true,
        show_on_home: subfamily?.show_on_home ?? false,
        show_on_family_page: subfamily?.show_on_family_page ?? true,
    };
}

function emptySpecTable() {
    return {
        title: "",
        columns: [{ label: "", unit: "" }],
        rows: [{ values: [""] }],
    };
}

function emptyProductForm(product = null) {
    return {
        id: product?.id ?? null,
        product_family_id: product?.product_family_id ?? "",
        product_subfamily_id: product?.product_subfamily_id ?? "",
        name: product?.name ?? "",
        slug: product?.slug ?? "",
        sku: product?.sku ?? "",
        brand: product?.brand ?? "",
        original_code: product?.original_code ?? "",
        equivalence_code: product?.equivalence_code ?? "",
        oem_code: product?.oem_code ?? "",
        short_description: product?.short_description ?? "",
        description: product?.description ?? "",
        applications: product?.applications ?? "",
        material: product?.material ?? "",
        treatment: product?.treatment ?? "",
        observations: product?.observations ?? "",
        price: product?.price ?? "",
        discount_price: product?.discount_price ?? "",
        discount_percent:
            product?.discount_percent ??
            discountPercentFromPrices(product?.price, product?.discount_price),
        main_media_id: product?.main_media_id ?? null,
        main_media_url: product?.main_media_url ?? "",
        main_media_file: null,
        technical_sheet_media_id: product?.technical_sheet_media_id ?? null,
        technical_sheet_url: product?.technical_sheet_url ?? "",
        technical_sheet_file: null,
        sort_order: product?.sort_order ?? "A",
        is_active: product?.is_active ?? true,
        is_featured_home: product?.is_featured_home ?? false,
        is_featured_family: product?.is_featured_family ?? false,
        gallery: product?.gallery ?? [],
        related_product_ids: product?.related_product_ids ?? [],
        spec_tables: product?.spec_tables?.length ? product.spec_tables : [emptySpecTable()],
    };
}

function mapProductDetails(product) {
    const specTableRows = product?.spec_tables ?? product?.specTables ?? [];
    const mainMedia = product?.main_media ?? product?.mainMedia;
    const technicalSheet = product?.technical_sheet ?? product?.technicalSheet;
    const relatedProducts = product?.related_products ?? product?.relatedProducts ?? [];

    const specTables = specTableRows.map((table) => {
        const columns = [...(table.columns ?? [])].sort((left, right) =>
            String(left.sort_order || "").localeCompare(String(right.sort_order || "")),
        );
        const rows = [...(table.rows ?? [])].sort((left, right) =>
            String(left.sort_order || "").localeCompare(String(right.sort_order || "")),
        );

        return {
            title: table.title ?? "",
            columns: columns.map((column) => ({
                label: column.label ?? "",
                unit: column.unit ?? "",
            })),
            rows: rows.map((row) => {
                const valuesByColumn = new Map(
                    (row.values ?? []).map((value) => [
                        value.product_spec_column_id ?? value.column?.id,
                        value.value ?? "",
                    ]),
                );

                return {
                    values: columns.map((column) => valuesByColumn.get(column.id) ?? ""),
                };
            }),
        };
    });

    return emptyProductForm({
        ...product,
        main_media_url: mediaUrlFromAsset(mainMedia),
        technical_sheet_url: mediaUrlFromAsset(technicalSheet),
        gallery: (product?.media ?? []).map((item) => ({
            media_id: item.media_id,
            url: mediaUrlFromAsset(item.media),
            file: null,
        })),
        related_product_ids: relatedProducts.map((item) => item.id),
        spec_tables: specTables,
    });
}

async function uploadAsset(file, title) {
    const payload = new FormData();
    payload.append("file", file);
    payload.append("title", title || file.name);

    const response = await axios.post("/admin/api/media-assets", payload, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
}

function ModalShell({ open, title, children, onClose, maxWidth = "max-w-5xl" }) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4">
            <button
                type="button"
                aria-label="Cerrar modal"
                className="absolute inset-0"
                onClick={onClose}
            />

            <div
                className={`relative z-[121] flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.28)]`}
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                        <Icon icon="solar:close-circle-outline" width={18} />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
            </div>
        </div>
    );
}

function Field({ label, children, hint }) {
    return (
        <div className="block space-y-2">
            <span className="block text-sm font-semibold text-slate-800">
                {label}
            </span>
            {children}
            {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
        </div>
    );
}

function TextInput(props) {
    return (
        <input
            {...props}
            className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10 ${
                props.className ?? ""
            }`}
        />
    );
}

function TextArea(props) {
    return (
        <textarea
            {...props}
            className={`min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10 ${
                props.className ?? ""
            }`}
        />
    );
}

function Toggle({ checked, onChange, label }) {
    return (
        <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
            />
            <span>{label}</span>
        </label>
    );
}

function StatCard({ label, value, icon }) {
    return (
        <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]">
                <Icon icon={icon} width={20} />
            </div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </article>
    );
}

function TabButton({ active, icon, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active
                    ? "bg-[#25A7CA] text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#25A7CA] hover:text-[#117a98]"
            }`}
        >
            <Icon icon={icon} width={18} />
            {label}
        </button>
    );
}

function EmptyState({ title, description }) {
    return (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {description}
            </p>
        </div>
    );
}

function BrandImagesPanel({ brands, onSaved }) {
    const [filesByBrand, setFilesByBrand] = useState({});
    const [savingBrand, setSavingBrand] = useState("");

    const setBrandFile = (brand, file) => {
        setFilesByBrand((current) => ({
            ...current,
            [brand]: file,
        }));
    };

    const saveBrandImage = async (item) => {
        const file = filesByBrand[item.brand];

        if (!file) {
            emitAdminToast("Seleccioná una imagen para esa marca.", "error");
            return;
        }

        setSavingBrand(item.brand);

        try {
            const uploaded = await uploadAsset(file, `Imagen marca ${item.brand}`);
            const response = await axios.post("/admin/api/product-brand-images", {
                brand: item.brand,
                media_id: uploaded.id,
            });

            emitAdminToast(
                `Imagen asignada a ${response.data.products_count ?? item.products_count} productos de ${item.brand}.`,
            );
            setBrandFile(item.brand, null);
            onSaved(response.data);
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo asignar la imagen de la marca.",
                "error",
            );
        } finally {
            setSavingBrand("");
        }
    };

    return (
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                        Imágenes por marca
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Cargá una imagen para cada marca. Al guardar, todos los
                        productos de esa marca pasan a usar esa imagen.
                    </p>
                </div>
            </div>

            {brands.length ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                                <th className="px-4 py-3 font-semibold">Marca</th>
                                <th className="px-4 py-3 font-semibold">Productos</th>
                                <th className="px-4 py-3 font-semibold">Imagen actual</th>
                                <th className="px-4 py-3 font-semibold">Nueva imagen</th>
                                <th className="px-4 py-3 font-semibold text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {brands.map((item) => (
                                <tr key={item.brand} className="border-b border-slate-100 align-middle">
                                    <td className="px-4 py-4">
                                        <p className="font-semibold text-slate-900">
                                            {item.brand}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4 text-slate-600">
                                        {item.products_count}
                                    </td>
                                    <td className="px-4 py-4">
                                        {item.media_url ? (
                                            <img
                                                src={item.media_url}
                                                alt={item.brand}
                                                className="h-16 w-20 rounded-2xl border border-slate-200 bg-slate-50 object-contain p-1"
                                            />
                                        ) : (
                                            <div className="flex h-16 w-20 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                                                <Icon icon="solar:gallery-outline" width={18} />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(event) =>
                                                setBrandFile(
                                                    item.brand,
                                                    event.target.files?.[0] ?? null,
                                                )
                                            }
                                            className="block w-full min-w-[260px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => saveBrandImage(item)}
                                                disabled={
                                                    savingBrand === item.brand ||
                                                    !filesByBrand[item.brand]
                                                }
                                                className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                            >
                                                <Icon icon="solar:gallery-add-outline" width={18} />
                                                {savingBrand === item.brand
                                                    ? "Asignando..."
                                                    : "Asignar a marca"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    title="Todavía no hay marcas"
                    description="Cuando cargues productos con marca, vas a poder asignarles una imagen común desde acá."
                />
            )}
        </section>
    );
}

function CoverEditor({ form, onChange, onSave, saving }) {
    const [previewUrl, setPreviewUrl] = useState(form.media_url || "");

    useEffect(() => {
        if (!form.image_file) {
            setPreviewUrl(form.media_url || "");
            return undefined;
        }

        const nextUrl = URL.createObjectURL(form.image_file);
        setPreviewUrl(nextUrl);

        return () => URL.revokeObjectURL(nextUrl);
    }, [form.image_file, form.media_url]);

    return (
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="space-y-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Portada pública
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                            Banner de /productos
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Administrá el título y la imagen principal de la página
                            pública de productos.
                        </p>
                    </div>

                    <Toggle
                        checked={form.is_active}
                        onChange={(value) => onChange("is_active", value)}
                        label="Mostrar banner"
                    />

                    <Field label="Título principal">
                        <TextInput
                            value={form.title}
                            onChange={(event) => onChange("title", event.target.value)}
                            placeholder="PRODUCTOS"
                        />
                    </Field>

                    <Field label="Imagen del banner">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                                onChange("image_file", event.target.files?.[0] ?? null)
                            }
                            className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                        />
                    </Field>

                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                    >
                        <Icon icon="solar:diskette-outline" width={18} />
                        {saving ? "Guardando..." : "Guardar portada"}
                    </button>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={form.title || "Productos"}
                            className="h-[360px] w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-[360px] items-center justify-center px-6 text-center text-sm text-slate-500">
                            Subí una imagen para la portada de productos.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function FamilyModal({ open, families, family, onClose, onSaved }) {
    const [form, setForm] = useState(emptyFamilyForm(family));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm(emptyFamilyForm(family));
    }, [family, open]);

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            let coverMediaId = form.cover_media_id;

            if (form.cover_file) {
                const uploaded = await uploadAsset(
                    form.cover_file,
                    `${form.name || "familia"} cover`,
                );
                coverMediaId = uploaded.id;
            }

            const payload = {
                name: form.name,
                slug: slugify(form.name),
                description: form.description || null,
                cover_media_id: coverMediaId,
                accent_color: form.accent_color || null,
                sort_order: form.sort_order || null,
                is_active: form.is_active,
                show_on_products_page: form.show_on_products_page,
                show_on_home: form.show_on_home,
            };

            if (form.id) {
                await axios.put(`/admin/api/product-families/${form.id}`, payload);
            } else {
                await axios.post("/admin/api/product-families", payload);
            }

            emitAdminToast(
                form.id
                    ? "La familia se actualizó correctamente."
                    : "La familia se creó correctamente.",
            );
            onSaved();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar la familia.",
                "error",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            title={form.id ? "Editar familia" : "Nueva familia"}
        >
            <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Nombre">
                        <TextInput
                            value={form.name}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                    slug: slugify(event.target.value),
                                }))
                            }
                        />
                    </Field>
                </div>

                <Field label="Descripción">
                    <TextArea
                        value={form.description}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                description: event.target.value,
                            }))
                        }
                        rows={5}
                    />
                </Field>

                <div className="grid gap-5 md:grid-cols-3">
                    <Field label="Color de acento">
                        <TextInput
                            value={form.accent_color}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    accent_color: event.target.value,
                                }))
                            }
                            placeholder="#093C62"
                        />
                    </Field>

                    <Field label="Orden">
                        <TextInput
                            value={form.sort_order}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    sort_order: event.target.value.toUpperCase(),
                                }))
                            }
                        />
                    </Field>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Toggle
                        checked={form.is_active}
                        onChange={(value) =>
                            setForm((current) => ({ ...current, is_active: value }))
                        }
                        label="Activa"
                    />
                    <Toggle
                        checked={form.show_on_products_page}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                show_on_products_page: value,
                            }))
                        }
                        label="Mostrar en /productos"
                    />
                    <Toggle
                        checked={form.show_on_home}
                        onChange={(value) =>
                            setForm((current) => ({ ...current, show_on_home: value }))
                        }
                        label="Mostrar en home"
                    />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Imagen de card">
                        <div className="mb-3 rounded-2xl border border-[#0072BB]/25 bg-[#0072BB]/10 px-4 py-3 text-sm font-semibold text-[#005f9d]">
                            Recomendado: 288px x 201px. Peso máximo: 10 MB.
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    cover_file: event.target.files?.[0] ?? null,
                                }))
                            }
                            className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                        />
                        {form.cover_media_url ? (
                            <img
                                src={form.cover_media_url}
                                alt={form.name || "Cover"}
                                className="mt-3 h-44 w-full rounded-2xl border border-slate-200 object-cover"
                            />
                        ) : null}
                    </Field>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                    >
                        {saving ? "Guardando..." : form.id ? "Guardar cambios" : "Crear familia"}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

function SubfamilyModal({ open, subfamily, families, onClose, onSaved }) {
    const [form, setForm] = useState(emptySubfamilyForm(subfamily));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm(emptySubfamilyForm(subfamily));
    }, [subfamily, open]);

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            const payload = {
                product_family_id: Number(form.product_family_id),
                name: form.name,
                slug: slugify(form.name),
                short_description: form.short_description || null,
                description: form.description || null,
                accent_color: form.accent_color || null,
                sort_order: form.sort_order || null,
                is_active: form.is_active,
                show_on_home: form.show_on_home,
                show_on_family_page: form.show_on_family_page,
            };

            if (form.id) {
                await axios.put(
                    `/admin/api/product-subfamilies/${form.id}`,
                    payload,
                );
            } else {
                await axios.post("/admin/api/product-subfamilies", payload);
            }

            emitAdminToast(
                form.id
                    ? "La subfamilia se actualizó correctamente."
                    : "La subfamilia se creó correctamente.",
            );
            onSaved();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar la subfamilia.",
                "error",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            title={form.id ? "Editar subfamilia" : "Nueva subfamilia"}
        >
            <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Familia">
                        <select
                            value={form.product_family_id}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    product_family_id: event.target.value,
                                }))
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                        >
                            <option value="">Seleccionar familia</option>
                            {families.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Nombre">
                        <TextInput
                            value={form.name}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                    slug: slugify(event.target.value),
                                }))
                            }
                        />
                    </Field>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Descripción corta">
                        <TextInput
                            value={form.short_description}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    short_description: event.target.value,
                                }))
                            }
                        />
                    </Field>
                </div>

                <Field label="Descripción">
                    <TextArea
                        value={form.description}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                description: event.target.value,
                            }))
                        }
                        rows={5}
                    />
                </Field>

                <div className="grid gap-5 md:grid-cols-3">
                    <Field label="Color de acento">
                        <TextInput
                            value={form.accent_color}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    accent_color: event.target.value,
                                }))
                            }
                            placeholder="#8BCFDE"
                        />
                    </Field>

                    <Field label="Orden">
                        <TextInput
                            value={form.sort_order}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    sort_order: event.target.value.toUpperCase(),
                                }))
                            }
                        />
                    </Field>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Toggle
                        checked={form.is_active}
                        onChange={(value) =>
                            setForm((current) => ({ ...current, is_active: value }))
                        }
                        label="Activa"
                    />
                    <Toggle
                        checked={form.show_on_home}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                show_on_home: value,
                            }))
                        }
                        label="Mostrar en home"
                    />
                    <Toggle
                        checked={form.show_on_family_page}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                show_on_family_page: value,
                            }))
                        }
                        label="Mostrar en página de familia"
                    />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                    >
                        {saving ? "Guardando..." : form.id ? "Guardar cambios" : "Crear subfamilia"}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

function GalleryEditor({ gallery, onChange }) {
    const removeAt = (index) => {
        onChange(gallery.filter((_, currentIndex) => currentIndex !== index));
    };

    const addFiles = (files) => {
        const nextItems = Array.from(files).map((file) => ({
            media_id: null,
            url: URL.createObjectURL(file),
            file,
        }));

        onChange([...gallery, ...nextItems]);
    };

    return (
        <div className="space-y-4">
            <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => addFiles(event.target.files ?? [])}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
            />

            {gallery.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {gallery.map((item, index) => (
                        <article
                            key={`${item.media_id || "new"}-${index}`}
                            className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50"
                        >
                            {item.url ? (
                                <img
                                    src={item.url}
                                    alt={`Galería ${index + 1}`}
                                    className="h-40 w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-slate-500">
                                    Archivo cargado
                                </div>
                            )}
                            <div className="flex justify-end p-3">
                                <button
                                    type="button"
                                    onClick={() => removeAt(index)}
                                    className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                >
                                    Quitar
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function SpecTablesEditor({ specTables, onChange }) {
    const updateTable = (tableIndex, updater) => {
        onChange(
            specTables.map((table, currentIndex) =>
                currentIndex === tableIndex ? updater(table) : table,
            ),
        );
    };

    const addTable = () => onChange([...specTables, emptySpecTable()]);

    const removeTable = (tableIndex) =>
        onChange(specTables.filter((_, index) => index !== tableIndex));

    const addColumn = (tableIndex) =>
        updateTable(tableIndex, (table) => ({
            ...table,
            columns: [...table.columns, { label: "", unit: "" }],
            rows: table.rows.map((row) => ({
                ...row,
                values: [...row.values, ""],
            })),
        }));

    const removeColumn = (tableIndex, columnIndex) =>
        updateTable(tableIndex, (table) => ({
            ...table,
            columns: table.columns.filter((_, index) => index !== columnIndex),
            rows: table.rows.map((row) => ({
                ...row,
                values: row.values.filter((_, index) => index !== columnIndex),
            })),
        }));

    const addRow = (tableIndex) =>
        updateTable(tableIndex, (table) => ({
            ...table,
            rows: [
                ...table.rows,
                { values: table.columns.map(() => "") },
            ],
        }));

    const removeRow = (tableIndex, rowIndex) =>
        updateTable(tableIndex, (table) => ({
            ...table,
            rows: table.rows.filter((_, index) => index !== rowIndex),
        }));

    return (
        <div className="space-y-5">
            {specTables.map((table, tableIndex) => (
                <div
                    key={`table-${tableIndex}`}
                    className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
                >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <Field label={`Tabla ${tableIndex + 1}`}>
                            <TextInput
                                value={table.title}
                                onChange={(event) =>
                                    updateTable(tableIndex, (current) => ({
                                        ...current,
                                        title: event.target.value,
                                    }))
                                }
                                placeholder="Tabla técnica"
                            />
                        </Field>
                        {specTables.length > 1 ? (
                            <button
                                type="button"
                                onClick={() => removeTable(tableIndex)}
                                className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                            >
                                Eliminar tabla
                            </button>
                        ) : null}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-900">
                                    Columnas
                                </p>
                                <button
                                    type="button"
                                    onClick={() => addColumn(tableIndex)}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                >
                                    Agregar columna
                                </button>
                            </div>

                            {table.columns.map((column, columnIndex) => (
                                <div
                                    key={`column-${columnIndex}`}
                                    className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]"
                                >
                                    <TextInput
                                        value={column.label}
                                        onChange={(event) =>
                                            updateTable(tableIndex, (current) => ({
                                                ...current,
                                                columns: current.columns.map(
                                                    (item, index) =>
                                                        index === columnIndex
                                                            ? {
                                                                  ...item,
                                                                  label: event.target.value,
                                                              }
                                                            : item,
                                                ),
                                            }))
                                        }
                                        placeholder="Nombre de columna"
                                    />
                                    <TextInput
                                        value={column.unit}
                                        onChange={(event) =>
                                            updateTable(tableIndex, (current) => ({
                                                ...current,
                                                columns: current.columns.map(
                                                    (item, index) =>
                                                        index === columnIndex
                                                            ? {
                                                                  ...item,
                                                                  unit: event.target.value,
                                                              }
                                                            : item,
                                                ),
                                            }))
                                        }
                                        placeholder="Unidad"
                                    />
                                    {table.columns.length > 1 ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeColumn(tableIndex, columnIndex)
                                            }
                                            className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                        >
                                            Quitar
                                        </button>
                                    ) : (
                                        <div />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-900">
                                    Filas
                                </p>
                                <button
                                    type="button"
                                    onClick={() => addRow(tableIndex)}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                >
                                    Agregar fila
                                </button>
                            </div>

                            {table.rows.map((row, rowIndex) => (
                                <div
                                    key={`row-${rowIndex}`}
                                    className="rounded-2xl border border-slate-200 bg-white p-4"
                                >
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                            Fila {rowIndex + 1}
                                        </p>
                                        {table.rows.length > 1 ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeRow(tableIndex, rowIndex)
                                                }
                                                className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                            >
                                                Quitar fila
                                            </button>
                                        ) : null}
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                        {table.columns.map((column, columnIndex) => (
                                            <TextInput
                                                key={`cell-${rowIndex}-${columnIndex}`}
                                                value={row.values[columnIndex] ?? ""}
                                                onChange={(event) =>
                                                    updateTable(tableIndex, (current) => ({
                                                        ...current,
                                                        rows: current.rows.map(
                                                            (item, currentRowIndex) =>
                                                                currentRowIndex === rowIndex
                                                                    ? {
                                                                          ...item,
                                                                          values: item.values.map(
                                                                              (
                                                                                  cell,
                                                                                  currentColumnIndex,
                                                                              ) =>
                                                                                  currentColumnIndex ===
                                                                                  columnIndex
                                                                                      ? event.target.value
                                                                                      : cell,
                                                                          ),
                                                                      }
                                                                    : item,
                                                        ),
                                                    }))
                                                }
                                                placeholder={column.label || `Columna ${columnIndex + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={addTable}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
            >
                Agregar otra tabla técnica
            </button>
        </div>
    );
}

function ProductModal({
    open,
    productId,
    families,
    subfamilies,
    products,
    onClose,
    onSaved,
}) {
    const [form, setForm] = useState(emptyProductForm());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (!productId) {
            setForm(emptyProductForm());
            return;
        }

        let active = true;
        setLoading(true);

        axios
            .get(`/admin/api/products/${productId}`)
            .then((response) => {
                if (active) {
                    setForm(mapProductDetails(response.data));
                }
            })
            .catch(() => {
                emitAdminToast(
                    "No se pudo cargar el detalle del producto.",
                    "error",
                );
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [open, productId]);

    const filteredSubfamilies = useMemo(
        () =>
            subfamilies.filter(
                (item) => Number(item.product_family_id) === Number(form.product_family_id),
            ),
        [subfamilies, form.product_family_id],
    );

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            let mainMediaId = form.main_media_id;
            let technicalSheetMediaId = form.technical_sheet_media_id;

            if (form.main_media_file) {
                const uploaded = await uploadAsset(
                    form.main_media_file,
                    `${form.name || "producto"} principal`,
                );
                mainMediaId = uploaded.id;
            }

            if (form.technical_sheet_file) {
                const uploaded = await uploadAsset(
                    form.technical_sheet_file,
                    `${form.name || "producto"} ficha`,
                );
                technicalSheetMediaId = uploaded.id;
            }

            const mediaRows = [];
            for (const [index, item] of form.gallery.entries()) {
                let mediaId = item.media_id;

                if (!mediaId && item.file) {
                    const uploaded = await uploadAsset(
                        item.file,
                        `${form.name || "producto"} galeria ${index + 1}`,
                    );
                    mediaId = uploaded.id;
                }

                if (!mediaId) {
                    continue;
                }

                mediaRows.push({
                    media_id: mediaId,
                    sort_order: String.fromCharCode(65 + index),
                    is_primary: false,
                });
            }

            const payload = {
                product_family_id: Number(form.product_family_id),
                product_subfamily_id: form.product_subfamily_id
                    ? Number(form.product_subfamily_id)
                    : null,
                name: form.name,
                slug: slugify(form.name),
                sku: form.sku || null,
                brand: form.brand || null,
                original_code: form.original_code || null,
                equivalence_code: form.equivalence_code || null,
                oem_code: form.oem_code || null,
                short_description: form.short_description || null,
                description: form.description || null,
                applications: form.applications || null,
                material: form.material || null,
                treatment: form.treatment || null,
                observations: form.observations || null,
                price: form.price === "" ? null : Number(form.price),
                discount_price: form.discount_price === "" ? null : Number(form.discount_price),
                main_media_id: mainMediaId,
                technical_sheet_media_id: technicalSheetMediaId,
                sort_order: form.sort_order || null,
                is_active: form.is_active,
                is_featured_home: form.is_featured_home,
                is_featured_family: form.is_featured_family,
                media: mediaRows,
                related_product_ids: form.related_product_ids,
                spec_tables: form.spec_tables
                    .filter(
                        (table) =>
                            table.columns.some((column) => column.label.trim() !== "") ||
                            table.rows.some((row) =>
                                row.values.some((value) => String(value || "").trim() !== ""),
                            ),
                    )
                    .map((table, tableIndex) => ({
                        title: table.title || null,
                        sort_order: String.fromCharCode(65 + tableIndex),
                        columns: table.columns
                            .filter((column) => column.label.trim() !== "")
                            .map((column, columnIndex) => ({
                                label: column.label,
                                unit: column.unit || null,
                                sort_order: String.fromCharCode(65 + columnIndex),
                            })),
                        rows: table.rows.map((row, rowIndex) => ({
                            sort_order: String.fromCharCode(65 + rowIndex),
                            values: row.values,
                        })),
                    })),
            };

            if (form.id) {
                await axios.put(`/admin/api/products/${form.id}`, payload);
            } else {
                await axios.post("/admin/api/products", payload);
            }

            emitAdminToast(
                form.id
                    ? "El producto se actualizó correctamente."
                    : "El producto se creó correctamente.",
            );
            onSaved();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar el producto.",
                "error",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            title={form.id ? "Editar producto" : "Nuevo producto"}
            maxWidth="max-w-7xl"
        >
            {loading ? (
                <div className="py-20 text-center text-sm text-slate-500">
                    Cargando producto...
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-5 xl:grid-cols-2">
                        <Field label="Familia">
                            <select
                                value={form.product_family_id}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        product_family_id: event.target.value,
                                        product_subfamily_id: "",
                                    }))
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                            >
                                <option value="">Seleccionar familia</option>
                                {families.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Subfamilia">
                            <select
                                value={form.product_subfamily_id}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        product_subfamily_id: event.target.value,
                                    }))
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                            >
                                <option value="">Sin subfamilia</option>
                                {filteredSubfamilies.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                        <Field label="Nombre">
                            <TextInput
                                value={form.name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                        slug: slugify(event.target.value),
                                    }))
                                }
                            />
                        </Field>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-4">
                        <Field label="SKU">
                            <TextInput
                                value={form.sku}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        sku: event.target.value,
                                    }))
                                }
                            />
                        </Field>

                        <Field label="Marca">
                            <TextInput
                                value={form.brand}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        brand: event.target.value,
                                    }))
                                }
                            />
                        </Field>

                        <Field label="Descripción corta">
                            <TextInput
                                value={form.short_description}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        short_description: event.target.value,
                                    }))
                                }
                            />
                        </Field>

                        <Field label="Orden">
                            <TextInput
                                value={form.sort_order}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        sort_order: event.target.value.toUpperCase(),
                                    }))
                                }
                            />
                        </Field>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-3">
                        <Field label="Código original">
                            <TextInput
                                value={form.original_code}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        original_code: event.target.value,
                                    }))
                                }
                            />
                        </Field>

                        <Field label="Equivalencia">
                            <TextInput
                                value={form.equivalence_code}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        equivalence_code: event.target.value,
                                    }))
                                }
                            />
                        </Field>

                        <Field label="Código OEM">
                            <TextInput
                                value={form.oem_code}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        oem_code: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                    </div>

                    <Field label="Descripción completa">
                        <TextArea
                            value={form.description}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                            rows={6}
                        />
                    </Field>

                    <Field label="Aplicaciones">
                        <TextArea
                            value={form.applications}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    applications: event.target.value,
                                }))
                            }
                            rows={4}
                        />
                    </Field>

                    <div className="grid gap-5 xl:grid-cols-3">
                        <Field label="Material">
                            <TextArea
                                value={form.material}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        material: event.target.value,
                                    }))
                                }
                                rows={4}
                            />
                        </Field>

                        <Field label="Tratamiento">
                            <TextArea
                                value={form.treatment}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        treatment: event.target.value,
                                    }))
                                }
                                rows={4}
                            />
                        </Field>

                        <Field label="Observaciones">
                            <TextArea
                                value={form.observations}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        observations: event.target.value,
                                    }))
                                }
                                rows={4}
                            />
                        </Field>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-3">
                        <Field label="Precio lista">
                            <TextInput
                                type="number"
                                step="0.01"
                                value={form.price}
                                onChange={(event) =>
                                    setForm((current) => {
                                        const price = event.target.value;

                                        return {
                                            ...current,
                                            price,
                                            discount_price:
                                                current.discount_percent === ""
                                                    ? current.discount_price
                                                    : discountPriceFromPercent(
                                                          price,
                                                          current.discount_percent,
                                                      ),
                                        };
                                    })
                                }
                            />
                        </Field>

                        <Field
                            label="Descuento (%)"
                            hint="Calcula el precio con descuento. La vista cliente usa este precio como base."
                        >
                            <TextInput
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={form.discount_percent}
                                onChange={(event) =>
                                    setForm((current) => {
                                        const discountPercent = event.target.value;

                                        return {
                                            ...current,
                                            discount_percent: discountPercent,
                                            discount_price: discountPriceFromPercent(
                                                current.price,
                                                discountPercent,
                                            ),
                                        };
                                    })
                                }
                            />
                        </Field>

                        <Field label="Precio con descuento">
                            <TextInput
                                type="number"
                                step="0.01"
                                value={form.discount_price}
                                onChange={(event) =>
                                    setForm((current) => {
                                        const discountPrice = event.target.value;

                                        return {
                                            ...current,
                                            discount_price: discountPrice,
                                            discount_percent: discountPercentFromPrices(
                                                current.price,
                                                discountPrice,
                                            ),
                                        };
                                    })
                                }
                            />
                        </Field>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Toggle
                            checked={form.is_active}
                            onChange={(value) =>
                                setForm((current) => ({ ...current, is_active: value }))
                            }
                            label="Activo"
                        />
                        <Toggle
                            checked={form.is_featured_home}
                            onChange={(value) =>
                                setForm((current) => ({
                                    ...current,
                                    is_featured_home: value,
                                }))
                            }
                            label="Destacado en home"
                        />
                        <Toggle
                            checked={form.is_featured_family}
                            onChange={(value) =>
                                setForm((current) => ({
                                    ...current,
                                    is_featured_family: value,
                                }))
                            }
                            label="Destacado en familia"
                        />
                    </div>

                    <div className="grid gap-5 xl:grid-cols-2">
                        <Field label="Imagen principal">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        main_media_file:
                                            event.target.files?.[0] ?? null,
                                    }))
                                }
                                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                            />
                            {form.main_media_url ? (
                                <img
                                    src={form.main_media_url}
                                    alt={form.name || "Principal"}
                                    className="mt-3 h-56 w-full rounded-2xl border border-slate-200 object-cover"
                                />
                            ) : null}
                        </Field>

                        <Field
                            label="Archivo técnico complementario"
                            hint="Opcional. La ficha técnica pública se genera igual desde el producto."
                        >
                            <input
                                type="file"
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        technical_sheet_file:
                                            event.target.files?.[0] ?? null,
                                    }))
                                }
                                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                            />
                            {form.technical_sheet_url ? (
                                <a
                                    href={form.technical_sheet_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                                >
                                    <Icon icon="solar:file-text-outline" width={18} />
                                    Ver archivo actual
                                </a>
                            ) : null}
                        </Field>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                Galería
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Estas imágenes alimentan la galería pública del
                                producto.
                            </p>
                        </div>
                        <GalleryEditor
                            gallery={form.gallery}
                            onChange={(gallery) =>
                                setForm((current) => ({ ...current, gallery }))
                            }
                        />
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                Productos relacionados
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Seleccioná los productos que querés mostrar al pie
                                de la ficha.
                            </p>
                        </div>

                        <div className="max-h-56 space-y-2 overflow-y-auto rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                            {products
                                .filter((item) => item.id !== form.id)
                                .map((item) => (
                                    <label
                                        key={item.id}
                                        className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm text-slate-700 transition hover:border-slate-200 hover:bg-white"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.related_product_ids.includes(
                                                item.id,
                                            )}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    related_product_ids: event.target
                                                        .checked
                                                        ? [
                                                              ...current.related_product_ids,
                                                              item.id,
                                                          ]
                                                        : current.related_product_ids.filter(
                                                              (currentId) =>
                                                                  currentId !== item.id,
                                                          ),
                                                }))
                                            }
                                        />
                                        <span>{item.name}</span>
                                    </label>
                                ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                Tablas técnicas
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Estas tablas alimentan la ficha pública y el PDF
                                técnico del producto.
                            </p>
                        </div>
                        <SpecTablesEditor
                            specTables={form.spec_tables}
                            onChange={(spec_tables) =>
                                setForm((current) => ({
                                    ...current,
                                    spec_tables,
                                }))
                            }
                        />
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                        >
                            {saving ? "Guardando..." : form.id ? "Guardar cambios" : "Crear producto"}
                        </button>
                    </div>
                </form>
            )}
        </ModalShell>
    );
}

export default function ProductsIndex({
    hero,
    families: initialFamilies,
    subfamilies: initialSubfamilies,
    products: initialProducts,
    brands: initialBrands,
    stats,
    initialTab,
    publicProductsUrl,
    importTemplateUrl,
}) {
    const [tab, setTab] = useState(
        initialTab && initialTab !== "cover" ? initialTab : "products",
    );
    const [previewOpen, setPreviewOpen] = useState(false);
    const [coverForm, setCoverForm] = useState(emptyHeroForm(hero));
    const [coverSaving, setCoverSaving] = useState(false);
    const [families, setFamilies] = useState(initialFamilies ?? []);
    const [subfamilies, setSubfamilies] = useState(initialSubfamilies ?? []);
    const [products, setProducts] = useState(initialProducts ?? []);
    const [productSearch, setProductSearch] = useState("");
    const [brands, setBrands] = useState(initialBrands ?? []);
    const [familyModalOpen, setFamilyModalOpen] = useState(false);
    const [editingFamily, setEditingFamily] = useState(null);
    const [subfamilyModalOpen, setSubfamilyModalOpen] = useState(false);
    const [editingSubfamily, setEditingSubfamily] = useState(null);
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        setTab(initialTab && initialTab !== "cover" ? initialTab : "products");
    }, [initialTab]);

    const visitTab = (nextTab) => {
        setTab(nextTab);
        router.visit(`/admin/productos?tab=${nextTab}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const featuredHomeProducts = useMemo(
        () => products.filter((product) => Boolean(product.is_featured_home)),
        [products],
    );

    const filteredProducts = useMemo(() => {
        const query = normalizeSearch(productSearch);

        if (!query) {
            return products;
        }

        return products.filter((product) => {
            const searchableText = normalizeSearch(
                [
                    product.name,
                    product.sku,
                    product.brand,
                    product.family_name,
                    product.subfamily_name,
                    product.original_code,
                    product.equivalence_code,
                    product.oem_code,
                ]
                    .filter(Boolean)
                    .join(" "),
            );

            return searchableText.includes(query);
        });
    }, [products, productSearch]);

    const reloadPage = () => {
        router.reload({
            onSuccess: (page) => {
                setFamilies(page.props.families ?? []);
                setSubfamilies(page.props.subfamilies ?? []);
                setProducts(page.props.products ?? []);
                setBrands(page.props.brands ?? []);
                setCoverForm(emptyHeroForm(page.props.hero));
                setFamilyModalOpen(false);
                setEditingFamily(null);
                setSubfamilyModalOpen(false);
                setEditingSubfamily(null);
                setProductModalOpen(false);
                setEditingProductId(null);
                setImportFile(null);
            },
        });
    };

    const saveCover = async () => {
        setCoverSaving(true);

        try {
            let mediaId = coverForm.media_id;

            if (coverForm.image_file) {
                const uploaded = await uploadAsset(
                    coverForm.image_file,
                    coverForm.title || "Productos hero",
                );
                mediaId = uploaded.id;
            }

            await axios.put(`/admin/api/site-sections/${coverForm.id}`, {
                page_key: "productos",
                section_key: "hero",
                title: coverForm.title || null,
                media_id: mediaId,
                sort_order: coverForm.sort_order || "A",
                is_active: coverForm.is_active,
                field_values: [],
                items: [],
            });

            emitAdminToast("La portada de productos se actualizó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar la portada de productos.",
                "error",
            );
        } finally {
            setCoverSaving(false);
        }
    };

    const deleteFamily = async (item) => {
        if (!window.confirm(`¿Eliminar la familia "${item.name}"?`)) {
            return;
        }

        try {
            await axios.delete(`/admin/api/product-families/${item.id}`);
            emitAdminToast("La familia se eliminó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo eliminar la familia.",
                "error",
            );
        }
    };

    const deleteSubfamily = async (item) => {
        if (!window.confirm(`¿Eliminar la subfamilia "${item.name}"?`)) {
            return;
        }

        try {
            await axios.delete(`/admin/api/product-subfamilies/${item.id}`);
            emitAdminToast("La subfamilia se eliminó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo eliminar la subfamilia.",
                "error",
            );
        }
    };

    const deleteProduct = async (item) => {
        if (!window.confirm(`¿Eliminar el producto "${item.name}"?`)) {
            return;
        }

        try {
            await axios.delete(`/admin/api/products/${item.id}`);
            emitAdminToast("El producto se eliminó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo eliminar el producto.",
                "error",
            );
        }
    };

    const runImport = async () => {
        if (!importFile) {
            emitAdminToast("Seleccioná un archivo para importar.", "error");
            return;
        }

        setImporting(true);

        try {
            const payload = new FormData();
            payload.append("file", importFile);

            const response = await axios.post("/admin/api/product-import", payload, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const summary = response.data.summary ?? {};
            emitAdminToast(
                `Importación completa. Familias: ${summary.families ?? 0}, subfamilias: ${summary.subfamilies ?? 0}, productos: ${summary.products ?? 0}.`,
            );
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo ejecutar la importación masiva.",
                "error",
            );
        } finally {
            setImporting(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Productos" />

            <PublicPreviewModal
                open={previewOpen}
                title="Vista pública de Productos"
                url={publicProductsUrl}
                onClose={() => setPreviewOpen(false)}
            />

            <FamilyModal
                open={familyModalOpen}
                families={families}
                family={editingFamily}
                onClose={() => {
                    setFamilyModalOpen(false);
                    setEditingFamily(null);
                }}
                onSaved={reloadPage}
            />

            <SubfamilyModal
                open={subfamilyModalOpen}
                subfamily={editingSubfamily}
                families={families}
                onClose={() => {
                    setSubfamilyModalOpen(false);
                    setEditingSubfamily(null);
                }}
                onSaved={reloadPage}
            />

            <ProductModal
                open={productModalOpen}
                productId={editingProductId}
                families={families}
                subfamilies={subfamilies}
                products={products}
                onClose={() => {
                    setProductModalOpen(false);
                    setEditingProductId(null);
                }}
                onSaved={reloadPage}
            />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.16),_transparent_34%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_44%,#eef7fb_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    <Icon icon="solar:box-outline" width={14} />
                                    Productos / Catálogo público
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Gestión de productos
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                    Desde acá administrás familias, subfamilias,
                                    productos, imágenes por marca e importación
                                    masiva del catálogo.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => setPreviewOpen(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                >
                                    <Icon icon="solar:square-arrow-right-up-outline" width={18} />
                                    Ver página pública
                                </button>

                                <a
                                    href={importTemplateUrl}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                >
                                    <Icon icon="solar:download-outline" width={18} />
                                    Descargar template
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    <StatCard
                        label="Familias"
                        value={stats?.families ?? families.length}
                        icon="solar:box-outline"
                    />
                    <StatCard
                        label="Subfamilias"
                        value={stats?.subfamilies ?? subfamilies.length}
                        icon="solar:widget-4-outline"
                    />
                    <StatCard
                        label="Productos"
                        value={stats?.products ?? products.length}
                        icon="solar:archive-outline"
                    />
                    <StatCard
                        label="Marcas"
                        value={stats?.brands ?? brands.length}
                        icon="solar:tag-outline"
                    />
                </section>

                <section className="flex flex-wrap gap-3">
                    <TabButton
                        active={tab === "families"}
                        icon="solar:box-outline"
                        label="Familias"
                        onClick={() => visitTab("families")}
                    />
                    <TabButton
                        active={tab === "subfamilies"}
                        icon="solar:widget-4-outline"
                        label="Subfamilias"
                        onClick={() => visitTab("subfamilies")}
                    />
                    <TabButton
                        active={tab === "products"}
                        icon="solar:archive-outline"
                        label="Productos"
                        onClick={() => visitTab("products")}
                    />
                    <TabButton
                        active={tab === "brand-images"}
                        icon="solar:gallery-add-outline"
                        label="Imágenes por marca"
                        onClick={() => visitTab("brand-images")}
                    />
                    <TabButton
                        active={tab === "import"}
                        icon="solar:upload-outline"
                        label="Importador masivo"
                        onClick={() => visitTab("import")}
                    />
                </section>

                {tab === "families" ? (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">
                                    Familias
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Administrá las tarjetas y familias visibles en la
                                    página pública de productos.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setEditingFamily(null);
                                    setFamilyModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                            >
                                <Icon icon="solar:add-circle-outline" width={18} />
                                Nueva familia
                            </button>
                        </div>

                        {families.length ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500">
                                            <th className="px-4 py-3 font-semibold">Familia</th>
                                            <th className="px-4 py-3 font-semibold">Slug</th>
                                            <th className="px-4 py-3 font-semibold">Orden</th>
                                            <th className="px-4 py-3 font-semibold">Web</th>
                                            <th className="px-4 py-3 font-semibold">Home</th>
                                            <th className="px-4 py-3 font-semibold">Subfamilias</th>
                                            <th className="px-4 py-3 font-semibold">Productos</th>
                                            <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {families.map((item) => (
                                            <tr key={item.id} className="border-b border-slate-100 align-top">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {item.cover_media_url ? (
                                                            <img
                                                                src={item.cover_media_url}
                                                                alt={item.name}
                                                                className="h-12 w-12 rounded-2xl object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                                                <Icon icon="solar:gallery-outline" width={18} />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold text-slate-900">
                                                                {item.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {item.is_active ? "Activa" : "Oculta"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">{item.slug}</td>
                                                <td className="px-4 py-4 text-slate-600">{item.sort_order}</td>
                                                <td className="px-4 py-4 text-slate-600">
                                                    {item.show_on_products_page ? "Sí" : "No"}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">
                                                    {item.show_on_home ? "Sí" : "No"}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">{item.subfamilies_count}</td>
                                                <td className="px-4 py-4 text-slate-600">{item.products_count}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingFamily(item);
                                                                setFamilyModalOpen(true);
                                                            }}
                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteFamily(item)}
                                                            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                title="Todavía no hay familias"
                                description="Creá la primera familia de productos para empezar a alimentar la web pública."
                            />
                        )}
                    </section>
                ) : null}

                {tab === "subfamilies" ? (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">
                                    Subfamilias
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Organizá las subcategorías que se muestran dentro
                                    de cada familia.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setEditingSubfamily(null);
                                    setSubfamilyModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                            >
                                <Icon icon="solar:add-circle-outline" width={18} />
                                Nueva subfamilia
                            </button>
                        </div>

                        {subfamilies.length ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500">
                                            <th className="px-4 py-3 font-semibold">Subfamilia</th>
                                            <th className="px-4 py-3 font-semibold">Familia</th>
                                            <th className="px-4 py-3 font-semibold">Slug</th>
                                            <th className="px-4 py-3 font-semibold">Orden</th>
                                            <th className="px-4 py-3 font-semibold">Home</th>
                                            <th className="px-4 py-3 font-semibold">Página familia</th>
                                            <th className="px-4 py-3 font-semibold">Productos</th>
                                            <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subfamilies.map((item) => (
                                            <tr key={item.id} className="border-b border-slate-100 align-top">
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {item.is_active ? "Activa" : "Oculta"}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">{item.family_name}</td>
                                                <td className="px-4 py-4 text-slate-600">{item.slug}</td>
                                                <td className="px-4 py-4 text-slate-600">{item.sort_order}</td>
                                                <td className="px-4 py-4 text-slate-600">
                                                    {item.show_on_home ? "Sí" : "No"}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">
                                                    {item.show_on_family_page ? "Sí" : "No"}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">{item.products_count}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingSubfamily(item);
                                                                setSubfamilyModalOpen(true);
                                                            }}
                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteSubfamily(item)}
                                                            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                title="Todavía no hay subfamilias"
                                description="Creá subfamilias para organizar mejor el catálogo público."
                            />
                        )}
                    </section>
                ) : null}

                {tab === "products" ? (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">
                                    Productos
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Administrá los productos visibles en la web
                                    pública y sus imágenes principales.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setEditingProductId(null);
                                    setProductModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8]"
                            >
                                <Icon icon="solar:add-circle-outline" width={18} />
                                Nuevo producto
                            </button>
                        </div>

                        <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                            <label className="relative block">
                                <Icon
                                    icon="solar:magnifer-outline"
                                    width={20}
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="search"
                                    value={productSearch}
                                    onChange={(event) =>
                                        setProductSearch(event.target.value)
                                    }
                                    placeholder="Buscar por nombre, SKU, código original, OEM o equivalencia"
                                    className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-12 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                                {productSearch ? (
                                    <button
                                        type="button"
                                        onClick={() => setProductSearch("")}
                                        className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <Icon icon="solar:close-circle-outline" width={18} />
                                    </button>
                                ) : null}
                            </label>

                            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Resultados
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {filteredProducts.length} de {products.length} productos
                                    </p>
                                </div>
                                <Icon
                                    icon="solar:filter-outline"
                                    width={24}
                                    className="text-[#0072BB]"
                                />
                            </div>
                        </div>

                        <div className="mb-6 rounded-[26px] border border-[#0072BB]/15 bg-[#0072BB]/[0.04] p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        Destacados en home
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Productos marcados para aparecer en la página principal.
                                    </p>
                                </div>
                                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#0072BB] px-3 py-1 text-xs font-semibold text-white">
                                    <Icon icon="solar:star-bold" width={14} />
                                    {featuredHomeProducts.length} destacados
                                </span>
                            </div>

                            {featuredHomeProducts.length ? (
                                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {featuredHomeProducts.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3 rounded-2xl border border-white bg-white/90 p-3 shadow-sm"
                                        >
                                            {item.main_media_url ? (
                                                <img
                                                    src={item.main_media_url}
                                                    alt={item.name}
                                                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                                    <Icon icon="solar:archive-outline" width={18} />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-900">
                                                    {item.name}
                                                </p>
                                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                    {item.sku || "Sin SKU"}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingProductId(item.id);
                                                    setProductModalOpen(true);
                                                }}
                                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                            >
                                                Editar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4 rounded-2xl border border-dashed border-[#0072BB]/25 bg-white px-4 py-5 text-sm text-slate-500">
                                    No hay productos destacados en home todavía.
                                </div>
                            )}
                        </div>

                        {filteredProducts.length ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-[1600px] text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500">
                                            <th className="px-4 py-3 font-semibold">Producto</th>
                                            <th className="px-4 py-3 font-semibold">Familia</th>
                                            <th className="px-4 py-3 font-semibold">Subfamilia</th>
                                            <th className="px-4 py-3 font-semibold">SKU</th>
                                            <th className="px-4 py-3 font-semibold">Marca</th>
                                            <th className="px-4 py-3 font-semibold">Cód. original</th>
                                            <th className="px-4 py-3 font-semibold">Equivalencia</th>
                                            <th className="px-4 py-3 font-semibold">OEM</th>
                                            <th className="px-4 py-3 font-semibold text-right">Precio lista</th>
                                            <th className="px-4 py-3 font-semibold text-right">Desc.</th>
                                            <th className="px-4 py-3 font-semibold text-right">Precio con desc.</th>
                                            <th className="px-4 py-3 font-semibold">Galería</th>
                                            <th className="px-4 py-3 font-semibold">Tablas</th>
                                            <th className="px-4 py-3 font-semibold">Relacionados</th>
                                            <th className="px-4 py-3 font-semibold">Estado</th>
                                            <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map((item) => (
                                            <tr key={item.id} className="border-b border-slate-100 align-top">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {item.main_media_url ? (
                                                            <img
                                                                src={item.main_media_url}
                                                                alt={item.name}
                                                                className="h-12 w-12 rounded-2xl object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                                                <Icon icon="solar:archive-outline" width={18} />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-900">
                                                                {item.name}
                                                            </p>
                                                            <p className="max-w-[220px] truncate text-xs text-slate-500">
                                                                {item.short_description || item.description || "Sin descripción corta"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">{item.family_name}</td>
                                                <td className="px-4 py-4 text-slate-600">{item.subfamily_name || "-"}</td>
                                                <td className="px-4 py-4 text-slate-600">{item.sku || "-"}</td>
                                                <td className="px-4 py-4 text-slate-600">{item.brand || "-"}</td>
                                                <td className="px-4 py-4 text-slate-600">{item.original_code || "-"}</td>
                                                <td className="px-4 py-4 text-slate-600">{item.equivalence_code || "-"}</td>
                                                <td className="px-4 py-4 text-slate-600">{item.oem_code || "-"}</td>
                                                <td className="px-4 py-4 text-right text-slate-700">
                                                    {formatMoney(item.price)}
                                                </td>
                                                <td className="px-4 py-4 text-right font-semibold text-[#308C05]">
                                                    {item.discount_percent !== null && item.discount_percent !== undefined
                                                        ? `${formatPercent(item.discount_percent)}%`
                                                        : "-"}
                                                </td>
                                                <td className="px-4 py-4 text-right text-slate-700">
                                                    {formatMoney(item.discount_price)}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">{item.gallery_count}</td>
                                                <td className="px-4 py-4 text-slate-600">{item.spec_tables_count}</td>
                                                <td className="px-4 py-4 text-slate-600">{item.related_count}</td>
                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                            item.is_active
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : "bg-slate-100 text-slate-500"
                                                        }`}
                                                    >
                                                        {item.is_active ? "Activo" : "Oculto"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingProductId(item.id);
                                                                setProductModalOpen(true);
                                                            }}
                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteProduct(item)}
                                                            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                title={
                                    products.length
                                        ? "No hay productos para esa búsqueda"
                                        : "Todavía no hay productos"
                                }
                                description={
                                    products.length
                                        ? "Probá buscar por nombre, SKU, código original, OEM o equivalencia."
                                        : "Creá el primer producto o usá el importador masivo para cargar el catálogo."
                                }
                            />
                        )}
                    </section>
                ) : null}

                {tab === "brand-images" ? (
                    <BrandImagesPanel
                        brands={brands}
                        onSaved={(updatedBrand) => {
                            setBrands((current) =>
                                current.map((item) =>
                                    item.brand === updatedBrand.brand
                                        ? {
                                              ...item,
                                              media_id: updatedBrand.media_id,
                                              media_url: updatedBrand.media_url,
                                              products_count:
                                                  updatedBrand.products_count ??
                                                  item.products_count,
                                          }
                                        : item,
                                ),
                            );
                            reloadPage();
                        }}
                    />
                ) : null}

                {tab === "import" ? (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                            <div className="space-y-5">
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        Importador masivo
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Importá familias, subfamilias y productos en
                                        lote usando el template Excel del panel.
                                    </p>
                                </div>

                                <Field
                                    label="Archivo Excel o CSV"
                                    hint="Para importar todo completo usá el template XLSX con hojas families, subfamilies y products."
                                >
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(event) =>
                                            setImportFile(event.target.files?.[0] ?? null)
                                        }
                                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                    />
                                </Field>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={runImport}
                                        disabled={importing}
                                        className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                    >
                                        <Icon icon="solar:upload-outline" width={18} />
                                        {importing ? "Importando..." : "Ejecutar importación"}
                                    </button>

                                    <a
                                        href={importTemplateUrl}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                                    >
                                        <Icon icon="solar:download-outline" width={18} />
                                        Bajar template
                                    </a>
                                </div>
                            </div>

                            <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Estructura
                                </p>
                                <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
                                    <p>
                                        `families`: nombre, slug, descripción,
                                        color, orden, visibilidad y media IDs.
                                    </p>
                                    <p>
                                        `subfamilies`: familia padre por slug,
                                        nombre, slug, descripciones, portada y
                                        visibilidad.
                                    </p>
                                    <p>
                                        `products`: familia, subfamilia, ficha
                                        completa, galerías, relacionados y
                                        `spec_tables_json`.
                                    </p>
                                    <p>
                                        `gallery_media_ids` va separado por comas.
                                    </p>
                                    <p>
                                        `related_product_slugs` va separado por
                                        comas.
                                    </p>
                                    <p>
                                        `spec_tables_json` acepta un array JSON con
                                        tablas, columnas y filas.
                                    </p>
                                </div>
                            </aside>
                        </div>
                    </section>
                ) : null}
            </div>
        </AdminLayout>
    );
}

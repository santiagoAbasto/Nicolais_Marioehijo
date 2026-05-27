import ImageUploadField from "@/Components/Admin/ImageUploadField";
import AdminLayout from "@/Layouts/AdminLayout";
import { useForm } from "@inertiajs/react";
import { Icon } from "@iconify/react";

function SwitchField({ checked, onChange, label }) {
    return (
        <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                    checked ? "bg-[#25A7CA]" : "bg-slate-300"
                }`}
            >
                <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
                        checked ? "translate-x-6" : "translate-x-1"
                    }`}
                />
            </button>
        </label>
    );
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

export default function EquipmentCategoryEdit({ category }) {
    const { data, setData, post, processing, errors } = useForm({
        name: category.name || "",
        slug: category.slug || "",
        order: category.order || "A",
        cover_image: null,
        cover_equipment_id: category.cover_equipment_id || "",
        show_in_home: !!category.show_in_home,
        is_active: !!category.is_active,
    });

    const submit = (event) => {
        event.preventDefault();
        post(`/admin/equipment-categories/${category.id}`, { forceFormData: true });
    };

    return (
        <AdminLayout>
            <form onSubmit={submit} className="space-y-6">
                <section className="flex items-center justify-between rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Editar categoría</h1>
                        <p className="mt-2 text-sm text-slate-500">{category.name}</p>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                    >
                        <Icon icon="solar:diskette-outline" width={18} />
                        Guardar cambios
                    </button>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),320px]">
                    <section className="space-y-5 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-slate-700">Nombre</span>
                                <input
                                    value={data.name}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setData("name", value);
                                        setData("slug", slugify(value));
                                    }}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </label>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-slate-700">Orden</span>
                                <input
                                    value={data.order}
                                    onChange={(event) => setData("order", event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </label>

                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-slate-700">Ficha principal</span>
                                <select
                                    value={data.cover_equipment_id}
                                    onChange={(event) => setData("cover_equipment_id", event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                                >
                                    {category.products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </section>

                    <aside className="space-y-5">
                        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900">Imagen de portada</h2>
                            <ImageUploadField
                                currentUrl={category.cover_image_url}
                                onChange={(file) => setData("cover_image", file)}
                                specs={{ maxMB: 5, formats: ["JPG", "PNG", "WEBP"] }}
                                error={errors.cover_image}
                            />
                        </section>

                        <section className="space-y-4 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                            <SwitchField checked={data.show_in_home} onChange={(value) => setData("show_in_home", value)} label="Mostrar en Home" />
                            <SwitchField checked={data.is_active} onChange={(value) => setData("is_active", value)} label="Activa" />
                        </section>
                    </aside>
                </div>
            </form>
        </AdminLayout>
    );
}

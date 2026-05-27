import ImageUploadField from "@/Components/Admin/ImageUploadField";
import RichTextEditor from "@/Components/Admin/RichTextEditor";
import AdminLayout from "@/Layouts/AdminLayout";
import { useForm } from "@inertiajs/react";
import { Icon } from "@iconify/react";

function ToggleField({ checked, onChange, label }) {
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

function FeaturesInput({ value, onChange }) {
    const text = value.join("\n");
    return (
        <textarea
            value={text}
            onChange={(event) => onChange(event.target.value.split("\n").map((item) => item.trim()))}
            rows={6}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
            placeholder="Una característica por línea"
        />
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

export default function EquipmentsCreate({ categories, nextOrder = "A" }) {
    const { data, setData, post, processing, errors } = useForm({
        title: "",
        slug: "",
        equipment_category_id: categories[0]?.id ?? "",
        description: "",
        main_image: null,
        features: [],
        show_in_home: false,
        order: nextOrder,
        is_active: true,
    });

    const submit = (event) => {
        event.preventDefault();
        post("/admin/equipments", { forceFormData: true });
    };

    return (
        <AdminLayout>
            <form onSubmit={submit} className="space-y-6">
                <section className="flex items-center justify-between rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Nuevo equipo</h1>
                        <p className="mt-2 text-sm text-slate-500">Alta completa de equipo y contenido rico.</p>
                    </div>
                    <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1d96b8] disabled:opacity-60">
                        <Icon icon="solar:diskette-outline" width={18} />
                        Guardar
                    </button>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),320px]">
                    <section className="space-y-5 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-slate-700">Título</span>
                                <input
                                    value={data.title}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setData("title", value);
                                        setData("slug", slugify(value));
                                    }}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                                {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                            </label>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-slate-700">Categoría</span>
                                <select value={data.equipment_category_id} onChange={(e) => setData("equipment_category_id", e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10">
                                    <option value="">Seleccionar</option>
                                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                                </select>
                                {errors.equipment_category_id && <p className="text-xs text-red-500">{errors.equipment_category_id}</p>}
                            </label>
                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-slate-700">Orden</span>
                                <input value={data.order} onChange={(e) => setData("order", e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10" />
                            </label>
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-medium text-slate-700">Descripción</p>
                            <RichTextEditor value={data.description} onChange={(value) => setData("description", value)} />
                        </div>

                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Características</span>
                            <FeaturesInput value={data.features} onChange={(value) => setData("features", value)} />
                        </label>
                    </section>

                    <aside className="space-y-5">
                        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900">Imagen principal</h2>
                            <ImageUploadField onChange={(file) => setData("main_image", file)} specs={{ maxMB: 5, formats: ["JPG", "PNG", "WEBP"] }} error={errors.main_image} />
                        </section>

                        <section className="space-y-4 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                            <ToggleField checked={data.show_in_home} onChange={(value) => setData("show_in_home", value)} label="Mostrar en Home" />
                            <ToggleField checked={data.is_active} onChange={(value) => setData("is_active", value)} label="Activo" />
                        </section>
                    </aside>
                </div>
            </form>
        </AdminLayout>
    );
}

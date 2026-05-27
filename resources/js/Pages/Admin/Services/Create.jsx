import ImageUploadField from "@/Components/Admin/ImageUploadField";
import RichTextEditor from "@/Components/Admin/RichTextEditor";
import AdminLayout from "@/Layouts/AdminLayout";
import { useForm } from "@inertiajs/react";
import { Icon } from "@iconify/react";

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function ServiceForm({ data, setData, errors }) {
    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),320px]">
            <section className="space-y-5 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Contenido</h2>
                    <p className="mt-1 text-sm text-slate-500">Completá el servicio sin hardcodear contenido.</p>
                </div>

                <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Título</span>
                    <input
                        value={data.title}
                        onChange={(event) => {
                            const value = event.target.value;
                            setData("title", value);
                            setData("slug", slugify(value));
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                    />
                    {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Orden</span>
                        <input
                            value={data.order}
                            onChange={(event) => setData("order", event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                        />
                        <p className="text-xs text-slate-400">Se sugiere automáticamente el siguiente orden disponible.</p>
                    </label>
                </div>

                <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Subtítulo</span>
                    <input
                        value={data.subtitle}
                        onChange={(event) => setData("subtitle", event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                    />
                </label>

                <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Descripción</p>
                    <RichTextEditor value={data.description} onChange={(value) => setData("description", value)} />
                    {errors.description && <p className="mt-2 text-xs text-red-500">{errors.description}</p>}
                </div>
            </section>

            <aside className="space-y-5">
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900">Imagen</h2>
                    <ImageUploadField
                        onChange={(file) => setData("image", file)}
                        specs={{ maxMB: 5, formats: ["JPG", "PNG", "WEBP"] }}
                        error={errors.image}
                    />
                </section>

                <section className="space-y-4 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Visibilidad</h2>
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <input type="checkbox" checked={data.show_in_home} onChange={(event) => setData("show_in_home", event.target.checked)} />
                        <span className="text-sm font-medium text-slate-700">Mostrar en Home</span>
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <input type="checkbox" checked={data.is_active} onChange={(event) => setData("is_active", event.target.checked)} />
                        <span className="text-sm font-medium text-slate-700">Activo</span>
                    </label>
                </section>
            </aside>
        </div>
    );
}

export default function ServicesCreate({ nextOrder = "A" }) {
    const { data, setData, post, processing, errors } = useForm({
        title: "",
        slug: "",
        subtitle: "",
        description: "",
        image: null,
        order: nextOrder,
        show_in_home: false,
        is_active: true,
    });

    const submit = (event) => {
        event.preventDefault();
        post("/admin/services", { forceFormData: true });
    };

    return (
        <AdminLayout>
            <form onSubmit={submit} className="space-y-6">
                <section className="flex items-center justify-between rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Nuevo servicio</h1>
                        <p className="mt-2 text-sm text-slate-500">Alta de contenido para la web pública y el Home.</p>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                    >
                        <Icon icon="solar:diskette-outline" width={18} />
                        Guardar
                    </button>
                </section>

                <ServiceForm data={data} setData={setData} errors={errors} />
            </form>
        </AdminLayout>
    );
}

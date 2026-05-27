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

export default function ProjectsCreate({ nextOrder = "A" }) {
    const { data, setData, post, processing, errors } = useForm({
        title: "",
        slug: "",
        description: "",
        cover_image: null,
        gallery_images: [],
        order: nextOrder,
        show_in_home: false,
        is_active: true,
    });

    const submit = (event) => {
        event.preventDefault();
        post("/admin/projects", { forceFormData: true });
    };

    return (
        <AdminLayout>
            <form onSubmit={submit} className="space-y-6">
                <section className="flex items-center justify-between rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Nuevo proyecto</h1>
                        <p className="mt-2 text-sm text-slate-500">Alta de trabajo realizado con portada y galería posterior.</p>
                    </div>
                    <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1d96b8] disabled:opacity-60">
                        <Icon icon="solar:diskette-outline" width={18} />
                        Guardar
                    </button>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),320px]">
                    <section className="space-y-5 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Título</span><input value={data.title} onChange={(e) => { const value = e.target.value; setData("title", value); setData("slug", slugify(value)); }} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10" />{errors.title && <p className="text-xs text-red-500">{errors.title}</p>}</label>
                        </div>
                        <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Orden</span><input value={data.order} onChange={(e) => setData("order", e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10" /><p className="text-xs text-slate-400">Se sugiere automáticamente el siguiente orden disponible.</p></label>
                        <div><p className="mb-2 text-sm font-medium text-slate-700">Descripción</p><RichTextEditor value={data.description} onChange={(value) => setData("description", value)} /></div>
                    </section>
                    <aside className="space-y-5">
                        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900">Portada</h2>
                            <ImageUploadField onChange={(file) => setData("cover_image", file)} specs={{ maxMB: 5, formats: ["JPG", "PNG", "WEBP"] }} error={errors.cover_image} />
                        </section>
                        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900">Galería</h2>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => setData("gallery_images", Array.from(e.target.files || []))}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-3 file:font-medium file:text-[#25A7CA]"
                            />
                            <p className="mt-2 text-xs text-slate-400">
                                Puedes subir varias imágenes y se guardan junto con el proyecto.
                            </p>
                            {data.gallery_images.length > 0 && (
                                <p className="mt-2 text-xs font-medium text-slate-600">
                                    {data.gallery_images.length} imagen{data.gallery_images.length === 1 ? "" : "es"} lista{data.gallery_images.length === 1 ? "" : "s"} para subir.
                                </p>
                            )}
                            {errors.gallery_images && <p className="mt-2 text-xs text-red-500">{errors.gallery_images}</p>}
                        </section>
                        <section className="space-y-4 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><input type="checkbox" checked={data.show_in_home} onChange={(e) => setData("show_in_home", e.target.checked)} /><span className="text-sm font-medium text-slate-700">Mostrar en Home</span></label>
                            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><input type="checkbox" checked={data.is_active} onChange={(e) => setData("is_active", e.target.checked)} /><span className="text-sm font-medium text-slate-700">Activo</span></label>
                        </section>
                    </aside>
                </div>
            </form>
        </AdminLayout>
    );
}

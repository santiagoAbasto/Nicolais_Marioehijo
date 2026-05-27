import ImageUploadField from "@/Components/Admin/ImageUploadField";
import RichTextEditor from "@/Components/Admin/RichTextEditor";
import AdminLayout from "@/Layouts/AdminLayout";
import { router, useForm } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useState } from "react";

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

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export default function EquipmentsEdit({ equipment, categories }) {
    const { data, setData, post, processing, errors } = useForm({
        title: equipment.title || "",
        slug: equipment.slug || "",
        equipment_category_id: equipment.equipment_category_id || "",
        description: equipment.description || "",
        main_image: null,
        features: equipment.features || [],
        show_in_home: !!equipment.show_in_home,
        order: equipment.order || "A",
        is_active: !!equipment.is_active,
    });
    const [galleryFile, setGalleryFile] = useState(null);
    const [galleryProcessing, setGalleryProcessing] = useState(false);
    const [galleryError, setGalleryError] = useState("");

    const submit = (event) => {
        event.preventDefault();
        post(`/admin/equipments/${equipment.id}`, { forceFormData: true });
    };

    const uploadGallery = async () => {
        if (!galleryFile) return;
        const payload = new FormData();
        payload.append("image", galleryFile);
        setGalleryProcessing(true);
        setGalleryError("");

        try {
            await axios.post(`/admin/equipments/${equipment.id}/images`, payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setGalleryFile(null);
            router.reload({ only: ["equipment"] });
        } catch (requestError) {
            setGalleryError(requestError.response?.data?.message ?? "No se pudo subir la imagen.");
        } finally {
            setGalleryProcessing(false);
        }
    };

    const removeGalleryImage = async (imageId) => {
        if (!window.confirm("¿Eliminar esta imagen?")) {
            return;
        }

        setGalleryProcessing(true);
        setGalleryError("");

        try {
            await axios.delete(`/admin/equipment-images/${imageId}`);
            router.reload({ only: ["equipment"] });
        } catch (requestError) {
            setGalleryError(requestError.response?.data?.message ?? "No se pudo eliminar la imagen.");
        } finally {
            setGalleryProcessing(false);
        }
    };

    return (
        <AdminLayout>
            <form onSubmit={submit} className="space-y-6">
                <section className="flex items-center justify-between rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Editar equipo</h1>
                        <p className="mt-2 text-sm text-slate-500">{equipment.title}</p>
                    </div>
                    <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1d96b8] disabled:opacity-60">
                        <Icon icon="solar:diskette-outline" width={18} />
                        Guardar cambios
                    </button>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),320px]">
                    <section className="space-y-5 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Título</span><input value={data.title} onChange={(e) => { const value = e.target.value; setData("title", value); setData("slug", slugify(value)); }} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10" /></label>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-slate-700">Categoría</span>
                                <select value={data.equipment_category_id} onChange={(e) => setData("equipment_category_id", e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10">
                                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                                </select>
                            </label>
                            <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Orden</span><input value={data.order} onChange={(e) => setData("order", e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10" /></label>
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-medium text-slate-700">Descripción</p>
                            <RichTextEditor value={data.description} onChange={(value) => setData("description", value)} />
                        </div>

                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Características</span>
                            <textarea value={(data.features || []).join("\n")} onChange={(e) => setData("features", e.target.value.split("\n").map((item) => item.trim()))} rows={6} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10" />
                        </label>
                    </section>

                    <aside className="space-y-5">
                        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900">Imagen principal</h2>
                            <ImageUploadField currentUrl={equipment.main_image_url} onChange={(file) => setData("main_image", file)} specs={{ maxMB: 5, formats: ["JPG", "PNG", "WEBP"] }} error={errors.main_image} />
                        </section>
                        <section className="space-y-4 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                            <ToggleField checked={data.show_in_home} onChange={(value) => setData("show_in_home", value)} label="Mostrar en Home" />
                            <ToggleField checked={data.is_active} onChange={(value) => setData("is_active", value)} label="Activo" />
                        </section>
                    </aside>
                </div>

                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Galería</h2>
                            <p className="mt-1 text-sm text-slate-500">Cargá imágenes complementarias del equipo.</p>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),auto]">
                        <input type="file" accept="image/*" onChange={(e) => setGalleryFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-3 file:font-medium file:text-[#25A7CA]" />
                        <button type="button" disabled={galleryProcessing || !galleryFile} onClick={uploadGallery} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">
                            {galleryProcessing ? "Procesando..." : "Subir imagen"}
                        </button>
                    </div>
                    {galleryError && (
                        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {galleryError}
                        </div>
                    )}
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                        {equipment.images.map((image) => (
                            <div key={image.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <img src={image.image_url} alt="Galería" className="h-40 w-full rounded-2xl object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeGalleryImage(image.id)}
                                    className="mt-3 w-full rounded-xl border border-red-100 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50"
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </form>
        </AdminLayout>
    );
}

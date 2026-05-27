import ImageUploadField from "@/Components/Admin/ImageUploadField";
import { emitAdminToast } from "@/lib/adminToast";
import AdminLayout from "@/Layouts/AdminLayout";
import { router, useForm } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useState } from "react";

function SwitchButton({ checked, onClick, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={onClick}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                checked ? "bg-emerald-500" : "bg-slate-300"
            }`}
        >
            <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    checked ? "translate-x-6" : "translate-x-1"
                }`}
            />
        </button>
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

export default function EquipmentCategoriesIndex({ categories, nextOrder = "A" }) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const { data, setData, reset } = useForm({
        name: "",
        slug: "",
        order: nextOrder,
        cover_image: null,
        show_in_home: false,
        is_active: true,
    });

    const submit = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setError("");

        try {
            const payload = new FormData();
            payload.append("name", data.name);
            payload.append("slug", slugify(data.name));
            payload.append("order", data.order);
            payload.append("show_in_home", data.show_in_home ? "1" : "0");
            payload.append("is_active", data.is_active ? "1" : "0");

            if (data.cover_image) {
                payload.append("cover_image", data.cover_image);
            }

            await axios.post("/admin/equipment-categories", payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            reset();
            setOpen(false);
            emitAdminToast("La categoría se guardó correctamente.", "success");
            router.reload({ preserveScroll: true });
        } catch (requestError) {
            const message = requestError.response?.data?.message ?? "No se pudo guardar la categoría.";
            setError(message);
            emitAdminToast(message, "error");
        } finally {
            setProcessing(false);
        }
    };

    const toggleActive = async (category) => {
        setProcessing(true);
        setError("");

        try {
            await axios.post(`/admin/equipment-categories/${category.id}`, {
                name: category.name,
                slug: category.slug,
                order: category.order,
                show_in_home: category.show_in_home,
                is_active: !category.is_active,
            });
            emitAdminToast("El estado de la categoría se actualizó.", "success");
            router.reload({ preserveScroll: true });
        } catch (requestError) {
            const message = requestError.response?.data?.message ?? "No se pudo actualizar la categoría.";
            setError(message);
            emitAdminToast(message, "error");
        } finally {
            setProcessing(false);
        }
    };

    const toggleHome = async (category) => {
        setProcessing(true);
        setError("");

        try {
            await axios.post(`/admin/equipment-categories/${category.id}`, {
                name: category.name,
                slug: category.slug,
                order: category.order,
                show_in_home: !category.show_in_home,
                is_active: category.is_active,
                cover_equipment_id: category.cover_equipment_id,
            });
            emitAdminToast("La visibilidad en Home se actualizó.", "success");
            router.reload({ preserveScroll: true });
        } catch (requestError) {
            const message = requestError.response?.data?.message ?? "No se pudo actualizar la visibilidad en Home.";
            setError(message);
            emitAdminToast(message, "error");
        } finally {
            setProcessing(false);
        }
    };

    const updateCover = async (category, coverEquipmentId) => {
        setProcessing(true);
        setError("");

        try {
            await axios.post(`/admin/equipment-categories/${category.id}`, {
                name: category.name,
                slug: category.slug,
                order: category.order,
                show_in_home: category.show_in_home,
                is_active: category.is_active,
                cover_equipment_id: coverEquipmentId,
            });
            emitAdminToast("La ficha principal se actualizó.", "success");
            router.reload({ preserveScroll: true });
        } catch (requestError) {
            const message = requestError.response?.data?.message ?? "No se pudo actualizar la ficha principal.";
            setError(message);
            emitAdminToast(message, "error");
        } finally {
            setProcessing(false);
        }
    };

    const destroy = async (category) => {
        if (!window.confirm(`¿Eliminar la categoría "${category.name}"? También se eliminarán sus productos.`)) {
            return;
        }

        setProcessing(true);
        setError("");

        try {
            await axios.delete(`/admin/equipment-categories/${category.id}`);
            emitAdminToast("La categoría se eliminó correctamente.", "success");
            router.reload({ preserveScroll: true });
        } catch (requestError) {
            const message = requestError.response?.data?.message ?? "No se pudo eliminar la categoría.";
            setError(message);
            emitAdminToast(message, "error");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Categorías de equipos</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Organiza los productos por familia, por ejemplo categorías, líneas o tipos de servicio.
                            </p>
                        </div>

                        <button
                            onClick={() => setOpen((current) => !current)}
                            className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1d96b8]"
                        >
                            {open ? "Cerrar" : "Nueva categoría"}
                        </button>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Total</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{categories.length}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Activas</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{categories.filter((category) => category.is_active).length}</p>
                        </div>
                    </div>
                </section>

                {open && (
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <form onSubmit={submit} className="grid gap-4 md:grid-cols-5">
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-slate-700">Nombre</span>
                                <input
                                    value={data.name}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setData((current) => ({
                                            ...current,
                                            name: value,
                                            slug: slugify(value),
                                        }));
                                    }}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-slate-700">Orden</span>
                                <input
                                    value={data.order}
                                    onChange={(event) => setData("order", event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                                />
                            </label>
                            <div className="flex items-end">
                                <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">Mostrar en Home</span>
                                        <SwitchButton
                                            checked={data.show_in_home}
                                            onClick={() => setData("show_in_home", !data.show_in_home)}
                                            label="Mostrar categoría en Home"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-5">
                                <ImageUploadField
                                    label="Foto de la portada"
                                    onChange={(file) => setData("cover_image", file)}
                                    specs={{ maxMB: 5, formats: ["JPG", "PNG", "WEBP"] }}
                                />
                                <p className="mt-2 text-xs text-slate-400">
                                    Al crear la categoría se genera su ficha principal con esta imagen y con el slug tomado del nombre.
                                </p>
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
                                >
                                    Guardar categoría
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-medium">Categoría</th>
                                    <th className="px-5 py-4 font-medium">Portada</th>
                                    <th className="px-5 py-4 font-medium">Ficha principal</th>
                                    <th className="px-5 py-4 font-medium">Slug</th>
                                    <th className="px-5 py-4 font-medium">Orden</th>
                                    <th className="px-5 py-4 font-medium">Productos</th>
                                    <th className="px-5 py-4 font-medium">Home</th>
                                    <th className="px-5 py-4 font-medium">Estado</th>
                                    <th className="px-5 py-4 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {categories.map((category) => (
                                    <tr key={category.id} className="transition hover:bg-slate-50">
                                        <td className="px-5 py-4 font-medium text-slate-800">{category.name}</td>
                                        <td className="px-5 py-4">
                                            {category.cover ? (
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={category.cover.image_url}
                                                        alt={category.cover.title}
                                                        className="h-12 w-12 rounded-2xl border border-slate-200 bg-white object-contain p-1"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700">{category.cover.title}</p>
                                                        <p className={`text-xs ${category.cover.has_real_image ? "text-emerald-600" : "text-amber-600"}`}>
                                                            {category.cover.has_real_image ? "Imagen cargada" : "Falta subir imagen"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">Sin portada</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            {category.products.length > 0 ? (
                                                <select
                                                    value={category.cover_equipment_id ?? ""}
                                                    onChange={(event) => updateCover(category, event.target.value)}
                                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
                                                >
                                                    {category.products.map((product) => (
                                                        <option key={product.id} value={product.id}>
                                                            {product.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-xs text-slate-400">Sin fichas cargadas</span>
                                            )}
                                            <p className="mt-2 text-xs text-slate-400">
                                                Aquí eliges qué ficha representa a toda la categoría en la web pública.
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 text-slate-500">{category.slug}</td>
                                        <td className="px-5 py-4 text-slate-500">{category.order}</td>
                                        <td className="px-5 py-4 text-slate-500">{category.equipments_count}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <SwitchButton
                                                    checked={category.show_in_home}
                                                    onClick={() => toggleHome(category)}
                                                    label={`Mostrar categoría ${category.name} en Home`}
                                                />
                                                <span className={`text-xs font-semibold ${category.show_in_home ? "text-emerald-700" : "text-slate-500"}`}>
                                                    {category.show_in_home ? "Visible" : "Oculta"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <SwitchButton
                                                    checked={category.is_active}
                                                    onClick={() => toggleActive(category)}
                                                    label={`Activar categoría ${category.name}`}
                                                />
                                                <span className={`text-xs font-semibold ${category.is_active ? "text-emerald-700" : "text-slate-500"}`}>
                                                    {category.is_active ? "Activa" : "Oculta"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                {category.cover && (
                                                    <button
                                                        type="button"
                                                        onClick={() => router.visit(`/admin/equipment-categories/${category.id}/edit`)}
                                                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-[#25A7CA] hover:text-[#25A7CA]"
                                                    >
                                                        Editar categoría
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => destroy(category)}
                                                    className="rounded-xl border border-red-100 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50"
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
                </section>

                {error && (
                    <section className="rounded-[24px] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
                        {error}
                    </section>
                )}
            </div>
        </AdminLayout>
    );
}

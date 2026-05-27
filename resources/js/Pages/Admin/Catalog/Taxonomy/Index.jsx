import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm, Link } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import ImageUploadField from "@/Components/Admin/ImageUploadField";

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
                onClick={onClose} 
            />
            <div className="relative z-10 flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl transition-all">
                <div className="shrink-0 border-b border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#f6f9fb_100%)] px-8 py-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
                        <button 
                            type="button"
                            onClick={onClose} 
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
                        >
                            <Icon icon="solar:close-circle-outline" width={22} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 pt-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

function InputField({ label, ...props }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold tracking-tight text-slate-900">{label}</label>
            <input
                {...props}
                className="block w-full rounded-2xl border-transparent bg-slate-50 px-4 py-3 text-sm transition-all focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
            />
        </div>
    );
}

function TextareaField({ label, ...props }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold tracking-tight text-slate-900">{label}</label>
            <textarea
                {...props}
                className="block w-full rounded-2xl border-transparent bg-slate-50 px-4 py-3 text-sm transition-all focus:border-[#25A7CA] focus:bg-white focus:ring-4 focus:ring-[#25A7CA]/10"
            />
        </div>
    );
}

function ToggleRow({ id, label, description, checked, onChange }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                <Icon icon="solar:eye-outline" width={18} className="text-[#25A7CA]" />
            </div>
            <div className="flex-1">
                <label htmlFor={id} className="block text-sm font-semibold text-slate-900">{label}</label>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
                <input
                    id={id}
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#25A7CA] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#25A7CA]/20"></div>
            </label>
        </div>
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

export default function TaxonomyIndex({ families }) {
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [isLineModalOpen, setIsLineModalOpen] = useState(false);
    const [editingLine, setEditingLine] = useState(null);

    // Initial pre-selection
    useEffect(() => {
        if (families.length > 0 && !selectedFamily) {
            setSelectedFamily(families[0]);
        } else if (selectedFamily) {
            const updated = families.find(f => f.id === selectedFamily.id);
            if (updated) setSelectedFamily(updated);
            else setSelectedFamily(null);
        }
    }, [families]);

    const familyForm = useForm({
        id: null,
        name: "",
        slug: "",
        intro_title: "",
        intro_text: "",
        is_active: true,
        sort_order: "",
    });

    const lineForm = useForm({
        id: null,
        name: "",
        slug: "",
        intro_title: "",
        intro_text: "",
        is_active: true,
        show_on_home: false,
        sort_order: "",
        hero_media_file: null,
        hero_media_url: null,
    });

    const openFamilyModal = (family = null) => {
        if (family) {
            familyForm.setData({
                id: family.id,
                name: family.name,
                slug: family.slug || "",
                intro_title: family.intro_title || "",
                intro_text: family.intro_text || "",
                is_active: family.is_active,
                sort_order: family.sort_order || "",
            });
        } else {
            familyForm.clearErrors();
            familyForm.setData({
                id: null,
                name: "",
                slug: "",
                intro_title: "",
                intro_text: "",
                is_active: true,
                sort_order: "",
            });
        }
        setIsFamilyModalOpen(true);
    };

    const saveFamily = (e) => {
        e.preventDefault();
        const opts = { onSuccess: () => setIsFamilyModalOpen(false) };
        if (familyForm.data.id) {
            familyForm.put(`/admin/productos/taxonomia/familias/${familyForm.data.id}`, opts);
        } else {
            familyForm.post('/admin/productos/taxonomia/familias', opts);
        }
    };

    const deleteFamily = () => {
        if (confirm("¿Estás seguro de eliminar esta familia de forma permanente?")) {
            router.delete(`/admin/productos/taxonomia/familias/${selectedFamily.id}`);
        }
    };

    const openLineModal = (line = null) => {
        if (line) {
            lineForm.setData({
                id: line.id,
                name: line.name,
                slug: line.slug || "",
                intro_title: line.intro_title || "",
                intro_text: line.intro_text || "",
                is_active: line.is_active,
                show_on_home: line.show_on_home ?? false,
                sort_order: line.sort_order || "",
                hero_media_file: null,
                hero_media_url: line.hero_media_url || null,
            });
            setEditingLine(line);
        } else {
            lineForm.clearErrors();
            lineForm.setData({
                id: null,
                name: "",
                slug: "",
                intro_title: "",
                intro_text: "",
                is_active: true,
                show_on_home: false,
                sort_order: "",
                hero_media_file: null,
                hero_media_url: null,
            });
            setEditingLine(null);
        }
        setIsLineModalOpen(true);
    };

    const saveLine = (e) => {
        e.preventDefault();
        const opts = { 
            onSuccess: () => setIsLineModalOpen(false),
            forceFormData: true 
        };
        if (lineForm.data.id) {
            lineForm.transform((data) => ({
                ...data,
                _method: 'put',
            }));
            lineForm.post(`/admin/productos/taxonomia/lineas/${lineForm.data.id}`, opts);
        } else {
            lineForm.transform((data) => {
                const payload = { ...data };
                delete payload._method;
                return payload;
            });
            lineForm.post(`/admin/productos/taxonomia/familias/${selectedFamily.id}/lineas`, opts);
        }
    };

    const deleteLine = (lineId) => {
        if (confirm("¿Estás seguro de eliminar esta línea de forma permanente?")) {
            router.delete(`/admin/productos/taxonomia/lineas/${lineId}`);
        }
    };

    return (
        <AdminLayout>
            <Head title="Estructura de productos" />

            <div className="space-y-6">
                
                {/* Premium Header Header */}
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.18),_transparent_34%),linear-gradient(135deg,#ffffff_0%,#f6f9fb_48%,#eef8fb_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#117a98]">
                                    <Icon icon="solar:folder-open-bold" width={14} />
                                    Estructura del catálogo
                                </div>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Familias y líneas principales
                                </h1>
                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    Acá definís la estructura inicial del catálogo: la familia principal y la línea a la que entra el usuario desde la portada de productos, como "Níquel y sus aleaciones".
                                </p>
                            </div>
                            <button
                                onClick={() => openFamilyModal()}
                                className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#1f8da8] hover:shadow-[0_12px_20px_-4px_rgba(37,167,202,0.4)]"
                            >
                                <Icon icon="solar:add-circle-bold" width={18} />
                                Nueva Familia
                            </button>
                        </div>
                    </div>
                </section>

                <div className="flex flex-col gap-6 lg:flex-row">
                    {/* Families Sidebar Module */}
                    <div className="w-full lg:w-1/3 xl:w-1/4">
                        <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-4 px-3 flex items-center justify-between">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Familias</h2>
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 border border-slate-200">
                                    {families.length}
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                {families.map((family) => {
                                    const isActive = selectedFamily?.id === family.id;
                                    return (
                                        <button
                                            key={family.id}
                                            onClick={() => setSelectedFamily(family)}
                                            className={`group relative flex w-full items-center justify-between overflow-hidden rounded-[20px] px-4 py-3.5 text-left font-semibold transition-all ${
                                                isActive
                                                    ? 'bg-[#25A7CA] text-white shadow-md'
                                                    : 'bg-transparent text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="relative z-10 flex items-center gap-3">
                                                <Icon 
                                                    icon="solar:box-minimalistic-bold-duotone" 
                                                    width={20} 
                                                    className={isActive ? "text-[#9ae6fb]" : "text-slate-400 group-hover:text-[#25A7CA] transition"} 
                                                />
                                                {family.name}
                                            </span>
                                            <div className="relative z-10 flex items-center gap-2">
                                                <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-[#1f8da8]/50 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    {family.sort_order}
                                                </span>
                                            </div>
                                            {isActive && (
                                                <div className="absolute right-[-10px] top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-white/10 blur-xl" />
                                            )}
                                        </button>
                                    );
                                })}
                                {families.length === 0 && (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                                        <Icon icon="solar:ghost-outline" width={32} className="mb-2 text-slate-300" />
                                        <p className="text-sm font-medium text-slate-500">No hay familias</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Editor Module */}
                    <div className="flex-1">
                        {selectedFamily ? (
                            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                                
                                {/* Family Header Context */}
                                <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-8 md:flex-row md:items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]">
                                            <Icon icon="solar:folder-with-files-bold-duotone" width={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{selectedFamily.name}</h2>
                                            <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                                                <code className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600">/{selectedFamily.slug}</code>
                                                {selectedFamily.is_active ? (
                                                    <span className="flex items-center gap-1.5 text-green-600"><span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Visible</span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span> Oculta</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button
                                            onClick={() => openFamilyModal(selectedFamily)}
                                            className="flex-1 justify-center inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 md:flex-none"
                                        >
                                            <Icon icon="solar:pen-outline" width={16} />
                                            Editar Familia
                                        </button>
                                        <button
                                            onClick={deleteFamily}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                                            title="Eliminar Familia"
                                        >
                                            <Icon icon="solar:trash-bin-trash-outline" width={18} />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>

                                {/* Lines Section */}
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="text-lg font-bold tracking-tight text-slate-900">Pantallas del primer nivel</h3>
                                    <button
                                        onClick={() => openLineModal()}
                                        className="inline-flex items-center gap-2 rounded-[18px] bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-800"
                                    >
                                        <Icon icon="solar:add-square-bold" width={18} />
                                        Añadir Línea
                                    </button>
                                </div>

                                {selectedFamily.lines.length > 0 ? (
                                    <div className="grid gap-3">
                                        {selectedFamily.lines.map((line) => (
                                            <div key={line.id} className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-center">
                                                <div className="mb-4 sm:mb-0">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="font-bold text-slate-900">{line.name}</h4>
                                                        <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
                                                            <Icon icon="solar:sort-from-bottom-to-top-bold" width={12} />
                                                            {line.sort_order}
                                                        </span>
                                                        {line.show_on_home && (
                                                            <span className="rounded-md bg-[#25A7CA]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#117a98]">
                                                                Home
                                                            </span>
                                                        )}
                                                        {!line.is_active && (
                                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">Inactivo</span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                                                        <Icon icon="solar:link-circle-outline" width={16} className="text-slate-400" />
                                                        /{line.slug}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/admin/productos/taxonomia/lineas/${line.id}/series`}
                                                        className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#25A7CA]/10 px-4 text-sm font-semibold text-[#117a98] transition hover:bg-[#25A7CA]/20"
                                                    >
                                                        <Icon icon="solar:layers-outline" width={15} />
                                                        Series
                                                    </Link>
                                                    <button
                                                        onClick={() => openLineModal(line)}
                                                        className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#25A7CA]"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => deleteLine(line.id)}
                                                        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white"
                                                    >
                                                        <Icon icon="solar:trash-bin-trash-bold" width={18} />
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center transition hover:border-[#25A7CA]/30">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-900/5">
                                            <Icon icon="solar:archive-linear" width={32} className="text-slate-400" />
                                        </div>
                                        <h4 className="text-base font-bold text-slate-900">Esta familia está vacía</h4>
                                        <p className="mt-1 max-w-sm text-sm text-slate-500">Aún no se han configurado líneas internas. Presiona "Añadir Línea" para comenzar.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
                                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[32px] bg-slate-50 shadow-inner">
                                    <Icon icon="solar:cursor-square-outline" width={40} className="text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight text-slate-900">Selecciona una Familia</h3>
                                <p className="mt-2 max-w-sm text-sm text-slate-500">
                                    Haz clic sobre una de las tarjetas de la izquierda para desplegar sus líneas internas y opciones de edición.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Family Editor Modal */}
            <Modal isOpen={isFamilyModalOpen} onClose={() => setIsFamilyModalOpen(false)} title={familyForm.data.id ? "Editar Familia" : "Nueva Familia"}>
                <form onSubmit={saveFamily} className="space-y-5">
                    <InputField
                        label="Nombre de la Familia"
                        placeholder="Ej: Metálicos"
                        value={familyForm.data.name}
                        onChange={(e) => {
                            const value = e.target.value;
                            familyForm.setData((current) => ({ ...current, name: value, slug: slugify(value) }));
                        }}
                        required
                    />
                    {familyForm.errors.name && <p className="mt-1 text-xs text-red-500">{familyForm.errors.name}</p>}
                    
                    <InputField
                        label="Orden Excel (Ej: 10, 20, 30)"
                        type="text"
                        placeholder="10"
                        value={familyForm.data.sort_order}
                        onChange={(e) => familyForm.setData("sort_order", e.target.value)}
                    />
                    
                    <InputField
                        label="Título visible en la pantalla de la familia"
                        placeholder="Título opcional para esa pantalla"
                        value={familyForm.data.intro_title}
                        onChange={(e) => familyForm.setData("intro_title", e.target.value)}
                    />
                    
                    <TextareaField
                        label="Texto Introductorio"
                        placeholder="Breve descripción de la familia..."
                        rows={3}
                        value={familyForm.data.intro_text}
                        onChange={(e) => familyForm.setData("intro_text", e.target.value)}
                    />

                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                            <Icon icon="solar:eye-outline" width={18} className="text-[#25A7CA]" />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="f_is_active" className="block text-sm font-semibold text-slate-900">Visibilidad Pública</label>
                            <p className="text-xs text-slate-500">¿Esta familia es navegable por los clientes?</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                id="f_is_active"
                                type="checkbox"
                                className="peer sr-only"
                                checked={familyForm.data.is_active}
                                onChange={(e) => familyForm.setData("is_active", e.target.checked)}
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#25A7CA] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#25A7CA]/20"></div>
                        </label>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsFamilyModalOpen(false)} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Cancelar</button>
                        <button type="submit" disabled={familyForm.processing} className="rounded-xl bg-[#25A7CA] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#1f8da8] focus:ring disabled:opacity-50">
                            {familyForm.processing ? "Guardando..." : "Guardar Familia"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Line Editor Modal */}
            <Modal isOpen={isLineModalOpen} onClose={() => setIsLineModalOpen(false)} title={lineForm.data.id ? "Editar Línea" : "Nueva Línea"}>
                <form onSubmit={saveLine} className="space-y-5">
                    {editingLine ? (
                        <div className="rounded-2xl border border-[#25A7CA]/20 bg-[#25A7CA]/5 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Datos actuales cargados</p>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Título actual</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{editingLine.intro_title || "Sin título cargado"}</p>
                                </div>
                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Texto actual</p>
                                    <p className="mt-1 line-clamp-3 text-sm text-slate-600">{editingLine.intro_text || "Sin texto cargado"}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Link
                                    href={`/admin/productos/contenido-tecnico?line=${editingLine.id}`}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                >
                                    Ver textos actuales
                                </Link>
                                <Link
                                    href={`/admin/productos/composicion-quimica?line=${editingLine.id}`}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                >
                                    Ver composición actual
                                </Link>
                            </div>
                        </div>
                    ) : null}

                    <div className="mb-4">
                        <ImageUploadField
                            label="Imagen de la tarjeta en el index"
                            currentUrl={lineForm.data.hero_media_url}
                            onChange={(file) => lineForm.setData('hero_media_file', file)}
                            specs={{ width: 392, height: 240, maxMB: 10, recommendedMBText: "entre 2 y 4 MB", formats: ["JPG", "PNG", "WEBP"] }}
                            error={lineForm.errors.hero_media_file}
                        />
                    </div>
                    <InputField
                        label="Nombre interno de la pantalla"
                        placeholder="Ej: Níquel y sus aleaciones"
                        value={lineForm.data.name}
                        onChange={(e) => {
                            const value = e.target.value;
                            lineForm.setData((current) => ({ ...current, name: value, slug: slugify(value) }));
                        }}
                        required
                    />
                    
                    <InputField
                        label="Orden Excel (Ej: 10, 20, 30)"
                        type="text"
                        placeholder="10"
                        value={lineForm.data.sort_order}
                        onChange={(e) => lineForm.setData("sort_order", e.target.value)}
                    />
                    
                    <InputField
                        label="Título visible al entrar a esta pantalla"
                        placeholder="Ej: Aleaciones de níquel"
                        value={lineForm.data.intro_title}
                        onChange={(e) => lineForm.setData("intro_title", e.target.value)}
                    />

                    <TextareaField
                        label="Texto debajo del título"
                        placeholder="Descripción corta que se ve arriba de la grilla..."
                        rows={3}
                        value={lineForm.data.intro_text}
                        onChange={(e) => lineForm.setData("intro_text", e.target.value)}
                    />

                    <ToggleRow
                        id="l_show_on_home"
                        label="Mostrar en home"
                        description="Controla si esta línea aparece en las tarjetas de la home pública."
                        checked={lineForm.data.show_on_home}
                        onChange={(checked) => lineForm.setData("show_on_home", checked)}
                    />

                    <ToggleRow
                        id="l_is_active"
                        label="Visible en la web"
                        description="Si está activo, esta pantalla se puede navegar desde el catálogo público."
                        checked={lineForm.data.is_active}
                        onChange={(checked) => lineForm.setData("is_active", checked)}
                    />

                    <div className="mt-8 flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsLineModalOpen(false)} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Cancelar</button>
                        <button type="submit" disabled={lineForm.processing} className="rounded-xl bg-[#25A7CA] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#1f8da8] focus:ring disabled:opacity-50">
                            {lineForm.processing ? "Guardando..." : "Guardar Línea"}
                        </button>
                    </div>
                </form>
            </Modal>

        </AdminLayout>
    );
}

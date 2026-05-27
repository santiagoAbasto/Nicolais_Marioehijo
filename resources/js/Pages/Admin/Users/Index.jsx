import AdminLayout from "@/Layouts/AdminLayout";
import ImageUploadField from "@/Components/Admin/ImageUploadField";
import { Head, useForm, usePage } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

/* ── Modal crear / editar usuario ───────────────────────────── */
function UserModal({ user, onClose, principalId, canManageUsers = false }) {
    const isEdit = !!user;
    const isPrincipal = user?.id === principalId;
    const isProtectedSuperAdmin = isEdit && canManageUsers && isPrincipal;
    const passwordOnly = isEdit && !canManageUsers;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:                  user?.name     || "",
        email:                 user?.email    || "",
        password:              "",
        password_confirmation: "",
        avatar:                null,
        remove_avatar:         false,
        can_access_admin:      user?.can_access_admin ?? true,
    });
    const [previewAvatar, setPreviewAvatar] = useState(user?.avatar_url || null);

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(`/admin/users/${user.id}`, {
                forceFormData: true,
                onSuccess: () => { reset(); onClose(); },
            });
        } else {
            post("/admin/users", {
                forceFormData: true,
                onSuccess: () => { reset(); onClose(); },
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800 text-base">
                        {passwordOnly ? "Actualizar contraseña" : isProtectedSuperAdmin ? "Editar superadmin" : isEdit ? "Editar usuario" : "Nuevo usuario admin"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icon icon="solar:close-circle-outline" width={20} />
                    </button>
                </div>

                <form onSubmit={submit} className="px-6 py-5 space-y-4">
                    {passwordOnly ? (
                        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm leading-6 text-slate-600">
                            Tu usuario está protegido. Solo podés actualizar tu contraseña; la gestión de usuarios queda reservada al superadmin.
                        </div>
                    ) : isProtectedSuperAdmin ? (
                        <>
                            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm leading-6 text-slate-600">
                                El superadmin está protegido: no puede eliminarse ni perder acceso. Desde acá podés actualizar su foto y contraseña.
                            </div>

                            <div>
                                <ImageUploadField
                                    label="Foto de perfil"
                                    currentUrl={previewAvatar}
                                    onChange={(file) => {
                                        setData("avatar", file);
                                        setData("remove_avatar", false);
                                        if (file) {
                                            setPreviewAvatar(URL.createObjectURL(file));
                                        }
                                    }}
                                    specs={{ maxMB: 5, formats: ["JPG", "PNG", "WEBP", "SVG"] }}
                                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                                    error={errors.avatar}
                                />

                                {previewAvatar && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPreviewAvatar(null);
                                            setData("avatar", null);
                                            setData("remove_avatar", true);
                                        }}
                                        className="mt-2 text-xs font-medium text-red-500"
                                    >
                                        Quitar foto
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData("name", e.target.value)}
                                    placeholder="Nombre completo"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25A7CA]/30"
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData("email", e.target.value)}
                                    placeholder="admin@empresa.com"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25A7CA]/30"
                                />
                                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <ImageUploadField
                                    label="Foto de perfil"
                                    currentUrl={previewAvatar}
                                    onChange={(file) => {
                                        setData("avatar", file);
                                        setData("remove_avatar", false);
                                        if (file) {
                                            setPreviewAvatar(URL.createObjectURL(file));
                                        }
                                    }}
                                    specs={{ maxMB: 5, formats: ["JPG", "PNG", "WEBP", "SVG"] }}
                                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                                    error={errors.avatar}
                                />

                                {previewAvatar && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPreviewAvatar(null);
                                            setData("avatar", null);
                                            setData("remove_avatar", true);
                                        }}
                                        className="mt-2 text-xs font-medium text-red-500"
                                    >
                                        Quitar foto
                                    </button>
                                )}
                            </div>

                            <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={data.can_access_admin}
                                    disabled={isPrincipal}
                                    onChange={e => setData("can_access_admin", e.target.checked)}
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    {isPrincipal ? "Acceso superadmin protegido" : "Puede acceder al panel como admin"}
                                </span>
                            </label>
                        </>
                    )}
                    {errors.user && <p className="text-xs text-red-500 -mt-2">{errors.user}</p>}

                    {/* Contraseña */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                            {isEdit && !passwordOnly && <span className="text-gray-400 font-normal ml-1">(dejá vacío para no cambiarla)</span>}
                        </label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={e => setData("password", e.target.value)}
                            placeholder={isEdit && !passwordOnly ? "Nueva contraseña (opcional)" : "Mínimo 8 caracteres"}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25A7CA]/30"
                        />
                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                    </div>

                    {/* Confirmar contraseña */}
                    {(!isEdit || passwordOnly || data.password) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={e => setData("password_confirmation", e.target.value)}
                                placeholder="Repetir contraseña"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25A7CA]/30"
                            />
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2 bg-[#25A7CA] text-white rounded-xl text-sm font-medium hover:bg-[#1d96b8] disabled:opacity-60 flex items-center gap-2"
                        >
                            {processing ? (
                                <><Icon icon="svg-spinners:ring-resize" width={14} /> Guardando...</>
                            ) : (
                                <><Icon icon="solar:check-circle-outline" width={14} /> {passwordOnly ? "Actualizar clave" : isProtectedSuperAdmin ? "Guardar superadmin" : isEdit ? "Guardar cambios" : "Crear usuario"}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Modal confirmación eliminar ────────────────────────────── */
function ConfirmDelete({ user, onConfirm, onCancel, processing }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon icon="solar:trash-bin-trash-bold" width={22} className="text-red-500" />
                </div>
                <h3 className="font-semibold text-gray-800 text-base mb-1">¿Eliminar usuario?</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Se eliminará <strong>{user.name}</strong> ({user.email}). Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={processing}
                        className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-60"
                    >
                        {processing ? "Eliminando..." : "Sí, eliminar"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Página principal ───────────────────────────────────────── */
export default function UsersIndex({ users, principalId, isSuperAdmin = false, canManageUsers = false }) {
    const page = usePage();
    const currentUserId = page.props?.auth?.user?.id;
    const [showCreate, setShowCreate]   = useState(false);
    const [editUser, setEditUser]       = useState(null);
    const [deleteUser, setDeleteUser]   = useState(null);
    const [deleting, setDeleting]       = useState(false);

    const { delete: destroy } = useForm();

    const handleDelete = () => {
        setDeleting(true);
        destroy(`/admin/users/${deleteUser.id}`, {
            onFinish: () => { setDeleting(false); setDeleteUser(null); },
        });
    };

    return (
        <AdminLayout>
            <Head title="Usuarios" />
            <div className="max-w-3xl">
                {/* Título */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Usuarios Admin</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Administrá quién tiene acceso al panel.
                        </p>
                    </div>
                    {canManageUsers && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#25A7CA] text-white rounded-xl text-sm font-medium hover:bg-[#1d96b8] transition"
                        >
                            <Icon icon="solar:user-plus-rounded-outline" width={16} />
                            Nuevo usuario
                        </button>
                    )}
                </div>

                {/* Info */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 mb-5 flex gap-3">
                    <Icon icon="solar:shield-keyhole-outline" width={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                        {isSuperAdmin ? (
                            <>
                                El <strong>superadmin</strong> no puede eliminarse ni perder acceso. Desde acá puede crear usuarios admin,
                                asignar acceso al panel y eliminar usuarios secundarios.
                            </>
                        ) : (
                            <>
                                Tu usuario admin está limitado a esta vista. Solo podés actualizar tu contraseña;
                                la gestión de otros usuarios queda reservada al superadmin.
                            </>
                        )}
                    </p>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Creado</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, i) => {
                                const isCurrentUser = user.id === currentUserId;

                                return (
                                <tr
                                    key={user.id}
                                    className={`border-b border-gray-50 last:border-0 ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            {user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url}
                                                    alt={user.name}
                                                    className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-[#25A7CA]/10 flex items-center justify-center flex-shrink-0">
                                                    <Icon icon="solar:user-bold" width={16} className="text-[#25A7CA]" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-800">{user.name}</span>
                                                    {user.is_principal && (
                                                        <span className="text-[10px] bg-[#25A7CA]/10 text-[#25A7CA] border border-[#25A7CA]/20 rounded-full px-2 py-0.5 font-semibold">
                                                            Superadmin
                                                        </span>
                                                    )}
                                                    {isCurrentUser && (
                                                        <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2 py-0.5 font-semibold">
                                                            Tu sesión
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] rounded-full px-2 py-0.5 font-semibold border ${user.can_access_admin ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                                        {user.can_access_admin ? "Con acceso" : "Sin acceso"}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-400">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-gray-400 hidden sm:table-cell">
                                        {user.created_at}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Editar */}
                                            <button
                                                onClick={() => setEditUser(user)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition"
                                                title="Editar"
                                            >
                                                <Icon icon="solar:pen-outline" width={13} />
                                                Editar
                                            </button>

                                            {/* Eliminar (solo superadmin, nunca principal ni sesión propia) */}
                                            {canManageUsers && !user.is_principal && !isCurrentUser ? (
                                                <button
                                                    onClick={() => setDeleteUser(user)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-100 rounded-lg text-xs text-red-500 hover:bg-red-50 transition"
                                                    title="Eliminar"
                                                >
                                                    <Icon icon="solar:trash-bin-trash-outline" width={13} />
                                                    Eliminar
                                                </button>
                                            ) : (
                                                <span
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-300 cursor-not-allowed"
                                                    title={isCurrentUser ? "No podés eliminar tu propio usuario mientras estás logueado" : user.is_principal ? "El superadmin no puede eliminarse" : "Solo el superadmin puede eliminar usuarios"}
                                                >
                                                    <Icon icon="solar:lock-outline" width={13} />
                                                    {isCurrentUser ? "Sesión activa" : user.is_principal ? "Protegido" : "Reservado"}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {users.length === 0 && (
                        <div className="py-12 text-center text-sm text-gray-400">
                            No hay usuarios registrados.
                        </div>
                    )}
                </div>
            </div>

            {/* Modales */}
            {showCreate && (
                <UserModal principalId={principalId} canManageUsers={canManageUsers} onClose={() => setShowCreate(false)} />
            )}
            {editUser && (
                <UserModal user={editUser} principalId={principalId} canManageUsers={canManageUsers} onClose={() => setEditUser(null)} />
            )}
            {deleteUser && (
                <ConfirmDelete
                    user={deleteUser}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteUser(null)}
                    processing={deleting}
                />
            )}
        </AdminLayout>
    );
}

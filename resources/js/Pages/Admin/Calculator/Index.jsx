import AdminLayout from "@/Layouts/AdminLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

const emptyMaterial = {
    name: "",
    density_g_cm3: "",
    uns: "",
    w_nr: "",
    sort_order: 0,
    is_active: true,
};

const emptyPipe = {
    order_index: 0,
    name: "",
    diameter_mm: "",
    schedule_label: "",
    schedule_aliases: "",
    wall_mm: "",
    is_active: true,
};

const emptyShape = {
    key: "",
    name: "",
    fields_text: "Diámetro\nLargo",
    formula_expression: "=PI()*(Medida_1^2)/4*Medida_2/1000",
    formula_label: "Volumen (cm3)",
    uses_pipe: false,
    sort_order: 0,
    is_active: true,
};

function StatCard({ label, value, icon }) {
    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]">
                    <Icon icon={icon} width={24} />
                </span>
                <div>
                    <p className="text-sm font-semibold text-slate-500">{label}</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

function TextInput({ label, error, className = "", ...props }) {
    return (
        <label className={`block ${className}`}>
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</span>
            <input
                {...props}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
            />
            {error ? <span className="mt-1 block text-xs font-semibold text-red-500">{error}</span> : null}
        </label>
    );
}

function TextArea({ label, error, className = "", ...props }) {
    return (
        <label className={`block ${className}`}>
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</span>
            <textarea
                {...props}
                className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-800 outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
            />
            {error ? <span className="mt-1 block text-xs font-semibold text-red-500">{error}</span> : null}
        </label>
    );
}

function ToggleInput({ checked, onChange, label }) {
    return (
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#25A7CA] focus:ring-[#25A7CA]"
            />
            {label}
        </label>
    );
}

function formatNumber(value, decimals = 4) {
    const number = Number(value);

    return Number.isFinite(number) ? number.toFixed(decimals) : "-";
}

function aliasesToString(value) {
    return Array.isArray(value) ? value.join(", ") : "";
}

function formatResult(value, unit) {
    const number = Number(value);

    return Number.isFinite(number) ? `${number.toFixed(3)} ${unit || ""}` : "-";
}

function fieldsToText(value) {
    return Array.isArray(value)
        ? value.map((field) => field.label || `${field.key}`).join("\n")
        : "";
}

export default function CalculatorIndex({ stats, recentMaterials = [], recentPipeStandards = [], calculatorShapes = [], usageHistory = { traffic: [], recent: [] } }) {
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [editingPipe, setEditingPipe] = useState(null);
    const [editingShape, setEditingShape] = useState(null);

    const importForm = useForm({
        materials_file: null,
        pipes_file: null,
    });

    const materialForm = useForm(emptyMaterial);
    const pipeForm = useForm(emptyPipe);
    const shapeForm = useForm(emptyShape);

    const submitImport = (event) => {
        event.preventDefault();
        importForm.post("/admin/calculadora/importar", {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => importForm.reset(),
        });
    };

    const resetMaterial = () => {
        setEditingMaterial(null);
        materialForm.clearErrors();
        materialForm.setData(emptyMaterial);
    };

    const editMaterial = (item) => {
        setEditingMaterial(item);
        materialForm.clearErrors();
        materialForm.setData({
            name: item.name ?? "",
            density_g_cm3: item.density_g_cm3 ?? "",
            uns: item.uns ?? "",
            w_nr: item.w_nr ?? "",
            sort_order: item.sort_order ?? 0,
            is_active: Boolean(item.is_active),
        });
    };

    const submitMaterial = (event) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => resetMaterial(),
        };

        if (editingMaterial) {
            materialForm.put(`/admin/calculadora/materiales/${editingMaterial.id}`, options);
            return;
        }

        materialForm.post("/admin/calculadora/materiales", options);
    };

    const deleteMaterial = (item) => {
        if (!window.confirm(`¿Eliminar el material "${item.name}" de la calculadora?`)) {
            return;
        }

        router.delete(`/admin/calculadora/materiales/${item.id}`, { preserveScroll: true });
    };

    const resetPipe = () => {
        setEditingPipe(null);
        pipeForm.clearErrors();
        pipeForm.setData(emptyPipe);
    };

    const editPipe = (item) => {
        setEditingPipe(item);
        pipeForm.clearErrors();
        pipeForm.setData({
            order_index: item.order_index ?? 0,
            name: item.name ?? "",
            diameter_mm: item.diameter_mm ?? "",
            schedule_label: item.schedule_label ?? "",
            schedule_aliases: aliasesToString(item.schedule_aliases),
            wall_mm: item.wall_mm ?? "",
            is_active: Boolean(item.is_active),
        });
    };

    const submitPipe = (event) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => resetPipe(),
        };

        if (editingPipe) {
            pipeForm.put(`/admin/calculadora/canos/${editingPipe.id}`, options);
            return;
        }

        pipeForm.post("/admin/calculadora/canos", options);
    };

    const deletePipe = (item) => {
        if (!window.confirm(`¿Eliminar el caño estándar "${item.name} / ${item.schedule_label}"?`)) {
            return;
        }

        router.delete(`/admin/calculadora/canos/${item.id}`, { preserveScroll: true });
    };

    const resetShape = () => {
        setEditingShape(null);
        shapeForm.clearErrors();
        shapeForm.setData(emptyShape);
    };

    const editShape = (item) => {
        setEditingShape(item);
        shapeForm.clearErrors();
        shapeForm.setData({
            key: item.key ?? "",
            name: item.name ?? "",
            fields_text: fieldsToText(item.fields_json),
            formula_expression: item.formula_expression ?? "",
            formula_label: item.formula_label ?? "Volumen (cm3)",
            uses_pipe: Boolean(item.uses_pipe),
            sort_order: item.sort_order ?? 0,
            is_active: Boolean(item.is_active),
        });
    };

    const submitShape = (event) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => resetShape(),
        };

        if (editingShape) {
            shapeForm.put(`/admin/calculadora/formulas/${editingShape.id}`, options);
            return;
        }

        shapeForm.post("/admin/calculadora/formulas", options);
    };

    const deleteShape = (item) => {
        if (!window.confirm(`¿Eliminar la fórmula "${item.name}" de la calculadora?`)) {
            return;
        }

        router.delete(`/admin/calculadora/formulas/${item.id}`, { preserveScroll: true });
    };

    const syncDefaultShapes = () => {
        if (!window.confirm("¿Sincronizar las fórmulas base? Esto actualizará las formas estándar de la calculadora.")) {
            return;
        }

        router.post("/admin/calculadora/formulas-base", {}, { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Calculadora de pesos" />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.18),_transparent_34%),linear-gradient(135deg,#ffffff_0%,#f6f9fb_48%,#eef8fb_100%)] px-6 py-8 md:px-8">
                        <div className="max-w-3xl">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">
                                Herramientas / Calculadora
                            </p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                Calculadora de pesos
                            </h1>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                Importá la base desde <strong>inicio.txt</strong> e <strong>inicio2.txt</strong>, o administrá manualmente materiales, caños estándar y fórmulas de <strong>Volumen (cm3)</strong>. Todo lo que esté activo se refleja en la calculadora pública.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-5">
                    <StatCard label="Materiales cargados" value={stats.materials} icon="solar:layers-minimalistic-outline" />
                    <StatCard label="Caños estándar cargados" value={stats.pipe_standards} icon="solar:calculator-minimalistic-outline" />
                    <StatCard label="Fórmulas de volumen" value={stats.shapes} icon="solar:functions-outline" />
                    <StatCard label="Usos registrados" value={stats.usage_logs} icon="solar:chart-2-outline" />
                    <StatCard label="Usos de hoy" value={stats.usage_today} icon="solar:clock-circle-outline" />
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#117a98]">Datos de la calculadora</p>
                        <h2 className="text-xl font-semibold text-slate-900">Historial de uso</h2>
                        <p className="text-sm text-slate-500">
                            Registro local de clientes que usan la calculadora: hora, IP, navegador, dispositivo, material, forma y resultado.
                        </p>
                    </div>

                    <div className="mt-6 rounded-[24px] bg-slate-50 p-5">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Tráfico últimas 24 horas</h3>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
                                {usageHistory.traffic.reduce((sum, item) => sum + Number(item.total || 0), 0)} usos
                            </span>
                        </div>
                        <div className="flex h-44 items-end gap-2 overflow-x-auto rounded-2xl bg-white px-4 py-5">
                            {usageHistory.traffic.map((item) => {
                                const max = Math.max(...usageHistory.traffic.map((point) => Number(point.total || 0)), 1);
                                const total = Number(item.total || 0);
                                const height = total > 0 ? Math.max(8, (total / max) * 96) : 4;

                                return (
                                    <div key={item.label} className="flex min-w-8 flex-1 flex-col items-center justify-end gap-2">
                                        <span className={`h-3 text-[10px] font-bold leading-3 ${total > 0 ? "text-slate-600" : "text-slate-300"}`}>
                                            {total > 0 ? total : ""}
                                        </span>
                                        <span
                                            className={`w-full rounded-t-xl ${
                                                total > 0
                                                    ? "bg-gradient-to-t from-[#007CC2] to-[#25A7CA] shadow-[0_8px_18px_-10px_rgba(0,124,194,0.8)]"
                                                    : "bg-slate-200"
                                            }`}
                                            style={{ height }}
                                            title={`${item.label}: ${item.total} usos`}
                                        />
                                        <span className="text-[10px] font-semibold text-slate-400">{item.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-6 overflow-auto rounded-2xl border border-slate-100">
                        <table className="w-full min-w-[1180px] text-left text-sm">
                            <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Hora</th>
                                    <th className="px-4 py-3">IP</th>
                                    <th className="px-4 py-3">Navegador</th>
                                    <th className="px-4 py-3">Dispositivo</th>
                                    <th className="px-4 py-3">Material</th>
                                    <th className="px-4 py-3">Forma</th>
                                    <th className="px-4 py-3">Caño</th>
                                    <th className="px-4 py-3">Piezas</th>
                                    <th className="px-4 py-3">Resultado</th>
                                    <th className="px-4 py-3">Origen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {usageHistory.recent.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Todavía no hay usos registrados. Se guardarán cuando un cliente presione “Calcular”.
                                        </td>
                                    </tr>
                                ) : null}
                                {usageHistory.recent.map((item) => (
                                    <tr key={item.id} className="text-slate-700">
                                        <td className="px-4 py-3">
                                            <span className="block font-semibold text-slate-900">{item.time}</span>
                                            <span className="text-xs text-slate-400">{item.created_at}</span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs">{item.ip_address || "-"}</td>
                                        <td className="px-4 py-3">{item.browser || "-"} / {item.platform || "-"}</td>
                                        <td className="px-4 py-3">{item.device_type || "-"}</td>
                                        <td className="px-4 py-3">{item.material_name || "-"}</td>
                                        <td className="px-4 py-3">{item.shape_name || "-"}</td>
                                        <td className="px-4 py-3">{item.pipe_standard_name || "-"}</td>
                                        <td className="px-4 py-3">{item.pieces ?? "-"}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-900">{formatResult(item.result_value, item.result_unit)}</td>
                                        <td className="max-w-[220px] truncate px-4 py-3 text-xs text-slate-500" title={item.referrer || item.page_url || ""}>
                                            {item.referrer || item.page_url || "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
                        <h2 className="text-xl font-semibold text-slate-900">Importar datos base</h2>
                        <p className="text-sm text-slate-500">
                            Podés subir uno o ambos archivos. Al importar, se reemplaza la tabla correspondiente para evitar duplicados.
                        </p>
                    </div>

                    <form onSubmit={submitImport} className="mt-6 grid gap-5 lg:grid-cols-2">
                        <label className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5">
                            <span className="block text-sm font-semibold text-slate-900">Materiales: inicio.txt</span>
                            <span className="mt-1 block text-xs text-slate-500">Nombre, densidad, UNS y W.Nr.</span>
                            <input
                                type="file"
                                accept=".txt,.csv,text/plain"
                                onChange={(event) => importForm.setData("materials_file", event.target.files?.[0] ?? null)}
                                className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                            />
                            {importForm.errors.materials_file ? <p className="mt-2 text-xs text-red-500">{importForm.errors.materials_file}</p> : null}
                        </label>

                        <label className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5">
                            <span className="block text-sm font-semibold text-slate-900">Caño estándar: inicio2.txt</span>
                            <span className="mt-1 block text-xs text-slate-500">Nominal, schedule, diámetro exterior y pared.</span>
                            <input
                                type="file"
                                accept=".txt,.csv,text/plain"
                                onChange={(event) => importForm.setData("pipes_file", event.target.files?.[0] ?? null)}
                                className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                            />
                            {importForm.errors.pipes_file ? <p className="mt-2 text-xs text-red-500">{importForm.errors.pipes_file}</p> : null}
                        </label>

                        <div className="flex justify-end lg:col-span-2">
                            <button
                                type="submit"
                                disabled={importForm.processing || (!importForm.data.materials_file && !importForm.data.pipes_file)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_16px_-4px_rgba(37,167,202,0.3)] transition hover:bg-[#1f8da8] disabled:opacity-50"
                            >
                                <Icon icon="solar:upload-minimalistic-outline" width={18} />
                                Importar calculadora
                            </button>
                        </div>
                    </form>
                </section>

                <section className="grid gap-6 xl:grid-cols-[430px_1fr]">
                    <form onSubmit={submitShape} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {editingShape ? "Editar fórmula" : "Agregar fórmula"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Fórmula de Volumen (cm3). Las medidas llegan en mm y la fórmula debe devolver cm³.
                                </p>
                            </div>
                            {editingShape ? (
                                <button type="button" onClick={resetShape} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50">
                                    Cancelar
                                </button>
                            ) : null}
                        </div>

                        <div className="mt-6 grid gap-4">
                            <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
                                <TextInput label="Key" value={shapeForm.data.key} error={shapeForm.errors.key} onChange={(event) => shapeForm.setData("key", event.target.value)} />
                                <TextInput label="Nombre visible" value={shapeForm.data.name} error={shapeForm.errors.name} onChange={(event) => shapeForm.setData("name", event.target.value)} />
                            </div>
                            <TextArea
                                label="Campos, uno por línea: texto plano o key|Etiqueta"
                                value={shapeForm.data.fields_text}
                                error={shapeForm.errors.fields_text}
                                onChange={(event) => shapeForm.setData("fields_text", event.target.value)}
                            />
                            <TextArea
                                label="Fórmula Volumen (cm3), pegada desde Excel"
                                value={shapeForm.data.formula_expression}
                                error={shapeForm.errors.formula_expression}
                                onChange={(event) => shapeForm.setData("formula_expression", event.target.value)}
                            />
                            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                                Podés escribir campos como <strong>Diámetro</strong>, <strong>Largo</strong>, <strong>Espesor de pared</strong>. En fórmula podés pegar algo de Excel como <strong>=PI()*(Medida_1^2)/4*Medida_2/1000</strong>; al guardar se convierte por detrás.
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextInput label="Etiqueta" value={shapeForm.data.formula_label} error={shapeForm.errors.formula_label} onChange={(event) => shapeForm.setData("formula_label", event.target.value)} />
                                <TextInput label="Orden" type="number" min="0" step="1" value={shapeForm.data.sort_order} error={shapeForm.errors.sort_order} onChange={(event) => shapeForm.setData("sort_order", event.target.value)} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <ToggleInput label="Usa caño estándar" checked={shapeForm.data.uses_pipe} onChange={(checked) => shapeForm.setData("uses_pipe", checked)} />
                                <ToggleInput label="Visible en la web" checked={shapeForm.data.is_active} onChange={(checked) => shapeForm.setData("is_active", checked)} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={shapeForm.processing}
                            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                        >
                            <Icon icon={editingShape ? "solar:pen-new-square-outline" : "solar:add-circle-outline"} width={18} />
                            {editingShape ? "Guardar fórmula" : "Crear fórmula"}
                        </button>
                    </form>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Fórmulas de Volumen (cm3)</h2>
                                <p className="mt-1 text-sm text-slate-500">Estas son las formas que aparecen en la calculadora pública.</p>
                            </div>
                            <button type="button" onClick={syncDefaultShapes} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#25A7CA]/30 px-4 py-3 text-sm font-bold text-[#117a98] hover:bg-[#25A7CA]/10">
                                <Icon icon="solar:refresh-circle-outline" width={18} />
                                Sincronizar base
                            </button>
                        </div>
                        <div className="mt-4 max-h-[620px] overflow-auto rounded-2xl border border-slate-100">
                            <table className="w-full min-w-[980px] text-left text-sm">
                                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Forma</th>
                                        <th className="px-4 py-3">Campos</th>
                                        <th className="px-4 py-3">Volumen (cm3)</th>
                                        <th className="px-4 py-3">Caño</th>
                                        <th className="px-4 py-3">Estado</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {calculatorShapes.map((item) => (
                                        <tr key={item.id} className="text-slate-700">
                                            <td className="px-4 py-3">
                                                <span className="block font-semibold text-slate-900">{item.name}</span>
                                                <span className="text-xs text-slate-400">{item.key}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{fieldsToText(item.fields_json).replaceAll("\n", ", ")}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-700">{item.formula_expression}</td>
                                            <td className="px-4 py-3">{item.uses_pipe ? "Sí" : "No"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                                    {item.is_active ? "Activo" : "Oculto"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => editShape(item)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                                                        Editar
                                                    </button>
                                                    <button type="button" onClick={() => deleteShape(item)} className="rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[430px_1fr]">
                    <form onSubmit={submitMaterial} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {editingMaterial ? "Editar material" : "Agregar material"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">La densidad en kg/m³ se calcula automáticamente.</p>
                            </div>
                            {editingMaterial ? (
                                <button type="button" onClick={resetMaterial} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50">
                                    Cancelar
                                </button>
                            ) : null}
                        </div>

                        <div className="mt-6 grid gap-4">
                            <TextInput label="Material" value={materialForm.data.name} error={materialForm.errors.name} onChange={(event) => materialForm.setData("name", event.target.value)} />
                            <TextInput label="Densidad g/cm³" type="number" min="0" step="0.000001" value={materialForm.data.density_g_cm3} error={materialForm.errors.density_g_cm3} onChange={(event) => materialForm.setData("density_g_cm3", event.target.value)} />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextInput label="UNS" value={materialForm.data.uns} error={materialForm.errors.uns} onChange={(event) => materialForm.setData("uns", event.target.value)} />
                                <TextInput label="W.Nr" value={materialForm.data.w_nr} error={materialForm.errors.w_nr} onChange={(event) => materialForm.setData("w_nr", event.target.value)} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextInput label="Orden" type="number" min="0" step="1" value={materialForm.data.sort_order} error={materialForm.errors.sort_order} onChange={(event) => materialForm.setData("sort_order", event.target.value)} />
                                <ToggleInput label="Visible en la web" checked={materialForm.data.is_active} onChange={(checked) => materialForm.setData("is_active", checked)} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={materialForm.processing}
                            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                        >
                            <Icon icon={editingMaterial ? "solar:pen-new-square-outline" : "solar:add-circle-outline"} width={18} />
                            {editingMaterial ? "Guardar material" : "Crear material"}
                        </button>
                    </form>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold text-slate-900">Materiales administrables</h2>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{recentMaterials.length} registros</span>
                        </div>
                        <div className="mt-4 max-h-[520px] overflow-auto rounded-2xl border border-slate-100">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Material</th>
                                        <th className="px-4 py-3">g/cm³</th>
                                        <th className="px-4 py-3">UNS</th>
                                        <th className="px-4 py-3">W.Nr</th>
                                        <th className="px-4 py-3">Estado</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentMaterials.map((item) => (
                                        <tr key={item.id} className="text-slate-700">
                                            <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                                            <td className="px-4 py-3">{formatNumber(item.density_g_cm3, 4)}</td>
                                            <td className="px-4 py-3">{item.uns || "-"}</td>
                                            <td className="px-4 py-3">{item.w_nr || "-"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                                    {item.is_active ? "Activo" : "Oculto"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => editMaterial(item)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                                                        Editar
                                                    </button>
                                                    <button type="button" onClick={() => deleteMaterial(item)} className="rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[430px_1fr]">
                    <form onSubmit={submitPipe} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {editingPipe ? "Editar caño estándar" : "Agregar caño estándar"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">Las pulgadas se calculan desde los milímetros.</p>
                            </div>
                            {editingPipe ? (
                                <button type="button" onClick={resetPipe} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50">
                                    Cancelar
                                </button>
                            ) : null}
                        </div>

                        <div className="mt-6 grid gap-4">
                            <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
                                <TextInput label="Orden" type="number" min="0" step="1" value={pipeForm.data.order_index} error={pipeForm.errors.order_index} onChange={(event) => pipeForm.setData("order_index", event.target.value)} />
                                <TextInput label="Nombre nominal" value={pipeForm.data.name} error={pipeForm.errors.name} onChange={(event) => pipeForm.setData("name", event.target.value)} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextInput label="Diámetro exterior mm" type="number" min="0" step="0.000001" value={pipeForm.data.diameter_mm} error={pipeForm.errors.diameter_mm} onChange={(event) => pipeForm.setData("diameter_mm", event.target.value)} />
                                <TextInput label="Pared mm" type="number" min="0" step="0.000001" value={pipeForm.data.wall_mm} error={pipeForm.errors.wall_mm} onChange={(event) => pipeForm.setData("wall_mm", event.target.value)} />
                            </div>
                            <TextInput label="Schedule principal" value={pipeForm.data.schedule_label} error={pipeForm.errors.schedule_label} onChange={(event) => pipeForm.setData("schedule_label", event.target.value)} />
                            <TextInput label="Aliases separados por coma" value={pipeForm.data.schedule_aliases} error={pipeForm.errors.schedule_aliases} onChange={(event) => pipeForm.setData("schedule_aliases", event.target.value)} />
                            <ToggleInput label="Visible en la web" checked={pipeForm.data.is_active} onChange={(checked) => pipeForm.setData("is_active", checked)} />
                        </div>

                        <button
                            type="submit"
                            disabled={pipeForm.processing}
                            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                        >
                            <Icon icon={editingPipe ? "solar:pen-new-square-outline" : "solar:add-circle-outline"} width={18} />
                            {editingPipe ? "Guardar caño estándar" : "Crear caño estándar"}
                        </button>
                    </form>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold text-slate-900">Caños estándar administrables</h2>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{recentPipeStandards.length} registros</span>
                        </div>
                        <div className="mt-4 max-h-[620px] overflow-auto rounded-2xl border border-slate-100">
                            <table className="w-full min-w-[920px] text-left text-sm">
                                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Nombre</th>
                                        <th className="px-4 py-3">Schedule</th>
                                        <th className="px-4 py-3">Ø mm</th>
                                        <th className="px-4 py-3">Pared mm</th>
                                        <th className="px-4 py-3">Aliases</th>
                                        <th className="px-4 py-3">Estado</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentPipeStandards.map((item) => (
                                        <tr key={item.id} className="text-slate-700">
                                            <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                                            <td className="px-4 py-3">{item.schedule_label}</td>
                                            <td className="px-4 py-3">{formatNumber(item.diameter_mm, 3)}</td>
                                            <td className="px-4 py-3">{formatNumber(item.wall_mm, 3)}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{aliasesToString(item.schedule_aliases) || "-"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                                    {item.is_active ? "Activo" : "Oculto"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => editPipe(item)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                                                        Editar
                                                    </button>
                                                    <button type="button" onClick={() => deletePipe(item)} className="rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

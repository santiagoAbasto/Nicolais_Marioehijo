import PublicPreviewModal from "@/Components/Admin/PublicPreviewModal";
import RichTextEditor from "@/Components/Admin/RichTextEditor";
import AdminLayout from "@/Layouts/AdminLayout";
import { emitAdminToast } from "@/lib/adminToast";
import { Head, router } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState } from "react";

function emptyHeroForm(hero) {
    return {
        id: hero?.id ?? null,
        title: hero?.title ?? "",
        media_id: hero?.media_id ?? null,
        media_url: hero?.media_url ?? "",
        image_file: null,
        sort_order: hero?.sort_order ?? "A",
        is_active: hero?.is_active ?? true,
    };
}

function emptyPolicyForm(policy) {
    return {
        id: policy?.id ?? null,
        title: policy?.title ?? "",
        description: policy?.description ?? "",
        media_id: policy?.media_id ?? null,
        media_url: policy?.media_url ?? "",
        image_file: null,
        sort_order: policy?.sort_order ?? "B",
        is_active: policy?.is_active ?? true,
    };
}

function emptyCertificateForm(certificate) {
    return {
        id: certificate?.id ?? null,
        title: certificate?.title ?? "",
        media_id: certificate?.media_id ?? null,
        media_url: certificate?.media_url ?? "",
        logo_file: null,
        secondary_media_id: certificate?.secondary_media_id ?? null,
        secondary_media_url: certificate?.secondary_media_url ?? "",
        certificate_file: null,
        existing_extension: certificate?.secondary_media_asset?.extension ?? "",
        existing_size_bytes: certificate?.secondary_media_asset?.size_bytes ?? null,
        sort_order: certificate?.sort_order ?? "C",
        is_active: certificate?.is_active ?? true,
    };
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

function formatBytes(sizeBytes) {
    if (!sizeBytes || Number.isNaN(Number(sizeBytes))) {
        return "";
    }

    const bytes = Number(sizeBytes);

    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${Math.round(bytes / 1024)} KB`;
}

function currentFileMeta(certificateForm) {
    if (certificateForm.certificate_file) {
        const extension = certificateForm.certificate_file.name.includes(".")
            ? certificateForm.certificate_file.name.split(".").pop()?.toUpperCase()
            : "";

        return [extension, formatBytes(certificateForm.certificate_file.size)]
            .filter(Boolean)
            .join(" - ");
    }

    return [certificateForm.existing_extension?.toUpperCase(), formatBytes(certificateForm.existing_size_bytes)]
        .filter(Boolean)
        .join(" - ");
}

function Field({ label, hint = null, children }) {
    return (
        <div className="block space-y-2">
            <div>
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
            </div>
            {children}
        </div>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                checked
                    ? "border-[#25A7CA]/30 bg-[#25A7CA]/10 text-[#117a98]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
        >
            <span
                className={`flex h-6 w-10 items-center rounded-full p-1 transition ${
                    checked ? "bg-[#25A7CA]" : "bg-slate-300"
                }`}
            >
                <span
                    className={`h-4 w-4 rounded-full bg-white transition ${
                        checked ? "translate-x-4" : "translate-x-0"
                    }`}
                />
            </span>
            <span>{label}</span>
        </button>
    );
}

function StatCard({ label, value, icon }) {
    return (
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                        {value}
                    </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25A7CA]/10 text-[#117a98]">
                    <Icon icon={icon} width={22} />
                </div>
            </div>
        </article>
    );
}

export default function QualityIndex({
    hero,
    policy,
    certificate,
    stats,
    publicQualityUrl,
}) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [heroForm, setHeroForm] = useState(emptyHeroForm(hero));
    const [policyForm, setPolicyForm] = useState(emptyPolicyForm(policy));
    const [certificateForm, setCertificateForm] = useState(emptyCertificateForm(certificate));
    const [heroSaving, setHeroSaving] = useState(false);
    const [policySaving, setPolicySaving] = useState(false);
    const [certificateSaving, setCertificateSaving] = useState(false);

    useEffect(() => {
        setHeroForm(emptyHeroForm(hero));
    }, [hero]);

    useEffect(() => {
        setPolicyForm(emptyPolicyForm(policy));
    }, [policy]);

    useEffect(() => {
        setCertificateForm(emptyCertificateForm(certificate));
    }, [certificate]);

    const reloadPage = () => {
        router.reload();
    };

    const saveHero = async () => {
        setHeroSaving(true);

        try {
            let mediaId = heroForm.media_id;

            if (heroForm.image_file) {
                const uploaded = await uploadAsset(
                    heroForm.image_file,
                    heroForm.title || "Calidad banner",
                );
                mediaId = uploaded.id;
            }

            await axios.put(`/admin/api/site-sections/${heroForm.id}`, {
                page_key: "calidad",
                section_key: "quality_banner",
                title: heroForm.title || null,
                media_id: mediaId,
                sort_order: heroForm.sort_order || "A",
                is_active: heroForm.is_active,
                field_values: [],
                items: [],
            });

            emitAdminToast("El banner de calidad se actualizó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar el banner de calidad.",
                "error",
            );
        } finally {
            setHeroSaving(false);
        }
    };

    const savePolicy = async () => {
        setPolicySaving(true);

        try {
            let mediaId = policyForm.media_id;

            if (policyForm.image_file) {
                const uploaded = await uploadAsset(
                    policyForm.image_file,
                    policyForm.title || "Calidad imagen",
                );
                mediaId = uploaded.id;
            }

            await axios.put(`/admin/api/site-sections/${policyForm.id}`, {
                page_key: "calidad",
                section_key: "quality_policy",
                title: null,
                description: policyForm.description || null,
                media_id: mediaId,
                secondary_media_id: null,
                sort_order: policyForm.sort_order || "B",
                is_active: policyForm.is_active,
                field_values: [],
                items: [],
            });

            emitAdminToast("El contenido principal de calidad se guardó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar el contenido de calidad.",
                "error",
            );
        } finally {
            setPolicySaving(false);
        }
    };

    const saveCertificate = async () => {
        setCertificateSaving(true);

        try {
            let logoMediaId = certificateForm.media_id;
            let documentMediaId = certificateForm.secondary_media_id;

            if (certificateForm.logo_file) {
                const uploadedLogo = await uploadAsset(
                    certificateForm.logo_file,
                    certificateForm.title || "Logo certificación calidad",
                );
                logoMediaId = uploadedLogo.id;
            }

            if (certificateForm.certificate_file) {
                const uploadedDocument = await uploadAsset(
                    certificateForm.certificate_file,
                    certificateForm.title || certificateForm.certificate_file.name,
                );
                documentMediaId = uploadedDocument.id;
            }

            await axios.put(`/admin/api/site-sections/${certificateForm.id}`, {
                page_key: "calidad",
                section_key: "quality_certificate",
                title: certificateForm.title || null,
                media_id: logoMediaId,
                secondary_media_id: documentMediaId,
                sort_order: certificateForm.sort_order || "C",
                is_active: certificateForm.is_active,
                field_values: [],
                items: [],
            });

            emitAdminToast("La certificación se actualizó correctamente.");
            reloadPage();
        } catch (error) {
            emitAdminToast(
                error?.response?.data?.message ||
                    "No se pudo guardar la certificación.",
                "error",
            );
        } finally {
            setCertificateSaving(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Calidad" />

            <PublicPreviewModal
                open={previewOpen}
                title="Vista pública de Calidad"
                url={publicQualityUrl}
                onClose={() => setPreviewOpen(false)}
            />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,167,202,0.16),_transparent_34%),linear-gradient(135deg,#f8fbfd_0%,#ffffff_44%,#eef7fb_100%)] px-6 py-8 md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#25A7CA]/20 bg-[#25A7CA]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#117a98]">
                                    <Icon icon="solar:shield-check-outline" width={14} />
                                    Calidad / Certificación
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Gestión de calidad
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                    Administrá el banner, la imagen principal, el texto
                                    enriquecido y la certificación que se muestran en la
                                    página pública de calidad.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPreviewOpen(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#25A7CA] hover:text-[#117a98]"
                            >
                                <Icon icon="solar:square-arrow-right-up-outline" width={18} />
                                Ver página pública
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        label="Banner"
                        value={stats?.banner_active ? "Activo" : "Inactivo"}
                        icon="solar:gallery-wide-outline"
                    />
                    <StatCard
                        label="Contenido"
                        value={stats?.policy_active ? "Activo" : "Inactivo"}
                        icon="solar:document-text-outline"
                    />
                    <StatCard
                        label="Certificación"
                        value={stats?.certificate_active ? "Activa" : "Inactiva"}
                        icon="solar:medal-ribbons-star-outline"
                    />
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-slate-900">
                                Banner principal
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Controla la portada superior del slug calidad.
                            </p>
                        </div>

                        <div className="space-y-5">
                            <Field label="Título">
                                <input
                                    type="text"
                                    value={heroForm.title}
                                    onChange={(event) =>
                                        setHeroForm((current) => ({
                                            ...current,
                                            title: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>

                            <Field label="Imagen del banner">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        setHeroForm((current) => ({
                                            ...current,
                                            image_file: event.target.files?.[0] ?? null,
                                        }))
                                    }
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                />
                                <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-amber-950">
                                        Recomendado: banner 1366 x 237 px · imagen entre
                                        2 y 4 MB · JPG, PNG o WEBP.
                                    </p>
                                </div>
                                {heroForm.media_url ? (
                                    <img
                                        src={heroForm.media_url}
                                        alt={heroForm.title || "Banner calidad"}
                                        className="mt-3 h-56 w-full rounded-2xl border border-slate-200 object-cover"
                                    />
                                ) : null}
                            </Field>

                            <Toggle
                                label="Bloque activo"
                                checked={heroForm.is_active}
                                onChange={(value) =>
                                    setHeroForm((current) => ({
                                        ...current,
                                        is_active: value,
                                    }))
                                }
                            />

                            <div className="flex justify-end border-t border-slate-200 pt-5">
                                <button
                                    type="button"
                                    onClick={saveHero}
                                    disabled={heroSaving}
                                    className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                >
                                    {heroSaving ? "Guardando..." : "Guardar banner"}
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-slate-900">
                                Contenido principal
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Cargá la imagen de 600 x 836 px y el contenido del
                                bloque sin título visible: texto introductorio y listado.
                            </p>
                        </div>

                        <div className="space-y-5">
                            <Field label="Imagen principal" hint="Se muestra a la izquierda del contenido.">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        setPolicyForm((current) => ({
                                            ...current,
                                            image_file: event.target.files?.[0] ?? null,
                                        }))
                                    }
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                />
                                <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-amber-950">
                                        Recomendado: imagen 600 x 836 px · entre
                                        2 y 4 MB · JPG, PNG o WEBP.
                                    </p>
                                </div>
                                {policyForm.media_url ? (
                                    <img
                                        src={policyForm.media_url}
                                        alt={policyForm.title || "Imagen calidad"}
                                        className="mt-3 h-64 w-full rounded-2xl border border-slate-200 object-cover"
                                    />
                                ) : null}
                            </Field>

                            <Field
                                label="Texto enriquecido"
                                hint="Este bloque se publica sin título. Podés usar una lista normal o escribir un párrafo terminado en ':' y luego frases separadas por punto para que la web las convierta en líneas con check."
                            >
                                <RichTextEditor
                                    value={policyForm.description}
                                    onChange={(value) =>
                                        setPolicyForm((current) => ({
                                            ...current,
                                            description: value,
                                        }))
                                    }
                                    placeholder="Escribí el contenido de calidad..."
                                />
                            </Field>

                            <Toggle
                                label="Bloque activo"
                                checked={policyForm.is_active}
                                onChange={(value) =>
                                    setPolicyForm((current) => ({
                                        ...current,
                                        is_active: value,
                                    }))
                                }
                            />

                            <div className="flex justify-end border-t border-slate-200 pt-5">
                                <button
                                    type="button"
                                    onClick={savePolicy}
                                    disabled={policySaving}
                                    className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                                >
                                    {policySaving ? "Guardando..." : "Guardar contenido"}
                                </button>
                            </div>
                        </div>
                    </section>
                </section>

                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-slate-900">
                            Certificación
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Cargá el logo de la certificación y el archivo. El formato y
                            el tamaño se detectan automáticamente.
                        </p>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                        <div className="space-y-5">
                            <Field label="Nombre del certificado">
                                <input
                                    type="text"
                                    value={certificateForm.title}
                                    onChange={(event) =>
                                        setCertificateForm((current) => ({
                                            ...current,
                                            title: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#25A7CA] focus:ring-4 focus:ring-[#25A7CA]/10"
                                />
                            </Field>

                            <Field label="Logo de la certificación">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        setCertificateForm((current) => ({
                                            ...current,
                                            logo_file: event.target.files?.[0] ?? null,
                                        }))
                                    }
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                />
                                <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-amber-950">
                                        Recomendado: logo 80 x 80 px · JPG, PNG o WEBP.
                                    </p>
                                </div>
                                {certificateForm.media_url ? (
                                    <div className="mt-3 flex h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white p-4">
                                        <img
                                            src={certificateForm.media_url}
                                            alt={certificateForm.title || "Logo certificación"}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                ) : null}
                            </Field>
                        </div>

                        <div className="space-y-5">
                            <Field
                                label="Archivo del certificado"
                                hint="Acepta PDF y documentos permitidos por el sistema."
                            >
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,.odt"
                                    onChange={(event) =>
                                        setCertificateForm((current) => ({
                                            ...current,
                                            certificate_file:
                                                event.target.files?.[0] ?? null,
                                        }))
                                    }
                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#25A7CA]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#117a98] hover:file:bg-[#25A7CA]/15"
                                />
                                <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-amber-950">
                                        Recomendado: PDF · hasta 20 MB para que se descargue rápido.
                                    </p>
                                </div>
                            </Field>

                            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-900">
                                    Archivo actual
                                </p>
                                <p className="mt-2 text-sm text-slate-600">
                                    {certificateForm.certificate_file?.name ||
                                        (certificateForm.secondary_media_url
                                            ? "Certificado cargado"
                                            : "Todavía no hay archivo cargado.")}
                                </p>
                                <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                                    {currentFileMeta(certificateForm) || "Sin metadatos"}
                                </p>
                                {certificateForm.secondary_media_url ? (
                                    <a
                                        href={certificateForm.secondary_media_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#117a98]"
                                    >
                                        <Icon icon="solar:square-arrow-right-up-outline" width={16} />
                                        Ver archivo cargado
                                    </a>
                                ) : null}
                            </div>

                            <Toggle
                                label="Bloque activo"
                                checked={certificateForm.is_active}
                                onChange={(value) =>
                                    setCertificateForm((current) => ({
                                        ...current,
                                        is_active: value,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
                        <button
                            type="button"
                            onClick={saveCertificate}
                            disabled={certificateSaving}
                            className="rounded-2xl bg-[#25A7CA] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d96b8] disabled:opacity-60"
                        >
                            {certificateSaving ? "Guardando..." : "Guardar certificación"}
                        </button>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

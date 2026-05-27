import { Icon } from "@iconify/react";
import { useState } from "react";

/**
 * ImageUploadField — Upload input with spec hints + live file info.
 *
 * Props
 *   label       string                        Field label (optional)
 *   currentUrl  string | null                 Existing image URL to show before a new file is picked
 *   onChange    (file: File) => void          Called when a file is selected
 *   specs       { width?, height?, maxMB?, recommendedMBText?, formats?: string[] }
 *               e.g. { width: 1224, height: 720, maxMB: 3, recommendedMBText: "2 a 4 MB", formats: ["PNG"] }
 *   error       string | null                 Validation error message
 *   accept      string                        input[accept], default "image/*"
 *   showPreview boolean                       Show image preview after selection, default true
 */
export default function ImageUploadField({
    label       = null,
    currentUrl  = null,
    onChange,
    specs       = null,
    error       = null,
    accept      = "image/*",
    showPreview = true,
}) {
    const [preview,  setPreview]  = useState(null);
    const [fileInfo, setFileInfo] = useState(null);

    const handleChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Display raw file info
        const ext = file.name.split(".").pop().toUpperCase();
        let sizeKB = file.size / 1024;
        let overMax = specs?.maxMB ? sizeKB / 1024 > specs.maxMB : false;

        setFileInfo({ ext, sizeKB, overMax });

        if (showPreview && file.type.startsWith("image/")) {
            setPreview(URL.createObjectURL(file));
        }

        onChange(file);
    };

    const fmtSize = (kb) =>
        kb >= 1024
            ? `${(kb / 1024).toFixed(2)} MB`
            : `${Math.round(kb)} KB`;

    return (
        <div>
            {label && (
                <label className="block text-sm text-gray-600 mb-2">{label}</label>
            )}

            {/* ── Spec hint ───────────────────────────────────── */}
            {specs && (
                <div className="mb-3 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                    <Icon
                        icon="solar:info-circle-outline"
                        width={14}
                        className="text-sky-400 flex-shrink-0"
                    />
                    <span className="text-xs text-sky-700">
                        Recomendado:
                        {specs.width && specs.height && (
                            <strong className="ml-1">
                                {specs.width}×{specs.height} px
                            </strong>
                        )}
                        {specs.formats?.length > 0 && (
                            <span className="ml-2">{specs.formats.join(" / ")}</span>
                        )}
                        {specs.recommendedMBText ? (
                            <span className="ml-2">· {specs.recommendedMBText}</span>
                        ) : specs.maxMB ? (
                            <span className="ml-2">· máx {specs.maxMB} MB</span>
                        ) : null}
                    </span>
                </div>
                    <p className="mt-2 text-[11px] leading-5 text-sky-700/90">
                        Buscá una imagen nítida, sin pixelado y con proporción cercana a la sugerida. Si este módulo pide otra medida puntual, esa recomendación manda.
                    </p>
                </div>
            )}

            {/* ── Current image ────────────────────────────────── */}
            {currentUrl && !preview && showPreview && (
                <img
                    src={currentUrl}
                    className="h-32 rounded-lg object-cover mb-3"
                    alt="imagen actual"
                />
            )}

            {/* ── File input ───────────────────────────────────── */}
            <input
                type="file"
                accept={accept}
                onChange={handleChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#25A7CA]/10 file:text-[#25A7CA] hover:file:bg-[#25A7CA]/20"
            />

            {/* ── File info badge ──────────────────────────────── */}
            {fileInfo && (
                <div
                    className={`flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 px-3 py-1.5 rounded-lg text-xs border ${
                        fileInfo.overMax
                            ? "bg-red-50 text-red-600 border-red-200"
                            : "bg-gray-50 text-gray-500 border-gray-100"
                    }`}
                >
                    <Icon
                        icon={fileInfo.overMax ? "solar:danger-triangle-outline" : "solar:file-check-outline"}
                        width={13}
                        className="flex-shrink-0"
                    />
                    <span>Formato: <strong>{fileInfo.ext}</strong></span>
                    <span>Tamaño: <strong>{fmtSize(fileInfo.sizeKB)}</strong></span>
                    {fileInfo.overMax && (
                        <span className="font-semibold">
                            ⚠ Excede el límite de {specs.maxMB} MB
                        </span>
                    )}
                </div>
            )}

            {/* ── New preview ──────────────────────────────────── */}
            {preview && (
                <img
                    src={preview}
                    className="mt-3 h-40 rounded-lg object-cover"
                    alt="preview"
                />
            )}

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

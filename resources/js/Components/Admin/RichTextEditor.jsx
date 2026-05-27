import { useRef, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";

function looksLikeHtml(value) {
    return /<[^>]+>/.test(String(value || ""));
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizeEditorValue(value) {
    const stringValue = String(value || "");

    if (stringValue.trim() === "") {
        return "";
    }

    if (looksLikeHtml(stringValue)) {
        return stringValue;
    }

    return stringValue
        .split(/\n{2,}/)
        .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
        .join("");
}

function walkTextNodes(node, visitor) {
    if (!node) {
        return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
        visitor(node);
        return;
    }

    Array.from(node.childNodes).forEach((child) => walkTextNodes(child, visitor));
}

function trimBlockEdgeWhitespace(root) {
    const selectors = "p, li, blockquote, h1, h2, h3, h4, h5, h6";

    root.querySelectorAll(selectors).forEach((element) => {
        const firstChild = element.firstChild;
        const lastChild = element.lastChild;

        if (firstChild?.nodeType === Node.TEXT_NODE) {
            firstChild.textContent = firstChild.textContent.replace(/^\s+/u, "");
        }

        if (lastChild?.nodeType === Node.TEXT_NODE) {
            lastChild.textContent = lastChild.textContent.replace(/\s+$/u, "");
        }

        if (element.innerHTML.trim() === "" || /^(\s|<br\s*\/?>)*$/iu.test(element.innerHTML)) {
            element.innerHTML = "";
        }
    });
}

function sanitizeEditorHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = String(html || "");

    tmp.querySelectorAll("*").forEach((element) => {
        [...element.attributes].forEach((attr) => {
            if (attr.name.startsWith("data-")) {
                element.removeAttribute(attr.name);
            }
        });

        if (element.getAttribute("style")?.trim() === "") {
            element.removeAttribute("style");
        }
    });

    walkTextNodes(tmp, (textNode) => {
        textNode.textContent = textNode.textContent.replace(/\u00a0/g, " ");
    });

    trimBlockEdgeWhitespace(tmp);

    return tmp.innerHTML.trim();
}

export default function RichTextEditor({ value = "", onChange, placeholder = "Escribe aquí..." }) {
    const editorRef = useRef(null);
    const savedRangeRef = useRef(null);

    useEffect(() => {
        const normalizedValue = normalizeEditorValue(value);

        if (
            editorRef.current &&
            editorRef.current.innerHTML !== normalizedValue &&
            document.activeElement !== editorRef.current
        ) {
            editorRef.current.innerHTML = normalizedValue;
        }
    }, [value]);

    const exec = useCallback((command, val = null) => {
        document.execCommand(command, false, val);
        editorRef.current?.focus();
        handleInput();
    }, []);

    const handleInput = useCallback(() => {
        if (onChange && editorRef.current) {
            onChange(sanitizeEditorHtml(editorRef.current.innerHTML));
        }
    }, [onChange]);

    const handleBlur = useCallback(() => {
        if (editorRef.current) {
            const sanitizedHtml = sanitizeEditorHtml(editorRef.current.innerHTML);
            if (editorRef.current.innerHTML !== sanitizedHtml) {
                editorRef.current.innerHTML = sanitizedHtml;
            }
        }
    }, []);

    const handlePaste = useCallback((e) => {
        e.preventDefault();
        const html = e.clipboardData.getData("text/html");
        const text = e.clipboardData.getData("text/plain");
        const clean = html
            ? sanitizeEditorHtml(html)
            : sanitizeEditorHtml(text.replace(/\n/g, "<br>"));
        document.execCommand("insertHTML", false, clean);
        handleInput();
    }, [handleInput]);

    const insertLink = () => {
        const url = window.prompt("URL del enlace:");
        if (url) exec("createLink", url);
    };

    const buttons = [
        { icon: "solar:text-bold-outline",       cmd: "bold",          title: "Negrita" },
        { icon: "solar:text-italic-outline",     cmd: "italic",        title: "Cursiva" },
        { icon: "solar:text-underline-outline",  cmd: "underline",     title: "Subrayado" },
        { icon: "solar:list-outline",            cmd: "insertUnorderedList", title: "Lista" },
        { icon: "solar:list-check-outline",      cmd: "insertOrderedList",   title: "Lista numerada" },
        { icon: "solar:align-left-outline",      cmd: "justifyLeft",   title: "Alinear izquierda" },
        { icon: "solar:align-center-outline",    cmd: "justifyCenter", title: "Centrar" },
        { icon: "solar:align-right-outline",     cmd: "justifyRight",  title: "Alinear derecha" },
    ];

    return (
        <div className="border border-[#E5E7EB] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#25A7CA]/30">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-gray-50 border-b border-[#E5E7EB]">
                {/* Headings */}
                <select
                    onMouseDown={() => {
                        const sel = window.getSelection();
                        if (sel && sel.rangeCount > 0) {
                            savedRangeRef.current = sel.getRangeAt(0).cloneRange();
                        }
                    }}
                    onChange={(e) => {
                        if (savedRangeRef.current) {
                            editorRef.current?.focus();
                            const sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(savedRangeRef.current);
                            savedRangeRef.current = null;
                        }
                        exec("formatBlock", e.target.value);
                        e.target.value = "";
                    }}
                    defaultValue=""
                    className="text-xs border border-gray-200 rounded px-1 py-1 text-gray-600 bg-white"
                >
                    <option value="" disabled>Formato</option>
                    <option value="p">Párrafo</option>
                    <option value="h2">Título H2</option>
                    <option value="h3">Título H3</option>
                    <option value="h4">Título H4</option>
                    <option value="blockquote">Cita</option>
                </select>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                {buttons.map(({ icon, cmd, title }) => (
                    <button
                        key={cmd}
                        type="button"
                        title={title}
                        onMouseDown={(e) => { e.preventDefault(); exec(cmd); }}
                        className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition"
                    >
                        <Icon icon={icon} width={15} />
                    </button>
                ))}

                <div className="w-px h-5 bg-gray-300 mx-1" />

                <button
                    type="button"
                    title="Insertar enlace"
                    onMouseDown={(e) => { e.preventDefault(); insertLink(); }}
                    className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition"
                >
                    <Icon icon="solar:link-outline" width={15} />
                </button>
                <button
                    type="button"
                    title="Quitar formato"
                    onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); }}
                    className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition"
                >
                    <Icon icon="solar:eraser-outline" width={15} />
                </button>
            </div>

            {/* Content Area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onBlur={handleBlur}
                onPaste={handlePaste}
                data-placeholder={placeholder}
                className="min-h-[200px] p-4 text-sm text-gray-800 focus:outline-none prose prose-sm max-w-none
                    [&[data-placeholder]:empty]:before:content-[attr(data-placeholder)]
                    [&[data-placeholder]:empty]:before:text-gray-400"
            />
        </div>
    );
}

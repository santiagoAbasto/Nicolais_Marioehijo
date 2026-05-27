export function normalizeCatalogNormaSearch(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
}

export function tokenizeCatalogNormaSearch(query) {
    const normalized = normalizeCatalogNormaSearch(query);

    return normalized ? normalized.split(/\s+/).filter(Boolean) : [];
}

export function buildCatalogNormaSearchText(norma) {
    return normalizeCatalogNormaSearch([
        norma?.nombre_emisor,
        norma?.norma,
        norma?.descripcion_corta,
        norma?.descripcion_larga,
        norma?.familia,
        norma?.subfamilia,
        norma?.tipo,
        norma?.aplicacion_web_comercial,
        norma?.keywords_seo,
        norma?.fuente,
    ].filter(Boolean).join(" "));
}

export function matchesCatalogNormaSearch(norma, query) {
    const tokens = tokenizeCatalogNormaSearch(query);

    if (tokens.length === 0) {
        return true;
    }

    const haystack = buildCatalogNormaSearchText(norma);

    return tokens.every((token) => haystack.includes(token));
}

export function filterCatalogNormasBySearch(normas, query) {
    return (normas ?? []).filter((norma) => matchesCatalogNormaSearch(norma, query));
}


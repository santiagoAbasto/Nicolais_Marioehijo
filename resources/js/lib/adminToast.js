const STORAGE_KEY = "admin-toast-pending";

export function emitAdminToast(message, type = "success", options = {}) {
    if (!message) return;

    const payload = {
        id: Date.now(),
        message,
        type,
    };

    if (options.persist) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }

    window.dispatchEvent(new CustomEvent("admin-toast", { detail: payload }));
}

export function consumePendingAdminToast() {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    sessionStorage.removeItem(STORAGE_KEY);

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

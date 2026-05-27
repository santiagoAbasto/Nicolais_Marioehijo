import { animate, remove, stagger } from 'animejs';

const isSkippedTransitionError = (error) => {
    const name = error?.name ?? "";
    const message = error?.message ?? String(error ?? "");

    return name === "AbortError" && message.includes("Transition was skipped");
};

if (typeof window !== "undefined" && !window.__nmSkippedTransitionGuard) {
    window.__nmSkippedTransitionGuard = true;

    window.addEventListener("unhandledrejection", (event) => {
        if (isSkippedTransitionError(event.reason)) {
            event.preventDefault();
        }
    });

    window.addEventListener("error", (event) => {
        if (isSkippedTransitionError(event.error)) {
            event.preventDefault();
        }
    });
}

/* =============================================
   WEB TOAST — iOS-style notification
   Llamar con: showWebToast(mensaje, 'success' | 'error')
============================================= */

const prefersReducedMotion = () => {
    return typeof window !== "undefined"
        && typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

const toElementsArray = (targets) => {
    if (!targets) return [];
    if (targets instanceof Element) return [targets];
    if (targets instanceof NodeList || Array.isArray(targets)) {
        return Array.from(targets).filter((target) => target instanceof Element);
    }
    return [];
};

const clearAnimatedInlineState = (targets) => {
    toElementsArray(targets).forEach((target) => {
        target.style.removeProperty("opacity");
        target.style.removeProperty("transform");
        target.style.removeProperty("filter");
        target.style.removeProperty("will-change");
    });
};

const scopedRevealTargets = (root, itemSelector) => {
    if (!root) return [];
    if (!itemSelector) return [root];

    return Array.from(root.querySelectorAll(itemSelector))
        .filter((target) => target instanceof Element && !target.hasAttribute("hidden"));
};

const isRootNearViewport = (root) => {
    if (!(root instanceof Element) || typeof window === "undefined") return false;

    const rect = root.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

    return rect.top <= viewportHeight * 0.92 && rect.bottom >= 0;
};

const primeRevealTargets = (targets, options = {}) => {
    if (prefersReducedMotion()) return;

    toElementsArray(targets).forEach((target) => {
        if (target.dataset.motionPrimed === "true" || target.dataset.motionDone === "true") return;
        target.dataset.motionPrimed = "true";
        target.style.opacity = "0";
    });
};

const playReveal = (targets, options = {}) => {
    const elements = toElementsArray(targets);
    if (!elements.length) return;

    if (prefersReducedMotion()) {
        clearAnimatedInlineState(elements);
        return;
    }

    const duration = Math.min(options.duration ?? 180, 220);
    const ease = options.ease ?? "linear";
    const delay = options.delay ?? stagger(10, { start: 0 });

    remove(elements);

    elements.forEach((element) => {
        element.style.willChange = "opacity";
    });

    animate(elements, {
        opacity: [0, 1],
        duration,
        delay,
        ease,
        onComplete: () => {
            elements.forEach((element) => {
                element.dataset.motionDone = "true";
            });
            clearAnimatedInlineState(elements);
        },
    });
};

const registerRevealGroup = (rootSelector, itemSelector, options = {}) => {
    const roots = Array.from(document.querySelectorAll(rootSelector));
    if (!roots.length) return;

    if (prefersReducedMotion()) {
        roots.forEach((root) => {
            const targets = scopedRevealTargets(root, itemSelector);
            clearAnimatedInlineState(targets);
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries
            .filter((entry) => entry.isIntersecting)
            .forEach((entry) => {
                const targets = scopedRevealTargets(entry.target, itemSelector);
                playReveal(targets, options);
                observer.unobserve(entry.target);
            });
    }, {
        threshold: options.threshold ?? 0.06,
        rootMargin: options.rootMargin ?? "0px 0px 12% 0px",
    });

    roots.forEach((root) => {
        const targets = scopedRevealTargets(root, itemSelector);
        if (!targets.length) return;

        if (isRootNearViewport(root)) {
            targets.forEach((target) => {
                target.dataset.motionDone = "true";
            });
            clearAnimatedInlineState(targets);
            return;
        }

        primeRevealTargets(targets, options);
        observer.observe(root);
    });
};

(function () {

    var SVG_OK = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">'
        + '<circle cx="12" cy="12" r="11" fill="#136CBA" opacity="0.12"/>'
        + '<path d="M7 12.5l3.5 3.5 6.5-7" stroke="#136CBA" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>'
        + '</svg>';

    var SVG_ERR = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">'
        + '<circle cx="12" cy="12" r="11" fill="#ef4444" opacity="0.12"/>'
        + '<path d="M15 9L9 15M9 9l6 6" stroke="#ef4444" stroke-width="2.1" stroke-linecap="round"/>'
        + '</svg>';

    var SVG_INFO = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">'
        + '<circle cx="12" cy="12" r="11" fill="#136CBA" opacity="0.12"/>'
        + '<path d="M12 8.2v.1M12 11v5" stroke="#136CBA" stroke-width="2.1" stroke-linecap="round"/>'
        + '</svg>';

    var SVG_X = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none">'
        + '<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'
        + '</svg>';

    function showWebToast(message, type, titleOverride) {
        type = type || 'success';
        var normalizedMessage = String(message || '').toLowerCase();
        var titleText = titleOverride
            || (type === 'success' && normalizedMessage.includes('suscrib')
                ? 'Suscripción activa'
                : (type === 'success' ? 'Consulta enviada' : (type === 'info' ? 'Newsletter' : 'Revisá el formulario')));

        /* Elimina toasts anteriores */
        document.querySelectorAll('.web-toast').forEach(function (t) { t.remove(); });

        var toast = document.createElement('div');
        toast.className = 'web-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');

        var icon = document.createElement('span');
        icon.className = 'web-toast__icon';
        icon.innerHTML = type === 'success' ? SVG_OK : (type === 'info' ? SVG_INFO : SVG_ERR);

        var text = document.createElement('span');
        text.className = 'web-toast__msg';

        var title = document.createElement('strong');
        title.className = 'web-toast__title';
        title.textContent = titleText;

        var body = document.createElement('span');
        body.className = 'web-toast__body';
        body.textContent = message;

        text.appendChild(title);
        text.appendChild(body);

        var close = document.createElement('button');
        close.className = 'web-toast__close';
        close.setAttribute('aria-label', 'Cerrar');
        close.setAttribute('type', 'button');
        close.innerHTML = SVG_X;

        toast.appendChild(icon);
        toast.appendChild(text);
        toast.appendChild(close);

        document.body.appendChild(toast);

        function dismiss() {
            toast.classList.add('web-toast--hide');
            setTimeout(function () { if (toast.parentNode) toast.remove(); }, 340);
        }

        close.addEventListener('click', dismiss);

        /* Auto-dismiss: 3.2s éxito / 5s error */
        var timer = setTimeout(dismiss, type === 'error' ? 5000 : 3200);

        /* Pausa al pasar el mouse */
        toast.addEventListener('mouseenter', function () { clearTimeout(timer); });
        toast.addEventListener('mouseleave', function () { timer = setTimeout(dismiss, 2000); });
    }

    window.showWebToast = showWebToast;

}());

document.addEventListener("DOMContentLoaded", () => {
    const flash = document.querySelector("[data-web-toast]");

    if (!flash || typeof window.showWebToast !== "function") {
        return;
    }

    window.showWebToast(
        flash.getAttribute("data-web-toast") || "",
        flash.getAttribute("data-web-toast-type") || "success",
        flash.getAttribute("data-web-toast-title") || "",
    );
});


/* =============================================
   NEWSLETTER — AJAX (sin recarga de página)
   Intercepta el submit, envía con fetch,
   muestra toast iOS inline y se queda en el footer.
============================================= */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("newsletterForm");
    const msg  = document.getElementById("newsletterMsg");   // aria-live oculto

    if (form && msg) {

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const btn   = form.querySelector("button[type='submit']");
            const input = form.querySelector("input[type='email']");
            const csrf  = form.querySelector("input[name='_token']").value;
            const email = input.value.trim();

            if (!email) {
                const errMsg = "Ingresá tu email.";
                msg.textContent = errMsg;
                showWebToast(errMsg, "error");
                return;
            }

            /* Respuesta optimista inmediata */
            btn.disabled      = true;
            btn.style.opacity = "0.6";
            input.value       = "";
            msg.textContent   = "¡Te suscribiste correctamente!";
            showWebToast("Te suscribiste correctamente.", "success", "Suscripción activa");

            try {
                const res = await fetch(form.action, {
                    method:  "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "X-CSRF-TOKEN": csrf,
                        "Accept":       "application/json",
                    },
                    body: new URLSearchParams({ email, _token: csrf }),
                });

                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    const successMsg = data?.message || "Te suscribiste correctamente.";
                    msg.textContent = successMsg;

                    if (successMsg !== "Te suscribiste correctamente.") {
                        showWebToast(successMsg, "success", "Suscripción activa");
                    }
                } else {
                    const errores  = data?.errors?.email;
                    const errorMsg = errores
                        ? errores[0]
                        : (data?.message || "Ocurrió un error. Intentá de nuevo.");
                    msg.textContent = errorMsg;
                    input.value = email;
                    showWebToast(errorMsg, "error");
                }

            } catch {
                const errMsg = "Error de red. Intentá de nuevo.";
                msg.textContent = errMsg;
                input.value = email;
                showWebToast(errMsg, "error");
            }

            btn.disabled      = false;
            btn.style.opacity = "";
        });
    }

});

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.querySelector("[data-footer-legal-modal]");
    const triggers = Array.from(document.querySelectorAll("[data-footer-legal-open]"));
    const closeButtons = Array.from(document.querySelectorAll("[data-footer-legal-close]"));

    if (!modal || !triggers.length) {
        return;
    }

    const closeModal = () => {
        modal.hidden = true;
        document.body.classList.remove("footer-legal-open");
    };

    const openModal = () => {
        modal.hidden = false;
        document.body.classList.add("footer-legal-open");
    };

    triggers.forEach((trigger) => {
        trigger.addEventListener("click", openModal);
    });

    closeButtons.forEach((button) => {
        button.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });
});

const initHomeMobileMenu = () => {
    const toggle = document.querySelector("[data-home-menu-toggle]");
    const menu = document.querySelector("[data-home-mobile-menu]");
    const panel = document.querySelector("[data-home-mobile-menu-panel]");

    if (!toggle || !menu || !panel) {
        return;
    }

    const closeButtons = Array.from(menu.querySelectorAll("[data-home-menu-close]"));
    const links = Array.from(menu.querySelectorAll("a, [data-client-modal-open]"));
    let lastFocused = null;

    const setOpen = (isOpen) => {
        toggle.classList.toggle("is-open", isOpen);
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
        document.body.classList.toggle("home-menu-open", isOpen);

        if (isOpen) {
            lastFocused = document.activeElement;
            menu.hidden = false;
            window.requestAnimationFrame(() => menu.classList.add("is-open"));
            window.requestAnimationFrame(() => {
                panel.querySelector("a, button")?.focus();
            });
        } else {
            menu.classList.remove("is-open");
            menu.hidden = true;

            if (lastFocused instanceof HTMLElement) {
                lastFocused.focus();
            }
        }
    };

    const close = () => setOpen(false);

    toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    closeButtons.forEach((button) => button.addEventListener("click", close));
    links.forEach((link) => link.addEventListener("click", close));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
            close();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 1024 && toggle.getAttribute("aria-expanded") === "true") {
            close();
        }
    });
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHomeMobileMenu);
} else {
    initHomeMobileMenu();
}

const initProductsMobileMenu = () => {
    const toggle = document.querySelector("[data-products-menu-toggle]");
    const menu = document.querySelector("[data-products-mobile-menu]");
    const panel = document.querySelector("[data-products-mobile-menu-panel]");

    if (!toggle || !menu || !panel) {
        return;
    }

    const closeButtons = Array.from(menu.querySelectorAll("[data-products-menu-close]"));
    const links = Array.from(menu.querySelectorAll("a, [data-client-modal-open]"));
    let lastFocused = null;

    const setOpen = (isOpen) => {
        toggle.classList.toggle("is-open", isOpen);
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
        document.body.classList.toggle("products-menu-open", isOpen);

        if (isOpen) {
            lastFocused = document.activeElement;
            menu.hidden = false;
            window.requestAnimationFrame(() => menu.classList.add("is-open"));
            window.requestAnimationFrame(() => {
                panel.querySelector("a, button")?.focus();
            });
        } else {
            menu.classList.remove("is-open");
            menu.hidden = true;

            if (lastFocused instanceof HTMLElement) {
                lastFocused.focus();
            }
        }
    };

    const close = () => setOpen(false);

    toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    closeButtons.forEach((button) => button.addEventListener("click", close));
    links.forEach((link) => link.addEventListener("click", close));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
            close();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 1024 && toggle.getAttribute("aria-expanded") === "true") {
            close();
        }
    });
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProductsMobileMenu);
} else {
    initProductsMobileMenu();
}

document.addEventListener("DOMContentLoaded", () => {

    const normalizeSearchText = (value) => String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    document.querySelectorAll("[data-products-local-search]").forEach((root) => {
        const form = root.querySelector("[data-products-local-search-form]");
        const input = root.querySelector("[data-products-local-search-input]");
        const emptyState = root.querySelector("[data-products-local-search-empty]");
        const resetButton = root.querySelector("[data-products-local-search-reset]");
        const scope = root.closest(".home-container");

        if (!form || !input || !scope) {
            return;
        }

        const items = Array.from(scope.querySelectorAll("[data-products-search-item]"))
            .filter((item) => !root.contains(item));
        const groups = Array.from(scope.querySelectorAll("[data-products-search-group]"))
            .filter((group) => !root.contains(group));

        const syncVisibility = () => {
            const query = normalizeSearchText(input.value);

            items.forEach((item) => {
                const haystack = normalizeSearchText(
                    item.getAttribute("data-products-search-text") || item.textContent,
                );
                const matches = query === "" || haystack.includes(query);
                item.hidden = !matches;
            });

            groups.forEach((group) => {
                const groupItems = items.filter((item) => group.contains(item));

                if (!groupItems.length) {
                    group.hidden = false;
                    return;
                }

                const hasVisibleItems = groupItems.some((item) => !item.hidden);
                group.hidden = query !== "" && !hasVisibleItems;
            });

            const hasVisibleItems = items.some((item) => !item.hidden);

            if (emptyState) {
                emptyState.hidden = query === "" || hasVisibleItems;
            }
        };

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            syncVisibility();
        });

        resetButton?.addEventListener("click", () => {
            input.value = "";
            syncVisibility();
            input.focus();
        });

        input.addEventListener("input", syncVisibility);
        syncVisibility();
    });

});


/* =============================================
   ANIME.JS — GLOBAL MOTION SYSTEM
   - Entrada elegante para header y hero
   - Reveal por scroll en secciones y cards
   - Respeta prefers-reduced-motion
============================================= */

document.addEventListener("DOMContentLoaded", () => {

    const homeHero = document.querySelector(".nm-hero");
    const homeHeader = document.querySelector(".nm-header");

    if (homeHero && homeHeader) {
        let ticking = false;

        const syncHomeHeader = () => {
            const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
            const headerHeight = homeHeader.offsetHeight || 0;
            const heroBottom = homeHero.offsetTop + homeHero.offsetHeight;

            homeHeader.classList.toggle("nm-header--fixed", scrollY > 31);
            homeHeader.classList.toggle("nm-header--solid", scrollY + headerHeight >= heroBottom);

            ticking = false;
        };

        const requestSyncHomeHeader = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(syncHomeHeader);
        };

        syncHomeHeader();
        window.addEventListener("scroll", requestSyncHomeHeader, { passive: true });
        window.addEventListener("resize", requestSyncHomeHeader);
    }

    const softStagger = (step, start = 0) => stagger(Math.min(step, 10), { start: Math.min(start, 0) });

    /* ── Header entrance ── */

    const headerTargets = [
        ".hero-brand",
        ".hero-menu > a",
        ".hero-menu > .hero-menu__item > .hero-menu__link",
        ".hero-nav-right > *",
        ".hero-hamburger",
        ".quality-page__nav a",
        ".quality-page__nav-right > *",
    ].flatMap((selector) => Array.from(document.querySelectorAll(selector)));

    clearAnimatedInlineState(headerTargets);

    /* ── Hero entrance (all hero variants) ── */

    const heroTargets = [
        ".hero-copy h1",
        ".hero-copy p",
        ".hero-actions",
        ".hero-slider-dots",
        ".quote-page__hero-caption",
        ".quote-page__hero-title",
        ".search-page__intro > *",
        ".nosotros-hero-caption",
        ".nosotros-hero-title",
    ].flatMap((selector) => Array.from(document.querySelectorAll(selector)));

    clearAnimatedInlineState(heroTargets);

    [
        {
            root: ".section-block",
            items: ".product-card, .application-card, .news-card",
            options: {
                duration: 180,
                delay: softStagger(10, 0),
            },
        },
        {
            root: ".products-page-search-stack",
            items: ".products-page-filters-panel",
            options: {
                duration: 160,
            },
        },
        {
            root: ".products-page-group",
            items: ".products-page-grid > *, .products-page-grade-links-grid > *, .products-page-applications-list > *, .products-page-stock-list > *",
            options: {
                duration: 180,
                delay: softStagger(10, 0),
            },
        },
        {
            root: ".calculator-page__grid",
            items: ".calculator-card",
            options: {
                duration: 180,
                delay: softStagger(10, 0),
            },
        },
        {
            root: ".offers-page__section",
            items: ".offers-page-card",
            options: {
                duration: 180,
                delay: softStagger(10, 0),
            },
        },
        {
            root: ".news-page__section",
            items: ".news-page-card",
            options: {
                duration: 180,
                delay: softStagger(10, 0),
            },
        },
        {
            root: ".news-page__related",
            items: ".news-page__related-title, .news-page-card",
            options: {
                duration: 180,
                delay: softStagger(10, 0),
            },
        },
        {
            root: ".applications-page__cards-section",
            items: ".applications-page__card",
            options: {
                duration: 180,
                delay: softStagger(10, 0),
            },
        },
    ].forEach(({ root, items, options }) => {
        registerRevealGroup(root, items, options);
    });

    /* ── Floating WhatsApp button entrance ── */

    const whatsappBtn = document.querySelector(".floating-whatsapp");

    if (whatsappBtn && !prefersReducedMotion()) {
        whatsappBtn.style.opacity = "0";
        whatsappBtn.style.transform = "scale(0.96) translateY(10px)";

        animate(whatsappBtn, {
            opacity: [0, 1],
            scale: [0.96, 1],
            y: [10, 0],
            duration: 380,
            delay: 120,
            ease: "out(4)",
            onComplete: () => clearAnimatedInlineState(whatsappBtn),
        });
    }

});


/* =============================================
   CLIENT ACCESS MODAL
============================================= */

document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("[data-client-modal]");
    if (!root) return;

    const triggers = document.querySelectorAll("[data-client-modal-open]");
    const closeButtons = root.querySelectorAll("[data-client-modal-close]");
    const panelButtons = root.querySelectorAll("[data-client-panel-open]");
    const panels = root.querySelectorAll("[data-client-panel]");
    const loginForm = root.querySelector("[data-client-login-form]");
    const registerForm = root.querySelector("[data-client-register-form]");
    const loginMessage = root.querySelector("[data-client-login-message]");
    const registerMessage = root.querySelector("[data-client-register-message]");
    let lastFocused = null;

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || "";

    const setPanel = (name) => {
        panels.forEach((panel) => {
            panel.classList.toggle("is-active", panel.dataset.clientPanel === name);
        });
    };

    const open = (panel = "login") => {
        lastFocused = document.activeElement;
        setPanel(panel);
        root.hidden = false;
        document.body.classList.add("client-access-open");
        window.requestAnimationFrame(() => {
            const input = root.querySelector(".client-access-modal__panel.is-active input:not([type='hidden'])");
            input?.focus();
        });
    };

    const close = () => {
        root.hidden = true;
        document.body.classList.remove("client-access-open");
        loginMessage.textContent = "";
        registerMessage.textContent = "";
        loginMessage.classList.remove("is-error");
        registerMessage.classList.remove("is-error");
        if (lastFocused instanceof HTMLElement) {
            lastFocused.focus();
        }
    };

    const setMessage = (element, text, error = false) => {
        element.textContent = text || "";
        element.classList.toggle("is-error", error);
    };

    const showClientToast = (message, type = "success", title = "") => {
        if (typeof window.showWebToast === "function") {
            window.showWebToast(message, type, title);
        }
    };

    const submitAjax = async (form, messageElement, successCallback = null) => {
        const button = form.querySelector("button[type='submit']");
        button.disabled = true;
        setMessage(messageElement, "Enviando...");

        try {
            const response = await fetch(form.action, {
                method: "POST",
                body: new FormData(form),
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrf(),
                    "X-Requested-With": "XMLHttpRequest",
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errors = data.errors ? Object.values(data.errors).flat() : [];
                throw new Error(errors[0] || data.message || "No pudimos procesar la solicitud.");
            }

            if (typeof successCallback === "function") {
                successCallback(data);
                return;
            }

            setMessage(messageElement, data.message || "Listo.");
        } catch (error) {
            setMessage(messageElement, "");
            showClientToast(error.message, "error");
        } finally {
            button.disabled = false;
        }
    };

    triggers.forEach((trigger) => trigger.addEventListener("click", () => open("login")));
    closeButtons.forEach((button) => button.addEventListener("click", close));
    panelButtons.forEach((button) => {
        button.addEventListener("click", () => setPanel(button.dataset.clientPanelOpen));
    });

    document.addEventListener("keydown", (event) => {
        if (!root.hidden && event.key === "Escape") {
            close();
        }
    });

    loginForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        submitAjax(loginForm, loginMessage, (data) => {
            window.location.href = data.redirect || "/zona-clientes";
        });
    });

    registerForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        submitAjax(registerForm, registerMessage, (data) => {
            registerForm.reset();
            setMessage(registerMessage, "");
            showClientToast(
                data.message || "Solicitud enviada correctamente. Te avisaremos por correo cuando sea revisada.",
                "success",
                "Solicitud enviada",
            );
        });
    });

    if (root.dataset.openOnLoad === "true") {
        open("login");
    }
});

/* =============================================
   GLOBAL SEARCH
   - Overlay profesional desde el header
   - Sugerencias agrupadas con debounce
   - Enter lleva a la pagina completa /buscar
============================================= */

document.addEventListener("DOMContentLoaded", () => {

    const root = document.querySelector("[data-global-search]");
    if (!root) return;

    const suggestUrl = root.dataset.suggestUrl;
    const searchUrl = root.dataset.searchUrl;
    const featuredStatus = root.dataset.featuredStatus || "Elegí una sugerencia o empezá a escribir para buscar en toda la web.";
    const input = root.querySelector("[data-global-search-input]");
    const form = root.querySelector("[data-global-search-form]");
    const quick = root.querySelector("[data-global-search-quick]");
    const status = root.querySelector("[data-global-search-status]");
    const results = root.querySelector("[data-global-search-results]");
    const featuredTemplate = root.querySelector("[data-global-search-featured-template]");
    const closeButtons = root.querySelectorAll("[data-global-search-close]");
    const triggers = document.querySelectorAll("a[aria-label='Buscar'], button[aria-label='Buscar'], .nm-search-button, .products-search-button");
    const backdrop = root.querySelector(".global-search__backdrop");
    const dialog = root.querySelector(".global-search__dialog");

    if (!suggestUrl || !searchUrl || !input || !form || !status || !results || !triggers.length) {
        return;
    }

    let open = false;
    let activeController = null;
    let activeToken = 0;
    let debounceTimer = null;
    let lastFocused = null;
    const suggestionsCache = new Map();

    const escapeHtml = (value) => {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const renderEmpty = (message) => {
        results.innerHTML = "";
        status.textContent = message;
    };

    const renderFeatured = () => {
        status.textContent = featuredStatus;
        results.innerHTML = featuredTemplate ? featuredTemplate.innerHTML : "";
    };

    const renderInsight = (insight) => {
        if (!insight || !insight.headline) {
            return "";
        }

        const normas = Array.isArray(insight.normas) ? insight.normas.filter((norma) => norma && (norma.emisor || norma.norma)) : [];
        const grades = Array.isArray(insight.grades) ? insight.grades.filter((grade) => grade && grade.title && grade.url) : [];
        const productSections = Array.isArray(insight.product_sections) ? insight.product_sections.filter((section) => section && section.title && Array.isArray(section.items) && section.items.length) : [];
        const supportingGroups = Array.isArray(insight.supporting_groups) ? insight.supporting_groups.filter((group) => group && group.title && Array.isArray(group.items) && group.items.length) : [];
        const featuredNorma = insight.featured_norma && insight.featured_norma.label ? insight.featured_norma : null;
        const featuredNormaMarkup = featuredNorma
            ? `
                <span class="global-search__item-reason">Norma principal ${escapeHtml(featuredNorma.label)}</span>
                ${featuredNorma.description ? `<span class="global-search__item-meta">${escapeHtml(featuredNorma.description)}</span>` : ""}
                ${Array.isArray(featuredNorma.grades) && featuredNorma.grades.length ? `
                    <span class="global-search__item-normas" aria-label="Grados relacionados">
                        ${featuredNorma.grades.map((grade) => `
                            <a href="${escapeHtml(grade.url)}" class="global-search__quick-chip">${escapeHtml(grade.title)}</a>
                        `).join("")}
                    </span>
                ` : ""}
            `
            : "";
        const productSectionsMarkup = productSections.length ? `
            <span class="global-search__item-meta">Jerarquía principal del catálogo</span>
            <span class="global-search__item-insight-groups">
                ${productSections.map((section) => `
                    <span class="global-search__item-insight-group">
                        <span class="global-search__item-insight-title">${escapeHtml(section.title)}</span>
                        <span class="global-search__item-normas">
                            ${section.items.map((item) => `
                                <a href="${escapeHtml(item.url)}" class="global-search__quick-chip">${escapeHtml(item.title)}</a>
                            `).join("")}
                        </span>
                    </span>
                `).join("")}
            </span>
        ` : "";
        const supportingGroupsMarkup = supportingGroups.length ? `
            <div class="global-search__assistant-suggestions">
                ${supportingGroups.map((group) => `
                    <div class="global-search__assistant-suggestion-group">
                        <span class="global-search__assistant-suggestion-title">${escapeHtml(group.title)}</span>
                        <span class="global-search__assistant-actions">
                            ${group.items.map((item) => `
                                <a href="${escapeHtml(item.url)}" class="global-search__quick-chip">${escapeHtml(item.title)}</a>
                            `).join("")}
                        </span>
                    </div>
                `).join("")}
            </div>
        ` : "";

        return `
            <div class="ai-halo-shell">
                <section class="global-search__group global-search__group--insight">
                    <div class="global-search__assistant-head">
                        <div class="global-search__assistant-title">
                            <span class="global-search__ai-orb global-search__ai-orb--small" aria-hidden="true"><span></span></span>
                            <h3>Asistente IA</h3>
                        </div>
                        <span class="global-search__assistant-badge">IA asistida</span>
                    </div>
                    <div class="global-search__assistant-body">
                        <span class="global-search__assistant-label">Interpretación</span>
                        <strong>${escapeHtml(insight.headline)}</strong>
                        ${insight.description ? `<p>${escapeHtml(insight.description)}</p>` : ""}
                        ${normas.length ? `
                            <span class="global-search__item-normas" aria-label="Normas detectadas">
                                ${normas.map((norma) => `
                                    <span class="global-search__item-norma-chip">
                                        ${norma.emisor ? `<span class="global-search__item-norma-emisor">${escapeHtml(norma.emisor)}</span>` : ""}
                                        ${norma.norma ? `<span class="global-search__item-norma-code">${escapeHtml(norma.norma)}</span>` : ""}
                                    </span>
                                `).join("")}
                            </span>
                        ` : ""}
                        ${featuredNormaMarkup}
                        ${grades.length ? `
                            <span class="global-search__assistant-actions" aria-label="Grados sugeridos">
                                ${grades.map((grade) => `
                                    <a href="${escapeHtml(grade.url)}" class="global-search__quick-chip">${escapeHtml(grade.title)}</a>
                                `).join("")}
                            </span>
                        ` : ""}
                        ${productSectionsMarkup}
                        ${supportingGroupsMarkup}
                    </div>
                </section>
            </div>
        `;
    };

    const renderGroups = (groups, insight = null) => {
        const groupsMarkup = groups.map((group) => {
            const renderItems = (items) => items.map((item) => {
                const normas = Array.isArray(item.normas) ? item.normas.filter((norma) => norma && (norma.emisor || norma.norma)) : [];
                const normasMarkup = normas.length
                    ? `
                        <span class="global-search__item-normas" aria-label="Normas relacionadas">
                            ${normas.map((norma) => `
                                <span class="global-search__item-norma-chip">
                                    ${norma.emisor ? `<span class="global-search__item-norma-emisor">${escapeHtml(norma.emisor)}</span>` : ""}
                                    ${norma.norma ? `<span class="global-search__item-norma-code">${escapeHtml(norma.norma)}</span>` : ""}
                                </span>
                            `).join("")}
                        </span>
                    `
                    : "";
                const reasonMarkup = item.match_reason
                    ? `<span class="global-search__item-reason">${escapeHtml(item.match_reason)}</span>`
                    : "";
                const metaItems = item.meta
                    ? String(item.meta).split(" · ").map((meta) => meta.trim()).filter(Boolean)
                    : [];
                const metaMarkup = metaItems.length
                    ? `
                        <span class="global-search__item-meta-list">
                            ${metaItems.map((meta) => `<span class="global-search__item-meta">${escapeHtml(meta)}</span>`).join("")}
                        </span>
                    `
                    : "";

                return `
                    <a href="${escapeHtml(item.url)}" class="global-search__item">
                        <span class="global-search__item-icon" aria-hidden="true">
                            <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                                <path d="M4.25 13.75H3.75C3.19772 13.75 2.75 13.3023 2.75 12.75V10.25C2.75 9.69772 3.19772 9.25 3.75 9.25H4.1L5.33333 6.78333C5.58738 6.27522 6.1068 5.95455 6.67484 5.95455H13.3252C13.8932 5.95455 14.4126 6.27522 14.6667 6.78333L15.9 9.25H16.25C16.8023 9.25 17.25 9.69772 17.25 10.25V12.75C17.25 13.3023 16.8023 13.75 16.25 13.75H15.75M4.25 13.75C4.25 14.4404 4.80964 15 5.5 15C6.19036 15 6.75 14.4404 6.75 13.75M4.25 13.75C4.25 13.0596 4.80964 12.5 5.5 12.5C6.19036 12.5 6.75 13.0596 6.75 13.75M6.75 13.75H13.25M13.25 13.75C13.25 14.4404 13.8096 15 14.5 15C15.1904 15 15.75 14.4404 15.75 13.75M13.25 13.75C13.25 13.0596 13.8096 12.5 14.5 12.5C15.1904 12.5 15.75 13.0596 15.75 13.75M5.25 9.25H14.75" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </span>
                        <span class="global-search__item-content">
                            <span class="global-search__item-top">
                                <span class="global-search__item-context">${escapeHtml(item.context)}</span>
                                <span class="global-search__item-arrow" aria-hidden="true">
                                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                        <path d="M5.8335 5.83334H14.1668M14.1668 5.83334V14.1667M14.1668 5.83334L5.8335 14.1667" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </span>
                            </span>
                            <span class="global-search__item-title">${escapeHtml(item.title)}</span>
                            <span class="global-search__item-details">
                                ${reasonMarkup}
                            </span>
                            ${metaMarkup}
                            ${normasMarkup}
                        </span>
                    </a>
                `;
            }).join("");

            const sections = Array.isArray(group.sections) && group.sections.length
                ? group.sections
                : [{ title: "", items: group.items ?? [] }];

            const items = sections.map((section) => {
                const sectionItems = Array.isArray(section.items) ? section.items : [];
                const sectionTitle = typeof section.title === "string" ? section.title.trim() : "";

                return `
                    <div class="global-search__group-section">
                        ${sectionTitle ? `
                            <div class="global-search__group-section-head">
                                <h4 class="global-search__group-section-title">${escapeHtml(sectionTitle)}</h4>
                                <span class="global-search__group-section-count">${sectionItems.length} resultado${sectionItems.length === 1 ? "" : "s"}</span>
                            </div>
                        ` : ""}
                        <div class="global-search__group-list">${renderItems(sectionItems)}</div>
                    </div>
                `;
            }).join("");

            return `
                <section class="global-search__group">
                    <div class="global-search__group-head">
                        <h3 class="global-search__group-title">${escapeHtml(group.title)}</h3>
                        <span class="global-search__group-count">${group.items.length} resultado${group.items.length === 1 ? "" : "s"}</span>
                    </div>
                    <div class="global-search__group-list">${items}</div>
                </section>
            `;
        }).join("");

        results.innerHTML = `${renderInsight(insight)}${groupsMarkup}`;
    };

    const setLoading = () => {
        status.textContent = "Buscando coincidencias...";
        results.innerHTML = "";
    };

    const openSearch = (prefill = "") => {
        if (open) return;
        open = true;
        lastFocused = document.activeElement;
        root.hidden = false;
        document.body.classList.add("global-search-open");
        input.value = prefill;
        if (prefill.trim() === "") {
            renderFeatured();
        } else {
            renderEmpty("Buscando coincidencias...");
        }
        window.requestAnimationFrame(() => {
            if (!prefersReducedMotion() && backdrop && dialog) {
                remove([backdrop, dialog]);
                backdrop.style.opacity = "0";
                dialog.style.opacity = "0";
                dialog.style.transform = "translateY(24px) scale(0.985)";

                animate(backdrop, {
                    opacity: [0, 1],
                    duration: 220,
                    ease: "out(3)",
                });

                animate(dialog, {
                    opacity: [0, 1],
                    y: [24, 0],
                    scale: [0.985, 1],
                    duration: 360,
                    ease: "out(4)",
                    onComplete: () => clearAnimatedInlineState(dialog),
                });
            }

            input.focus();
        });
        if (prefill.trim() !== "") {
            requestSuggestions(prefill.trim());
        }
    };

    const closeSearch = () => {
        if (!open) return;
        open = false;
        const teardown = () => {
            root.hidden = true;
            document.body.classList.remove("global-search-open");
            if (activeController) activeController.abort();
            activeController = null;
            activeToken += 1;
            clearTimeout(debounceTimer);
            debounceTimer = null;
            clearAnimatedInlineState([backdrop, dialog]);
            if (lastFocused instanceof HTMLElement) {
                lastFocused.focus();
            }
        };

        if (prefersReducedMotion() || !backdrop || !dialog) {
            teardown();
            return;
        }

        remove([backdrop, dialog]);

        animate(backdrop, {
            opacity: [1, 0],
            duration: 180,
            ease: "out(2)",
        });

        animate(dialog, {
            opacity: [1, 0],
            y: [0, 18],
            scale: [1, 0.985],
            duration: 220,
            ease: "out(3)",
            onComplete: teardown,
        });
    };

    const requestSuggestions = async (query) => {
        const trimmed = query.trim();
        const token = ++activeToken;

        if (activeController) activeController.abort();

        if (trimmed.length === 0) {
            renderFeatured();
            return;
        }

        if (suggestionsCache.has(trimmed)) {
            const cached = suggestionsCache.get(trimmed);
            const groups = Array.isArray(cached.groups) ? cached.groups.filter((group) => Array.isArray(group.items) && group.items.length > 0) : [];

            if (!groups.length) {
                renderEmpty(`No encontramos coincidencias para "${trimmed}".`);
                return;
            }

            status.textContent = `${groups.reduce((sum, group) => sum + group.items.length, 0)} resultado${groups.reduce((sum, group) => sum + group.items.length, 0) === 1 ? "" : "s"} para "${trimmed}".`;
            renderGroups(groups, cached.insight ?? null);
            return;
        }

        setLoading();
        activeController = new AbortController();

        try {
            const response = await fetch(`${suggestUrl}?q=${encodeURIComponent(trimmed)}`, {
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
                signal: activeController.signal,
            });

            if (!response.ok) {
                throw new Error("suggest_failed");
            }

            const data = await response.json();

            if (token !== activeToken) {
                return;
            }

            suggestionsCache.set(trimmed, data);

            const groups = Array.isArray(data.groups) ? data.groups.filter((group) => Array.isArray(group.items) && group.items.length > 0) : [];

            if (!groups.length) {
                if (data.insight && data.insight.headline) {
                    status.textContent = `Sin coincidencias exactas para "${trimmed}".`;
                    renderGroups([], data.insight);
                    return;
                }

                renderEmpty(`No encontramos coincidencias para "${trimmed}".`);
                return;
            }

            status.textContent = `${groups.reduce((sum, group) => sum + group.items.length, 0)} resultado${groups.reduce((sum, group) => sum + group.items.length, 0) === 1 ? "" : "s"} para "${trimmed}".`;
            renderGroups(groups, data.insight ?? null);
        } catch (error) {
            if (error.name === "AbortError") return;
            if (error.message === "suggest_failed") {
                renderEmpty("Estamos recibiendo muchas búsquedas seguidas. Probá de nuevo en unos segundos.");
                return;
            }
            renderEmpty("No pudimos cargar sugerencias en este momento.");
        }
    };

    triggers.forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }

            event.preventDefault();
            openSearch("");
        });
    });

    closeButtons.forEach((button) => {
        button.addEventListener("click", () => closeSearch());
    });

    document.addEventListener("keydown", (event) => {
        const target = event.target;
        const isTypingField = target instanceof HTMLElement && (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable
        );

        if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || event.key === "/") {
            if (event.key === "/" && isTypingField) {
                return;
            }

            event.preventDefault();
            openSearch("");
            return;
        }

        if (event.key === "Escape" && open) {
            event.preventDefault();
            closeSearch();
        }
    });

    input.addEventListener("input", () => {
        const value = input.value.trim();
        clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => requestSuggestions(value), 280);
    });

    form.addEventListener("submit", (event) => {
        const value = input.value.trim();
        if (!value) {
            event.preventDefault();
            input.focus();
            return;
        }

        closeSearch();
        window.location.href = `${searchUrl}?q=${encodeURIComponent(value)}`;
        event.preventDefault();
    });

    results.addEventListener("click", () => closeSearch());
    quick?.addEventListener("click", () => closeSearch());
});


/* =============================================
   COMPOSITION CHARTS — glow animation
   El glow se aplica sobre cada .compo-chart__segment-shape
   via CSS @keyframes (compo-shape-glow-pulse).
   Cuando filter y clip-path están en el MISMO elemento,
   Safari calcula correctamente la sombra sobre el
   paralelogramo. Aplicar filter al PARENT no funciona
   en Safari (no hereda clip-path de los hijos).
============================================= */

(function () {
    let activeTrack = null;
    let clearTrackTimer = null;

    function clearTrackTimerIfNeeded() {
        if (clearTrackTimer) {
            window.clearTimeout(clearTrackTimer);
            clearTrackTimer = null;
        }
    }

    function clearCompoHoverState(track = activeTrack) {
        clearTrackTimerIfNeeded();

        if (track) {
            track.classList.remove("is-glowing");
            track.style.removeProperty("--track-glow-color");
        }

        if (track === activeTrack) {
            activeTrack = null;
        }
    }

    function resolveCompoTarget(target) {
        const seg = target.closest(
            ".compo-chart__segment, .compo-series-chart__segment"
        );

        if (seg) {
            const isChart = seg.classList.contains("compo-chart__segment");
            const trackSelector = isChart ? ".compo-chart__track" : ".compo-series-chart__track";

            return {
                track: seg.closest(trackSelector),
                color: seg.style.getPropertyValue("--segment-color").trim(),
            };
        }

        const legendItem = target.closest(
            ".compo-chart__mobile-legend-item, .compo-series-chart__mobile-legend-item"
        );

        if (legendItem) {
            const isChartLegend = legendItem.classList.contains("compo-chart__mobile-legend-item");
            const barSelector = isChartLegend ? ".compo-chart__bar" : ".compo-series-chart__bar";
            const trackSelector = isChartLegend ? ".compo-chart__track" : ".compo-series-chart__track";

            return {
                track: legendItem.closest(barSelector)?.querySelector(trackSelector) ?? null,
                color: legendItem.dataset.segmentColor?.trim() ?? "",
            };
        }

        return { track: null, color: "" };
    }

    function setTrackGlow(track, color, persistMs = 0) {
        if (!track || !color) {
            clearCompoHoverState();
            return;
        }

        if (activeTrack && activeTrack !== track) {
            clearCompoHoverState(activeTrack);
        }

        clearTrackTimerIfNeeded();
        track.style.setProperty("--track-glow-color", color);
        track.classList.add("is-glowing");
        activeTrack = track;

        if (persistMs > 0) {
            clearTrackTimer = window.setTimeout(() => {
                if (activeTrack === track) {
                    clearCompoHoverState(track);
                }
            }, persistMs);
        }
    }

    function onCompoMouseMove(e) {
        const { track, color } = resolveCompoTarget(e.target);

        if (!track || !color) {
            clearCompoHoverState();
            return;
        }

        setTrackGlow(track, color);
    }

    document.addEventListener("mousemove", onCompoMouseMove, { passive: true });
    document.addEventListener("pointerdown", (e) => {
        const { track, color } = resolveCompoTarget(e.target);
        if (track && color) {
            setTrackGlow(track, color, 1600);
        }
    }, { passive: true });
    document.addEventListener("focusin", (e) => {
        const { track, color } = resolveCompoTarget(e.target);
        if (track && color) {
            setTrackGlow(track, color, 1600);
        }
    });
    document.addEventListener("focusout", () => {
        window.setTimeout(() => {
            const { track } = resolveCompoTarget(document.activeElement ?? document.body);
            if (!track) {
                clearCompoHoverState();
            }
        }, 0);
    });
    document.addEventListener("mouseout", (e) => {
        if (!e.relatedTarget) clearCompoHoverState();
    });
}());


/* =============================================
   COMPOSITION CHARTS — scroll-triggered animation
   Activa la animación CSS cuando la barra entra al viewport.
   Respeta prefers-reduced-motion.
============================================= */

(function () {
    function activateCompoCharts() {
        const selectors = [
            { root: ".compo-chart",        cls: "compo-chart--animated" },
            { root: ".compo-series-chart", cls: "compo-series-chart--animated" },
        ];

        if (prefersReducedMotion()) {
            selectors.forEach(({ root, cls }) => {
                document.querySelectorAll(root).forEach((el) => el.classList.add(cls));
            });
            return;
        }

        selectors.forEach(({ root, cls }) => {
            const charts = Array.from(document.querySelectorAll(root));
            if (!charts.length) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add(cls);
                    observer.unobserve(entry.target);
                });
            }, { threshold: 0.06, rootMargin: "0px 0px 8% 0px" });

            charts.forEach((chart) => {
                if (isRootNearViewport(chart)) {
                    chart.classList.add(cls);
                } else {
                    observer.observe(chart);
                }
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", activateCompoCharts);
    } else {
        activateCompoCharts();
    }
}());


document.addEventListener("DOMContentLoaded", () => {
    const megaMenus = document.querySelectorAll("[data-products-mega-menu]");

    megaMenus.forEach((menu) => {
        const lineButtons = Array.from(menu.querySelectorAll("[data-products-menu-line]"));
        const panels = Array.from(menu.querySelectorAll("[data-products-menu-panel]"));
        const content = menu.querySelector(".products-mega-menu__content");
        const contentShell = menu.querySelector(".products-mega-menu__content-shell");
        const scrollbar = menu.querySelector(".products-mega-menu__scrollbar");
        const scrollbarThumb = menu.querySelector(".products-mega-menu__scrollbar-thumb");
        const initialLine = menu.dataset.productsMenuInitial || lineButtons[0]?.dataset.productsMenuLine;

        if (!lineButtons.length || !panels.length || !initialLine) {
            return;
        }

        const syncScrollState = () => {
            if (!(content instanceof HTMLElement) || !(contentShell instanceof HTMLElement)) {
                return;
            }

            const hasOverflow = content.scrollHeight - content.clientHeight > 12;
            const isNearEnd = content.scrollTop + content.clientHeight >= content.scrollHeight - 12;

            contentShell.classList.toggle("is-scrollable", hasOverflow);
            contentShell.classList.toggle("is-scroll-end", !hasOverflow || isNearEnd);

            if (!(scrollbar instanceof HTMLElement) || !(scrollbarThumb instanceof HTMLElement)) {
                return;
            }

            if (!hasOverflow) {
                scrollbarThumb.style.height = "";
                scrollbarThumb.style.transform = "translateY(0)";
                return;
            }

            const trackHeight = scrollbar.clientHeight;
            const scrollRatio = content.clientHeight / content.scrollHeight;
            const thumbHeight = Math.max(36, Math.round(trackHeight * scrollRatio));
            const maxScroll = Math.max(1, content.scrollHeight - content.clientHeight);
            const maxThumbOffset = Math.max(0, trackHeight - thumbHeight);
            const thumbOffset = Math.min(maxThumbOffset, Math.round((content.scrollTop / maxScroll) * maxThumbOffset));

            scrollbarThumb.style.height = `${thumbHeight}px`;
            scrollbarThumb.style.transform = `translateY(${thumbOffset}px)`;
        };

        const scheduleScrollStateSync = () => {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(syncScrollState);
            });
        };

        const activateLine = (slug) => {
            lineButtons.forEach((button) => {
                const isActive = button.dataset.productsMenuLine === slug;

                button.classList.toggle("is-active", isActive);
                button.setAttribute("aria-selected", isActive ? "true" : "false");
            });

            panels.forEach((panel) => {
                const isActive = panel.dataset.productsMenuPanel === slug;

                panel.classList.toggle("is-active", isActive);
                panel.hidden = !isActive;
            });

            if (content instanceof HTMLElement) {
                content.scrollTop = 0;
            }

            scheduleScrollStateSync();
        };

        activateLine(initialLine);

        lineButtons.forEach((button) => {
            const slug = button.dataset.productsMenuLine;

            button.addEventListener("mouseenter", () => activateLine(slug));
            button.addEventListener("focus", () => activateLine(slug));
        });

        menu.addEventListener("mouseenter", scheduleScrollStateSync);
        menu.addEventListener("focusin", scheduleScrollStateSync);
        menu.addEventListener("mouseleave", () => activateLine(initialLine));

        if (content instanceof HTMLElement) {
            content.addEventListener("scroll", syncScrollState, { passive: true });
            window.addEventListener("resize", syncScrollState, { passive: true });
            window.addEventListener("load", scheduleScrollStateSync, { passive: true });
            scheduleScrollStateSync();
        }
    });
});


document.addEventListener("DOMContentLoaded", () => {

    /* =============================================
       MOBILE NAVBAR — JS fix
       Garantiza position:fixed en mobile/tablet
       independientemente de quirks de iOS Safari.
       overflow-x: clip en html (reset.css) resuelve
       el horizontal overflow del panel de nav.
    ============================================= */

    const nav = document.getElementById("mainNav");

    if (nav) {
        const isCatalogHeader = nav.classList.contains("site-header--catalog");

        function applyMobileFixed() {
            if (window.innerWidth <= 1024) {
                nav.style.position = "fixed";
                nav.style.top      = "0";
                nav.style.left     = "0";
                nav.style.right    = "0";
                nav.style.width    = "100%";
                nav.style.zIndex   = "100";
                document.body.style.paddingTop = isCatalogHeader ? nav.offsetHeight + "px" : "";
            } else {
                /* Desktop: quita los estilos inline y deja actuar al CSS */
                nav.style.position = "";
                nav.style.top      = "";
                nav.style.left     = "";
                nav.style.right    = "";
                nav.style.width    = "";
                nav.style.zIndex   = "";
                document.body.style.paddingTop = "";
            }
        }

        applyMobileFixed();
        window.addEventListener("resize", applyMobileFixed, { passive: true });
    }


    /* =============================================
       HERO SLIDER
       - Auto-avance configurable por slide
       - Dots sincronizan con el slide activo
       - Click en dot navega al slide correspondiente
       - Funciona con cualquier cantidad de slides
    ============================================= */

    const heroSection = document.querySelector(".hero");

    if (heroSection) {

        const slides   = heroSection.querySelectorAll(".hero-slide");
        const dots     = heroSection.querySelectorAll(".hero-dot");
        const contents = heroSection.querySelectorAll(".hero-content");

        if (slides.length > 1) {

            let currentIndex = 0;
            let autoplay;

            function getHeroDelay() {
                const seconds = Number(slides[currentIndex]?.dataset?.autoplaySeconds || 6);

                if (!Number.isFinite(seconds) || seconds <= 0) {
                    return 6000;
                }

                return seconds * 1000;
            }

            function heroGoTo(index) {
                slides[currentIndex].classList.remove("active");
                if (dots[currentIndex])     dots[currentIndex].classList.remove("active");
                if (contents[currentIndex]) contents[currentIndex].classList.remove("active");

                const oldIframe = slides[currentIndex].querySelector("iframe");
                if (oldIframe) oldIframe.src = "";

                currentIndex = (index + slides.length) % slides.length;

                slides[currentIndex].classList.add("active");
                if (dots[currentIndex])     dots[currentIndex].classList.add("active");
                if (contents[currentIndex]) contents[currentIndex].classList.add("active");

                const newIframe = slides[currentIndex].querySelector("iframe");
                if (newIframe && newIframe.dataset.src) {
                    newIframe.src = newIframe.dataset.src;
                }
            }

            function startAutoplay() {
                clearInterval(autoplay);
                autoplay = setInterval(() => heroGoTo(currentIndex + 1), getHeroDelay());
            }

            function resetAutoplay() {
                startAutoplay();
            }

            dots.forEach((dot, i) => {
                dot.addEventListener("click", () => {
                    if (i !== currentIndex) { heroGoTo(i); resetAutoplay(); }
                });
            });

            startAutoplay();
        }
    }

    /* =============================================
       PRODUCTS BANNER SLIDER
       - Mismo comportamiento que el hero slider
       - Soporte imagen y video (data-src en iframe)
    ============================================= */

    const productsBanner = document.querySelector(".products-banner");

    if (productsBanner) {

        const pbSlides = productsBanner.querySelectorAll(".products-banner__slide");
        const pbDots   = productsBanner.querySelectorAll(".products-banner__dot");

        if (pbSlides.length > 1) {

            let pbCurrent = 0;
            let pbAutoplay;

            function pbGoTo(index) {
                pbSlides[pbCurrent].classList.remove("active");
                if (pbDots[pbCurrent]) pbDots[pbCurrent].classList.remove("active");

                const oldIframe = pbSlides[pbCurrent].querySelector("iframe");
                if (oldIframe) oldIframe.src = "";

                pbCurrent = (index + pbSlides.length) % pbSlides.length;

                pbSlides[pbCurrent].classList.add("active");
                if (pbDots[pbCurrent]) pbDots[pbCurrent].classList.add("active");

                const newIframe = pbSlides[pbCurrent].querySelector("iframe");
                if (newIframe && newIframe.dataset.src) {
                    newIframe.src = newIframe.dataset.src;
                }
            }

            function pbStartAutoplay() {
                pbAutoplay = setInterval(() => pbGoTo(pbCurrent + 1), 6000);
            }

            function pbResetAutoplay() {
                clearInterval(pbAutoplay);
                pbStartAutoplay();
            }

            pbDots.forEach((dot, i) => {
                dot.addEventListener("click", () => {
                    if (i !== pbCurrent) { pbGoTo(i); pbResetAutoplay(); }
                });
            });

            pbStartAutoplay();
        }
    }


    /* =============================================
       HAMBURGER MENU
    ============================================= */

    const hamburger = document.getElementById("hamburgerBtn");
    const navLinks  = document.getElementById("navLinks");
    const navClose  = document.getElementById("navClose");
    const overlay   = document.getElementById("navOverlay");
    const mobileProductsToggle = navLinks?.querySelector("[data-mobile-products-toggle]");
    const mobileProductsPanel = navLinks?.querySelector("[data-mobile-products-panel]");

    function toggleMobileProducts(forceOpen = null) {
        if (!mobileProductsToggle || !mobileProductsPanel) return;

        const shouldOpen = forceOpen ?? mobileProductsToggle.getAttribute("aria-expanded") !== "true";

        mobileProductsToggle.classList.toggle("is-open", shouldOpen);
        mobileProductsToggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
        mobileProductsPanel.classList.toggle("is-open", shouldOpen);
        mobileProductsPanel.hidden = !shouldOpen;
    }

    function openMenu() {
        if (!navLinks || !overlay || !hamburger) return;
        navLinks.classList.add("open");
        overlay.classList.add("active");
        hamburger.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";

        if (!prefersReducedMotion()) {
            remove([navLinks, overlay]);
            overlay.style.opacity = "0";
            navLinks.style.opacity = "0";
            navLinks.style.transform = "translateX(24px)";

            animate(overlay, {
                opacity: [0, 1],
                duration: 180,
                ease: "out(2)",
            });

            animate(navLinks, {
                opacity: [0, 1],
                x: [24, 0],
                duration: 280,
                ease: "out(4)",
                onComplete: () => clearAnimatedInlineState(navLinks),
            });
        }
    }

    function closeMenu() {
        if (!navLinks || !overlay || !hamburger) return;
        const teardown = () => {
            navLinks.classList.remove("open");
            overlay.classList.remove("active");
            hamburger.setAttribute("aria-expanded", "false");
            document.body.style.overflow = "";
            clearAnimatedInlineState([navLinks, overlay]);
        };

        if (prefersReducedMotion()) {
            teardown();
            return;
        }

        remove([navLinks, overlay]);

        animate(overlay, {
            opacity: [1, 0],
            duration: 160,
            ease: "out(2)",
        });

        animate(navLinks, {
            opacity: [1, 0],
            x: [0, 20],
            duration: 220,
            ease: "out(3)",
            onComplete: teardown,
        });
    }

    if (hamburger) {
        hamburger.addEventListener("click", () => {
            navLinks.classList.contains("open") ? closeMenu() : openMenu();
        });

        navClose.addEventListener("click", closeMenu);
        overlay.addEventListener("click", closeMenu);
        mobileProductsToggle?.addEventListener("click", () => toggleMobileProducts());

        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", closeMenu);
        });
    }

    /* =============================================
       HEADER SCROLL — fondo sólido al desplazarse
       Solo activo cuando el header es fixed (≤1024px)
       para no afectar el comportamiento desktop.
    ============================================= */

    if (nav) {
        const updateHeaderBg = () => {
            if (window.innerWidth <= 1024 && window.scrollY > 20) {
                nav.classList.add("site-header--scrolled");
            } else {
                nav.classList.remove("site-header--scrolled");
            }
        };
        window.addEventListener("scroll", updateHeaderBg, { passive: true });
        window.addEventListener("resize", updateHeaderBg, { passive: true });
        updateHeaderBg();
    }

    /* =============================================
       HEADER SEARCH
    ============================================= */

    const searchModal = document.getElementById("headerSearchModal");
    const searchBackdrop = document.getElementById("headerSearchBackdrop");
    const searchClose = document.getElementById("headerSearchClose");
    const searchInput = document.getElementById("headerSearchInput");
    const searchOpenButtons = document.querySelectorAll("#headerSearchOpen, #headerSearchOpenMobile");

    function openSearch() {
        if (!searchModal) return;
        searchModal.hidden = false;
        document.body.style.overflow = "hidden";
        window.setTimeout(() => {
            if (searchInput) searchInput.focus();
        }, 20);
    }

    function closeSearch() {
        if (!searchModal) return;
        searchModal.hidden = true;
        document.body.style.overflow = "";
    }

    searchOpenButtons.forEach((button) => {
        button.addEventListener("click", () => {
            closeMenu();
            openSearch();
        });
    });

    if (searchClose) searchClose.addEventListener("click", closeSearch);
    if (searchBackdrop) searchBackdrop.addEventListener("click", closeSearch);

    document.addEventListener("keydown", (event) => {
        if (searchModal && !searchModal.hidden && event.key === "Escape") {
            closeSearch();
        }
    });

    /* =============================================
       PRESUPUESTO SELECT ARROW
    ============================================= */

    document.querySelectorAll(".presupuesto-select__arrow").forEach((arrow) => {
        arrow.addEventListener("click", () => {
            const select = arrow.parentElement ? arrow.parentElement.querySelector("select") : null;
            if (!select) return;
            select.focus();
            if (typeof select.showPicker === "function") {
                select.showPicker();
            } else {
                select.click();
            }
        });
    });

});


/* =============================================
   NOVEDADES SLIDER
   - Muestra grupos de 3 posts
   - Dots generados dinámicamente por blade
   - Click en dot navega al grupo correspondiente
   - Solo activo si hay más de 1 grupo
============================================= */

document.addEventListener("DOMContentLoaded", () => {

    const novedades = document.querySelector(".novedades");
    if (!novedades) return;

    const slides = novedades.querySelectorAll(".novedades__slide");
    const dots   = novedades.querySelectorAll(".novedades__dot");

    if (slides.length <= 1) return;

    let current = 0;

    function novedadesGoTo(index) {
        slides[current].classList.remove("active");
        if (dots[current]) dots[current].classList.remove("active");

        current = (index + slides.length) % slides.length;

        slides[current].classList.add("active");
        if (dots[current]) dots[current].classList.add("active");
    }

    dots.forEach((dot, i) => {
        dot.addEventListener("click", () => {
            if (i !== current) novedadesGoTo(i);
        });
    });

});


/* =============================================
   PRODUCTS FILTER TOGGLE
   - Reutiliza los chips existentes del catalogo
   - El segundo icono abre/cierra el panel
============================================= */

document.addEventListener("DOMContentLoaded", () => {

    const root = document.querySelector("[data-products-filters-root]");
    const toggle = document.querySelector("[data-products-filters-toggle]");
    const panel = document.querySelector("[data-products-filters-panel]");

    if (!root || !toggle || !panel) return;

    const form = root.querySelector("[data-products-filters-form]");
    const materialSelect = root.querySelector("[data-products-filter-material]");
    const gradeSelect = root.querySelector("[data-products-filter-grade]");
    const shapeSelect = root.querySelector("[data-products-filter-shape]");

    const gradeOptions = gradeSelect ? Array.from(gradeSelect.options).map((option) => ({
        value: option.value,
        label: option.textContent,
        materialSlug: option.dataset.materialSlug || "",
        selected: option.selected,
    })) : [];

    const shapeOptions = shapeSelect ? Array.from(shapeSelect.options).map((option) => ({
        value: option.value,
        label: option.textContent,
        materialSlugs: (option.dataset.materialSlugs || "").split(",").filter(Boolean),
        selected: option.selected,
    })) : [];

    const rebuildSelect = (select, options, selectedValue, matcher) => {
        if (!select) return;

        select.innerHTML = "";

        options
            .filter((option) => matcher(option))
            .forEach((option) => {
                const selectOption = document.createElement("option");
                selectOption.value = option.value;
                selectOption.textContent = option.label;

                if ("materialSlug" in option && option.materialSlug) {
                    selectOption.dataset.materialSlug = option.materialSlug;
                }

                if ("materialSlugs" in option && option.materialSlugs.length) {
                    selectOption.dataset.materialSlugs = option.materialSlugs.join(",");
                }

                if (option.value === selectedValue) {
                    selectOption.selected = true;
                }

                select.appendChild(selectOption);
            });

        if (!Array.from(select.options).some((option) => option.value === selectedValue)) {
            select.value = "";
        }
    };

    const syncDependentFilters = () => {
        if (!materialSelect) return;

        const selectedMaterial = materialSelect.value;
        const currentGrade = gradeSelect ? gradeSelect.value : "";
        const currentShape = shapeSelect ? shapeSelect.value : "";

        rebuildSelect(
            gradeSelect,
            gradeOptions,
            currentGrade,
            (option) => option.value === "" || selectedMaterial === "" || option.materialSlug === selectedMaterial,
        );

        rebuildSelect(
            shapeSelect,
            shapeOptions,
            currentShape,
            (option) => option.value === "" || selectedMaterial === "" || option.materialSlugs.includes(selectedMaterial),
        );
    };

    syncDependentFilters();

    materialSelect?.addEventListener("change", () => {
        if (gradeSelect) gradeSelect.value = "";
        if (shapeSelect) shapeSelect.value = "";
        syncDependentFilters();
    });

    const syncState = (expanded) => {
        toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
        panel.hidden = !expanded;
    };

    const openPanel = () => {
        if (prefersReducedMotion()) {
            syncState(true);
            return;
        }

        remove(panel);
        panel.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
        panel.style.opacity = "0";
        panel.style.transform = "translateY(14px)";
        panel.style.height = "0px";
        panel.style.overflow = "hidden";

        animate(panel, {
            opacity: [0, 1],
            y: [14, 0],
            height: [0, panel.scrollHeight],
            duration: 320,
            ease: "out(4)",
            onComplete: () => {
                clearAnimatedInlineState(panel);
                panel.style.removeProperty("height");
                panel.style.removeProperty("overflow");
            },
        });
    };

    const closePanel = () => {
        if (prefersReducedMotion()) {
            syncState(false);
            return;
        }

        remove(panel);
        toggle.setAttribute("aria-expanded", "false");
        panel.style.overflow = "hidden";

        animate(panel, {
            opacity: [1, 0],
            y: [0, 12],
            height: [panel.offsetHeight, 0],
            duration: 220,
            ease: "out(3)",
            onComplete: () => {
                panel.hidden = true;
                clearAnimatedInlineState(panel);
                panel.style.removeProperty("height");
                panel.style.removeProperty("overflow");
            },
        });
    };

    syncState(!panel.hidden);

    toggle.addEventListener("click", () => {
        panel.hidden ? openPanel() : closePanel();
    });

    document.addEventListener("click", (event) => {
        if (panel.hidden) return;
        if (root.contains(event.target)) return;
        closePanel();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !panel.hidden) {
            closePanel();
        }
    });

});

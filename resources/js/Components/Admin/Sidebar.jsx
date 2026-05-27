import { router, usePage } from "@inertiajs/react";
import { Icon } from "@iconify/react";
import { animate, remove } from "animejs";
import { useEffect, useMemo, useRef, useState } from "react";

const ADMIN_LOGO_PATH = "/storage/brand/logo.svg";
const ADMIN_SIDEBAR_SCROLL_KEY = "admin-sidebar-scroll-top";

function getBrandInitials(name) {
    return (name || "Nicolais Mario e Hijo")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase();
}

function isItemActive(item, currentUrl) {
    if (item.exact) {
        return currentUrl === item.url;
    }

    if (item.match) {
        return currentUrl.startsWith(item.match);
    }

    return currentUrl.startsWith(item.url);
}

function SidebarItem({ item, currentUrl, onNavigate, dark = false }) {
    const active = isItemActive(item, currentUrl);
    const hasStep = item.step !== undefined && item.step !== null;

    return (
        <button
            type="button"
            onClick={() => onNavigate(item.url)}
            className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${active
                ? dark
                    ? "bg-cyan-300/12 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(77,235,255,0.18)]"
                    : "bg-[#25A7CA]/12 text-[#117a98] shadow-[inset_0_0_0_1px_rgba(37,167,202,0.15)]"
                : dark
                    ? "text-slate-300 hover:bg-white/8 hover:text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
        >
            {hasStep ? (
                <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition ${active
                        ? "bg-[#25A7CA] text-white shadow-[0_8px_18px_rgba(37,167,202,0.28)]"
                        : dark
                            ? "bg-white/10 text-slate-300 group-hover:bg-white/15 group-hover:text-white"
                            : "bg-slate-200 text-slate-600 group-hover:bg-slate-300 group-hover:text-slate-800"
                        }`}
                >
                    {item.step}
                </span>
            ) : (
                <span
                    className={`h-2 w-2 rounded-full transition ${active ? "bg-[#25A7CA]" : dark ? "bg-white/20 group-hover:bg-cyan-200" : "bg-slate-300 group-hover:bg-slate-500"
                        }`}
                />
            )}
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {item.title}
            </span>
        </button>
    );
}

function SidebarSection({
    section,
    currentUrl,
    onNavigate,
    isOpen,
    onToggle,
    dark = false,
}) {
    const panelRef = useRef(null);
    const chevronRef = useRef(null);
    const mountedRef = useRef(false);
    const hasActiveChild = section.children.some((item) =>
        isItemActive(item, currentUrl),
    );

    useEffect(() => {
        const panel = panelRef.current;
        const chevron = chevronRef.current;

        if (!panel || !chevron) {
            return;
        }

        const prefersReducedMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        remove(panel);
        remove(chevron);

        if (!mountedRef.current || prefersReducedMotion) {
            mountedRef.current = true;
            panel.hidden = !isOpen;
            panel.style.height = isOpen ? "auto" : "0px";
            panel.style.opacity = isOpen ? "1" : "0";
            panel.style.overflow = isOpen ? "visible" : "hidden";
            chevron.style.transform = `rotate(${isOpen ? 180 : 0}deg)`;
            return;
        }

        panel.hidden = false;
        panel.style.overflow = "hidden";

        if (isOpen) {
            panel.style.height = "0px";
            panel.style.opacity = "0";

            const targetHeight = panel.scrollHeight;

            animate(panel, {
                height: ["0px", `${targetHeight}px`],
                opacity: [0, 1],
                duration: 320,
                ease: "out(3)",
                onComplete: () => {
                    panel.style.height = "auto";
                    panel.style.overflow = "visible";
                },
            });
        } else {
            const currentHeight = panel.scrollHeight;

            animate(panel, {
                height: [`${currentHeight}px`, "0px"],
                opacity: [1, 0],
                duration: 240,
                ease: "inOut(2)",
                onComplete: () => {
                    panel.hidden = true;
                    panel.style.height = "0px";
                    panel.style.overflow = "hidden";
                },
            });
        }

        animate(chevron, {
            rotate: isOpen ? 180 : 0,
            duration: 280,
            ease: "out(3)",
        });
    }, [isOpen]);

    return (
        <section
            data-admin-sidebar-section
            className={`rounded-[24px] border bg-white p-2.5 transition ${hasActiveChild
                ? dark
                    ? "border-cyan-200/25 bg-white/[0.075] shadow-[0_18px_60px_rgba(77,235,255,0.08)]"
                    : "border-[#25A7CA]/30 shadow-[0_14px_30px_rgba(37,167,202,0.08)]"
                : dark
                    ? "border-white/10 bg-white/[0.045]"
                    : "border-slate-200"
                }`}
        >
            <button
                type="button"
                onClick={onToggle}
                className={`flex w-full items-center gap-3 rounded-[20px] px-2.5 py-2.5 text-left transition ${hasActiveChild
                    ? dark ? "bg-cyan-300/10" : "bg-[#25A7CA]/8"
                    : dark ? "hover:bg-white/8" : "hover:bg-slate-50"
                    }`}
                aria-expanded={isOpen}
            >
                <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${hasActiveChild || isOpen
                        ? "bg-[#25A7CA] text-white"
                        : dark ? "bg-white/8 text-cyan-100/70" : "bg-slate-100 text-slate-500"
                        }`}
                >
                    <Icon icon={section.icon} width={18} />
                </span>

                <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                        {section.title}
                    </span>
                    {section.description ? (
                        <span className={`mt-0.5 block truncate text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                            {section.description}
                        </span>
                    ) : null}
                </span>

                <span
                    ref={chevronRef}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${dark ? "text-cyan-100/55" : "text-slate-400"}`}
                >
                    <Icon icon="solar:alt-arrow-down-outline" width={18} />
                </span>
            </button>

            <div ref={panelRef} className="px-2 pb-1 pt-2">
                <div className={`space-y-1 border-t pt-2 ${dark ? "border-white/10" : "border-slate-100"}`}>
                    {section.children.map((item) => (
                        <SidebarItem
                            key={item.url}
                            item={item}
                            currentUrl={currentUrl}
                            onNavigate={onNavigate}
                            dark={dark}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function Sidebar({
    onNavigateComplete = () => { },
    mobile = false,
    dark = false,
}) {
    const page = usePage();
    const auth = page.props?.auth;
    const app = page.props?.app;
    const currentUrl = page.url ?? "";
    const [showLogo, setShowLogo] = useState(true);
    const [openSectionKey, setOpenSectionKey] = useState("panel");
    const navRef = useRef(null);

    const sections = useMemo(() => [
        {
            key: "panel",
            title: "Panel",
            description: "Estado general del proyecto",
            icon: "solar:widget-2-outline",
            children: [
                {
                    title: "Vista general",
                    url: "/admin/dashboard",
                    match: "/admin/dashboard",
                },
            ],
        },
        {
            key: "inicio",
            title: "Inicio",
            description: "Inicio del sitio",
            icon: "solar:home-smile-outline",
            children: [
                {
                    title: "Slider principal",
                    url: "/admin/home/sliders",
                    match: "/admin/home/sliders",
                },
                {
                    title: "Nosotros en inicio",
                    url: "/admin/home/about",
                    match: "/admin/home/about",
                },
            ],
        },
        {
            key: "Nosotros",
            title: "Nosotros",
            description: "Contenido institucional",
            icon: "solar:users-group-rounded-outline",
            children: [
                {
                    title: "Página Nosotros",
                    url: "/admin/nosotros",
                    match: "/admin/nosotros",
                },
            ],
        },
        {
            key: "Productos",
            title: "Productos",
            description: "Catálogo y carga web",
            icon: "solar:box-outline",
            children: [
                {
                    title: "Productos web",
                    url: "/admin/productos",
                    exact: true,
                },
                {
                    title: "Imágenes por marca",
                    url: "/admin/productos?tab=brand-images",
                    match: "/admin/productos?tab=brand-images",
                },
                {
                    title: "Importador Excel",
                    url: "/admin/productos?tab=import",
                    match: "/admin/productos?tab=import",
                },
            ],
        },
        {
            key: "Catalogos",
            title: "Catálogos",
            description: "Archivos públicos",
            icon: "solar:folder-with-files-outline",
            children: [
                {
                    title: "Página Catálogos",
                    url: "/admin/catalog",
                    match: "/admin/catalog",
                },
            ],
        },
        {
            key: "Novedades",
            title: "Novedades",
            description: "Contenido editorial",
            icon: "solar:document-text-outline",
            children: [
                {
                    title: "Página Novedades",
                    url: "/admin/novedades",
                    match: "/admin/novedades",
                },
            ],
        },
        {
            key: "Newsletter",
            title: "Newsletter",
            description: "Suscriptores y envíos",
            icon: "solar:letter-unread-outline",
            children: [
                {
                    title: "Campañas y suscriptores",
                    url: "/admin/newsletter",
                    match: "/admin/newsletter",
                },
            ],
        },
        {
            key: "Contacto",
            title: "Contacto",
            description: "Datos y consultas",
            icon: "solar:chat-round-outline",
            children: [
                {
                    title: "Página Contacto",
                    url: "/admin/contacto",
                    match: "/admin/contacto",
                },
            ],
        },
        {
            key: "ZonaCliente",
            title: "Zona Cliente",
            description: "Acceso privado",
            icon: "solar:users-group-rounded-outline",
            children: [
                {
                    title: "Usuarios",
                    url: "/admin/zona-cliente/usuarios",
                    match: "/admin/zona-cliente/usuarios",
                },
                {
                    title: "Productos",
                    url: "/admin/zona-cliente/productos",
                    match: "/admin/zona-cliente/productos",
                },
                {
                    title: "Carrito",
                    url: "/admin/zona-cliente/carrito",
                    match: "/admin/zona-cliente/carrito",
                },
                {
                    title: "Presupuesto",
                    url: "/admin/zona-cliente/presupuesto",
                    match: "/admin/zona-cliente/presupuesto",
                },
                {
                    title: "Pedidos",
                    url: "/admin/zona-cliente/pedidos",
                    match: "/admin/zona-cliente/pedidos",
                },
                {
                    title: "Lista de precios",
                    url: "/admin/zona-cliente/lista-de-precios",
                    match: "/admin/zona-cliente/lista-de-precios",
                },
                {
                    title: "Info de pagos",
                    url: "/admin/zona-cliente/info-de-pagos",
                    match: "/admin/zona-cliente/info-de-pagos",
                },
                {
                    title: "Márgenes",
                    url: "/admin/zona-cliente/margenes",
                    match: "/admin/zona-cliente/margenes",
                },
            ],
        },

        {
            key: "WhatsApp",
            title: "WhatsApp flotante",
            description: "CTA transversal",
            icon: "solar:phone-calling-rounded-outline",
            children: [
                {
                    title: "Configuración",
                    url: "/admin/whatsapp",
                    match: "/admin/whatsapp",
                },
                {
                    title: "Footer",
                    url: "/admin/footer",
                    match: "/admin/footer",
                },
                {
                    title: "Redes sociales",
                    url: "/admin/redes-sociales",
                    match: "/admin/redes-sociales",
                },
            ],
        },
        {
            key: "Metadatos",
            title: "Metadatos",
            description: "SEO y datos base",
            icon: "solar:chart-2-outline",
            children: [
                {
                    title: "SEO del sitio",
                    url: "/admin/metadatos",
                    match: "/admin/metadatos",
                },
            ],
        },
        {
            key: "Usuarios",
            title: "Usuarios",
            description: "Accesos al panel",
            icon: "solar:users-group-rounded-outline",
            children: [
                {
                    title: "Gestionar usuarios",
                    url: "/admin/users",
                    match: "/admin/users",
                },
            ],
        },
    ], []);

    const activeSectionKey = useMemo(() => {
        const activeSection = sections.find((section) =>
            section.children.some((item) => isItemActive(item, currentUrl)),
        );

        return activeSection?.key ?? "panel";
    }, [sections, currentUrl]);

    useEffect(() => {
        setOpenSectionKey(activeSectionKey);
    }, [activeSectionKey]);

    useEffect(() => {
        const element = navRef.current;
        if (!element) {
            return;
        }

        const savedScrollTop = window.sessionStorage.getItem(
            ADMIN_SIDEBAR_SCROLL_KEY,
        );

        if (savedScrollTop !== null) {
            window.requestAnimationFrame(() => {
                element.scrollTop = Number(savedScrollTop) || 0;
            });
        }
    }, [currentUrl]);

    useEffect(() => {
        const element = navRef.current;
        if (!element) {
            return undefined;
        }

        const handleScroll = () => {
            window.sessionStorage.setItem(
                ADMIN_SIDEBAR_SCROLL_KEY,
                String(element.scrollTop),
            );
        };

        element.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            element.removeEventListener("scroll", handleScroll);
        };
    }, []);

    useEffect(() => {
        const element = navRef.current;
        if (!element) {
            return;
        }

        const prefersReducedMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (prefersReducedMotion) {
            return;
        }

        const sectionsToAnimate = Array.from(
            element.querySelectorAll("[data-admin-sidebar-section]"),
        );

        if (!sectionsToAnimate.length) {
            return;
        }

        animate(sectionsToAnimate, {
            opacity: [0, 1],
            translateY: [14, 0],
            duration: 420,
            delay: (_, index) => index * 36,
            ease: "out(3)",
        });
    }, []);

    const handleNavigate = (url) => {
        if (url === currentUrl) {
            onNavigateComplete();
            return;
        }

        if (navRef.current) {
            window.sessionStorage.setItem(
                ADMIN_SIDEBAR_SCROLL_KEY,
                String(navRef.current.scrollTop),
            );
        }

        onNavigateComplete();
        router.visit(url, {
            preserveScroll: true,
        });
    };

    const brandName = app?.name ?? "Nicolais Mario e Hijo";
    const user = auth?.user;

    return (
        <aside
            className={
                mobile
                    ? `flex h-full w-full flex-col border-r ${dark ? "border-white/10 bg-[#050A16] text-white" : "border-slate-200 bg-white text-slate-900"}`
                    : `sticky top-0 flex h-screen w-[296px] flex-col border-r ${dark ? "border-white/10 bg-[#050A16] text-white shadow-[18px_0_70px_rgba(0,0,0,.22)]" : "border-slate-200 bg-white text-slate-900"}`
            }
        >
            <div className={`border-b px-4 py-4 ${dark ? "border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(77,235,255,.12),transparent_42%)]" : "border-slate-200"}`}>
                <div className="flex items-start gap-3">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${dark ? "border-white/10 bg-white/92 shadow-[0_18px_50px_rgba(77,235,255,.1)]" : "border-slate-200 bg-white"}`}>
                        {showLogo ? (
                            <img
                                src={ADMIN_LOGO_PATH}
                                alt={`Logo de ${brandName}`}
                                className="h-10 w-10 object-contain"
                                onError={() => setShowLogo(false)}
                            />
                        ) : (
                            <span className={`text-lg font-semibold tracking-[0.18em] ${dark ? "text-slate-950" : "text-slate-900"}`}>
                                {getBrandInitials(brandName)}
                            </span>
                        )}
                    </div>

                    <div className="min-w-0 pt-1">
                        <p className={`truncate text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                            {brandName}
                        </p>
                        <p className={`mt-1 text-xs uppercase tracking-[0.18em] ${dark ? "text-cyan-100/55" : "text-slate-400"}`}>
                            Navegación compacta
                        </p>
                    </div>

                    {mobile ? (
                        <button
                            type="button"
                            onClick={onNavigateComplete}
                            className={`ml-auto flex h-10 w-10 items-center justify-center rounded-2xl border transition ${dark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                            aria-label="Cerrar menú"
                        >
                            <Icon icon="solar:close-circle-outline" width={18} />
                        </button>
                    ) : null}
                </div>
            </div>

            <nav
                ref={navRef}
                className="flex-1 space-y-2.5 overflow-y-auto px-3 py-4"
            >
                {sections.map((section) => (
                    <SidebarSection
                        key={section.key}
                        section={section}
                        currentUrl={currentUrl}
                        onNavigate={handleNavigate}
                        isOpen={openSectionKey === section.key}
                        onToggle={() =>
                            setOpenSectionKey((current) =>
                                current === section.key ? null : section.key,
                            )
                        }
                        dark={dark}
                    />
                ))}
            </nav>

            <div className={`border-t p-4 ${dark ? "border-white/10 bg-[#050A16]" : "border-slate-200"}`}>
                {user ? (
                    <div className={`mb-3 flex items-center gap-3 rounded-[22px] border p-3 ${dark ? "border-white/10 bg-white/[0.06]" : "border-slate-200 bg-slate-50"}`}>
                        {user.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="h-11 w-11 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25A7CA] text-sm font-semibold text-white">
                                {user.name?.charAt(0)?.toUpperCase?.() || "A"}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className={`truncate text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                                {user.name}
                            </p>
                            <p className={`truncate text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                                {user.email}
                            </p>
                        </div>
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={() => router.post("/admin/logout")}
                    className={`flex w-full items-center justify-center gap-2 rounded-[20px] border py-3 text-sm font-medium transition ${dark ? "border-red-300/20 bg-red-400/10 text-red-200 hover:bg-red-400/15" : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"}`}
                >
                    <Icon icon="solar:logout-2-outline" width={16} />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}

import Sidebar from "@/Components/Admin/Sidebar";
import Header from "@/Components/Admin/Header";
import { usePage } from "@inertiajs/react";
import Toast from "@/Components/Admin/Toast";
import { createContext, useContext, useMemo, useState } from "react";

const AdminThemeContext = createContext({
    theme: "light",
    dark: false,
});

export function useAdminTheme() {
    return useContext(AdminThemeContext);
}

export default function AdminLayout({ children, showImageGuide = false, fullWidth = false, theme = "dark", enableThemeSwitch = true }) {
    const { flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const storageKey = "admin-dashboard-theme";
    const [selectedTheme, setSelectedTheme] = useState(() => {
        if (typeof window === "undefined") {
            return theme;
        }

        return window.localStorage.getItem(storageKey) || theme;
    });
    const currentTheme = selectedTheme;
    const dark = currentTheme === "dark";
    const themeContext = useMemo(() => ({
        theme: currentTheme,
        dark,
    }), [currentTheme, dark]);
    const handleThemeChange = (nextTheme) => {
        setSelectedTheme(nextTheme);

        if (typeof window !== "undefined") {
            window.localStorage.setItem(storageKey, nextTheme);
        }
    };

    return (
        <AdminThemeContext.Provider value={themeContext}>
        <div className={`flex h-screen font-sans ${dark ? "bg-[#030713] text-white" : "bg-[#F3F4F6] text-[#111827]"}`}>
            <Toast flash={flash} />

            <div className={`hidden shrink-0 border-r md:block ${dark ? "border-white/10 bg-[#050A16]" : "border-[#E5E7EB] bg-white"}`}>
                <Sidebar dark={dark} />
            </div>

            {sidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        onClick={() => setSidebarOpen(false)}
                        className={`absolute inset-0 ${dark ? "bg-black/72" : "bg-slate-950/40"}`}
                    />
                    <div className={`absolute inset-y-0 left-0 z-50 w-[272px] max-w-[88vw] shadow-2xl ${dark ? "bg-[#050A16]" : "bg-white"}`}>
                        <Sidebar onNavigateComplete={() => setSidebarOpen(false)} mobile dark={dark} />
                    </div>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <Header
                    onToggleSidebar={() => setSidebarOpen((current) => !current)}
                    dark={dark}
                    showThemeSwitch
                    onThemeChange={handleThemeChange}
                />
                <main className={`flex-1 overflow-y-auto p-8 ${dark ? "bg-[#030713]" : ""}`}>
                    <div className={`mx-auto space-y-6 ${fullWidth ? "max-w-none" : "max-w-[1400px]"}`}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
        </AdminThemeContext.Provider>
    );
}

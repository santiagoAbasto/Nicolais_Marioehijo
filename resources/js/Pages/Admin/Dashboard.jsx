import AdminLayout, { useAdminTheme } from "@/Layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion } from "framer-motion";
import { create } from "zustand";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import * as THREE from "three";
import * as d3 from "d3";
import earthDayUrl from "../../../../node_modules/three-globe/example/img/earth-blue-marble.jpg?url";
import earthTopologyUrl from "../../../../node_modules/three-globe/example/img/earth-topology.png?url";
import nightSkyUrl from "../../../../node_modules/three-globe/example/img/night-sky.png?url";
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Bot,
    Cpu,
    Database,
    Gauge,
    Globe2,
    LockKeyhole,
    Network,
    Radar,
    Radio,
    ScanLine,
    ServerCog,
    ShieldCheck,
    Sparkles,
    Timer,
    TrendingUp,
    Users,
    Zap,
} from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    PolarAngleAxis,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const Globe = lazy(() => import("react-globe.gl").then((module) => ({ default: module.default })));
const queryClient = new QueryClient();

const useRealtimeStore = create((set) => ({
    pulse: 0,
    socketState: "simulado",
    bump: () => set((state) => ({ pulse: state.pulse + 1 })),
    setSocketState: (socketState) => set({ socketState }),
}));

const palette = {
    cyan: "#4DEBFF",
    blue: "#3B82FF",
    indigo: "#5B5BFF",
    violet: "#8B5CFF",
    magenta: "#FF4FD8",
    green: "#00FF9D",
    red: "#FF4D6D",
};

const metricIcons = {
    active_users: Users,
    requests_per_second: Activity,
    bots_blocked: Bot,
    attack_attempts: ShieldCheck,
    abandoned_sessions: AlertTriangle,
    ttfb: Timer,
    core_web_vitals: Gauge,
    api_latency: Zap,
    uptime: Radio,
};

function formatNumber(value, options = {}) {
    return new Intl.NumberFormat("es-AR", options).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return "Sin señal todavía";
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Sin señal todavía";

    return date.toLocaleString("es-AR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function useDashboardRealtime(initialPayload) {
    const bump = useRealtimeStore((state) => state.bump);
    const setSocketState = useRealtimeStore((state) => state.setSocketState);

    useEffect(() => {
        const interval = window.setInterval(bump, 2600);
        const socketUrl = import.meta.env.VITE_SOCKET_URL;
        let socket;

        if (socketUrl) {
            socket = io(socketUrl, { transports: ["websocket"], autoConnect: true });
            socket.on("connect", () => setSocketState("realtime"));
            socket.on("disconnect", () => setSocketState("reconectando"));
            socket.on("dashboard:analytics", bump);
        }

        return () => {
            window.clearInterval(interval);
            socket?.disconnect();
        };
    }, [bump, setSocketState]);

    return useQuery({
        queryKey: ["admin-ai-dashboard", initialPayload?.summary?.views_today ?? 0],
        queryFn: async () => initialPayload,
        initialData: initialPayload,
        staleTime: 15000,
        refetchOnWindowFocus: false,
    });
}

function DashboardStyles() {
    return (
        <style>{`
            @keyframes aiAurora {
                0%, 100% { transform: translate3d(-8%, -5%, 0) scale(1); opacity: .62; }
                50% { transform: translate3d(7%, 6%, 0) scale(1.08); opacity: .88; }
            }
            @keyframes borderFlow {
                0% { transform: rotate(0deg) scale(1); filter: hue-rotate(0deg); }
                50% { transform: rotate(180deg) scale(1.04); filter: hue-rotate(24deg); }
                100% { transform: rotate(360deg) scale(1); filter: hue-rotate(0deg); }
            }
            @keyframes scanMove {
                0% { transform: translateY(-110%); opacity: 0; }
                20%, 70% { opacity: .55; }
                100% { transform: translateY(110%); opacity: 0; }
            }
            @keyframes activeMapPing {
                0% { transform: scale(.68); opacity: .8; }
                72%, 100% { transform: scale(1.9); opacity: 0; }
            }
            .ai-panel {
                position: relative;
                isolation: isolate;
            }
            .ai-panel::before,
            .ai-panel::after {
                content: "";
                position: absolute;
                inset: -2px;
                border-radius: inherit;
                pointer-events: none;
                z-index: -1;
            }
            .ai-panel::before {
                background: conic-gradient(from 0deg, #4DEBFF, #3B82FF, #8B5CFF, #FF4FD8, #5B5BFF, #4DEBFF);
                animation: borderFlow 12s linear infinite;
                opacity: .9;
                filter: blur(0.4px);
            }
            .ai-panel::after {
                inset: -18px;
                background:
                    radial-gradient(circle at 12% 22%, rgba(77,235,255,.54), transparent 30%),
                    radial-gradient(circle at 78% 12%, rgba(255,79,216,.42), transparent 29%),
                    radial-gradient(circle at 50% 100%, rgba(91,91,255,.44), transparent 34%);
                animation: aiAurora 8s ease-in-out infinite;
                filter: blur(24px);
                opacity: .7;
            }
            .dashboard-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: rgba(77,235,255,.45) rgba(255,255,255,.06);
            }
            .dashboard-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
            .dashboard-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,.06); border-radius: 999px; }
            .dashboard-scrollbar::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, #4DEBFF, #8B5CFF);
                border-radius: 999px;
            }
        `}</style>
    );
}

function ParticleCore() {
    const ref = useRef();
    const positions = useMemo(() => {
        const count = 850;
        const points = new Float32Array(count * 3);

        for (let index = 0; index < count; index += 1) {
            const radius = 1.15 + Math.random() * 1.25;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            points[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
            points[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            points[index * 3 + 2] = radius * Math.cos(phi);
        }

        return points;
    }, []);

    useFrame(({ clock }) => {
        if (!ref.current) return;
        ref.current.rotation.y = clock.elapsedTime * 0.08;
        ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.28) * 0.12;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial
                color={palette.cyan}
                size={0.018}
                transparent
                opacity={0.82}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

function NeuralField() {
    return (
        <div className="pointer-events-none absolute inset-0 opacity-70">
            <Canvas camera={{ position: [0, 0, 4.4], fov: 54 }}>
                <ambientLight intensity={0.55} />
                <pointLight position={[4, 4, 4]} intensity={1.4} color={palette.cyan} />
                <ParticleCore />
            </Canvas>
        </div>
    );
}

function useDashboardConsoleFilters() {
    useEffect(() => {
        const originalWarn = console.warn;

        console.warn = (...args) => {
            const message = args.map((arg) => String(arg)).join(" ");

            if (message.includes("THREE.Clock: This module has been deprecated")) {
                return;
            }

            originalWarn(...args);
        };

        return () => {
            console.warn = originalWarn;
        };
    }, []);
}

function StatCard({ label, value, suffix = "", icon, accent = palette.cyan, sublabel, description }) {
    const IconComponent = icon;
    const { dark } = useAdminTheme();

    return (
        <motion.article
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`group relative overflow-hidden rounded-[26px] border p-5 backdrop-blur-2xl ${dark ? "border-white/10 bg-white/[0.065] shadow-[0_20px_80px_rgba(0,0,0,.28)]" : "border-slate-200 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,.08)]"}`}
        >
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${dark ? "via-white/45" : "via-slate-300"} to-transparent`} />
            <div
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-45"
                style={{ backgroundColor: accent }}
            />
            <div className="relative flex items-start justify-between gap-4">
                <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
                    <p className={`mt-3 text-3xl font-semibold tracking-tight ${dark ? "text-white" : "text-slate-950"}`}>
                        {value}
                        <span className={`text-lg ${dark ? "text-slate-300" : "text-slate-500"}`}>{suffix}</span>
                    </p>
                    {description ? <p className={`mt-2 max-w-[18rem] text-sm leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>{description}</p> : null}
                    {sublabel ? <p className={`mt-2 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{sublabel}</p> : null}
                </div>
                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-[0_0_34px_rgba(77,235,255,.18)] ${dark ? "border-white/10 bg-white/10" : "border-slate-200 bg-slate-50"}`}
                    style={{ color: accent }}
                >
                    <IconComponent size={22} strokeWidth={1.8} />
                </div>
            </div>
        </motion.article>
    );
}

function GlobeFallback() {
    return (
        <div className="relative flex h-full min-h-[460px] items-center justify-center overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_50%_48%,rgba(59,130,255,.35),rgba(6,18,45,.92)_52%,rgba(2,7,18,1)_76%)]">
            <div className="absolute h-72 w-72 rounded-full border border-cyan-300/35 bg-[radial-gradient(circle,rgba(77,235,255,.25),rgba(59,130,255,.22)_42%,rgba(139,92,255,.12)_62%,transparent_72%)] shadow-[0_0_90px_rgba(77,235,255,.28)]" />
            <Radar className="relative text-cyan-100" size={56} />
        </div>
    );
}

function TrafficGlobe({ regions = [], summary }) {
    const globeRef = useRef(null);
    const globeContainerRef = useRef(null);
    const [globeSize, setGlobeSize] = useState({ width: 900, height: 500 });
    const globeHeight = 500;
    const points = regions.map((region) => ({
        ...region,
        size: Math.max(0.22, Math.min(0.82, region.value / 18)),
        color: palette.green,
    }));
    const arcs = points.slice(1).map((point, index) => ({
        startLat: points[0]?.lat ?? -34.6,
        startLng: points[0]?.lng ?? -58.38,
        endLat: point.lat,
        endLng: point.lng,
        color: [palette.cyan, index % 2 ? palette.magenta : palette.violet],
    }));

    useEffect(() => {
        const element = globeContainerRef.current;

        if (!element) {
            return undefined;
        }

        const updateSize = () => {
            const rect = element.getBoundingClientRect();
            const measuredWidth = rect.width > 0 ? rect.width : element.clientWidth;

            const nextWidth = Math.max(320, Math.floor(measuredWidth || 900));

            setGlobeSize((current) => (
                current.width === nextWidth
                    ? current
                    : { ...current, width: nextWidth }
            ));
        };

        const frame = window.requestAnimationFrame(updateSize);

        const observer = new ResizeObserver(updateSize);
        observer.observe(element);

        return () => {
            window.cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!globeRef.current) {
            return;
        }

        globeRef.current.pointOfView({ lat: -28, lng: -58, altitude: 2.15 }, 900);

        const controls = globeRef.current.controls?.();
        if (controls) {
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.28;
            controls.enableZoom = false;
            controls.minDistance = 280;
            controls.maxDistance = 520;
        }

        const renderer = globeRef.current.renderer?.();
        renderer?.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, 1.35));
    }, [globeSize.width, points.length]);

    const makeActiveMarker = (point) => {
        const marker = document.createElement("div");
        marker.style.width = "22px";
        marker.style.height = "22px";
        marker.style.borderRadius = "999px";
        marker.style.position = "relative";
        marker.style.transform = "translate(-50%, -50%)";
        marker.style.background = "rgba(0,255,157,.96)";
        marker.style.border = "3px solid rgba(244,248,255,.95)";
        marker.style.boxShadow = "0 0 0 8px rgba(0,255,157,.18), 0 0 30px rgba(0,255,157,.75)";
        marker.style.pointerEvents = "none";

        const pulse = document.createElement("span");
        pulse.style.position = "absolute";
        pulse.style.inset = "-11px";
        pulse.style.border = "2px solid rgba(0,255,157,.52)";
        pulse.style.borderRadius = "999px";
        pulse.style.animation = "activeMapPing 1.8s ease-out infinite";
        marker.appendChild(pulse);

        const label = document.createElement("span");
        label.textContent = `${point.country} · ${point.value}`;
        label.style.position = "absolute";
        label.style.left = "28px";
        label.style.top = "50%";
        label.style.transform = "translateY(-50%)";
        label.style.whiteSpace = "nowrap";
        label.style.border = "1px solid rgba(255,255,255,.18)";
        label.style.borderRadius = "999px";
        label.style.background = "rgba(5,15,34,.82)";
        label.style.padding = "6px 10px";
        label.style.color = "#F4F8FF";
        label.style.fontSize = "12px";
        label.style.fontWeight = "700";
        label.style.boxShadow = "0 12px 40px rgba(0,0,0,.28)";
        label.style.backdropFilter = "blur(12px)";
        marker.appendChild(label);

        return marker;
    };

    return (
        <section className="relative flex flex-col self-start overflow-hidden rounded-[34px] border border-white/10 bg-[#060A18] p-5 shadow-[0_28px_120px_rgba(0,0,0,.42)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(77,235,255,.18),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(139,92,255,.18),transparent_34%),linear-gradient(135deg,rgba(9,21,52,.96),rgba(4,9,24,.98))]" />
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200/80">Mapa 3D global</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Usuarios activos por región</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                        Visualiza desde qué país hay sesiones activas y cómo se concentra la actividad del sitio en tiempo real.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                        {formatNumber(summary.active_users)} usuarios activos
                    </span>
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                        {formatNumber(summary.requests_per_second, { maximumFractionDigits: 2 })} rps
                    </span>
                </div>
            </div>

            <div ref={globeContainerRef} className="relative z-10 mt-5 h-[500px] overflow-hidden rounded-[30px] border border-white/10 bg-black">
                <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_48%,transparent_24%,rgba(2,8,22,.18)_72%,rgba(2,8,22,.5)_100%)]" />
                <Suspense fallback={<GlobeFallback />}>
                    <Globe
                        ref={globeRef}
                        width={globeSize.width}
                        height={globeHeight}
                        backgroundColor="rgba(0,0,0,0)"
                        backgroundImageUrl={nightSkyUrl}
                        globeImageUrl={earthDayUrl}
                        bumpImageUrl={earthTopologyUrl}
                        showAtmosphere
                        atmosphereColor="#4DEBFF"
                        atmosphereAltitude={0.18}
                        pointsData={points}
                        pointLat="lat"
                        pointLng="lng"
                        pointAltitude={(point) => 0.035 + point.size * 0.1}
                        pointRadius={(point) => 0.28 + point.size * 0.22}
                        pointColor={(point) => point.color}
                        pointResolution={10}
                        htmlElementsData={points}
                        htmlLat="lat"
                        htmlLng="lng"
                        htmlAltitude={0.055}
                        htmlElement={makeActiveMarker}
                        ringsData={points}
                        ringLat="lat"
                        ringLng="lng"
                        ringColor={(point) => () => point.color}
                        ringMaxRadius={(point) => 2.1 + point.size * 3.2}
                        ringPropagationSpeed={1.1}
                        ringRepeatPeriod={1450}
                        arcsData={arcs}
                        arcStartLat="startLat"
                        arcStartLng="startLng"
                        arcEndLat="endLat"
                        arcEndLng="endLng"
                        arcColor="color"
                        arcDashLength={0.45}
                        arcDashGap={1.6}
                        arcDashAnimateTime={2400}
                        arcStroke={0.65}
                    />
                </Suspense>

                <div className="absolute bottom-4 left-4 z-20 w-[min(320px,calc(100%-32px))] rounded-[24px] border border-white/10 bg-[#071124]/82 p-4 shadow-[0_18px_70px_rgba(0,0,0,.36)] backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/80">Regiones activas</p>
                        <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-xs font-semibold text-emerald-200">
                            {formatNumber(points.reduce((sum, point) => sum + Number(point.value || 0), 0))} señales
                        </span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {(points.length ? points : [{ country: "Sin actividad registrada", value: 0, color: palette.cyan }]).slice(0, 4).map((point) => (
                            <div key={point.country} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2">
                                <span className="flex min-w-0 items-center gap-2 text-sm text-slate-100">
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_18px_currentColor]" style={{ backgroundColor: point.color, color: point.color }} />
                                    <span className="truncate">{point.country}</span>
                                </span>
                                <span className="shrink-0 text-sm font-semibold text-white">{formatNumber(point.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function TelemetryChart({ telemetry = [] }) {
    const { dark } = useAdminTheme();

    return (
        <section className={`rounded-[30px] border p-5 backdrop-blur-2xl ${dark ? "border-white/10 bg-white/[0.065] shadow-[0_24px_90px_rgba(0,0,0,.3)]" : "border-slate-200 bg-white/92 shadow-[0_18px_60px_rgba(15,23,42,.08)]"}`}>
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? "text-cyan-200/80" : "text-[#0072BB]"}`}>Telemetry stream</p>
                    <h2 className={`mt-2 text-xl font-semibold ${dark ? "text-white" : "text-slate-950"}`}>Tráfico, latencia y alertas</h2>
                    <p className={`mt-2 max-w-xl text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                        Cruza volumen de visitas, velocidad de respuesta y señales de alerta para detectar cambios de comportamiento.
                    </p>
                </div>
                <ScanLine className="text-cyan-200" size={24} />
            </div>
            <div className="h-[320px] min-h-[320px] min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <AreaChart data={telemetry} margin={{ left: -12, right: 10, top: 8, bottom: 0 }}>
                        <defs>
                            <linearGradient id="trafficGlow" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor={palette.cyan} stopOpacity={0.55} />
                                <stop offset="100%" stopColor={palette.cyan} stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="latencyGlow" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor={palette.violet} stopOpacity={0.4} />
                                <stop offset="100%" stopColor={palette.violet} stopOpacity={0.01} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke={dark ? "rgba(255,255,255,.08)" : "rgba(15,23,42,.08)"} vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: dark ? "rgba(226,232,240,.65)" : "rgba(51,65,85,.7)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: dark ? "rgba(226,232,240,.65)" : "rgba(51,65,85,.7)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{
                                background: "rgba(7, 12, 28, .92)",
                                border: "1px solid rgba(77,235,255,.22)",
                                borderRadius: 18,
                                color: "#fff",
                                boxShadow: "0 20px 80px rgba(0,0,0,.45)",
                            }}
                        />
                        <Area type="monotone" dataKey="traffic" stroke={palette.cyan} strokeWidth={3} fill="url(#trafficGlow)" name="Tráfico" />
                        <Area type="monotone" dataKey="latency" stroke={palette.violet} strokeWidth={2} fill="url(#latencyGlow)" name="Latencia" />
                        <Line type="monotone" dataKey="alerts" stroke={palette.red} strokeWidth={2} dot={false} name="Alertas" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}

function DistributionPanel({ title, items = [], icon: IconComponent }) {
    const { dark } = useAdminTheme();

    return (
        <section className={`rounded-[30px] border p-5 backdrop-blur-2xl ${dark ? "border-white/10 bg-white/[0.065] shadow-[0_24px_90px_rgba(0,0,0,.26)]" : "border-slate-200 bg-white/92 shadow-[0_18px_60px_rgba(15,23,42,.08)]"}`}>
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? "text-slate-400" : "text-slate-500"}`}>{title}</p>
                    <h3 className={`mt-2 text-lg font-semibold ${dark ? "text-white" : "text-slate-950"}`}>Distribución activa</h3>
                    <p className={`mt-2 text-sm leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                        Muestra dónde se concentra la navegación para priorizar contenido, regiones o fuentes de tráfico.
                    </p>
                </div>
                <IconComponent className="text-cyan-200" size={22} />
            </div>
            <div className="space-y-3">
                {(items.length ? items : [{ label: "Sin datos", value: 0, ratio: 0 }]).map((item) => (
                    <div key={item.label}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                            <span className={`truncate ${dark ? "text-slate-200" : "text-slate-700"}`}>{item.label}</span>
                            <span className={`font-semibold ${dark ? "text-white" : "text-slate-950"}`}>{formatNumber(item.value)}</span>
                        </div>
                        <div className={`h-2 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-slate-200"}`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.ratio || 0}%` }}
                                transition={{ duration: 0.75, ease: "easeOut" }}
                                className="h-full rounded-full bg-gradient-to-r from-[#4DEBFF] via-[#5B5BFF] to-[#FF4FD8] shadow-[0_0_22px_rgba(77,235,255,.28)]"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function SystemRadials({ system = [] }) {
    const { dark } = useAdminTheme();
    const data = system.map((item) => ({ ...item, fill: item.tone }));

    return (
        <section className={`rounded-[30px] border p-5 backdrop-blur-2xl ${dark ? "border-white/10 bg-white/[0.065] shadow-[0_24px_90px_rgba(0,0,0,.26)]" : "border-slate-200 bg-white/92 shadow-[0_18px_60px_rgba(15,23,42,.08)]"}`}>
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Infraestructura</p>
                    <h3 className={`mt-2 text-lg font-semibold ${dark ? "text-white" : "text-slate-950"}`}>CPU, RAM y base de datos</h3>
                    <p className={`mt-2 text-sm leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                        Lectura rápida del consumo técnico para anticipar lentitud, saturación o consultas pesadas.
                    </p>
                </div>
                <ServerCog className="text-cyan-200" size={22} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
                {data.map((item) => (
                    <div key={item.label} className={`rounded-[24px] border p-4 text-center ${dark ? "border-white/10 bg-black/18" : "border-slate-200 bg-slate-50"}`}>
                        <div className="mx-auto h-24 min-h-24 min-w-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <RadialBarChart innerRadius="68%" outerRadius="100%" data={[item]} startAngle={90} endAngle={-270}>
                                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    <RadialBar dataKey="value" cornerRadius={20} background={{ fill: "rgba(255,255,255,.08)" }} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className={`mt-1 text-2xl font-semibold ${dark ? "text-white" : "text-slate-950"}`}>{item.value}%</p>
                        <p className={`text-xs font-bold uppercase tracking-[0.16em] ${dark ? "text-slate-400" : "text-slate-500"}`}>{item.label}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function HeatmapPanel({ telemetry = [] }) {
    const { dark } = useAdminTheme();
    const max = Math.max(...telemetry.map((item) => item.load || 0), 1);
    const heat = d3.scaleLinear().domain([0, max]).range(["rgba(77,235,255,.16)", "rgba(255,79,216,.75)"]);
    const cells = Array.from({ length: 42 }, (_, index) => {
        const item = telemetry[index % Math.max(telemetry.length, 1)] ?? { load: 0 };
        return {
            id: index,
            value: Math.min(100, (item.load || 0) + ((index * 7) % 24)),
        };
    });

    return (
        <section className={`rounded-[30px] border p-5 backdrop-blur-2xl ${dark ? "border-white/10 bg-white/[0.065] shadow-[0_24px_90px_rgba(0,0,0,.26)]" : "border-slate-200 bg-white/92 shadow-[0_18px_60px_rgba(15,23,42,.08)]"}`}>
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Heatmap</p>
                    <h3 className={`mt-2 text-lg font-semibold ${dark ? "text-white" : "text-slate-950"}`}>Intensidad de actividad</h3>
                    <p className={`mt-2 text-sm leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                        Cada bloque representa momentos de mayor o menor actividad para detectar picos sin leer tablas.
                    </p>
                </div>
                <Network className="text-cyan-200" size={22} />
            </div>
            <div className="grid grid-cols-7 gap-2">
                {cells.map((cell) => (
                    <motion.div
                        key={cell.id}
                        initial={{ opacity: 0, scale: 0.82 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: cell.id * 0.008 }}
                        className="h-9 rounded-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,.12)] 2xl:h-10"
                        style={{ background: heat(cell.value) }}
                    />
                ))}
            </div>
        </section>
    );
}

function SecurityStream({ recent = [], topIps = [] }) {
    const { dark } = useAdminTheme();

    return (
        <section className={`rounded-[30px] border backdrop-blur-2xl ${dark ? "border-white/10 bg-[#070B18]/90 shadow-[0_24px_90px_rgba(0,0,0,.34)]" : "border-slate-200 bg-white/92 shadow-[0_18px_60px_rgba(15,23,42,.08)]"}`}>
            <div className={`border-b p-5 ${dark ? "border-white/10" : "border-slate-200"}`}>
                <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Logs realtime</p>
                <h3 className={`mt-2 text-lg font-semibold ${dark ? "text-white" : "text-slate-950"}`}>Eventos y actividad sospechosa</h3>
                <p className={`mt-2 text-sm leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                    Resume las últimas acciones del sitio y marca señales que conviene revisar antes de que escalen.
                </p>
            </div>
            <div className="dashboard-scrollbar max-h-[420px] overflow-auto p-5">
                <div className="space-y-3">
                    {(recent.length ? recent : [{ page_label: "Esperando eventos del sitio", section_label: "Sistema", country_name: "Sin datos", time_ago: "Ahora" }]).map((item, index) => (
                        <div key={`${item.page_label}-${index}`} className={`rounded-[22px] border p-4 ${dark ? "border-white/10 bg-white/[0.055]" : "border-slate-200 bg-slate-50"}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className={`truncate font-semibold ${dark ? "text-white" : "text-slate-950"}`}>{item.page_label}</p>
                                    <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{item.section_label} · {item.country_name}</p>
                                </div>
                                <span className="shrink-0 rounded-full bg-cyan-300/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">{item.time_ago}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-5 space-y-3">
                    {topIps.map((item) => (
                        <div key={item.ip_address} className="rounded-[22px] border border-[#FF4D6D]/15 bg-[#FF4D6D]/7 p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className={`font-semibold ${dark ? "text-white" : "text-slate-950"}`}>{item.ip_address}</p>
                                    <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>{item.country_name} · {item.device_type}</p>
                                </div>
                                <span className="text-sm font-bold text-[#FF8BA1]">Riesgo {item.risk}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function ModuleLinks({ modules = [], pending = [] }) {
    const { dark } = useAdminTheme();

    return (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <div className={`rounded-[30px] border p-5 backdrop-blur-2xl ${dark ? "border-white/10 bg-white/[0.065]" : "border-slate-200 bg-white/92 shadow-[0_18px_60px_rgba(15,23,42,.08)]"}`}>
                <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Módulos administrables</p>
                <p className={`mt-2 max-w-2xl text-sm leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                    Accesos directos a las áreas que más influyen en contenido, catálogo, clientes y operación diaria.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {modules.map((module) => (
                        <Link
                            key={module.title}
                            href={module.href}
                            className={`group rounded-[22px] border p-4 transition hover:-translate-y-0.5 hover:border-cyan-200/40 ${dark ? "border-white/10 bg-black/20 hover:bg-white/10" : "border-slate-200 bg-slate-50 hover:bg-white"}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className={`font-semibold ${dark ? "text-white" : "text-slate-950"}`}>{module.title}</p>
                                    <p className={`mt-2 text-sm leading-5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{module.description}</p>
                                </div>
                                <ArrowRight className="mt-1 text-slate-500 transition group-hover:text-cyan-200" size={18} />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <div className={`rounded-[30px] border p-5 backdrop-blur-2xl ${dark ? "border-white/10 bg-white/[0.065]" : "border-slate-200 bg-white/92 shadow-[0_18px_60px_rgba(15,23,42,.08)]"}`}>
                <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Operación comercial</p>
                <p className={`mt-2 text-sm leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                    Pendientes comerciales que requieren seguimiento desde el panel administrativo.
                </p>
                <div className="mt-5 space-y-3">
                    {pending.map((item) => (
                        <div key={item.label} className={`flex items-center justify-between gap-4 rounded-[20px] border px-4 py-3 ${dark ? "border-white/10 bg-black/20" : "border-slate-200 bg-slate-50"}`}>
                            <span className={`text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>{item.label}</span>
                            <span className={`text-lg font-semibold ${dark ? "text-white" : "text-slate-950"}`}>{formatNumber(item.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CatalogPulse({ stats = {} }) {
    const { dark } = useAdminTheme();
    const items = [
        ["Familias", stats.families, Database],
        ["Líneas", stats.lines, Network],
        ["Series", stats.series, Sparkles],
        ["Grados", stats.grades, ShieldCheck],
        ["Variantes", stats.variants, Cpu],
    ];

    return (
        <section className={`rounded-[30px] border p-5 backdrop-blur-2xl ${dark ? "border-white/10 bg-white/[0.065]" : "border-slate-200 bg-white/92 shadow-[0_18px_60px_rgba(15,23,42,.08)]"}`}>
            <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Catálogo técnico</p>
            <p className={`mt-2 max-w-3xl text-sm leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                Estado estructural del catálogo para entender cobertura técnica, variantes disponibles y profundidad de datos.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {items.map(([label, value, IconComponent], index) => (
                    <div key={label} className={`rounded-[22px] border p-4 ${dark ? "border-white/10 bg-black/20" : "border-slate-200 bg-slate-50"}`}>
                        <IconComponent className={index % 2 ? "text-violet-200" : "text-cyan-200"} size={20} />
                        <p className={`mt-4 text-2xl font-semibold ${dark ? "text-white" : "text-slate-950"}`}>{formatNumber(value)}</p>
                        <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function DashboardExperience({ stats = {}, pending = [], modules = [], analytics, ops }) {
    useDashboardConsoleFilters();

    const { data } = useDashboardRealtime(analytics);
    const { dark } = useAdminTheme();
    const pulse = useRealtimeStore((state) => state.pulse);
    const socketState = useRealtimeStore((state) => state.socketState);
    const summary = data.summary;
    const metricCards = [
        ["Usuarios activos", summary.active_users, "", "active_users", palette.green, "Visitantes únicos con señal reciente dentro de la web."],
        ["Abandonos detectados", summary.abandoned_sessions, "", "abandoned_sessions", palette.red, "Sesiones que cerraron, se ocultaron o dejaron de responder."],
        ["Requests por segundo", summary.requests_per_second, "", "requests_per_second", palette.cyan, "Ritmo estimado de actividad técnica que recibe la plataforma."],
        ["Bots bloqueados", summary.bots_blocked, "", "bots_blocked", palette.violet, "Tráfico automático filtrado antes de afectar la lectura comercial."],
        ["Ataques bloqueados", summary.attack_attempts, "", "attack_attempts", palette.red, "Patrones sospechosos o errores repetidos que conviene vigilar."],
        ["TTFB", summary.ttfb, "ms", "ttfb", palette.blue, "Tiempo hasta el primer byte: indica velocidad inicial del servidor."],
        ["Core Web Vitals", summary.core_web_vitals, "%", "core_web_vitals", palette.green, "Salud percibida por el usuario: carga, estabilidad e interacción."],
        ["Latencia API", summary.api_latency, "ms", "api_latency", palette.magenta, "Tiempo promedio estimado de respuesta de servicios internos."],
        ["Uptime", summary.uptime, "%", "uptime", palette.cyan, "Disponibilidad general del sitio durante el período monitoreado."],
    ];

    return (
        <>
            <DashboardStyles />
            <Head title="Admin Dashboard" />

            <div className={`relative -m-4 isolate overflow-hidden rounded-[38px] p-4 shadow-[0_30px_140px_rgba(0,0,0,.38)] sm:-m-6 sm:p-6 lg:-m-8 lg:p-8 ${dark ? "bg-[#040713] text-white" : "bg-[#F7FAFC] text-slate-950"}`}>
                <NeuralField />
                <div className={`absolute inset-0 -z-10 ${dark ? "bg-[radial-gradient(circle_at_15%_10%,rgba(77,235,255,.2),transparent_34%),radial-gradient(circle_at_85%_4%,rgba(255,79,216,.13),transparent_30%),linear-gradient(135deg,#040713_0%,#071026_54%,#050815_100%)]" : "bg-[radial-gradient(circle_at_15%_10%,rgba(77,235,255,.18),transparent_34%),radial-gradient(circle_at_85%_4%,rgba(139,92,255,.1),transparent_30%),linear-gradient(135deg,#F8FCFF_0%,#EDF6FB_52%,#FFFFFF_100%)]"}`} />
                <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />

                <motion.header
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className={`relative z-10 overflow-hidden rounded-[34px] border p-6 shadow-[0_22px_100px_rgba(0,0,0,.18)] backdrop-blur-2xl md:p-8 ${dark ? "border-white/10 bg-white/[0.07]" : "border-white bg-white/78"}`}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(77,235,255,.18),transparent_30%),radial-gradient(circle_at_8%_70%,rgba(139,92,255,.16),transparent_32%)]" />
                    <div className="relative grid gap-8 xl:grid-cols-[1.15fr_.85fr] xl:items-end">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] ${dark ? "border-cyan-200/20 bg-cyan-200/10 text-cyan-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"}`}>
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00FF9D] opacity-70" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00FF9D]" />
                                    </span>
                                    Monitoreo en vivo
                                </span>
                                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${dark ? "border-white/10 bg-white/10 text-slate-300" : "border-slate-200 bg-white/80 text-slate-600"}`}>
                                    Señal {socketState} · pulso {pulse}
                                </span>
                            </div>
                            <h1 className={`mt-5 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl ${dark ? "text-white" : "text-slate-950"}`}>
                                Dashboard analítico para monitoreo total.
                            </h1>
                            <p className={`mt-5 max-w-3xl text-base leading-7 md:text-lg ${dark ? "text-slate-300" : "text-slate-600"}`}>
                                Telemetría, seguridad, rendimiento, catálogo y actividad comercial reunidos en una central premium preparada para producción.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                            <div className={`rounded-[24px] border p-4 ${dark ? "border-white/10 bg-black/20" : "border-slate-200 bg-white/70"}`}>
                                <p className={`text-xs font-bold uppercase tracking-[0.16em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Última señal</p>
                                <p className={`mt-2 text-lg font-semibold ${dark ? "text-white" : "text-slate-950"}`}>{formatDate(data.last_recorded_at)}</p>
                            </div>
                            <div className={`rounded-[24px] border p-4 ${dark ? "border-white/10 bg-black/20" : "border-slate-200 bg-white/70"}`}>
                                <p className={`text-xs font-bold uppercase tracking-[0.16em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Visitas 30 días</p>
                                <p className={`mt-2 text-lg font-semibold ${dark ? "text-white" : "text-slate-950"}`}>{formatNumber(summary.visits_30d)}</p>
                            </div>
                            <div className={`rounded-[24px] border p-4 ${dark ? "border-white/10 bg-black/20" : "border-slate-200 bg-white/70"}`}>
                                <p className={`text-xs font-bold uppercase tracking-[0.16em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Visitantes únicos</p>
                                <p className={`mt-2 text-lg font-semibold ${dark ? "text-white" : "text-slate-950"}`}>{formatNumber(summary.unique_visitors_30d)}</p>
                            </div>
                        </div>
                    </div>
                </motion.header>

                <main className="relative z-10 mt-6 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {metricCards.map(([label, value, suffix, key, accent, description]) => (
                            <StatCard
                                key={label}
                                label={label}
                                value={formatNumber(value, { maximumFractionDigits: 2 })}
                                suffix={suffix}
                                icon={metricIcons[key]}
                                accent={accent}
                                description={description}
                                sublabel={key === "attack_attempts" ? `${formatNumber(summary.error_500)} errores 500 · ${formatNumber(summary.error_404)} 404` : null}
                            />
                        ))}
                    </div>

                    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,.72fr)]">
                        <TrafficGlobe regions={data.regions} summary={summary} />
                        <div className="space-y-6">
                            <SystemRadials system={ops.system} />
                            <HeatmapPanel telemetry={data.telemetry} />
                        </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
                        <TelemetryChart telemetry={data.telemetry} />
                        <SecurityStream recent={data.recent} topIps={data.top_ips} />
                    </div>

                    <div className="grid gap-6 xl:grid-cols-3">
                        <DistributionPanel title="Secciones" items={data.sections} icon={TrendingUp} />
                        <DistributionPanel title="Países" items={data.countries} icon={Globe2} />
                        <DistributionPanel title="Fuentes" items={data.sources} icon={LockKeyhole} />
                    </div>

                    <section className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
                        <div className={`rounded-[30px] border p-5 backdrop-blur-2xl ${dark ? "border-white/10 bg-white/[0.065]" : "border-slate-200 bg-white/92 shadow-[0_18px_60px_rgba(15,23,42,.08)]"}`}>
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Páginas más vistas</p>
                                    <h3 className={`mt-2 text-lg font-semibold ${dark ? "text-white" : "text-slate-950"}`}>Ranking de intención</h3>
                                    <p className={`mt-2 max-w-xl text-sm leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                                        Ordena las páginas con más interacción para entender qué busca el usuario y qué contenido empuja la conversión.
                                    </p>
                                </div>
                                <AlertTriangle className="text-cyan-200" size={22} />
                            </div>
                            <div className="h-[300px] min-h-[300px] min-w-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <BarChart data={data.pages} layout="vertical" margin={{ left: 16, right: 16, top: 4, bottom: 4 }}>
                                        <CartesianGrid stroke={dark ? "rgba(255,255,255,.08)" : "rgba(15,23,42,.08)"} horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="label" type="category" width={150} tick={{ fill: dark ? "rgba(226,232,240,.72)" : "rgba(51,65,85,.72)", fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: "rgba(77,235,255,.08)" }}
                                            contentStyle={{
                                                background: "rgba(7, 12, 28, .92)",
                                                border: "1px solid rgba(77,235,255,.22)",
                                                borderRadius: 18,
                                                color: "#fff",
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[0, 14, 14, 0]} fill="url(#pageGradient)" />
                                        <defs>
                                            <linearGradient id="pageGradient" x1="0" x2="1" y1="0" y2="0">
                                                <stop offset="0%" stopColor={palette.cyan} />
                                                <stop offset="100%" stopColor={palette.violet} />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <CatalogPulse stats={stats} />
                        </div>
                    </section>

                    <ModuleLinks modules={modules} pending={pending} />
                </main>
            </div>
        </>
    );
}

export default function Dashboard(props) {
    return (
        <QueryClientProvider client={queryClient}>
            <AdminLayout showImageGuide={false} fullWidth theme="dark" enableThemeSwitch>
                <DashboardExperience {...props} />
            </AdminLayout>
        </QueryClientProvider>
    );
}

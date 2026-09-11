"use client";

import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import { useCallback, useEffect, useState } from "react";
import AdminUsers from "./AdminUsers";
import { MasonryFeed } from "@/components/feed/MasonryFeed";
import { VisualItem } from "@/types/visualItem";
import {
    useAdminWebSocket,
    WsAdminDashboard,
    WsAdminUser,
    WsVisualItem,
} from "@/hooks/useAdminWebSocket";

type View = "home" | "panel";

type AdminMetric = { label: string; value: number; change: string };
type AdminTable  = { name: string; rows: number; status: string };
type AdminDashboard = { metrics: AdminMetric[]; tables: AdminTable[] };
type AdminUser = {
    id: number;
    email: string;
    displayName: string;
    pictureUrl?: string | null;
    role: string;
    createdAt: string;
};

// Merge a WsAdminDashboard (no `change` field) into AdminDashboard safely
function mergeDashboard(incoming: WsAdminDashboard): AdminDashboard {
    return {
        metrics: incoming.metrics.map((m) => ({ label: m.label, value: m.value, change: "" })),
        tables: incoming.tables,
    };
}

export default function AdminWorkspace() {
    const [view, setView] = useState<View>("home");
    const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
    const [loadingDashboard, setLoadingDashboard] = useState(true);
    const [dashboardError, setDashboardError] = useState<string | null>(null);
    const [images, setImages] = useState<VisualItem[]>([]);
    const [loadingImages, setLoadingImages] = useState(true);
    const [imagesError, setImagesError] = useState<string | null>(null);
    const [savedPinIds, setSavedPinIds] = useState<number[]>([]);
    const [requiresLogin, setRequiresLogin] = useState(false);
    const [liveUsers, setLiveUsers] = useState<AdminUser[] | null>(null);
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "");

    // ── Initial REST loads ───────────────────────────────────────────────────
    useEffect(() => {
        apiClient<AdminDashboard>("/admin/dashboard", { credentials: "include" })
            .then(setDashboard)
            .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : "";
                const isUnauthorized = message.includes("401") || message.includes("403");
                setRequiresLogin(isUnauthorized);
                setDashboardError(isUnauthorized
                    ? "Admin access is required. Sign in with the admin Google account."
                    : "Unable to connect to the backend. Start Spring Boot and try again.");
            })
            .finally(() => setLoadingDashboard(false));
    }, []);

    useEffect(() => {
        apiClient<VisualItem[]>("/visual-items")
            .then(setImages)
            .catch(() => setImagesError("Unable to load visual items from the backend."))
            .finally(() => setLoadingImages(false));
    }, []);

    useEffect(() => {
        apiClient<number[]>("/user/saved-ids")
            .then(setSavedPinIds)
            .catch(() => setSavedPinIds([]));
    }, []);

    // ── WebSocket real-time handlers ─────────────────────────────────────────
    const handleDashboardUpdate = useCallback((data: WsAdminDashboard) => {
        setDashboard(mergeDashboard(data));
    }, []);

    const handleUsersUpdate = useCallback((data: WsAdminUser[]) => {
        setLiveUsers(data as AdminUser[]);
    }, []);

    const handleNewImage = useCallback((item: WsVisualItem) => {
        setImages((prev) => {
            // Avoid duplicates
            if (prev.some((p) => p.id === item.id)) return prev;
            return [item as unknown as VisualItem, ...prev];
        });
    }, []);

    const handleImageDeleted = useCallback((id: number) => {
        setImages((prev) => prev.filter((p) => p.id !== id));
    }, []);

    const wsStatus = useAdminWebSocket({
        onDashboardUpdate: handleDashboardUpdate,
        onUsersUpdate:     handleUsersUpdate,
        onNewImage:        handleNewImage,
        onImageDeleted:    handleImageDeleted,
    });

    // ── Admin delete (also handled by WS, but keep optimistic UI) ───────────
    const handleDeletePin = async (id: number) => {
        try {
            await apiClient(`/visual-items/${id}`, { method: "DELETE" });
            // WS will also push the deletion; filter here for instant feedback
            setImages((prev) => prev.filter((item) => item.id !== id));
        } catch (err) {
            alert("Failed to delete pin: " + (err instanceof Error ? err.message : "Unknown error"));
        }
    };

    const handleSaveToggle = async (id: number, shouldSave: boolean) => {
        await apiClient(`/user/saved/${id}`, { method: shouldSave ? "POST" : "DELETE" });
        setSavedPinIds((prev) =>
            shouldSave ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((savedId) => savedId !== id)
        );
    };

    return (
        <main className="min-h-screen bg-[#f5f1e9] text-[#1f2925]">
            <header className="sticky top-0 z-10 border-b border-[#d8ded8] bg-[#f5f1e9]/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4 lg:px-10">
                    <Link className="shrink-0 text-lg font-semibold tracking-tight" href="/">
                        Chitram
                    </Link>
                    <nav className="flex flex-1 items-center gap-1" aria-label="Admin navigation">
                        <button className={`rounded-full px-4 py-2 text-sm font-semibold transition ${view === "home" ? "bg-[#1f2925] text-white" : "text-[#68736d] hover:bg-white"}`} onClick={() => setView("home")} type="button">
                            Home
                        </button>
                        <button className={`rounded-full px-4 py-2 text-sm font-semibold transition ${view === "panel" ? "bg-[#1f2925] text-white" : "text-[#68736d] hover:bg-white"}`} onClick={() => setView("panel")} type="button">
                            Panel
                        </button>
                    </nav>

                    {/* Live connection indicator */}
                    <LiveIndicator status={wsStatus} />

                    <span className="hidden rounded-full bg-[#e9eee8] px-3 py-2 text-xs font-semibold text-[#68736d] sm:inline-flex">Admin workspace</span>
                    <button
                        className="rounded-full border border-[#d8ded8] px-3 py-1.5 text-xs font-semibold text-[#68736d] hover:border-[#1f2925] hover:text-[#1f2925] transition active:scale-95"
                        onClick={async () => {
                            try {
                                await apiClient<void>("/auth/logout", { method: "POST" });
                            } catch (e) {
                                console.error(e);
                            }
                            window.location.href = "/";
                        }}
                        type="button"
                    >
                        Sign out
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14 animate-fade-in">
                {dashboardError || view === "panel" ? (
                    <PanelView
                        dashboard={dashboard}
                        error={dashboardError}
                        loginUrl={`${backendUrl}/oauth2/authorization/google`}
                        requiresLogin={requiresLogin}
                        loading={loadingDashboard}
                        liveUsers={liveUsers}
                    />
                ) : (
                    <>
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d2643b]">Admin home</p>
                                <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">See what Chitram is becoming.</h1>
                                <p className="mt-4 max-w-2xl text-base leading-7 text-[#68736d]">A calm view of the latest visual activity across the platform with natural aspect ratios.</p>
                            </div>
                        </div>

                        {imagesError && <p className="mt-10 rounded-3xl border border-[#e8b9ad] bg-[#fff5f2] p-6 text-[#a84f37]">{imagesError}</p>}

                        <div className="mt-10">
                            <MasonryFeed
                                items={images}
                                isLoading={loadingImages}
                                isAdmin={true}
                                onDeletePin={handleDeletePin}
                                savedPinIds={savedPinIds}
                                onSaveToggle={handleSaveToggle}
                                emptyTitle="No visual items yet"
                                emptySubtitle="Images uploaded to Supabase Storage will appear here."
                            />
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

// ── Live indicator dot ───────────────────────────────────────────────────────
function LiveIndicator({ status }: { status: "connecting" | "connected" | "disconnected" }) {
    const configs = {
        connected:    { dot: "bg-[#438268] animate-pulse", label: "Live", text: "text-[#438268]" },
        connecting:   { dot: "bg-[#d2a63b] animate-pulse", label: "Connecting…", text: "text-[#d2a63b]" },
        disconnected: { dot: "bg-[#a84f37]", label: "Offline", text: "text-[#a84f37]" },
    };
    const c = configs[status];

    return (
        <div className="flex items-center gap-1.5" title={`WebSocket: ${status}`}>
            <span className={`h-2 w-2 rounded-full ${c.dot}`} />
            <span className={`hidden text-xs font-medium sm:block ${c.text}`}>{c.label}</span>
        </div>
    );
}

// ── Panel view (dashboard + users) ───────────────────────────────────────────
function PanelView({
    dashboard,
    error,
    loginUrl,
    requiresLogin,
    loading,
    liveUsers,
}: {
    dashboard: AdminDashboard | null;
    error: string | null;
    loginUrl: string;
    requiresLogin: boolean;
    loading: boolean;
    liveUsers: Array<{ id: number; email: string; displayName: string; pictureUrl?: string | null; role: string; createdAt: string }> | null;
}) {
    if (error) {
        return (
            <div className="rounded-3xl border border-[#e8b9ad] bg-[#fff5f2] p-6 text-[#a84f37] animate-fade-in">
                <p>{error}</p>
                {requiresLogin && (
                    <a className="mt-4 inline-flex rounded-full bg-[#1f2925] px-4 py-2 text-sm font-semibold text-white active:scale-95 transition" href={loginUrl}>
                        Sign in with Google
                    </a>
                )}
            </div>
        );
    }

    if (loading || !dashboard) {
        return (
            <div className="animate-fade-in">
                <div className="h-6 w-36 rounded-md animate-shimmer" />
                <div className="mt-3 h-10 w-96 rounded-xl animate-shimmer" />
                <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-3xl bg-white p-5 shadow-sm space-y-4 border border-[#e4dcd3]/60">
                            <div className="h-4 w-24 rounded animate-shimmer" />
                            <div className="h-8 w-16 rounded animate-shimmer" />
                        </div>
                    ))}
                </div>
                <div className="mt-6 rounded-3xl border border-[#d8ded8] bg-white p-6 space-y-4">
                    <div className="h-5 w-32 rounded animate-shimmer" />
                    <div className="h-32 w-full rounded-2xl animate-shimmer" />
                </div>
            </div>
        );
    }

    return (
        <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d2643b]">Platform panel</p>
            <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Know the shape of Chitram.</h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-[#68736d]">A read-only overview of users, activity, and database readiness.</p>
                </div>
                <span className="text-sm text-[#68736d]">Updated live</span>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {dashboard.metrics.map((stat) => (
                    <section className="rounded-3xl bg-white p-5 shadow-[0_16px_50px_rgba(31,41,37,0.08)] transition-all" key={stat.label}>
                        <p className="text-sm text-[#68736d]">{stat.label}</p>
                        <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums transition-all duration-300">{stat.value.toLocaleString()}</p>
                    </section>
                ))}
            </div>
            <section className="mt-6 overflow-hidden rounded-3xl border border-[#d8ded8] bg-white">
                <div className="flex items-center justify-between border-b border-[#e8ece8] px-6 py-5">
                    <div>
                        <h2 className="font-semibold">Database tables</h2>
                        <p className="mt-1 text-sm text-[#68736d]">Current foundation and planned domains.</p>
                    </div>
                    <span className="rounded-full bg-[#e9eee8] px-3 py-1 text-xs font-semibold text-[#438268]">Read only</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                        <thead className="bg-[#f8faf7] text-xs uppercase tracking-[0.12em] text-[#68736d]"><tr><th className="px-6 py-4 font-semibold">Table</th><th className="px-6 py-4 font-semibold">Rows</th><th className="px-6 py-4 font-semibold">Status</th></tr></thead>
                        <tbody>{dashboard.tables.map((table) => <tr className="border-t border-[#e8ece8] transition-colors" key={table.name}><td className="px-6 py-4 font-medium">{table.name}</td><td className="px-6 py-4 text-[#68736d] tabular-nums">{table.rows.toLocaleString()}</td><td className="px-6 py-4"><span className={table.status === "Healthy" ? "text-[#438268]" : "text-[#d2643b]"}>{table.status}</span></td></tr>)}</tbody>
                    </table>
                </div>
            </section>
            <AdminUsers liveUsers={liveUsers} />
        </div>
    );
}

"use client";

import { apiClient } from "@/lib/apiClient";
import { useEffect, useState } from "react";

type Category = { id: number; name: string; description: string | null; enabled: boolean };
type Report = { id: number; targetType: string; targetId: number; reportedBy: string; reason: string; description: string | null; status: string; createdAt: string };
type Pin = { id: number; title: string; category: string };
type Activity = { action: string; target: string | null; occurredAt: string };

export default function AdminOperations() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [pins, setPins] = useState<Pin[]>([]);
    const [platformSettings, setPlatformSettings] = useState<Record<string, boolean>>({});
    const [activity, setActivity] = useState<Activity[]>([]);
    const [sessionDurationDays, setSessionDurationDays] = useState<number | null>(null);
    const [savingSessionDuration, setSavingSessionDuration] = useState(false);
    const [categoryName, setCategoryName] = useState("");
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [reportFilter, setReportFilter] = useState<string>("ALL");
    const [reportTargetFilter, setReportTargetFilter] = useState<string>("ALL");

    async function load() {
        const [loadedCategories, loadedReports, loadedPins, loadedSettings, loadedActivity, loadedSession] = await Promise.all([
            apiClient<Category[]>("/admin/categories"),
            apiClient<Report[]>("/admin/reports"),
            apiClient<Pin[]>("/admin/visual-items"),
            apiClient<Record<string, boolean>>("/admin/settings/platform"),
            apiClient<Activity[]>("/admin/activity"),
            apiClient<{ sessionDurationDays: number }>("/admin/settings/session"),
        ]);
        setCategories(loadedCategories);
        setReports(loadedReports);
        setPins(loadedPins.slice(0, 12));
        setPlatformSettings(loadedSettings);
        setActivity(loadedActivity);
        setSessionDurationDays(loadedSession.sessionDurationDays);
    }

    useEffect(() => {
        let active = true;
        queueMicrotask(() => {
            load().catch(() => {
                if (active) setCategoryError("Unable to load categories, reports, and settings.");
            });
        });
        return () => { active = false; };
    }, []);

    async function createCategory() {
        if (!categoryName.trim()) return;
        setCategoryError(null);
        try {
            await apiClient("/admin/categories", {
                method: "POST",
                body: JSON.stringify({ name: categoryName.trim(), description: null }),
            });
            setCategoryName("");
            await load();
        } catch (error) {
            setCategoryError(error instanceof Error ? error.message : "Unable to create category.");
        }
    }

    async function toggleCategory(category: Category) {
        await apiClient(`/admin/categories/${category.id}/status`, {
            method: "PUT",
            body: JSON.stringify({ enabled: !category.enabled }),
        });
        await load();
    }

    async function updateReportStatus(report: Report, status: string) {
        await apiClient(`/admin/reports/${report.id}/status`, {
            method: "PUT",
            body: JSON.stringify({ status }),
        });
        await load();
    }

    async function setModerationStatus(pinId: number, status: string) {
        await apiClient(`/admin/visual-items/${pinId}/moderation`, { method: "PUT", body: JSON.stringify({ status }) });
        await load();
    }

    async function togglePlatformSetting(key: string, enabled: boolean) {
        await apiClient(`/admin/settings/platform/${key}`, { method: "PUT", body: JSON.stringify({ enabled }) });
        setPlatformSettings((previous) => ({ ...previous, [key]: enabled }));
        const refreshed = await apiClient<Activity[]>("/admin/activity");
        setActivity(refreshed);
    }

    async function updateSessionDuration(days: number) {
        setSavingSessionDuration(true);
        setCategoryError(null);
        try {
            const saved = await apiClient<{ sessionDurationDays: number }>("/admin/settings/session", {
                method: "PUT",
                body: JSON.stringify({ sessionDurationDays: days }),
            });
            setSessionDurationDays(saved.sessionDurationDays);
        } catch (error) {
            setCategoryError(error instanceof Error ? error.message : "Unable to update session duration.");
        } finally {
            setSavingSessionDuration(false);
        }
    }

    const filteredReports = reports.filter((report) => {
        const statusMatch = reportFilter === "ALL" || report.status === reportFilter;
        const targetMatch = reportTargetFilter === "ALL" || report.targetType === reportTargetFilter;
        return statusMatch && targetMatch;
    });

    const reportStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: "bg-[#fef3cd] text-[#856404]",
            REVIEWING: "bg-[#cce5ff] text-[#004085]",
            RESOLVED: "bg-[#e9eee8] text-[#438268]",
            DISMISSED: "bg-[#f0f0f0] text-[#68736d]",
        };
        return styles[status] ?? "bg-[#f0f0f0] text-[#68736d]";
    };

    return (
        <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
            <section className="overflow-hidden rounded-3xl border border-[#d8ded8] bg-white">
                <div className="border-b border-[#e8ece8] px-6 py-5">
                    <h2 className="font-semibold">Categories</h2>
                    <p className="mt-1 text-sm text-[#68736d]">Manage the labels used by discovery and recommendations.</p>
                </div>
                <div className="flex gap-2 border-b border-[#e8ece8] p-4">
                    <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="New category" className="min-w-0 flex-1 rounded-full border border-[#d8ded8] px-4 py-2 text-sm outline-none focus:border-[#438268]" />
                    <button type="button" onClick={() => void createCategory()} className="rounded-full bg-[#1f2925] px-4 py-2 text-sm font-semibold text-white">Create</button>
                </div>
                {categoryError && <p className="px-6 py-3 text-sm text-[#a84f37]">{categoryError}</p>}
                <div className="divide-y divide-[#e8ece8]">
                    {categories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between px-6 py-4">
                            <span className="text-sm font-medium">{category.name}</span>
                            <button type="button" onClick={() => void toggleCategory(category)} className={`rounded-full px-3 py-1 text-xs font-semibold ${category.enabled ? "bg-[#e9eee8] text-[#438268]" : "bg-[#f2ece8] text-[#a84f37]"}`}>{category.enabled ? "Enabled" : "Disabled"}</button>
                        </div>
                    ))}
                    {categories.length === 0 && <p className="px-6 py-5 text-sm text-[#68736d]">No categories created yet.</p>}
                </div>
            </section>
            <section className="overflow-hidden rounded-3xl border border-[#d8ded8] bg-white">
                <div className="border-b border-[#e8ece8] px-6 py-5">
                    <h2 className="font-semibold">Reports</h2>
                    <p className="mt-1 text-sm text-[#68736d]">Review reported content and accounts.</p>
                </div>
                <div className="flex flex-wrap gap-2 border-b border-[#e8ece8] px-6 py-3">
                    <select value={reportFilter} onChange={(e) => setReportFilter(e.target.value)} className="rounded-lg border border-[#d8ded8] bg-white px-3 py-1.5 text-xs font-semibold">
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="REVIEWING">Reviewing</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="DISMISSED">Dismissed</option>
                    </select>
                    <select value={reportTargetFilter} onChange={(e) => setReportTargetFilter(e.target.value)} className="rounded-lg border border-[#d8ded8] bg-white px-3 py-1.5 text-xs font-semibold">
                        <option value="ALL">All Targets</option>
                        <option value="PIN">Pins</option>
                        <option value="USER">Accounts</option>
                    </select>
                </div>
                <div className="divide-y divide-[#e8ece8] max-h-[480px] overflow-y-auto">
                    {filteredReports.map((report) => (
                        <div key={report.id} className="px-6 py-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold">Report #{report.id}</span>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${reportStatusBadge(report.status)}`}>{report.status}</span>
                                        <span className="rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-semibold text-[#68736d]">{report.targetType}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-[#68736d]">
                                        Target: {report.targetType} #{report.targetId} · Reported by {report.reportedBy}
                                    </p>
                                    <p className="mt-0.5 text-xs font-medium text-[#1f2925]">{report.reason}</p>
                                    {report.description && <p className="mt-1 text-xs text-[#68736d]">{report.description}</p>}
                                    <p className="mt-1 text-[10px] text-[#98a39c]">{report.createdAt}</p>
                                </div>
                                <div className="flex shrink-0 gap-1.5">
                                    {report.status !== "RESOLVED" && (
                                        <button type="button" onClick={() => void updateReportStatus(report, "RESOLVED")} className="rounded-full bg-[#e9eee8] px-3 py-1 text-[11px] font-semibold text-[#438268] transition hover:bg-[#d8e8d5]">Resolve</button>
                                    )}
                                    {report.status !== "DISMISSED" && (
                                        <button type="button" onClick={() => void updateReportStatus(report, "DISMISSED")} className="rounded-full border border-[#d8ded8] px-3 py-1 text-[11px] font-semibold transition hover:bg-[#f5f1e9]">Dismiss</button>
                                    )}
                                    {report.status === "RESOLVED" || report.status === "DISMISSED" ? (
                                        <button type="button" onClick={() => void updateReportStatus(report, "PENDING")} className="rounded-full border border-[#d8ded8] px-3 py-1 text-[11px] font-semibold transition hover:bg-[#f5f1e9]">Reopen</button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredReports.length === 0 && <p className="px-6 py-5 text-sm text-[#68736d]">No reports match the current filters.</p>}
                </div>
            </section>
            <section className="overflow-hidden rounded-3xl border border-[#d8ded8] bg-white xl:col-span-2">
                <div className="border-b border-[#e8ece8] px-6 py-5"><h2 className="font-semibold">Pin moderation</h2><p className="mt-1 text-sm text-[#68736d]">Approve, reject, or hide uploaded pins.</p></div>
                <div className="divide-y divide-[#e8ece8]">
                    {pins.map((pin) => <div key={pin.id} className="flex items-center justify-between gap-4 px-6 py-4"><div><p className="text-sm font-semibold">{pin.title}</p><p className="text-xs text-[#68736d]">#{pin.id} · {pin.category}</p></div><div className="flex gap-2"><button type="button" onClick={() => void setModerationStatus(pin.id, "APPROVED")} className="rounded-full bg-[#e9eee8] px-3 py-1 text-xs font-semibold text-[#438268]">Approve</button><button type="button" onClick={() => void setModerationStatus(pin.id, "REJECTED")} className="rounded-full bg-[#fff5f2] px-3 py-1 text-xs font-semibold text-[#a84f37]">Reject</button><button type="button" onClick={() => void setModerationStatus(pin.id, "HIDDEN")} className="rounded-full border border-[#d8ded8] px-3 py-1 text-xs font-semibold">Hide</button></div></div>)}
                    {pins.length === 0 && <p className="px-6 py-5 text-sm text-[#68736d]">No pins available.</p>}
                </div>
            </section>
            <div className="flex flex-col gap-6">
                <section className="overflow-hidden rounded-3xl border border-[#d8ded8] bg-white">
                    <div className="border-b border-[#e8ece8] px-6 py-5"><h2 className="font-semibold">Platform settings</h2><p className="mt-1 text-sm text-[#68736d]">Small operational switches for the early platform.</p></div>
                    <div className="divide-y divide-[#e8ece8]">{[["registration_enabled", "Registration"], ["image_uploads_enabled", "Image uploads"], ["public_profiles_enabled", "Public profiles"]].map(([key, label]) => <div key={key} className="flex items-center justify-between px-6 py-4"><span className="text-sm font-medium">{label}</span><div className="checkbox-wrapper-35"><input checked={Boolean(platformSettings[key])} id={`platform-${key}`} name={`platform-${key}`} onChange={(event) => void togglePlatformSetting(key, event.target.checked)} type="checkbox" className="switch" /><label htmlFor={`platform-${key}`}><span className="switch-x-text"> </span><span className="switch-x-toggletext"><span className="switch-x-unchecked"><span className="switch-x-hiddenlabel">Unchecked: </span>OFF</span><span className="switch-x-checked"><span className="switch-x-hiddenlabel">Checked: </span>ON</span></span></label></div></div>)}</div>
                </section>
                <section className="overflow-hidden rounded-3xl border border-[#d8ded8] bg-white">
                    <div className="border-b border-[#e8ece8] px-6 py-5"><h2 className="font-semibold">Admin activity</h2><p className="mt-1 text-sm text-[#68736d]">Recent administrative changes.</p></div>
                    <div className="divide-y divide-[#e8ece8]">{activity.slice(0, 8).map((entry) => <div key={`${entry.action}-${entry.occurredAt}`} className="px-6 py-3"><p className="text-sm font-semibold">{entry.action}</p><p className="text-xs text-[#68736d]">{entry.target ?? "Platform"} · {entry.occurredAt}</p></div>)}{activity.length === 0 && <p className="px-6 py-5 text-sm text-[#68736d]">No admin activity yet.</p>}</div>
                </section>
                <section className="overflow-hidden rounded-3xl border border-[#d8ded8] bg-white">
                    <div className="border-b border-[#e8ece8] px-6 py-5"><h2 className="font-semibold">Session duration</h2><p className="mt-1 text-sm text-[#68736d]">Controls how long users remain signed in before they need to authenticate again.</p></div>
                    <div className="px-6 py-5">
                        {sessionDurationDays === null ? (
                            <p className="text-sm text-[#68736d]">Loading current session duration...</p>
                        ) : (
                            <select value={sessionDurationDays} disabled={savingSessionDuration} onChange={(event) => void updateSessionDuration(Number(event.target.value))} className="w-full rounded-xl border border-[#d8ded8] bg-white px-3 py-2 text-sm disabled:opacity-60">
                                <option value={7}>7 days</option>
                                <option value={30}>30 days</option>
                                <option value={90}>90 days</option>
                                <option value={365}>1 year</option>
                            </select>
                        )}
                        <p className="mt-2 text-xs text-[#68736d]">New sign-ins use this value. Existing sessions keep their current expiry.</p>
                    </div>
                </section>
            </div>
        </div>
    );
}

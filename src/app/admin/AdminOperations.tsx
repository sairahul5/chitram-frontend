"use client";

import { apiClient } from "@/lib/apiClient";
import { useEffect, useState } from "react";

type Category = { id: number; name: string; description: string | null; enabled: boolean };
type Report = { id: number; pinId: number; reportedBy: string; reason: string; status: string; createdAt: string };
type Pin = { id: number; title: string; category: string };
type Activity = { action: string; target: string | null; occurredAt: string };

export default function AdminOperations() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [pins, setPins] = useState<Pin[]>([]);
    const [platformSettings, setPlatformSettings] = useState<Record<string, boolean>>({});
    const [activity, setActivity] = useState<Activity[]>([]);
    const [categoryName, setCategoryName] = useState("");
    const [categoryError, setCategoryError] = useState<string | null>(null);

    async function load() {
        const [loadedCategories, loadedReports, loadedPins, loadedSettings, loadedActivity] = await Promise.all([
            apiClient<Category[]>("/admin/categories"),
            apiClient<Report[]>("/admin/reports"),
            apiClient<Pin[]>("/admin/visual-items"),
            apiClient<Record<string, boolean>>("/admin/settings/platform"),
            apiClient<Activity[]>("/admin/activity"),
        ]);
        setCategories(loadedCategories);
        setReports(loadedReports);
        setPins(loadedPins.slice(0, 12));
        setPlatformSettings(loadedSettings);
        setActivity(loadedActivity);
    }

    useEffect(() => {
        load().catch(() => setCategoryError("Unable to load categories and reports."));
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

    async function resolveReport(report: Report) {
        await apiClient(`/admin/reports/${report.id}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: report.status === "RESOLVED" ? "PENDING" : "RESOLVED" }),
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

    return (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
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
                    <h2 className="font-semibold">Reports & moderation</h2>
                    <p className="mt-1 text-sm text-[#68736d]">AI moderation is not configured; review reported pins manually.</p>
                </div>
                <div className="divide-y divide-[#e8ece8]">
                    {reports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between gap-4 px-6 py-4">
                            <div><p className="text-sm font-semibold">Pin #{report.pinId} · {report.reason}</p><p className="mt-1 text-xs text-[#68736d]">Reported by {report.reportedBy} · {report.status}</p></div>
                            <button type="button" onClick={() => void resolveReport(report)} className="rounded-full border border-[#d8ded8] px-3 py-1 text-xs font-semibold">{report.status === "RESOLVED" ? "Reopen" : "Resolve"}</button>
                        </div>
                    ))}
                    {reports.length === 0 && <p className="px-6 py-5 text-sm text-[#68736d]">No reports pending.</p>}
                </div>
            </section>
            <section className="overflow-hidden rounded-3xl border border-[#d8ded8] bg-white xl:col-span-2">
                <div className="border-b border-[#e8ece8] px-6 py-5"><h2 className="font-semibold">Pin moderation</h2><p className="mt-1 text-sm text-[#68736d]">Approve, reject, or hide uploaded pins.</p></div>
                <div className="divide-y divide-[#e8ece8]">
                    {pins.map((pin) => <div key={pin.id} className="flex items-center justify-between gap-4 px-6 py-4"><div><p className="text-sm font-semibold">{pin.title}</p><p className="text-xs text-[#68736d]">#{pin.id} · {pin.category}</p></div><div className="flex gap-2"><button type="button" onClick={() => void setModerationStatus(pin.id, "APPROVED")} className="rounded-full bg-[#e9eee8] px-3 py-1 text-xs font-semibold text-[#438268]">Approve</button><button type="button" onClick={() => void setModerationStatus(pin.id, "REJECTED")} className="rounded-full bg-[#fff5f2] px-3 py-1 text-xs font-semibold text-[#a84f37]">Reject</button><button type="button" onClick={() => void setModerationStatus(pin.id, "HIDDEN")} className="rounded-full border border-[#d8ded8] px-3 py-1 text-xs font-semibold">Hide</button></div></div>)}
                    {pins.length === 0 && <p className="px-6 py-5 text-sm text-[#68736d]">No pins available.</p>}
                </div>
            </section>
            <section className="overflow-hidden rounded-3xl border border-[#d8ded8] bg-white">
                <div className="border-b border-[#e8ece8] px-6 py-5"><h2 className="font-semibold">Platform settings</h2><p className="mt-1 text-sm text-[#68736d]">Small operational switches for the early platform.</p></div>
                <div className="divide-y divide-[#e8ece8]">{[["registration_enabled", "Registration"], ["image_uploads_enabled", "Image uploads"], ["public_profiles_enabled", "Public profiles"]].map(([key, label]) => <div key={key} className="flex items-center justify-between px-6 py-4"><span className="text-sm font-medium">{label}</span><div className="checkbox-wrapper-35"><input checked={Boolean(platformSettings[key])} id={`platform-${key}`} name={`platform-${key}`} onChange={(event) => void togglePlatformSetting(key, event.target.checked)} type="checkbox" className="switch" /><label htmlFor={`platform-${key}`}><span className="switch-x-text"> </span><span className="switch-x-toggletext"><span className="switch-x-unchecked"><span className="switch-x-hiddenlabel">Unchecked: </span>OFF</span><span className="switch-x-checked"><span className="switch-x-hiddenlabel">Checked: </span>ON</span></span></label></div></div>)}</div>
            </section>
            <section className="overflow-hidden rounded-3xl border border-[#d8ded8] bg-white">
                <div className="border-b border-[#e8ece8] px-6 py-5"><h2 className="font-semibold">Admin activity</h2><p className="mt-1 text-sm text-[#68736d]">Recent administrative changes.</p></div>
                <div className="divide-y divide-[#e8ece8]">{activity.slice(0, 8).map((entry) => <div key={`${entry.action}-${entry.occurredAt}`} className="px-6 py-3"><p className="text-sm font-semibold">{entry.action}</p><p className="text-xs text-[#68736d]">{entry.target ?? "Platform"} · {entry.occurredAt}</p></div>)}{activity.length === 0 && <p className="px-6 py-5 text-sm text-[#68736d]">No admin activity yet.</p>}</div>
            </section>
        </div>
    );
}

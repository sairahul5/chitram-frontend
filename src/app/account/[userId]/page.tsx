"use client";

import { apiClient } from "@/lib/apiClient";
import { Avatar } from "@/components/ui/Avatar";
import { MasonryFeed } from "@/components/feed/MasonryFeed";
import { VisualItem } from "@/types/visualItem";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PublicProfile = {
    id: number;
    name: string;
    username: string | null;
    pictureUrl: string | null;
    followersCount: number;
    creationsCount: number;
    creations: VisualItem[];
};

export default function PublicAccountPage() {
    const params = useParams<{ userId: string }>();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [reportReason, setReportReason] = useState("SPAM");
    const [reportDescription, setReportDescription] = useState("");
    const [reportError, setReportError] = useState<string | null>(null);
    const [reportSuccess, setReportSuccess] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const userId = params.userId;
        if (!userId) return;

        apiClient<PublicProfile>(`/user/profile/${userId}`)
            .then(setProfile)
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [params.userId]);

    useEffect(() => {
        apiClient<{ id: number } | null>("/auth/session")
            .then((profile) => setCurrentUser(profile ? { id: profile.id } : null))
            .catch(() => setCurrentUser(null));
    }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        }
        if (showMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showMenu]);

    const handleReportSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!profile) return;
        setIsReporting(true);
        setReportError(null);
        try {
            await apiClient("/reports", {
                method: "POST",
                body: JSON.stringify({
                    targetType: "USER",
                    targetId: profile.id,
                    reason: reportReason,
                    description: reportDescription.trim(),
                }),
            });
            setReportSuccess(true);
            setShowReport(false);
            setReportDescription("");
            setReportReason("SPAM");
        } catch (error) {
            setReportError(error instanceof Error ? error.message : "Unable to submit report.");
        } finally {
            setIsReporting(false);
        }
    };

    if (loading) {
        return (
            <main className="relative flex min-h-screen items-center justify-center bg-[#f5f1e9] text-[#1f2925]" aria-label="Loading account">
                <div className="spinner" aria-hidden="true">
                    {Array.from({ length: 10 }, (_, index) => <div key={index} />)}
                </div>
            </main>
        );
    }

    if (notFound || !profile) {
        return (
            <main className="min-h-screen bg-[#f5f1e9] px-6 py-12 text-[#1f2925]">
                <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-bold">Account not found</h1>
                    <Link className="mt-5 inline-flex rounded-full bg-[#1f2925] px-5 py-2.5 text-sm font-semibold text-white" href="/">
                        Back to posts
                    </Link>
                </div>
            </main>
        );
    }

    const isOwnProfile = currentUser?.id === profile.id;

    return (
        <main className="min-h-screen bg-[#f5f1e9] px-4 py-6 text-[#1f2925] sm:px-8 lg:px-12">
            <header className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                <Link className="shrink-0" href="/" aria-label="Chitram home">
                    <img src="/name.png" alt="Chitram" className="h-11 w-40 translate-y-2 object-cover object-center" />
                </Link>
                <Link className="rounded-full border border-[#d8ded8] bg-white px-3 py-2 text-xs font-semibold hover:border-[#1f2925] sm:px-4 sm:text-sm" href="/">
                    Back to posts
                </Link>
            </header>

            <section className="mx-auto mt-8 max-w-7xl rounded-3xl border border-[#e4dcd3] bg-white p-4 shadow-sm sm:mt-10 sm:p-8">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Avatar src={profile.pictureUrl} name={profile.name} size="lg" className="border border-[#e8ece8]" />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold sm:text-2xl">{profile.name}</h1>
                        {profile.username && <p className="mt-1 text-sm font-semibold text-[#d2643b]">@{profile.username}</p>}
                        <p className="mt-2 text-xs text-[#68736d]">{profile.creationsCount} posts · {profile.followersCount} followers</p>
                    </div>
                    {!isOwnProfile && currentUser && (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8ded8] bg-white text-[#1f2925] shadow-sm transition hover:bg-[#f5f1e9] active:scale-95"
                                aria-label="More options"
                                aria-expanded={showMenu}
                            >
                                <span className="flex flex-col items-center gap-0.5" aria-hidden="true">
                                    <span className="h-1 w-1 rounded-full bg-current" />
                                    <span className="h-1 w-1 rounded-full bg-current" />
                                    <span className="h-1 w-1 rounded-full bg-current" />
                                </span>
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-11 w-44 rounded-2xl border border-[#e4dcd3] bg-white py-2 text-xs font-medium text-[#1f2925] shadow-xl z-20 animate-scale-in">
                                    <button
                                        onClick={() => { setShowReport(true); setShowMenu(false); }}
                                        className="flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-[#fff5f2]"
                                    >
                                        <span>Report account</span>
                                        <span>⚑</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {reportSuccess && (
                    <div className="mt-4 rounded-xl bg-[#e9eee8] px-4 py-3 text-sm text-[#438268]">
                        Report submitted. Thank you for helping keep Chitram safe.
                    </div>
                )}
            </section>

            {showReport && (
                <div className="mx-auto mt-4 max-w-7xl">
                    <form onSubmit={handleReportSubmit} className="rounded-2xl border border-[#e4dcd3] bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-bold">Report account</h4>
                            <button type="button" onClick={() => setShowReport(false)} className="text-xs font-semibold text-[#68736d]">Cancel</button>
                        </div>
                        <p className="mt-2 text-xs text-[#68736d]">Reporting @{profile.username || profile.name}&apos;s account.</p>
                        <select value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="mt-3 w-full rounded-xl border border-[#d8ded8] bg-white px-3 py-2 text-sm">
                            <option value="SPAM">Spam</option>
                            <option value="HARASSMENT">Harassment</option>
                            <option value="IMPERSONATION">Impersonation</option>
                            <option value="INAPPROPRIATE_CONTENT">Inappropriate content</option>
                            <option value="HATE">Hate or abusive behavior</option>
                            <option value="OTHER">Other</option>
                        </select>
                        <textarea value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} maxLength={1000} rows={3} placeholder="Additional details (optional)" className="mt-2 w-full resize-none rounded-xl border border-[#d8ded8] px-3 py-2 text-sm" />
                        {reportError && <p className="mt-2 text-xs text-[#a84f37]">{reportError}</p>}
                        <button type="submit" disabled={isReporting} className="mt-3 w-full rounded-xl bg-[#1f2925] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{isReporting ? "Submitting..." : "Submit report"}</button>
                    </form>
                </div>
            )}

            <section className="mx-auto mt-8 max-w-7xl">
                <h2 className="mb-5 text-lg font-bold">Posts by {profile.name}</h2>
                <MasonryFeed
                    items={profile.creations}
                    emptyTitle="No posts yet"
                    emptySubtitle="This account has not shared any posts yet."
                />
            </section>
        </main>
    );
}

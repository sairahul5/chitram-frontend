"use client";

import { apiClient } from "@/lib/apiClient";
import { MasonryFeed } from "@/components/feed/MasonryFeed";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
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
    followingCount: number;
    creationsCount: number;
    creations: VisualItem[];
    isFollowing: boolean;
    isAdmin: boolean;
};

export default function PublicAccountPage() {
    const params = useParams<{ userId: string }>();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: number } | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [reportReason, setReportReason] = useState("SPAM");
    const [reportDescription, setReportDescription] = useState("");
    const [reportError, setReportError] = useState<string | null>(null);
    const [reportSuccess, setReportSuccess] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const [profileCopied, setProfileCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!params.userId) return;
        apiClient<PublicProfile>(`/user/profile/${encodeURIComponent(params.userId)}`)
            .then((data) => { setProfile(data); setIsFollowing(data.isFollowing); })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [params.userId]);

    useEffect(() => {
        apiClient<{ id: number } | null>("/auth/session")
            .then((session) => setCurrentUser(session ? { id: session.id } : null))
            .catch(() => setCurrentUser(null));
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
        };
        if (showMenu) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showMenu]);

    const isOwnProfile = Boolean(profile && currentUser?.id === profile.id);

    const toggleFollow = async () => {
        if (!profile || isOwnProfile) return;
        setFollowLoading(true);
        try {
            await apiClient(`/user/follow/${profile.id}`, { method: isFollowing ? "DELETE" : "POST" });
            setIsFollowing((value) => !value);
            setProfile((current) => current ? { ...current, followersCount: Math.max(0, current.followersCount + (isFollowing ? -1 : 1)) } : current);
        } finally {
            setFollowLoading(false);
        }
    };

    const shareProfile = async () => {
        if (!profile?.username) return;
        const url = `${window.location.origin}/account/${encodeURIComponent(profile.username)}`;
        try {
            if (navigator.share) await navigator.share({ title: `${profile.name} on Chitram`, url });
            else { await navigator.clipboard.writeText(url); setProfileCopied(true); window.setTimeout(() => setProfileCopied(false), 1500); }
        } catch { /* Native share cancellation is harmless. */ }
        setShowMenu(false);
    };

    const submitReport = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!profile) return;
        setIsReporting(true);
        setReportError(null);
        try {
            await apiClient("/reports", { method: "POST", body: JSON.stringify({ targetType: "USER", targetId: profile.id, reason: reportReason, description: reportDescription.trim() }) });
            setReportSuccess(true);
            setShowReport(false);
            setReportDescription("");
        } catch (error) {
            setReportError(error instanceof Error ? error.message : "Unable to submit report.");
        } finally {
            setIsReporting(false);
        }
    };

    if (loading) return <ProfileSkeleton />;
    if (notFound || !profile) return <main className="min-h-screen bg-[#f5f1e9] px-6 py-12 text-[#1f2925]"><div className="mx-auto max-w-md rounded-3xl border border-[#e4dcd3] bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold">Account not found</h1><Link className="mt-5 inline-flex rounded-full bg-[#1f2925] px-5 py-2.5 text-sm font-semibold text-white" href="/">Back to posts</Link></div></main>;

    return (
        <ProfileLayout
            profile={profile}
            topActions={<Link href="/" className="rounded-full border border-[#d8ded8] px-3 py-2 text-xs font-semibold text-[#68736d] transition hover:border-[#1f2925] hover:text-[#1f2925] sm:px-4 sm:text-sm">Gallery</Link>}
            profileActions={<>
                {isOwnProfile ? <Link href="/user" className="inline-flex flex-1 items-center justify-center rounded-full border border-[#d8ded8] px-4 py-2 text-sm font-semibold transition hover:border-[#1f2925] sm:flex-none">Edit profile</Link> : currentUser ? <button type="button" onClick={() => void toggleFollow()} disabled={followLoading} className={`inline-flex flex-1 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 sm:flex-none ${isFollowing ? "border border-[#d8ded8] text-[#68736d] hover:border-[#a84f37] hover:text-[#a84f37]" : "bg-[#1f2925] text-white hover:bg-[#2e3b36]"}`}>{followLoading ? "Updating..." : isFollowing ? "Following" : "Follow"}</button> : null}
                <div className="relative" ref={menuRef}><button type="button" onClick={() => setShowMenu((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8ded8] bg-white text-lg transition hover:bg-[#f5f1e9]" aria-label="More profile actions" aria-expanded={showMenu}>⋮</button>{showMenu && <div className="absolute right-0 top-12 z-20 w-48 rounded-2xl border border-[#e4dcd3] bg-white py-2 text-xs font-medium shadow-xl"><button type="button" onClick={() => void shareProfile()} className="flex w-full justify-between px-4 py-2 text-left hover:bg-[#f5f1e9]">{profileCopied ? "Profile link copied" : "Share profile"}<span>↗</span></button>{!isOwnProfile && currentUser && <button type="button" onClick={() => { setShowReport(true); setShowMenu(false); }} className="flex w-full justify-between px-4 py-2 text-left hover:bg-[#fff5f2]">Report account<span>⚑</span></button>}</div>}</div>
            </>}
            tabs={<ProfileTab>Creations ({profile.creationsCount})</ProfileTab>}
        >
            {reportSuccess && <div className="mb-4 rounded-xl bg-[#e9eee8] px-4 py-3 text-sm text-[#438268]">Report submitted. Thank you for helping keep Chitram safe.</div>}
            {showReport && <form onSubmit={submitReport} className="mb-6 rounded-2xl border border-[#e4dcd3] bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h4 className="text-sm font-bold">Report account</h4><button type="button" onClick={() => setShowReport(false)} className="text-xs font-semibold text-[#68736d]">Cancel</button></div><p className="mt-2 text-xs text-[#68736d]">Reporting @{profile.username || profile.name}&apos;s account.</p><select value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="mt-3 w-full rounded-xl border border-[#d8ded8] bg-white px-3 py-2 text-sm"><option value="SPAM">Spam</option><option value="HARASSMENT">Harassment</option><option value="IMPERSONATION">Impersonation</option><option value="OTHER">Other</option></select><textarea value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} maxLength={1000} rows={3} placeholder="Additional details (optional)" className="mt-2 w-full resize-none rounded-xl border border-[#d8ded8] px-3 py-2 text-sm" />{reportError && <p className="mt-2 text-xs text-[#a84f37]">{reportError}</p>}<button type="submit" disabled={isReporting} className="mt-3 rounded-full bg-[#1f2925] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{isReporting ? "Submitting..." : "Submit report"}</button></form>}
            <MasonryFeed items={profile.creations} emptyTitle="No posts yet" emptySubtitle="This account has not shared any posts yet." />
        </ProfileLayout>
    );
}

function ProfileTab({ children }: { children: React.ReactNode }) {
    return <span className="relative inline-flex shrink-0 whitespace-nowrap px-3 pb-3.5 pt-1 text-sm font-semibold text-[#1f2925]">{children}<span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#1f2925]" /></span>;
}

function ProfileSkeleton() {
    return <main className="min-h-screen bg-[#f5f1e9] px-4 py-6 sm:px-6 lg:px-10"><div className="mx-auto max-w-7xl"><div className="h-14 w-full animate-shimmer rounded-3xl" /><div className="mt-8 rounded-3xl border border-[#e4dcd3] bg-white p-8"><div className="flex items-center gap-5"><div className="h-24 w-24 animate-shimmer rounded-full" /><div className="space-y-3"><div className="h-6 w-48 animate-shimmer rounded-lg" /><div className="h-4 w-32 animate-shimmer rounded-lg" /></div></div><div className="mt-8 h-12 animate-shimmer rounded-xl" /></div></div></main>;
}

"use client";

import { apiClient } from "@/lib/apiClient";
import { Avatar } from "@/components/ui/Avatar";
import { MasonryFeed } from "@/components/feed/MasonryFeed";
import { PinUploadModal } from "@/components/upload/PinUploadModal";
import { VisualItem } from "@/types/visualItem";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type UserProfileDetails = {
    id: number;
    name: string;
    email: string;
    pictureUrl: string | null;
    username: string | null;
    followersCount: number;
    followingCount: number;
    creationsCount: number;
    creations: VisualItem[];
    isAdmin?: boolean;
};

type UserSummary = {
    id: number;
    name: string;
    email: string;
    pictureUrl: string | null;
    username?: string | null;
    followersCount: number;
    following: boolean;
};

type Tab = "creations" | "saved" | "all-creations" | "creators" | "followers" | "following";

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfileDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [notSignedIn, setNotSignedIn] = useState(false);

    const [activeTab, setActiveTab] = useState<Tab>("creations");
    const [allCreations, setAllCreations] = useState<VisualItem[]>([]);
    const [savedPins, setSavedPins] = useState<VisualItem[]>([]);
    const [creators, setCreators] = useState<UserSummary[]>([]);
    const [followers, setFollowers] = useState<UserSummary[]>([]);
    const [followingList, setFollowingList] = useState<UserSummary[]>([]);

    const [tabLoading, setTabLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editName, setEditName] = useState("");
    const [editUsername, setEditUsername] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editSuccess, setEditSuccess] = useState<string | null>(null);
    const [suggestingUsername, setSuggestingUsername] = useState(false);

    const [showUpload, setShowUpload] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
    }, []);

    const loadProfile = async () => {
        try {
            const data = await apiClient<UserProfileDetails>("/user/profile");
            setProfile(data);
            setNotSignedIn(false);
        } catch {
            setNotSignedIn(true);
        } finally {
            setLoading(false);
        }
    };

    const loadTabContent = async (tab: Tab) => {
        if (tab === "creations") return;
        setTabLoading(true);
        try {
            if (tab === "all-creations") {
                const list = await apiClient<VisualItem[]>("/user/all-creations");
                setAllCreations(list);
            } else if (tab === "saved") {
                const list = await apiClient<VisualItem[]>("/user/saved");
                setSavedPins(list);
            } else if (tab === "creators") {
                const list = await apiClient<UserSummary[]>("/user/creators");
                setCreators(list);
            } else if (tab === "followers") {
                const list = await apiClient<UserSummary[]>("/user/followers");
                setFollowers(list);
            } else if (tab === "following") {
                const list = await apiClient<UserSummary[]>("/user/following");
                setFollowingList(list);
            }
        } catch (e) {
            console.error("Failed to load tab:", tab, e);
        } finally {
            setTabLoading(false);
        }
    };

    useEffect(() => {
        loadProfile(); // eslint-disable-line react-hooks/set-state-in-effect
    }, []);

    useEffect(() => {
        if (profile) {
            loadTabContent(activeTab); // eslint-disable-line react-hooks/set-state-in-effect
        }
    }, [activeTab, profile?.id]);

    const handleFollowToggle = async (userId: number, currentFollowing: boolean) => {
        setActionLoadingId(userId);
        try {
            if (currentFollowing) {
                await apiClient<{ success: boolean; following: boolean }>(`/user/follow/${userId}`, {
                    method: "DELETE",
                });
            } else {
                await apiClient<{ success: boolean; following: boolean }>(`/user/follow/${userId}`, {
                    method: "POST",
                });
            }

            // Update in creators list
            setCreators((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, following: !currentFollowing } : u))
            );
            // Update in following list if present
            setFollowingList((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, following: !currentFollowing } : u))
            );
            // Update in followers list if present
            setFollowers((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, following: !currentFollowing } : u))
            );

            // Update profile following count
            setProfile((prev) =>
                prev
                    ? {
                        ...prev,
                        followingCount: currentFollowing
                            ? Math.max(0, prev.followingCount - 1)
                            : prev.followingCount + 1,
                    }
                    : null
            );
        } catch (err) {
            console.error("Error toggling follow:", err);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleSaveToggle = async (id: number, shouldSave: boolean) => {
        await apiClient(`/user/saved/${id}`, { method: shouldSave ? "POST" : "DELETE" });
        if (!shouldSave) {
            setSavedPins((prev) => prev.filter((pin) => pin.id !== id));
        }
    };

    const handleSignOut = async () => {
        try {
            await apiClient<void>("/auth/logout", { method: "POST" });
        } catch (err) {
            console.error(err);
        }
        window.location.href = "/";
    };

    const openEditProfile = () => {
        if (!profile) return;
        setEditName(profile.name || "");
        setEditUsername(profile.username || "");
        setEditError(null);
        setEditSuccess(null);
        setShowEditProfile(true);
        if (!profile.username) {
            fetchSuggestedUsername();
        }
    };

    const fetchSuggestedUsername = async () => {
        setSuggestingUsername(true);
        try {
            const res = await apiClient<{ username: string }>("/user/username/suggest");
            if (res.username) {
                setEditUsername(res.username);
            }
        } catch (e) {
            console.error("Failed to suggest username:", e);
        } finally {
            setSuggestingUsername(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editName.trim()) {
            setEditError("Display name cannot be empty");
            return;
        }
        if (!editUsername.trim()) {
            setEditError("Username cannot be empty");
            return;
        }
        const cleanUsername = editUsername.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
            setEditError("Username must be 3-30 characters (letters, numbers, underscore only)");
            return;
        }
        setSavingProfile(true);
        setEditError(null);
        setEditSuccess(null);
        try {
            const updated = await apiClient<UserProfileDetails>("/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    displayName: editName.trim(),
                    username: cleanUsername,
                }),
            });
            setProfile(updated);
            setEditSuccess("Profile updated successfully!");
            setTimeout(() => {
                setShowEditProfile(false);
                setEditSuccess(null);
            }, 1000);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to update profile. Please try again.";
            setEditError(msg);
        } finally {
            setSavingProfile(false);
        }
    };


    const handleDeletePin = async (id: number) => {
        try {
            await apiClient(`/visual-items/${id}`, { method: "DELETE" });
            setProfile((prev) =>
                prev
                    ? {
                        ...prev,
                        creations: prev.creations.filter((c) => c.id !== id),
                        creationsCount: Math.max(0, prev.creationsCount - 1),
                    }
                    : null
            );
            setAllCreations((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            alert("Failed to delete pin: " + (err instanceof Error ? err.message : "Unknown error"));
        }
    };

    const handleEditPin = async (updated: VisualItem) => {
        const saved = await apiClient<VisualItem>(`/visual-items/${updated.id}`, {
            method: "PUT",
            body: JSON.stringify({ title: updated.title, category: updated.category, description: updated.description }),
        });
        setProfile((prev) => prev ? { ...prev, creations: prev.creations.map((item) => item.id === saved.id ? saved : item) } : prev);
        setAllCreations((prev) => prev.map((item) => item.id === saved.id ? saved : item));
        setSavedPins((prev) => prev.map((item) => item.id === saved.id ? saved : item));
        return saved;
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#f5f1e9] text-[#1f2925]">
                <header className="sticky top-0 z-20 border-b border-[#e4dcd3] bg-[#f5f1e9]/90 backdrop-blur-md">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
                        <div className="flex items-center gap-6">
                            <img src="/name.png" alt="Chitram" className="h-10 w-36 translate-y-2 object-cover object-center sm:h-12 sm:w-44" />
                            <div className="h-5 w-24 rounded-full animate-shimmer" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-20 rounded-full animate-shimmer" />
                            <div className="h-9 w-20 rounded-full animate-shimmer" />
                        </div>
                    </div>
                </header>
                <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-12 animate-fade-in">
                    <div className="rounded-3xl border border-[#e4dcd3] bg-white p-6 sm:p-10 shadow-sm">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-5">
                                <div className="h-20 w-20 rounded-full animate-shimmer" />
                                <div className="space-y-2">
                                    <div className="h-6 w-48 rounded-lg animate-shimmer" />
                                    <div className="h-4 w-36 rounded-lg animate-shimmer" />
                                </div>
                            </div>
                            <div className="h-10 w-36 rounded-full animate-shimmer" />
                        </div>
                        <div className="mt-8 flex items-center gap-8 border-t border-[#f0eee6] pt-6">
                            <div className="h-8 w-24 rounded-lg animate-shimmer" />
                            <div className="h-8 w-24 rounded-lg animate-shimmer" />
                            <div className="h-8 w-24 rounded-lg animate-shimmer" />
                        </div>
                    </div>
                    <div className="mt-8 grid auto-rows-[220px] grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-3xl animate-shimmer border border-[#e4dcd3]/60" />
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    if (notSignedIn || !profile) {
        return (
            <main className="min-h-screen bg-[#f5f1e9] px-6 py-12 text-[#1f2925]">
                <div className="mx-auto max-w-md rounded-3xl border border-[#e8dcd3] bg-white p-8 text-center shadow-[0_20px_50px_rgba(31,41,37,0.08)]">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fbebe4] text-2xl">
                        👤
                    </div>
                    <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#1f2925]">Sign in to your Profile</h1>
                    <p className="mt-2 text-sm leading-6 text-[#68736d]">
                        View your followers, track your uploaded creations, and connect with other visual creators on Chitram.
                    </p>
                    <div className="mt-6 flex flex-col gap-3">
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center rounded-2xl bg-[#1f2925] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#2e3b36] transition"
                        >
                            Continue to Sign In
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center rounded-2xl border border-[#d8ded8] px-5 py-3 text-sm font-semibold text-[#68736d] hover:bg-[#fafaf7] transition"
                        >
                            Browse gallery
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <ProfileLayout
            profile={profile}
            topActions={
                <>
                    {profile.isAdmin && <Link href="/admin" className="rounded-full bg-[#1f2925] px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-[#2e3b36] sm:px-4 sm:text-sm">Admin Panel</Link>}
                    <Link href="/" className="rounded-full border border-[#d8ded8] px-3 py-2 text-center text-xs font-semibold text-[#68736d] transition hover:border-[#1f2925] hover:text-[#1f2925] sm:px-4 sm:text-sm">Gallery</Link>
                    <button onClick={handleSignOut} className="rounded-full border border-[#d8ded8] px-3 py-2 text-center text-xs font-semibold text-[#68736d] transition hover:border-[#1f2925] hover:text-[#1f2925] sm:px-4 sm:text-sm" type="button">Sign out</button>
                </>
            }
            profileActions={
                <>
                    <button onClick={openEditProfile} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#d8ded8] bg-white px-3.5 py-2 text-sm font-semibold text-[#1f2925] shadow-sm transition hover:border-[#1f2925] hover:bg-[#fafaf7] sm:flex-none">
                        <span aria-hidden="true">✎</span><span>Edit profile</span>
                    </button>
                    <button onClick={() => setShowUpload(!showUpload)} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition active:scale-95 sm:flex-none ${showUpload ? "border border-[#f5c7b3] bg-[#fbebe4] text-[#d2643b]" : "bg-[#1f2925] text-white hover:bg-[#2e3b36]"}`}>
                        <span aria-hidden="true">＋</span><span>{showUpload ? "Close studio" : "Share a creation"}</span>
                    </button>
                </>
            }
            usernameFallback={
                <button onClick={openEditProfile} className="inline-flex rounded-full border border-dashed border-[#d2643b] bg-[#fbebe4]/60 px-2.5 py-1 text-xs font-medium text-[#d2643b] transition hover:bg-[#fbebe4]">+ Set username</button>
            }
            description="Cloud media stored on Supabase Storage"
            onFollowersClick={() => setActiveTab("followers")}
            onFollowingClick={() => setActiveTab("following")}
            tabs={
                <>
                    <ProfileTab active={activeTab === "creations"} onClick={() => setActiveTab("creations")}>My Creations ({profile.creationsCount})</ProfileTab>
                    <ProfileTab active={activeTab === "saved"} onClick={() => setActiveTab("saved")}>Saved Pins ({savedPins.length})</ProfileTab>
                    {profile.isAdmin && <ProfileTab active={activeTab === "all-creations"} onClick={() => setActiveTab("all-creations")}>All Platform Creations ({allCreations.length})</ProfileTab>}
                    <ProfileTab active={activeTab === "creators"} onClick={() => setActiveTab("creators")}>Discover Creators</ProfileTab>
                    <ProfileTab active={activeTab === "followers"} onClick={() => setActiveTab("followers")}>Followers ({profile.followersCount})</ProfileTab>
                    <ProfileTab active={activeTab === "following"} onClick={() => setActiveTab("following")}>Following ({profile.followingCount})</ProfileTab>
                </>
            }
        >

                {/* Edit Profile Modal */}
                {showEditProfile && mounted && createPortal(
                    <div
                        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
                        onClick={(e) => {
                            if (e.target === e.currentTarget && !savingProfile) {
                                setShowEditProfile(false);
                            }
                        }}
                    >
                        <div
                            className="relative w-full max-w-lg rounded-3xl border border-[#e4dcd3] bg-white p-6 sm:p-8 shadow-2xl animate-scale-in my-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-[#f0eee6] pb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-[#1f2925]">Edit Profile</h2>
                                    <p className="mt-0.5 text-xs text-[#68736d]">Update your display name and unique username handle</p>
                                </div>
                                <button
                                    onClick={() => setShowEditProfile(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#68736d] hover:bg-[#fafaf7] hover:text-[#1f2925] active:scale-95 transition"
                                    type="button"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#68736d]" htmlFor="edit-name">
                                        Display Name
                                    </label>
                                    <input
                                        id="edit-name"
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Your full or preferred name"
                                        maxLength={50}
                                        required
                                        className="mt-2 w-full rounded-2xl border border-[#d8ded8] bg-[#fafaf7] px-4 py-3 text-sm text-[#1f2925] outline-none focus:border-[#1f2925] focus:bg-white transition"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#68736d]" htmlFor="edit-username">
                                            Username Handle
                                        </label>
                                        <button
                                            type="button"
                                            onClick={fetchSuggestedUsername}
                                            disabled={suggestingUsername}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#d2643b] hover:text-[#b85029] active:scale-95 disabled:opacity-50 transition"
                                        >
                                            {suggestingUsername ? (
                                                <>
                                                    <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                                    <span>Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>🎲 Suggest Random</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="relative mt-2 flex items-center">
                                        <span className="absolute left-4 select-none text-sm font-bold text-[#d2643b]">@</span>
                                        <input
                                            id="edit-username"
                                            type="text"
                                            value={editUsername}
                                            onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                                            placeholder="unique_username"
                                            maxLength={30}
                                            required
                                            className="w-full rounded-2xl border border-[#d8ded8] bg-[#fafaf7] pl-8 pr-4 py-3 text-sm font-medium text-[#1f2925] outline-none focus:border-[#1f2925] focus:bg-white transition"
                                        />
                                    </div>
                                    <p className="mt-1.5 text-[11px] text-[#84928a]">
                                        Letters, numbers, and underscores (3-30 chars). Saved in Supabase.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#68736d]">
                                        Linked Google Account
                                    </label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="mt-2 w-full rounded-2xl border border-[#e8ece8] bg-[#f5f5f2] px-4 py-2.5 text-sm text-[#84928a] cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-[11px] text-[#98a39c]">Authenticated via Google OAuth2</p>
                                </div>

                                {editError && (
                                    <div className="rounded-2xl border border-[#e8b9ad] bg-[#fff5f2] p-3.5 text-xs font-medium text-[#a84f37] animate-fade-in">
                                        {editError}
                                    </div>
                                )}

                                {editSuccess && (
                                    <div className="rounded-2xl border border-[#b7dfc8] bg-[#edf8f1] p-3.5 text-xs font-medium text-[#2c6e49] animate-fade-in">
                                        {editSuccess}
                                    </div>
                                )}

                                <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditProfile(false)}
                                        className="rounded-full border border-[#d8ded8] px-5 py-2.5 text-sm font-semibold text-[#68736d] hover:bg-[#fafaf7] active:scale-95 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingProfile}
                                        className="inline-flex items-center gap-2 rounded-full bg-[#1f2925] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2e3b36] active:scale-95 disabled:opacity-50 transition"
                                    >
                                        {savingProfile ? (
                                            <>
                                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Upload Studio Pin Modal */}
                <PinUploadModal
                    isOpen={showUpload}
                    onClose={() => setShowUpload(false)}
                    onSuccess={(newPin) => {
                        setProfile((prev) =>
                            prev
                                ? {
                                    ...prev,
                                    creations: [newPin, ...prev.creations],
                                    creationsCount: prev.creationsCount + 1,
                                }
                                : null
                        );
                        setAllCreations((prev) => [newPin, ...prev]);
                    }}
                />

                {/* Tab Content */}
                <div>
                    {/* Tab 1: Creations */}
                    {activeTab === "creations" && (
                        <div className="animate-fade-in">
                            <MasonryFeed
                                items={profile.creations}
                                currentUserId={profile.id}
                                isAdmin={profile.isAdmin}
                                onDeletePin={handleDeletePin}
                                onEditPin={handleEditPin}
                                isOwnerFeed
                                savedPinIds={savedPins.map((pin) => pin.id)}
                                onSaveToggle={handleSaveToggle}
                                emptyTitle="No creations published yet"
                                emptySubtitle="Share your original photography, architecture, or visual art stored directly on Supabase."
                            />
                        </div>
                    )}

                    {/* Saved Pins */}
                    {activeTab === "saved" && (
                        <div className="animate-fade-in">
                            <MasonryFeed
                                items={savedPins}
                                isLoading={tabLoading}
                                currentUserId={profile.id}
                                isAdmin={profile.isAdmin}
                                onEditPin={handleEditPin}
                                savedPinIds={savedPins.map((pin) => pin.id)}
                                onSaveToggle={handleSaveToggle}
                                emptyTitle="No saved pins yet"
                                emptySubtitle="Save images from the discovery feed and they will appear here."
                            />
                        </div>
                    )}

                    {/* Admin Tab: All Platform Creations */}
                    {activeTab === "all-creations" && (
                        <div className="animate-fade-in">
                            <MasonryFeed
                                items={allCreations}
                                isLoading={tabLoading}
                                currentUserId={profile.id}
                                isAdmin={profile.isAdmin}
                                onDeletePin={handleDeletePin}
                                onEditPin={handleEditPin}
                                savedPinIds={savedPins.map((pin) => pin.id)}
                                onSaveToggle={handleSaveToggle}
                                emptyTitle="No community creations yet"
                                emptySubtitle="Creations published across the platform will appear here."
                            />
                        </div>
                    )}

                    {/* Tab 2: Discover Creators */}
                    {activeTab === "creators" && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
                            {tabLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-3xl border border-[#e4dcd3] bg-white p-5 shadow-sm">
                                        <div className="flex items-center gap-3.5">
                                            <div className="h-12 w-12 rounded-full animate-shimmer" />
                                            <div className="space-y-2">
                                                <div className="h-4 w-28 rounded-md animate-shimmer" />
                                                <div className="h-3 w-16 rounded-md animate-shimmer" />
                                            </div>
                                        </div>
                                        <div className="h-8 w-20 rounded-full animate-shimmer" />
                                    </div>
                                ))
                            ) : creators.length === 0 ? (
                                <p className="col-span-full rounded-3xl border border-[#d8ded8] bg-white p-8 text-center text-sm text-[#68736d] animate-fade-in">
                                    No other creators registered on Chitram yet.
                                </p>
                            ) : (
                                creators.map((creator) => (
                                    <div
                                        key={creator.id}
                                        className="flex items-center justify-between rounded-3xl border border-[#e4dcd3] bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <Avatar
                                                src={creator.pictureUrl}
                                                name={creator.name}
                                                size="md"
                                                className="border border-[#e8ece8]"
                                            />
                                            <div>
                                                <h3 className="text-sm font-bold text-[#1f2925]">{creator.name}</h3>
                                                <div className="flex items-center gap-1.5 text-xs text-[#68736d]">
                                                    {creator.username && <span className="font-semibold text-[#d2643b]">@{creator.username}</span>}
                                                    {creator.username && <span>•</span>}
                                                    <span>{creator.followersCount} followers</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            disabled={actionLoadingId === creator.id}
                                            onClick={() => handleFollowToggle(creator.id, creator.following)}
                                            className={`rounded-full px-4 py-1.5 text-xs font-semibold active:scale-95 transition inline-flex items-center gap-1.5 ${creator.following
                                                ? "border border-[#d8ded8] text-[#68736d] hover:border-[#a84f37] hover:text-[#a84f37]"
                                                : "bg-[#1f2925] text-white hover:bg-[#2e3b36]"
                                                } ${actionLoadingId === creator.id ? "opacity-70 cursor-not-allowed" : ""}`}
                                        >
                                            {actionLoadingId === creator.id ? (
                                                <>
                                                    <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                                    <span>Updating...</span>
                                                </>
                                            ) : (
                                                creator.following ? "Following" : "Follow"
                                            )}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Tab 3: Followers */}
                    {activeTab === "followers" && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
                            {tabLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-3xl border border-[#e4dcd3] bg-white p-5 shadow-sm">
                                        <div className="flex items-center gap-3.5">
                                            <div className="h-12 w-12 rounded-full animate-shimmer" />
                                            <div className="space-y-2">
                                                <div className="h-4 w-28 rounded-md animate-shimmer" />
                                                <div className="h-3 w-16 rounded-md animate-shimmer" />
                                            </div>
                                        </div>
                                        <div className="h-8 w-20 rounded-full animate-shimmer" />
                                    </div>
                                ))
                            ) : followers.length === 0 ? (
                                <div className="col-span-full rounded-3xl border border-dashed border-[#ccd4cd] bg-white/50 p-10 text-center text-[#68736d] animate-fade-in">
                                    <p className="font-semibold text-[#1f2925]">No followers yet</p>
                                    <p className="mt-1 text-xs">
                                        As people discover your creations, they will appear here!
                                    </p>
                                </div>
                            ) : (
                                followers.map((follower) => (
                                    <div
                                        key={follower.id}
                                        className="flex items-center justify-between rounded-3xl border border-[#e4dcd3] bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <Avatar
                                                src={follower.pictureUrl}
                                                name={follower.name}
                                                size="md"
                                                className="border border-[#e8ece8]"
                                            />
                                            <div>
                                                <h3 className="text-sm font-bold text-[#1f2925]">{follower.name}</h3>
                                                <div className="flex items-center gap-1.5 text-xs text-[#68736d]">
                                                    {follower.username && <span className="font-semibold text-[#d2643b]">@{follower.username}</span>}
                                                    {follower.username && <span>•</span>}
                                                    <span>{follower.followersCount} followers</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            disabled={actionLoadingId === follower.id}
                                            onClick={() => handleFollowToggle(follower.id, follower.following)}
                                            className={`rounded-full px-4 py-1.5 text-xs font-semibold active:scale-95 transition inline-flex items-center gap-1.5 ${follower.following
                                                ? "border border-[#d8ded8] text-[#68736d] hover:border-[#a84f37] hover:text-[#a84f37]"
                                                : "bg-[#1f2925] text-white hover:bg-[#2e3b36]"
                                                } ${actionLoadingId === follower.id ? "opacity-70 cursor-not-allowed" : ""}`}
                                        >
                                            {actionLoadingId === follower.id ? (
                                                <>
                                                    <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                                    <span>Updating...</span>
                                                </>
                                            ) : (
                                                follower.following ? "Following" : "Follow back"
                                            )}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Tab 4: Following */}
                    {activeTab === "following" && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
                            {tabLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-3xl border border-[#e4dcd3] bg-white p-5 shadow-sm">
                                        <div className="flex items-center gap-3.5">
                                            <div className="h-12 w-12 rounded-full animate-shimmer" />
                                            <div className="space-y-2">
                                                <div className="h-4 w-28 rounded-md animate-shimmer" />
                                                <div className="h-3 w-16 rounded-md animate-shimmer" />
                                            </div>
                                        </div>
                                        <div className="h-8 w-20 rounded-full animate-shimmer" />
                                    </div>
                                ))
                            ) : followingList.length === 0 ? (
                                <div className="col-span-full rounded-3xl border border-dashed border-[#ccd4cd] bg-white/50 p-10 text-center text-[#68736d] animate-fade-in">
                                    <p className="font-semibold text-[#1f2925]">You are not following anyone yet</p>
                                    <p className="mt-1 text-xs">
                                        Check out the <strong>Discover Creators</strong> tab to follow visual artists!
                                    </p>
                                    <button
                                        onClick={() => setActiveTab("creators")}
                                        className="mt-4 rounded-full bg-[#1f2925] px-4 py-1.5 text-xs font-semibold text-white active:scale-95 transition"
                                    >
                                        Explore creators
                                    </button>
                                </div>
                            ) : (
                                followingList.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between rounded-3xl border border-[#e4dcd3] bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <Avatar
                                                src={user.pictureUrl}
                                                name={user.name}
                                                size="md"
                                                className="border border-[#e8ece8]"
                                            />
                                            <div>
                                                <h3 className="text-sm font-bold text-[#1f2925]">{user.name}</h3>
                                                <div className="flex items-center gap-1.5 text-xs text-[#68736d]">
                                                    {user.username && <span className="font-semibold text-[#d2643b]">@{user.username}</span>}
                                                    {user.username && <span>•</span>}
                                                    <span>{user.followersCount} followers</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            disabled={actionLoadingId === user.id}
                                            onClick={() => handleFollowToggle(user.id, true)}
                                            className={`rounded-full border border-[#d8ded8] px-4 py-1.5 text-xs font-semibold text-[#68736d] hover:border-[#a84f37] hover:text-[#a84f37] active:scale-95 transition inline-flex items-center gap-1.5 ${actionLoadingId === user.id ? "opacity-70 cursor-not-allowed" : ""
                                                }`}
                                        >
                                            {actionLoadingId === user.id ? (
                                                <>
                                                    <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                                    <span>Updating...</span>
                                                </>
                                            ) : (
                                                "Unfollow"
                                            )}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
        </ProfileLayout>
    );
}

function ProfileTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button type="button" onClick={onClick} className={`relative shrink-0 whitespace-nowrap px-3 pb-3.5 pt-1 text-sm font-semibold transition ${active ? "text-[#1f2925]" : "text-[#68736d] hover:text-[#1f2925]"}`}>
            {children}
            {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#1f2925]" />}
        </button>
    );
}

"use client";

import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { ReactNode } from "react";

export type ProfileLayoutData = {
    id: number;
    name: string;
    username: string | null;
    pictureUrl: string | null;
    email?: string | null;
    followersCount: number;
    followingCount: number;
    creationsCount: number;
    isAdmin?: boolean;
};

interface ProfileLayoutProps {
    profile: ProfileLayoutData;
    topActions: ReactNode;
    profileActions: ReactNode;
    tabs: ReactNode;
    children: ReactNode;
    onFollowersClick?: () => void;
    onFollowingClick?: () => void;
    usernameFallback?: ReactNode;
    description?: ReactNode;
}

export function ProfileLayout({
    profile,
    topActions,
    profileActions,
    tabs,
    children,
    onFollowersClick,
    onFollowingClick,
    usernameFallback,
    description,
}: ProfileLayoutProps) {
    return (
        <main className="min-h-screen overflow-x-hidden bg-[#f5f1e9] text-[#1f2925]">
            <header className="sticky top-0 z-20 border-b border-[#e4dcd3] bg-[#f5f1e9]/90 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
                    <Link href="/" className="shrink-0" aria-label="Chitram home">
                        <img src="/name.png" alt="Chitram" className="h-10 w-36 translate-y-2 object-cover object-center sm:h-12 sm:w-44" />
                    </Link>
                    <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
                        {topActions}
                    </div>
                </div>
            </header>

            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
                <section className="rounded-3xl border border-[#e4dcd3] bg-white p-4 shadow-[0_16px_50px_rgba(31,41,37,0.06)] sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                            <Avatar src={profile.pictureUrl} name={profile.name} size="xl" className="shrink-0" />
                            <div className="min-w-0 pt-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="min-w-0 break-words text-xl font-bold leading-tight tracking-tight sm:text-2xl">{profile.name}</h1>
                                    {profile.isAdmin && <span className="shrink-0 rounded-full bg-[#d2643b] px-2.5 py-0.5 text-xs font-semibold text-white">Admin</span>}
                                </div>
                                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                                    {profile.username ? (
                                        <span className="inline-flex max-w-full truncate rounded-full bg-[#fbebe4] px-2.5 py-1 text-xs font-semibold text-[#d2643b]">@{profile.username}</span>
                                    ) : usernameFallback}
                                    {profile.email && <span className="hidden text-xs text-[#c4cec7] sm:inline">•</span>}
                                    {profile.email && <span className="max-w-full truncate text-xs text-[#68736d]">{profile.email}</span>}
                                </div>
                                {description && <div className="mt-2 text-xs font-medium text-[#98a39c]">{description}</div>}
                            </div>
                        </div>
                        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
                            {profileActions}
                        </div>
                    </div>

                    <div className="mt-7 grid grid-cols-3 border-t border-[#f0eee6] pt-5">
                        <div className="flex min-w-0 flex-col items-center gap-1 text-center">
                            <span className="text-xl font-bold tabular-nums sm:text-2xl">{profile.creationsCount}</span>
                            <span className="text-[10px] uppercase tracking-wider text-[#68736d] sm:text-xs">Creations</span>
                        </div>
                        <button type="button" onClick={onFollowersClick} disabled={!onFollowersClick} className="flex min-w-0 flex-col items-center gap-1 border-x border-[#e4dcd3] text-center transition hover:opacity-70 disabled:cursor-default disabled:hover:opacity-100">
                            <span className="text-xl font-bold tabular-nums sm:text-2xl">{profile.followersCount}</span>
                            <span className="text-[10px] uppercase tracking-wider text-[#68736d] sm:text-xs">Followers</span>
                        </button>
                        <button type="button" onClick={onFollowingClick} disabled={!onFollowingClick} className="flex min-w-0 flex-col items-center gap-1 text-center transition hover:opacity-70 disabled:cursor-default disabled:hover:opacity-100">
                            <span className="text-xl font-bold tabular-nums sm:text-2xl">{profile.followingCount}</span>
                            <span className="text-[10px] uppercase tracking-wider text-[#68736d] sm:text-xs">Following</span>
                        </button>
                    </div>
                </section>

                <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-[#e4dcd3] px-1 scrollbar-none" aria-label="Profile sections">
                    {tabs}
                </nav>

                <div className="mt-6 min-w-0">{children}</div>
            </div>
        </main>
    );
}

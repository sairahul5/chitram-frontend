"use client";

import { apiClient } from "@/lib/apiClient";
import { Avatar } from "@/components/ui/Avatar";
import { MasonryFeed } from "@/components/feed/MasonryFeed";
import { VisualItem } from "@/types/visualItem";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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

    useEffect(() => {
        const userId = params.userId;
        if (!userId) return;

        apiClient<PublicProfile>(`/user/profile/${userId}`)
            .then(setProfile)
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [params.userId]);

    if (loading) {
        return <main className="min-h-screen bg-[#f5f1e9] p-8 text-[#1f2925]">Loading account...</main>;
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

    return (
        <main className="min-h-screen bg-[#f5f1e9] px-4 py-6 text-[#1f2925] sm:px-8 lg:px-12">
            <header className="mx-auto flex max-w-7xl items-center justify-between">
                <Link className="text-2xl font-bold tracking-tight" href="/">Chitram</Link>
                <Link className="rounded-full border border-[#d8ded8] bg-white px-4 py-2 text-sm font-semibold hover:border-[#1f2925]" href="/">
                    Back to posts
                </Link>
            </header>

            <section className="mx-auto mt-10 max-w-7xl rounded-3xl border border-[#e4dcd3] bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-4">
                    <Avatar src={profile.pictureUrl} name={profile.name} size="lg" className="border border-[#e8ece8]" />
                    <div>
                        <h1 className="text-2xl font-bold">{profile.name}</h1>
                        {profile.username && <p className="mt-1 text-sm font-semibold text-[#d2643b]">@{profile.username}</p>}
                        <p className="mt-2 text-xs text-[#68736d]">{profile.creationsCount} posts · {profile.followersCount} followers</p>
                    </div>
                </div>
            </section>

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

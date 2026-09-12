"use client";

import { apiClient } from "@/lib/apiClient";
import { VisualItem } from "@/types/visualItem";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SharedPinPage() {
    const params = useParams<{ username: string; shareKey: string }>();
    const [item, setItem] = useState<VisualItem | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!params.username || !params.shareKey) return;
        apiClient<VisualItem>(`/visual-items/share/${encodeURIComponent(params.username)}/${encodeURIComponent(params.shareKey)}`)
            .then(setItem)
            .catch(() => setNotFound(true));
    }, [params.username, params.shareKey]);

    if (notFound) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f5f1e9] px-6 text-[#1f2925]">
                <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-bold">Post not found</h1>
                    <Link className="mt-5 inline-flex rounded-full bg-[#1f2925] px-5 py-2.5 text-sm font-semibold text-white" href="/">Back to posts</Link>
                </div>
            </main>
        );
    }

    if (!item) return <main className="min-h-screen bg-[#f5f1e9]" aria-label="Loading post" />;

    return (
        <main className="min-h-screen bg-[#f5f1e9] px-4 py-6 text-[#1f2925] sm:px-8 lg:px-12">
            <header className="mx-auto flex max-w-5xl items-center justify-between gap-3">
                <Link className="shrink-0" href="/" aria-label="Chitram home">
                    <img src="/name.png" alt="Chitram" className="h-11 w-40 translate-y-2 object-cover object-center" />
                </Link>
                <Link className="rounded-full border border-[#d8ded8] bg-white px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm" href="/">Back to posts</Link>
            </header>
            <article className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl border border-[#e4dcd3] bg-white shadow-sm">
                <img src={item.imageUrl} alt={item.title || "Chitram post"} className="max-h-[75vh] w-full object-contain bg-[#e6e0d6]" />
                <div className="p-5 sm:p-7">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d2643b]">{item.category}</p>
                    <h1 className="mt-2 text-2xl font-bold">{item.title}</h1>
                    {item.description && <p className="mt-2 text-sm leading-6 text-[#68736d]">{item.description}</p>}
                    {item.creatorUsername && <Link className="mt-5 inline-flex text-sm font-semibold text-[#d2643b] hover:underline" href={`/account/${item.creatorUsername}`}>@{item.creatorUsername}</Link>}
                </div>
            </article>
        </main>
    );
}
"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error("Unhandled application error", error);
    }, [error]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f5f1e9] px-6 text-[#1f2925]">
            <section className="w-full max-w-md rounded-3xl bg-white px-8 py-10 text-center shadow-sm">
                <h1 className="text-2xl font-semibold">Something went wrong</h1>
                <p className="mt-3 text-sm text-[#68736d]">Please try again. Your data is safe.</p>
                <button
                    type="button"
                    onClick={reset}
                    className="mt-6 rounded-full bg-[#1f2925] px-5 py-2.5 text-sm font-semibold text-white"
                >
                    Try again
                </button>
            </section>
        </main>
    );
}
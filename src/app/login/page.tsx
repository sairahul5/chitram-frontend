"use client";

import Link from "next/link";
import Image from "next/image";

const backendUrl = (process.env.NEXT_PUBLIC_API_URL ?? "https://chitram-backend-og9p.onrender.com/api").replace(/\/api\/?$/, "");

export default function LoginPage() {
    return (
        <main className="flex min-h-screen flex-col bg-[#f5f1e9] text-[#1f2925] selection:bg-[#d2643b]/20">
            <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 sm:flex-nowrap sm:px-8 sm:py-6">
                <Link href="/" className="basis-full shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d2643b] hover:opacity-80 sm:basis-auto" aria-label="Chitram home">
                    <Image src="/name.png" alt="Chitram" width={144} height={40} className="h-9 w-32 object-cover object-center sm:h-10 sm:w-36" priority />
                </Link>
                <Link
                    href="/"
                    className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-[#68736d] hover:text-[#1f2925] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d2643b]"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to gallery
                </Link>
            </header>

            <section className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 sm:py-10">
                <div className="w-full max-w-[410px] rounded-2xl border border-[#e4dcd3] bg-[#fffdfa] p-6 shadow-[0_10px_28px_rgba(31,41,37,0.05)] sm:p-8">
                    <div className="text-center">
                        <Image src="/name.png" alt="Chitram" width={112} height={32} className="mx-auto h-8 w-28 object-cover object-center" priority />
                        <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#1f2925] sm:text-[26px]">
                            Sign in to Chitram
                        </h1>
                        <p className="mx-auto mt-2 max-w-[290px] text-sm leading-5 text-[#68736d]">
                            Save, follow, and share your favorite visuals.
                        </p>
                    </div>

                    <div className="mt-6 space-y-3">
                        <a
                            href={`${backendUrl}/oauth2/authorization/google`}
                            id="google-login-button"
                            aria-label="Continue with Google"
                            className="group flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#d8ded8] bg-white px-5 text-sm font-semibold text-[#1f2925] shadow-sm hover:border-[#aebbb2] hover:bg-[#fafaf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d2643b]"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span>Continue with Google</span>
                        </a>

                        <div className="relative my-5 flex items-center justify-center">
                            <div className="w-full border-t border-[#e8ece8]" />
                            <span className="absolute bg-[#fffdfa] px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[#98a39c]">
                                or
                            </span>
                        </div>

                        <Link
                            href="/"
                            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-[#f0eee6] px-5 text-sm font-semibold text-[#48534e] hover:bg-[#e6e3da] hover:text-[#1f2925] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d2643b]"
                        >
                            Browse gallery without account
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="mx-auto w-full max-w-6xl px-5 py-5 text-center text-xs text-[#98a39c] sm:px-8 sm:py-6">
                Chitram
            </footer>
        </main>
    );
}

"use client";

import Link from "next/link";

const backendUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "");

export default function LoginPage() {
    return (
        <main className="relative min-h-screen bg-[#f5f1e9] text-[#1f2925] flex flex-col justify-between selection:bg-[#d2643b]/20">
            {/* Ambient background glow */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#e8d5c4]/60 via-[#edd9cb]/30 to-transparent blur-3xl" />
                <div className="absolute bottom-0 left-10 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-[#d5e0d5]/50 via-[#e4ebe4]/20 to-transparent blur-3xl" />
            </div>

            {/* Navigation Header */}
            <header className="relative z-10 mx-auto w-full max-w-6xl px-6 py-8 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-2xl font-bold tracking-tight text-[#1f2925] hover:opacity-80 transition"
                >
                    Chitram
                </Link>
                <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#68736d] hover:text-[#1f2925] transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to gallery
                </Link>
            </header>

            {/* Main Auth Section */}
            <section className="relative z-10 mx-auto w-full max-w-md px-6 py-6 sm:py-10">
                <div className="rounded-3xl border border-[#e4dcd3] bg-white/90 p-8 sm:p-10 shadow-[0_24px_60px_rgba(31,41,37,0.08)] backdrop-blur-md">
                    <div className="text-center">
                        <span className="inline-block rounded-full bg-[#fbebe4] px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#d2643b]">
                            Welcome back
                        </span>
                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#1f2925]">
                            Sign in to Chitram
                        </h1>
                        <p className="mt-2.5 text-sm leading-6 text-[#68736d]">
                            Discover visual ideas, follow creators, and share your photography and art stored directly in Supabase cloud.
                        </p>
                    </div>

                    <div className="mt-8 space-y-4">
                        {/* Google OAuth Login Button */}
                        <a
                            href={`${backendUrl}/oauth2/authorization/google`}
                            id="google-login-button"
                            className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-[#d8ded8] bg-white px-5 py-3.5 text-sm font-semibold text-[#1f2925] shadow-sm hover:border-[#1f2925] hover:bg-[#fafaf7] hover:shadow-md active:scale-[0.99] transition duration-200"
                        >
                            <svg className="h-5 w-5 transition group-hover:scale-105" viewBox="0 0 24 24">
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

                        <div className="relative my-6 flex items-center justify-center">
                            <div className="w-full border-t border-[#e8ece8]" />
                            <span className="absolute bg-white px-3 text-xs uppercase tracking-widest text-[#98a39c]">
                                or
                            </span>
                        </div>

                        <Link
                            href="/"
                            className="flex w-full items-center justify-center rounded-2xl bg-[#f0eee6] px-5 py-3 text-sm font-semibold text-[#48534e] hover:bg-[#e6e3da] hover:text-[#1f2925] transition"
                        >
                            Browse gallery without account
                        </Link>
                    </div>

                    {/* Highlights list */}
                    <div className="mt-8 border-t border-[#e8ece8] pt-6 space-y-3">
                        <div className="flex items-start gap-3 text-xs text-[#68736d]">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#edf3ee] text-[#3b795c]">✓</span>
                            <span>Direct cloud uploads powered by <strong>Supabase Storage</strong></span>
                        </div>
                        <div className="flex items-start gap-3 text-xs text-[#68736d]">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#edf3ee] text-[#3b795c]">✓</span>
                            <span>Custom profile with followers and following connections</span>
                        </div>
                        <div className="flex items-start gap-3 text-xs text-[#68736d]">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#edf3ee] text-[#3b795c]">✓</span>
                            <span>Secure OAuth2 single sign-on with your Google account</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 py-6 text-center text-xs text-[#98a39c]">
                © {new Date().getFullYear()} Chitram — Visual Discovery & Creator Sanctuary. All images stored in Supabase.
            </footer>
        </main>
    );
}

import Link from "next/link";

type PanelShellProps = {
    eyebrow: string;
    title: string;
    description: string;
    role: "Admin" | "User";
    children: React.ReactNode;
};

const navigation = [
    { label: "Overview", href: "#overview" },
    { label: "Coming next", href: "#coming-next" },
];

export function PanelShell({
    eyebrow,
    title,
    description,
    role,
    children,
}: PanelShellProps) {
    return (
        <main className="min-h-screen bg-[#f5f1e9] text-[#1f2925]">
            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
                <aside className="flex w-full flex-col justify-between border-b border-[#d8ded8] px-6 py-6 lg:w-64 lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
                    <div>
                        <Link className="shrink-0" href="/" aria-label="Chitram home">
                            <img src="/name.png" alt="Chitram" className="h-10 w-36 translate-y-2 object-cover object-center" />
                        </Link>
                        <p className="mt-1 text-sm text-[#68736d]">{role} workspace</p>
                        <nav className="mt-10 flex gap-2 lg:flex-col" aria-label={`${role} panel navigation`}>
                            {navigation.map((item, index) => (
                                <a
                                    className={`rounded-xl px-3 py-2 text-sm font-medium ${index === 0 ? "bg-[#1f2925] text-white" : "text-[#68736d] hover:bg-white"
                                        }`}
                                    href={item.href}
                                    key={item.label}
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>
                    </div>
                    <Link className="mt-8 text-sm font-semibold text-[#d2643b]" href="/">
                        Back to Chitram
                    </Link>
                </aside>

                <section className="flex-1 px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
                    <header className="max-w-3xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d2643b]">{eyebrow}</p>
                        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-[#68736d]">{description}</p>
                    </header>
                    <div className="mt-10">{children}</div>
                </section>
            </div>
        </main>
    );
}

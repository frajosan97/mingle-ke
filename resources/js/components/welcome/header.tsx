// resources/js/components/landing/header.tsx
import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { login, register } from "@/routes";

type HeaderProps = {
    user?: { id: number } | null;
};

export default function Header({ user }: HeaderProps) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={`nav-base fixed inset-x-0 top-0 z-50 ${
                scrolled ? "nav-scrolled" : "px-4 pt-4 lg:px-0"
            }`}
        >
            <nav
                className={`mx-auto flex items-center justify-between ${
                    scrolled ? "container-page" : "nav-floating"
                }`}
            >
                <Link href="/" className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-glow-pink">
                        <Heart className="h-5 w-5 fill-white text-white" />
                    </span>
                    <span className="text-base font-extrabold tracking-tight text-foreground">
                        Mingle
                        <span className="text-gradient-brand">KE</span>
                    </span>
                </Link>

                <div className="hidden items-center gap-2 md:flex">
                    {[
                        ["Premium", "#premium"],
                        ["Regular", "#regular"],
                        ["Stories", "#stories"],
                        ["Safety", "#safety"],
                    ].map(([label, href]) => (
                        <a
                            key={label}
                            href={href}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                        >
                            {label}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {user ? (
                        <Link
                            href="/conversations"
                            className="group relative flex items-center gap-2 rounded-full bg-gradient-brand px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-pink/30 transition hover:scale-105"
                            title="Open chat"
                        >
                            <MessageCircle className="h-4 w-4 transition-transform group-hover:rotate-12" />
                            <span>Chat</span>
                            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-green" />
                            </span>
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={login()}
                                className="hidden rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground sm:block"
                            >
                                Log in
                            </Link>
                            <Link
                                href={register()}
                                className="rounded-full bg-gradient-brand px-5 py-2 text-sm font-bold text-white shadow-lg shadow-brand-pink/30 transition hover:scale-105"
                            >
                                Join Free
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}

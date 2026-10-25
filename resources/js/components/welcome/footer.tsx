// resources/js/components/landing/footer.tsx
import { Link } from "@inertiajs/react";
import { Heart } from "lucide-react";
import { FOOTER_LINKS, SOCIALS } from "./data";

export default function Footer() {
    return (
        <footer className="border-t border-border bg-muted/30 px-4 pt-14 pb-8 lg:px-8">
            <div className="container-page">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand">
                                <Heart className="h-5 w-5 fill-white text-white" />
                            </span>
                            <span className="text-base font-extrabold tracking-tight text-foreground">
                                Mingle
                                <span className="text-gradient-brand">KE</span>
                            </span>
                        </Link>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                            Kenya's most trusted platform for real connections.
                            Meet verified singles, companions, and new friends
                            near you — safely and instantly.
                        </p>

                        <div className="mt-6 flex gap-2">
                            {SOCIALS.map((s) => (
                                <a
                                    key={s.name}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={s.name}
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition hover:border-brand-pink hover:bg-brand-pink/10 hover:text-brand-pink"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                    >
                                        <path d={s.icon} />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {[
                        { title: "Discover", links: FOOTER_LINKS.discover },
                        { title: "Company", links: FOOTER_LINKS.company },
                        { title: "Support", links: FOOTER_LINKS.support },
                        { title: "Legal", links: FOOTER_LINKS.legal },
                    ].map((col) => (
                        <div key={col.title}>
                            <h4 className="text-sm font-bold text-foreground">
                                {col.title}
                            </h4>
                            <ul className="mt-4 space-y-2.5">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground transition hover:text-brand-pink"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
                    <div className="flex flex-wrap items-center gap-3">
                        <span>
                            © {new Date().getFullYear()} MingleKE · Made in
                            Kenya 🇰🇪
                        </span>
                        <span className="hidden h-3 w-px bg-border sm:block" />
                        <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-green" />
                            All systems operational
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-border bg-card/60 px-2.5 py-0.5 font-semibold text-foreground/70">
                            18+
                        </span>
                        <span>English (KE)</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

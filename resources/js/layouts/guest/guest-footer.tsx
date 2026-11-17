// resources/js/layouts/guest/guest-footer.tsx
import { Link } from "@inertiajs/react";
import { ShieldCheck, Flag, Scale, FileText, Mail, Phone } from "lucide-react";
import { SOCIALS } from "../../components/partials/welcome/data";
import AppLogo from "../../components/app-logo";

const DISCOVER_LINKS = [
    { label: "Premium escorts", href: "/browse?tier=premium" },
    { label: "Regular escorts", href: "/browse?tier=regular" },
    { label: "Near me", href: "/browse?near=1" },
    { label: "Top rated", href: "/browse?sort=rating" },
    { label: "New members", href: "/browse?sort=new" },
] as const;

const SAFETY_LINKS = [
    { label: "Verification process", href: "/safety/verification" },
    { label: "Community guidelines", href: "/guidelines" },
    { label: "Report a concern", href: "/report" },
    { label: "Safety center", href: "/safety" },
    { label: "Anti-trafficking policy", href: "/anti-trafficking" },
    { label: "Law enforcement requests", href: "/legal/law-enforcement" },
] as const;

const LEGAL_LINKS = [
    { label: "Terms of service", href: "/legal/terms" },
    { label: "Privacy policy (DPA)", href: "/legal/privacy" },
    { label: "18+ adult content policy", href: "/legal/adult-content" },
    { label: "Refund & coin policy", href: "/legal/refunds" },
    { label: "Cookie policy", href: "/legal/cookies" },
    { label: "Report illegal content", href: "/legal/report-illegal" },
] as const;

export default function GuestFooter() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-border bg-muted/30 pt-14 pb-8">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
                    {/* Brand + trust */}
                    <div className="lg:col-span-2">
                        <Link href="/" aria-label="Home">
                            <AppLogo />
                        </Link>

                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                            Kenya's verified adult social platform. Real people,
                            verified profiles, transparent pricing — built for
                            safety, discretion, and mutual respect.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-green/30 bg-brand-green/10 px-2.5 py-1 text-[11px] font-semibold text-brand-green">
                                <ShieldCheck className="h-3 w-3" />
                                18+ Adults Only
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-pink/30 bg-brand-pink/10 px-2.5 py-1 text-[11px] font-semibold text-brand-pink">
                                <Scale className="h-3 w-3" />
                                ODPC Registered
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[11px] font-semibold text-foreground/70">
                                🇰🇪 Data Protection Act 2019
                            </span>
                        </div>

                        <div className="mt-5 space-y-1.5 text-sm text-muted-foreground">
                            <a
                                href="mailto:support@mingleke.app"
                                className="flex items-center gap-2 transition-colors hover:text-brand-pink"
                            >
                                <Mail className="h-3.5 w-3.5" />
                                support@mingleke.app
                            </a>
                            <a
                                href="tel:+254700000000"
                                className="flex items-center gap-2 transition-colors hover:text-brand-pink"
                            >
                                <Phone className="h-3.5 w-3.5" />
                                +254 700 000 000 (Mon–Sun, 8am–10pm)
                            </a>
                        </div>

                        <div className="mt-6 flex gap-2">
                            {SOCIALS.map((s) => (
                                <a
                                    key={s.name}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={s.name}
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition-colors hover:border-brand-pink hover:bg-brand-pink/10 hover:text-brand-pink"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    >
                                        <path d={s.icon} />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Discover */}
                    <div>
                        <h4 className="text-sm font-bold text-foreground">
                            Discover
                        </h4>
                        <ul className="mt-4 space-y-2.5">
                            {DISCOVER_LINKS.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-brand-pink"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Trust & Safety */}
                    <div>
                        <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                            <ShieldCheck className="h-3.5 w-3.5 text-brand-green" />
                            Trust & Safety
                        </h4>
                        <ul className="mt-4 space-y-2.5">
                            {SAFETY_LINKS.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-brand-pink"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            Legal
                        </h4>
                        <ul className="mt-4 space-y-2.5">
                            {LEGAL_LINKS.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition-colors hover:text-brand-pink"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
                    <div className="flex flex-wrap items-center gap-3">
                        <span>© {year} MingleKE Ltd · Nairobi, Kenya 🇰🇪</span>
                        <span className="hidden h-3 w-px bg-border sm:block" />
                        <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-green" />
                            All systems operational
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href="/legal/adult-content"
                            className="inline-flex items-center gap-1 rounded-full border border-brand-pink/30 bg-brand-pink/10 px-2.5 py-0.5 font-semibold text-brand-pink transition-colors hover:bg-brand-pink/20"
                        >
                            <ShieldCheck className="h-3 w-3" />
                            18+ Only
                        </Link>
                        <Link
                            href="/legal/report-illegal"
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-2.5 py-0.5 font-semibold text-foreground/70 transition-colors hover:text-brand-pink"
                        >
                            <Flag className="h-3 w-3" />
                            Report illegal content
                        </Link>
                        <span>English (KE)</span>
                    </div>
                </div>

                {/* Final legal paragraph */}
                <div className="mt-6 rounded-2xl border border-border bg-card/40 p-4 text-[11px] leading-relaxed text-muted-foreground">
                    <p>
                        <strong className="text-foreground">MingleKE</strong> is
                        an adults-only (18+) social platform for consenting
                        adults. We do not facilitate or promote prostitution,
                        sexual exploitation, or human trafficking. All users
                        must verify their identity and agree to our Community
                        Guidelines. Any account we believe is engaged in illegal
                        activity will be reported to the relevant Kenyan
                        authorities. MingleKE Ltd is a data controller
                        registered with the Office of the Data Protection
                        Commissioner (ODPC) under the Data Protection Act, 2019.
                        To report illegal content, a safety concern, or a
                        law-enforcement request, contact{" "}
                        <a
                            href="mailto:trust@mingleke.app"
                            className="font-semibold text-brand-pink hover:underline"
                        >
                            trust@mingleke.app
                        </a>
                        .
                    </p>
                </div>
            </div>
        </footer>
    );
}

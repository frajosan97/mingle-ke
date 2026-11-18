// resources/js/layouts/guest/guest-header.tsx

import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
    LogOut,
    Menu,
    MessageCircle,
    Moon,
    Settings,
    Sun,
    User as UserIcon,
    Wallet,
    X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { login, register } from "@/routes";
import { useAppearance } from "@/hooks/use-appearance";
import AppLogo from "../../components/app-logo";

/* ── Types ───────────────────────────────────────────────── */

export type HeaderUser = {
    id: number;
    name: string;
    avatar?: string | null;
    avatar_url?: string | null;
    listing_active?: boolean;
};

type NavLink = { label: string; href: string; icon?: LucideIcon };

/* ── Nav data ────────────────────────────────────────────── */

const PUBLIC_NAV: NavLink[] = [
    { label: "Discover", href: "/escorts" },
    { label: "Escorts", href: "/escorts" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Safety", href: "/#safety" },
];

const AUTH_NAV: NavLink[] = [
    { label: "Discover", href: "/escorts" },
    { label: "Escorts", href: "/escorts" },
];

const ESCORT_EXTRA_NAV: NavLink = {
    label: "My listing",
    href: "/escorts/onboarding",
};

const ACCOUNT_NAV: NavLink[] = [
    { label: "Profile", href: "/settings/profile", icon: UserIcon },
    { label: "Wallet", href: "/wallets", icon: Wallet },
    { label: "Messages", href: "/conversations", icon: MessageCircle },
];

/* ── Shared classes ──────────────────────────────────────── */

const DESKTOP_LINK =
    "rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";

const MOBILE_LINK =
    "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";

const PILL =
    "hidden h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:flex";

const PRIMARY_CTA =
    "rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.03] hover:bg-primary/90 active:scale-95 sm:px-7";

const ICON_BTN =
    "flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";

/* ── Component ───────────────────────────────────────────── */

export default function GuestHeader({ user }: { user?: HeaderUser | null }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === "dark";

    const closeAll = () => {
        setMobileOpen(false);
        setProfileOpen(false);
    };

    const toggleTheme = () => {
        updateAppearance(isDark ? "light" : "dark");
        closeAll();
    };

    /* scroll → sticky state */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    /* resize → close mobile drawer */
    useEffect(() => {
        const onResize = () => window.innerWidth >= 768 && setMobileOpen(false);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    /* Escape closes both menus */
    useEffect(() => {
        if (!mobileOpen && !profileOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAll();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [mobileOpen, profileOpen]);

    /* click-outside closes profile dropdown */
    useEffect(() => {
        if (!profileOpen) return;
        const onClick = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest("[data-profile-menu]")) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [profileOpen]);

    /* Which left-side links for the current auth state */
    const navLinks: NavLink[] = !user
        ? PUBLIC_NAV
        : user.listing_active
          ? [...AUTH_NAV, ESCORT_EXTRA_NAV]
          : AUTH_NAV;

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-[padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                scrolled ? "pt-0" : "pt-4"
            }`}
        >
            <nav
                aria-label="Main navigation"
                className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    scrolled
                        ? "mx-auto max-w-full rounded-none border-b border-border bg-background/90 shadow-md backdrop-blur-xl"
                        : "mx-auto max-w-[calc(100%-2rem)] rounded-2xl border border-border/60 bg-background/75 shadow-sm backdrop-blur-lg sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl"
                }`}
            >
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                    <Link
                        href="/"
                        aria-label="Home"
                        className="shrink-0"
                        onClick={closeAll}
                    >
                        <AppLogo />
                    </Link>

                    {/* ── Desktop nav ───────────────────────── */}
                    <div className="hidden items-center gap-1 md:flex">
                        {navLinks.map((l) => (
                            <Link
                                key={l.label}
                                href={l.href}
                                className={DESKTOP_LINK}
                            >
                                {l.label}
                            </Link>
                        ))}
                    </div>

                    {/* ── Right-side actions ────────────────── */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            aria-label={
                                isDark
                                    ? "Switch to light mode"
                                    : "Switch to dark mode"
                            }
                            className={`${ICON_BTN} hidden sm:flex`}
                        >
                            {isDark ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </button>

                        {user ? (
                            <>
                                <Link
                                    href="/conversations"
                                    aria-label="Chat"
                                    className={PILL}
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    Chat
                                </Link>
                                {user.listing_active ? (
                                    <span className="hidden rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 md:inline">
                                        Listing active
                                    </span>
                                ) : (
                                    <Link
                                        href="/escorts/listing-fee"
                                        className={`hidden md:inline-block ${PRIMARY_CTA}`}
                                    >
                                        Become an escort
                                    </Link>
                                )}
                                {/* Profile menu */}
                                <div className="relative" data-profile-menu>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setProfileOpen((v) => !v)
                                        }
                                        aria-label="Open account menu"
                                        aria-haspopup="menu"
                                        aria-expanded={profileOpen}
                                        className="flex items-center rounded-full border border-border bg-background p-0.5 transition-colors hover:bg-accent"
                                    >
                                        <Avatar user={user} />
                                    </button>

                                    {profileOpen && (
                                        <ProfileMenu
                                            user={user}
                                            onClose={closeAll}
                                        />
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className={`hidden sm:block ${DESKTOP_LINK}`}
                                >
                                    Log in
                                </Link>
                                <Link href={register()} className={PRIMARY_CTA}>
                                    Join Free
                                </Link>
                            </>
                        )}

                        {/* Mobile toggle */}
                        <button
                            type="button"
                            onClick={() => setMobileOpen((v) => !v)}
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileOpen}
                            aria-controls="guest-mobile-menu"
                            className={`${ICON_BTN} md:hidden`}
                        >
                            {mobileOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Mobile drawer ────────────────────────── */}
            {mobileOpen && (
                <div
                    id="guest-mobile-menu"
                    className="mx-auto mt-2 max-w-[calc(100%-2rem)] rounded-2xl border border-border bg-card/95 shadow-lg backdrop-blur-xl md:hidden"
                >
                    <div className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
                        {navLinks.map((l) => (
                            <Link
                                key={l.label}
                                href={l.href}
                                onClick={closeAll}
                                className={MOBILE_LINK}
                            >
                                {l.label}
                            </Link>
                        ))}

                        <div className="my-1 border-t border-border" />

                        {user ? (
                            <>
                                {ACCOUNT_NAV.map(
                                    ({ label, href, icon: Icon }) => (
                                        <Link
                                            key={label}
                                            href={href}
                                            onClick={closeAll}
                                            className={MOBILE_LINK}
                                        >
                                            {Icon && (
                                                <Icon className="h-4 w-4" />
                                            )}
                                            {label}
                                        </Link>
                                    ),
                                )}

                                {!user.listing_active && (
                                    <Link
                                        href="/escorts/listing-fee"
                                        onClick={closeAll}
                                        className="mt-1 rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-bold text-primary-foreground"
                                    >
                                        Become an escort
                                    </Link>
                                )}

                                <ThemeButton
                                    isDark={isDark}
                                    onClick={toggleTheme}
                                />

                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    onClick={closeAll}
                                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-accent"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Log out
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    onClick={closeAll}
                                    className={MOBILE_LINK}
                                >
                                    Log in
                                </Link>
                                <ThemeButton
                                    isDark={isDark}
                                    onClick={toggleTheme}
                                />
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

/* ── Extracted bits ──────────────────────────────────────── */

function Avatar({ user }: { user: HeaderUser }) {
    const avatarUrl = user.avatar_url ?? user.avatar;

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover"
            />
        );
    }

    return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {user.name.charAt(0).toUpperCase()}
        </span>
    );
}

function ProfileMenu({
    user,
    onClose,
}: {
    user: HeaderUser;
    onClose: () => void;
}) {
    return (
        <div
            role="menu"
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
            <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-semibold text-foreground">
                    {user.name}
                </p>
                <p className="text-xs text-muted-foreground">
                    {user.listing_active ? "Escort" : "Member"}
                </p>
            </div>

            {ACCOUNT_NAV.map(({ label, href, icon: Icon }) => (
                <Link
                    key={label}
                    href={href}
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    {label}
                </Link>
            ))}

            <Link
                href="/logout"
                method="post"
                as="button"
                onClick={onClose}
                className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-accent"
            >
                <LogOut className="h-4 w-4" />
                Log out
            </Link>
        </div>
    );
}

function ThemeButton({
    isDark,
    onClick,
}: {
    isDark: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
            {isDark ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
            {isDark ? "Light mode" : "Dark mode"}
        </button>
    );
}

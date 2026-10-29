// resources/js/layouts/auth/auth-split-layout.tsx
import { Link, usePage } from "@inertiajs/react";
import { home } from "@/routes";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";
import type { AuthLayoutProps } from "@/types";
import AppLogo from "@/components/app-logo";

const AVATARS = [1, 5, 12, 32, 44];

function BrandPanel({ appName }: { appName?: string }) {
    return (
        <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-zinc-900 p-10 text-white lg:flex dark:border-r">
            {/* Background image + overlays (decorative) */}
            <div className="absolute inset-0 z-0" aria-hidden="true">
                <img
                    src="https://images.unsplash.com/photo-1516589091380-5d8e87df6999?auto=format&fit=crop&q=80&w=1600"
                    alt=""
                    className="h-full w-full object-cover object-center opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-brand-pink/40 via-black/60 to-brand-orange/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
            </div>

            <Link
                href={home()}
                className="relative z-10 flex items-center gap-2.5 transition-transform hover:scale-105"
                aria-label={`${appName ?? "Home"} — go to homepage`}
            >
                <AppLogo />
            </Link>

            <div className="relative z-10 space-y-6">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md">
                        <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
                        Kenya's most trusted platform
                    </div>
                    <h2 className="text-4xl font-bold leading-tight tracking-tight">
                        Real people.
                        <br />
                        Real connections.
                        <br />
                        <span className="text-brand-pink">
                            Right next door.
                        </span>
                    </h2>
                    <p className="max-w-md text-sm text-white/70">
                        Join thousands of verified members finding genuine
                        connections, companions, and love across Kenya.
                    </p>
                </div>

                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-brand-green" />
                        <span className="font-medium">100% Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 fill-brand-pink text-brand-pink" />
                        <span className="font-medium">12K+ Matches</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {AVATARS.map((img) => (
                            <img
                                key={img}
                                src={`https://i.pravatar.cc/60?img=${img}`}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="h-8 w-8 rounded-full border-2 border-white/20 object-cover"
                            />
                        ))}
                    </div>
                    <p className="text-xs text-white/60">
                        Join{" "}
                        <span className="font-semibold text-white">1,247</span>{" "}
                        members online now
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative isolate grid min-h-dvh w-full grid-cols-1 overflow-x-hidden lg:grid-cols-2">
            <BrandPanel appName={name} />

            {/* Right Column: Form */}
            <div className="flex w-full items-center justify-center p-6 sm:p-8 lg:p-12">
                <div className="mx-auto flex w-full flex-col gap-6 sm:max-w-sm">
                    <Link
                        href={home()}
                        className="flex items-center justify-center lg:hidden"
                        aria-label="Go to homepage"
                    >
                        <AppLogo />
                    </Link>

                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-balance text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>

                    <div className="pt-2">{children}</div>
                </div>
            </div>
        </div>
    );
}

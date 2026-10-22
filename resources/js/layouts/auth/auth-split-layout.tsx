// resources/js/layouts/auth/auth-split-layout.tsx
import { Link, usePage } from "@inertiajs/react";
import AppLogoIcon from "@/components/app-logo-icon";
import { home } from "@/routes";
import type { AuthLayoutProps } from "@/types";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid min-h-screen w-full grid-cols-1 overflow-x-hidden lg:grid-cols-2">
            {/* Left Column */}
            <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-zinc-900 p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1516589091380-5d8e87df6999?auto=format&fit=crop&q=80&w=1600"
                        alt="Two people connecting"
                        className="h-full w-full object-cover object-center opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-pink/40 via-black/60 to-brand-orange/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                </div>

                <Link
                    href={home()}
                    className="relative z-20 flex items-center gap-2.5 transition-transform hover:scale-105"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md">
                        <AppLogoIcon className="size-6 fill-current text-white" />
                    </div>
                    <span className="text-xl font-extrabold tracking-tight">
                        {name || "MingleKE"}
                    </span>
                </Link>

                <div className="relative z-20 space-y-6">
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
                            {[1, 5, 12, 32, 44].map((img) => (
                                <img
                                    key={img}
                                    src={`https://i.pravatar.cc/60?img=${img}`}
                                    alt=""
                                    className="h-8 w-8 rounded-full border-2 border-white/20 object-cover"
                                />
                            ))}
                        </div>
                        <p className="text-xs text-white/60">
                            Join{" "}
                            <span className="font-semibold text-white">
                                1,247
                            </span>{" "}
                            members online now
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Column: Form */}
            <div className="flex w-full items-center justify-center p-6 sm:p-8 lg:p-12">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:max-w-sm">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand shadow-glow-pink">
                                <AppLogoIcon className="size-6 fill-current text-white" />
                            </div>
                            <span className="text-xl font-extrabold tracking-tight text-foreground">
                                Mingle
                                <span className="text-gradient-brand">KE</span>
                            </span>
                        </div>
                    </Link>

                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {title}
                        </h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    <div className="pt-2">{children}</div>
                </div>
            </div>
        </div>
    );
}

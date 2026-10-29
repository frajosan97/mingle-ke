// resources/js/layouts/auth/auth-card-layout.tsx
import { Link, usePage } from "@inertiajs/react";
import type { AuthLayoutProps } from "@/types";
import AppLogo from "@/components/app-logo";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { home } from "@/routes";
import { Sparkles } from "lucide-react";

const GRID_MASK =
    "radial-gradient(ellipse at center, black 20%, transparent 70%)";

function AmbientBackground() {
    return (
        <>
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
            >
                <div className="orb orb-pink absolute -left-32 -top-32 h-[600px] w-[600px] opacity-30" />
                <div
                    className="orb orb-orange absolute -right-32 top-1/4 h-[600px] w-[600px] opacity-30"
                    style={{ animationDelay: "1.5s" }}
                />
                <div
                    className="orb orb-gold absolute -bottom-32 left-1/3 h-[500px] w-[500px] opacity-20"
                    style={{ animationDelay: "3s" }}
                />
            </div>

            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(black_1px,transparent_1px),linear-gradient(90deg,black_1px,transparent_1px)] dark:[background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)]"
                style={{
                    backgroundSize: "48px 48px",
                    maskImage: GRID_MASK,
                    WebkitMaskImage: GRID_MASK,
                }}
            />
        </>
    );
}

export default function AuthCardLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative isolate flex min-h-dvh w-full flex-col items-center justify-center overflow-x-hidden bg-background p-6 md:p-10">
            <AmbientBackground />

            <div className="relative z-10 flex w-full max-w-md flex-col gap-6">
                <header className="flex justify-center">
                    <Link
                        href={home()}
                        className="flex items-center gap-2.5 self-center rounded-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-label={`${name ?? "MingleKE"} — go to homepage`}
                    >
                        <AppLogo />
                    </Link>
                </header>

                <main className="relative">
                    <div
                        aria-hidden="true"
                        className="absolute -inset-0.5 rounded-2xl bg-gradient-brand opacity-20 blur-lg"
                    />
                    <Card className="relative rounded-2xl border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl">
                        <CardHeader className="space-y-2 px-8 pt-8 pb-0 text-center">
                            {title && (
                                <CardTitle className="text-2xl font-bold tracking-tight text-balance text-foreground">
                                    {title}
                                </CardTitle>
                            )}
                            {description && (
                                <CardDescription className="text-sm text-pretty text-muted-foreground">
                                    {description}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="px-8 py-6">
                            {children}
                        </CardContent>
                    </Card>
                </main>

                <footer className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
                    <span>Trusted by 12,000+ members across Kenya</span>
                </footer>
            </div>
        </div>
    );
}

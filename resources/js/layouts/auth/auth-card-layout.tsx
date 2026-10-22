// resources/js/layouts/auth/auth-card-layout.tsx
import { Link, usePage } from "@inertiajs/react";
import type { PropsWithChildren } from "react";
import AppLogoIcon from "@/components/app-logo-icon";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { home } from "@/routes";
import { Sparkles } from "lucide-react";

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    const { name } = usePage().props;

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-background p-6 md:p-10">
            {/* Ambient Background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
                className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(black_1px,transparent_1px),linear-gradient(90deg,black_1px,transparent_1px)] dark:[background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)]"
                style={{
                    backgroundSize: "48px 48px",
                    maskImage:
                        "radial-gradient(ellipse at center, black 20%, transparent 70%)",
                    WebkitMaskImage:
                        "radial-gradient(ellipse at center, black 20%, transparent 70%)",
                }}
            />

            {/* Foreground Content */}
            <div className="relative z-10 flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className="group flex items-center justify-center gap-2.5 self-center transition-transform hover:scale-105"
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand shadow-glow-pink">
                        <AppLogoIcon className="size-6 fill-current text-white" />
                    </div>
                    <span className="text-xl font-extrabold tracking-tight text-foreground">
                        {name || "Mingle"}
                        <span className="text-gradient-brand">KE</span>
                    </span>
                </Link>

                <div className="relative">
                    <div className="absolute -inset-0.5 rounded-2xl bg-gradient-brand opacity-20 blur-lg" />
                    <Card className="relative rounded-2xl border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl">
                        <CardHeader className="space-y-2 px-8 pt-8 pb-0 text-center">
                            {title && (
                                <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                                    {title}
                                </CardTitle>
                            )}
                            {description && (
                                <CardDescription className="text-sm text-muted-foreground">
                                    {description}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="px-8 py-6">
                            {children}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
                    <span>Trusted by 12,000+ members across Kenya</span>
                </div>
            </div>
        </div>
    );
}

// resources/js/layouts/auth/auth-simple-layout.tsx
import { Link } from "@inertiajs/react";
import AppLogoIcon from "@/components/app-logo-icon";
import { home } from "@/routes";
import type { AuthLayoutProps } from "@/types";

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-background p-6 md:p-10">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="orb orb-pink absolute -left-20 top-10 h-72 w-72 opacity-20" />
                <div className="orb orb-orange absolute -right-20 bottom-10 h-72 w-72 opacity-20" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="mb-8 flex flex-col items-center gap-4">
                    <Link
                        href={home()}
                        className="group flex items-center gap-2.5 transition-transform hover:scale-105"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand shadow-glow-pink">
                            <AppLogoIcon className="size-6 fill-current text-white" />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-foreground">
                            Mingle
                            <span className="text-gradient-brand">KE</span>
                        </span>
                    </Link>

                    <div className="space-y-1.5 text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
                    {children}
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    By continuing, you agree to our{" "}
                    <Link
                        href="/terms"
                        className="font-medium text-foreground underline underline-offset-4 hover:text-brand-pink"
                    >
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                        href="/privacy"
                        className="font-medium text-foreground underline underline-offset-4 hover:text-brand-pink"
                    >
                        Privacy Policy
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}

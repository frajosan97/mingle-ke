// resources/js/layouts/auth/auth-simple-layout.tsx
import { Link } from "@inertiajs/react";
import AppLogo from "@/components/app-logo";
import { home } from "@/routes";
import type { AuthLayoutProps } from "@/types";

function AuthOrbs() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
        >
            <div className="orb orb-pink absolute -left-20 top-10 h-72 w-72 opacity-20" />
            <div className="orb orb-orange absolute -right-20 bottom-10 h-72 w-72 opacity-20" />
        </div>
    );
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative isolate flex min-h-dvh w-full flex-col items-center justify-center overflow-x-hidden bg-background p-6 md:p-10">
            <AuthOrbs />

            <div className="relative z-10 flex w-full max-w-md flex-col">
                <header className="mb-8 flex flex-col items-center gap-4">
                    <Link
                        href={home()}
                        className="flex items-center gap-2.5 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
                        aria-label="MingleKE — go to homepage"
                    >
                        <AppLogo />
                    </Link>

                    <div className="flex flex-col items-center gap-1.5 text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-balance text-foreground">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-pretty text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                </header>

                <main className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
                    {children}
                </main>

                <footer className="mt-6 text-center text-xs text-muted-foreground">
                    By continuing, you agree to our{" "}
                    <Link
                        href="/terms"
                        className="font-medium text-foreground underline underline-offset-4 hover:text-brand-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                    >
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                        href="/privacy"
                        className="font-medium text-foreground underline underline-offset-4 hover:text-brand-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                    >
                        Privacy Policy
                    </Link>
                    .
                </footer>
            </div>
        </div>
    );
}

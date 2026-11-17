import { Link } from "@inertiajs/react";
import type { PropsWithChildren } from "react";
import AppLogo from "@/components/app-logo";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { home } from "@/routes";

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center bg-background font-sans text-foreground selection:bg-destructive selection:text-destructive-foreground antialiased transition-colors duration-300 p-6 md:p-10">
            {/* Decorative Blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-red/5 dark:bg-brand-red/10 blur-[120px]" />
                <div className="absolute bottom-0 -left-40 h-[500px] w-[500px] rounded-full bg-primary/5 dark:bg-primary/10 blur-[100px]" />
            </div>

            <div className="relative z-10 flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className="flex items-center justify-center self-center transition-opacity hover:opacity-80"
                >
                    <AppLogo className="h-12 w-auto sm:h-14" />
                </Link>

                <Card className="rounded-2xl border-none bg-card/95 shadow-[0_8px_40px_rgb(0,0,0,0.06)] dark:shadow-black/40 backdrop-blur-xl">
                    <CardHeader className="px-10 pt-8 pb-0 text-center">
                        <CardTitle className="text-xl font-extrabold tracking-tight">
                            {title}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            {description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-10 py-8">{children}</CardContent>
                </Card>
            </div>
        </div>
    );
}

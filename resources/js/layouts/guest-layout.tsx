// resources/js/layouts/guest/guest-layout.tsx
import { type ReactNode } from "react";
import { usePage } from "@inertiajs/react";
import GuestHeader from "./guest/guest-header";
import GuestFooter from "./guest/guest-footer";

type GuestLayoutProps = {
    children: ReactNode;
};

export default function GuestLayout({ children }: GuestLayoutProps) {
    const { auth } = usePage<{ auth?: { user?: { id: number } | null } }>()
        .props;

    return (
        <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
            <GuestHeader user={auth?.user ?? null} />
            <main className="flex-1">{children}</main>
            <GuestFooter />
        </div>
    );
}

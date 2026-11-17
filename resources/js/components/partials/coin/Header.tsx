// resources/js/components/coin/Header.tsx
import { History } from "lucide-react";
import { Link } from "@inertiajs/react";

export default function Header() {
    return (
        <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Get coins
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Top up your balance to keep chatting, unlock gifts and stand
                    out.
                </p>
            </div>

            <Link
                href="/coins/history"
                className="inline-flex w-max items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
                <History className="h-4 w-4" />
                Transaction history
            </Link>
        </header>
    );
}

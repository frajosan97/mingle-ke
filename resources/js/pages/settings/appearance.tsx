// resources/js/pages/settings/appearance.tsx
import { Head } from "@inertiajs/react";
import AppearanceTabs from "@/components/appearance-tabs";
import { edit as editAppearance } from "@/routes/appearance";

export default function Appearance() {
    return (
        <>
            <Head title="Appearance settings" />

            <div className="space-y-10 pb-8">
                {/* ── Header ─────────────────────────────── */}
                <header>
                    <h2 className="text-2xl font-bold text-foreground">
                        Appearance
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Update the look and feel of the app on this device.
                    </p>
                </header>
            </div>

            <div className="rounded-2xl border-0 bg-card/40">
                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [{ title: "Appearance settings", href: editAppearance() }],
};

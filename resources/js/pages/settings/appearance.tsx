// resources/js/pages/settings/appearance.tsx
import { Head } from "@inertiajs/react";
import AppearanceTabs from "@/components/appearance-tabs";
import { edit as editAppearance } from "@/routes/appearance";

export default function Appearance() {
    return (
        <>
            <Head title="Appearance settings" />

            <div className="space-y-10">
                {/* ── Header ──────────────────────────────────────── */}
                <div>
                    <h2 className="text-2xl font-bold text-foreground">
                        Appearance
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Update the look and feel of the app on this device.
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/40 p-3 mt-6 md:p-4">
                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [{ title: "Appearance settings", href: editAppearance() }],
};

// resources/js/pages/settings/appearance.tsx
import { Head } from "@inertiajs/react";
import AppearanceTabs from "@/components/appearance-tabs";
import { edit as editAppearance } from "@/routes/appearance";
import { PageHeader } from "@/components/page-header";

export default function Appearance() {
    return (
        <>
            <Head title="Appearance settings" />

            <div className="space-y-10 pb-8">
                <PageHeader
                    title="Appearance settings"
                    description="Customize the look and feel of your account."
                    backHref="/settings"
                />
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

// resources/js/app.tsx

import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initializeTheme } from "@/hooks/use-appearance";
import { configureEcho } from "@laravel/echo-react";
import AppLayout from "@/layouts/app-layout";
import AuthLayout from "@/layouts/auth-layout";
import SettingsLayout from "./layouts/settings/layout";

configureEcho({
    broadcaster: "reverb",
});

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

/**
 * Globals exposed on `window` for use inside hooks and non-React code paths.
 */
type AuthWindow = Window & {
    __authUserId?: number | null;
    __authUserName?: string | null;
    csrfToken?: string;
};

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),

    layout: (name) => {
        switch (true) {
            case name === "welcome":
                return null;

            case name.startsWith("auth/"):
                return AuthLayout;

            case name.startsWith("settings/"):
                return [AppLayout, SettingsLayout];

            default:
                return AppLayout;
        }
    },

    strictMode: true,

    setup({ el, App, props }) {
        if (!el) {
            throw new Error("Inertia root element was not found.");
        }

        const initialProps = props.initialPage.props as {
            auth?: {
                user?: { id: number; name: string } | null;
            };
            csrf_token?: string;
        };

        // Expose auth + CSRF globals in one place.
        const authWindow = window as AuthWindow;
        authWindow.__authUserId = initialProps.auth?.user?.id ?? null;
        authWindow.__authUserName = initialProps.auth?.user?.name ?? null;
        authWindow.csrfToken =
            initialProps.csrf_token ??
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content ??
            "";

        createRoot(el).render(
            <TooltipProvider delayDuration={0}>
                <App {...props} />
                <Toaster />
            </TooltipProvider>,
        );
    },

    // Brand pink progress bar
    progress: {
        color: "#ff2d75",
    },
});

initializeTheme();

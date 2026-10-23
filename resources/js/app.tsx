import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initializeTheme } from "@/hooks/use-appearance";
import { configureEcho } from "@laravel/echo-react";
import AppLayout from "@/layouts/app-layout";
import AuthLayout from "@/layouts/auth-layout";
import SettingsLayout from "./layouts/settings/layout";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

type AuthWindow = Window & {
    __authUserId?: number | null;
    __authUserName?: string | null;
    csrfToken?: string;
};

function initializeBrowserGlobals(props: {
    auth?: {
        user?: { id: number; name: string } | null;
    };
    csrf_token?: string;
}) {
    if (typeof window === "undefined") {
        return;
    }

    const authWindow = window as AuthWindow;

    authWindow.__authUserId = props.auth?.user?.id ?? null;
    authWindow.__authUserName = props.auth?.user?.name ?? null;

    authWindow.csrfToken =
        props.csrf_token ??
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ??
        "";
}

// Initialize browser-only functionality only in the browser.
if (typeof window !== "undefined") {
    configureEcho({
        broadcaster: "reverb",
    });

    initializeTheme();
}

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
        // This is the browser entry point. SSR must use a separate
        // entry file configured in vite.config.ts.
        if (typeof window === "undefined") {
            return;
        }

        if (!el) {
            console.error(
                "Inertia root element is missing. Check the Blade layout " +
                    "and ensure the SSR entry point is configured separately.",
            );
            return;
        }

        const initialProps = props.initialPage.props as {
            auth?: {
                user?: { id: number; name: string } | null;
            };
            csrf_token?: string;
        };

        initializeBrowserGlobals(initialProps);

        createRoot(el).render(
            <TooltipProvider delayDuration={0}>
                <App {...props} />
                <Toaster />
            </TooltipProvider>,
        );
    },

    progress: {
        color: "#ff2d75",
    },
});

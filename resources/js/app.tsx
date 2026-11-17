import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initializeTheme } from "@/hooks/use-appearance";
import { configureEcho } from "@laravel/echo-react";
import AppLayout from "@/layouts/app-layout";
import AuthLayout from "@/layouts/auth-layout";
import SettingsLayout from "@/layouts/settings/layout";
import GuestLayout from "@/layouts/guest-layout";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

const appLayoutPrefixes = ["escort/", "coin/", "conversations/", "dashboard"];

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
        if (name.startsWith("auth/")) {
            return AuthLayout;
        }
        
        if (name.startsWith("settings/")) {
            return [AppLayout, SettingsLayout];
        }

        if (appLayoutPrefixes.some((prefix) => name.startsWith(prefix))) {
            return AppLayout;
        }

        return GuestLayout;
    },

    strictMode: true,

    setup({ el, App, props }) {
        if (typeof window === "undefined") {
            return;
        }

        if (!el) {
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

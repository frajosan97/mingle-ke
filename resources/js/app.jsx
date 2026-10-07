// resources/js/app.jsx

// --------------------
// Polyfills / Globals (must come first)
// --------------------
import "./bootstrap";
import "./echo";

// --------------------
// Vendor Styles (CSS — order matters)
// --------------------
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// --------------------
// App Styles (must come AFTER vendor CSS to override)
// --------------------
import "../css/app.css";

// --------------------
// Vendor Scripts
// --------------------
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// --------------------
// React / Inertia
// --------------------
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

// --------------------
// App Providers
// --------------------
import { LocationProvider } from "@/Contexts/LocationContext";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
    console.warn(
        "[Auth] VITE_GOOGLE_CLIENT_ID is not set — Google sign-in will fail.",
    );
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx"),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Pull the authenticated user (and their stored coords) from
        // Inertia's shared props BEFORE the React tree mounts.
        // Requires HandleInertiaRequests to share auth.user with lat/lng.
        const user = props.initialPage.props.auth?.user ?? null;

        const profileCoords =
            user?.lat != null && user?.lng != null
                ? { lat: user.lat, lng: user.lng }
                : null;

        root.render(
            <GoogleOAuthProvider clientId={googleClientId}>
                <LocationProvider profileCoords={profileCoords}>
                    <App {...props} />
                </LocationProvider>
            </GoogleOAuthProvider>,
        );
    },
    progress: {
        color: "#4B5563",
    },
});

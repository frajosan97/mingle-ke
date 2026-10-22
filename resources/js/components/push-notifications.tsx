import { useState } from "react";

export default function PushNotifications() {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    async function enableNotifications() {
        if (loading) return;

        setLoading(true);
        setStatus("Enabling push notifications...");

        try {
            if (
                !("serviceWorker" in navigator) ||
                !("PushManager" in window) ||
                !("Notification" in window)
            ) {
                throw new Error(
                    "Push notifications are not supported by this browser.",
                );
            }

            const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

            if (!publicKey) {
                throw new Error(
                    "VITE_VAPID_PUBLIC_KEY is missing. Check your .env file and restart Vite.",
                );
            }

            console.info("[PUSH] Requesting notification permission.");

            const permission = await Notification.requestPermission();

            if (permission !== "granted") {
                throw new Error(
                    `Notification permission was ${permission}. Allow notifications in your browser settings.`,
                );
            }

            console.info("[PUSH] Registering service worker.");

            const registration =
                await navigator.serviceWorker.register("/sw.js");

            await navigator.serviceWorker.ready;

            console.info("[PUSH] Service worker ready.");

            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                console.info("[PUSH] Creating browser subscription.");

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: decodeVapidKey(publicKey),
                });
            } else {
                console.info("[PUSH] Reusing existing browser subscription.");
            }

            console.info("[PUSH] Saving subscription to Laravel.");

            const response = await fetch("/push-subscriptions", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN":
                        document.querySelector<HTMLMetaElement>(
                            'meta[name="csrf-token"]',
                        )?.content ?? "",
                },
                body: JSON.stringify(subscription),
            });

            const responseText = await response.text();

            let result: { message?: string; errors?: unknown };

            try {
                result = JSON.parse(responseText) as {
                    message?: string;
                    errors?: unknown;
                };
            } catch {
                result = { message: responseText };
            }

            if (!response.ok) {
                console.error("[PUSH] Laravel rejected subscription.", {
                    status: response.status,
                    response: result,
                });

                throw new Error(
                    `Laravel returned HTTP ${response.status}: ${
                        result.message || "Subscription could not be saved."
                    }`,
                );
            }

            console.info("[PUSH] Subscription saved successfully.", result);

            setStatus(
                result.message || "Push notifications enabled successfully.",
            );
        } catch (error) {
            console.error("[PUSH] Setup failed:", error);

            setStatus(
                error instanceof Error
                    ? error.message
                    : "Unable to enable push notifications.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={enableNotifications}
                disabled={loading}
                className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading ? "Enabling..." : "Enable push notifications"}
            </button>

            {status && (
                <p role="status" className="text-sm">
                    {status}
                </p>
            )}
        </div>
    );
}

function decodeVapidKey(key: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (key.length % 4)) % 4);
    const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/");

    const raw = window.atob(base64);
    const bytes = new Uint8Array(new ArrayBuffer(raw.length));

    for (let i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i);
    }

    return bytes;
}

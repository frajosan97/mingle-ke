import { useCallback, useEffect, useState } from "react";
import axios from "axios";

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(vapidPublicKey) {
    const [permission, setPermission] = useState(
        typeof Notification !== "undefined"
            ? Notification.permission
            : "default",
    );
    const [subscribed, setSubscribed] = useState(false);

    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;
        navigator.serviceWorker.register("/sw.js").catch(console.error);
    }, []);

    const subscribe = useCallback(async () => {
        if (!("serviceWorker" in navigator) || !("PushManager" in window))
            return false;

        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== "granted") return false;

        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
            sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
        }

        await axios.post("/push/subscribe", sub.toJSON());
        setSubscribed(true);
        return true;
    }, [vapidPublicKey]);

    const unsubscribe = useCallback(async () => {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
            await axios.delete("/push/unsubscribe", {
                data: { endpoint: sub.endpoint },
            });
            await sub.unsubscribe();
        }
        setSubscribed(false);
    }, []);

    useEffect(() => {
        (async () => {
            if (!("serviceWorker" in navigator)) return;
            const reg = await navigator.serviceWorker.ready.catch(() => null);
            if (!reg) return;
            const sub = await reg.pushManager.getSubscription();
            setSubscribed(!!sub);
        })();
    }, []);

    return { permission, subscribed, subscribe, unsubscribe };
}

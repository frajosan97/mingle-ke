self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
    event.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch {
        payload = { title: "New message", body: event.data.text() };
    }

    const title = payload.title || "New message";
    const options = {
        body: payload.body || "",
        icon: payload.icon || "/icons/icon-192.png",
        badge: "/icons/badge-72.png",
        tag: payload.tag,
        renotify: !!payload.tag,
        data: payload.data || {},
        vibrate: [100, 50, 100],
    };

    event.waitUntil(
        (async () => {
            // Foreground suppression: if a visible client exists, skip OS toast.
            const clients = await self.clients.matchAll({
                type: "window",
                includeUncontrolled: true,
            });
            const focused = clients.find(
                (c) => c.focused && c.visibilityState === "visible",
            );
            if (focused) {
                focused.postMessage({ type: "push-received", payload });
                return;
            }
            await self.registration.showNotification(title, options);
        })(),
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || "/conversations";

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clients) => {
                for (const client of clients) {
                    if ("focus" in client) {
                        client.focus();
                        if ("navigate" in client) client.navigate(targetUrl);
                        return;
                    }
                }
                if (self.clients.openWindow)
                    return self.clients.openWindow(targetUrl);
            }),
    );
});

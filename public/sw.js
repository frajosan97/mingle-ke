self.addEventListener("push", (event) => {
    let data = {};

    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = {
            body: event.data ? event.data.text() : "",
        };
    }

    const title = data.title || "PickSend";

    event.waitUntil(
        self.registration.showNotification(title, {
            body: data.body || "You have a new notification.",
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: {
                url: data.url || "/",
            },
        }),
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/";

    event.waitUntil(self.clients.openWindow(url));
});

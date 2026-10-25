// resources/js/lib/conversation/time.ts

/**
 * Canonical chat timestamp formatter.
 * Always 12-hour with AM/PM, matching the server's `H:i A` format.
 */
export function formatChatTime(
    iso?: string | null,
    opts: { hour12?: boolean } = {},
): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";

    return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: opts.hour12 ?? true,   // 👈 12-hour by default
    });
}

/** Convenience alias for a Date (used by optimistic send). */
export function formatChatTimeFromDate(
    date: Date,
    opts: { hour12?: boolean } = {},
): string {
    return formatChatTime(date.toISOString(), opts);
}

// resources/js/lib/conversation/time.ts
function capitalizeFirst(s: string): string {
    if (!s) return s;
    return s.charAt(0).toLocaleUpperCase() + s.slice(1);
}

export function formatDateDivider(iso?: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    if (d >= startOfToday) return "Today";
    if (d >= startOfYesterday) return "Yesterday";

    const diffDays = Math.floor(
        (startOfToday.getTime() - d.getTime()) / 86_400_000,
    );

    if (diffDays < 7) {
        return capitalizeFirst(
            d.toLocaleDateString([], { weekday: "long" }),
        );
    }

    return capitalizeFirst(
        d.toLocaleDateString([], {
            day: "numeric",
            month: "long",
            year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
        }),
    );
}
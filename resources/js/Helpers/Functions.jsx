// resources/js/Helpers/Functions.jsx
import { format, isToday, isYesterday, isThisWeek, isValid } from "date-fns";

/* ─────────────────────────────────────────────
 |  Date parsing
 * ───────────────────────────────────────────── */

/** Safe Date parser — returns null for anything invalid. */
export function parseDate(d) {
    if (!d) return null;
    const date = d instanceof Date ? d : new Date(d);
    return isValid(date) ? date : null;
}

/* ─────────────────────────────────────────────
 |  Formatting
 * ───────────────────────────────────────────── */

/**
 * Conversation list timestamp.
 *   today    → "3:45 PM"
 *   yesterday → "Yesterday"
 *   this week → "Tue"
 *   older     → "10/05/2026"
 */
export function formatConvoTime(d) {
    const date = parseDate(d);
    if (!date) return "";
    if (isToday(date)) return format(date, "p");
    if (isYesterday(date)) return "Yesterday";
    if (isThisWeek(date, { weekStartsOn: 1 })) return format(date, "EEE");
    return format(date, "P");
}

/**
 * Message bubble timestamp.
 * Always "3:45 PM" — day is conveyed by the day-divider badge.
 */
export function formatMessageTime(d) {
    const date = parseDate(d);
    if (!date) return "";
    return format(date, "p");
}

/**
 * Day separator label used in the message thread.
 *   today     → "Today"
 *   yesterday → "Yesterday"
 *   older     → "October 5, 2026"
 */
export function formatDayLabel(d) {
    const date = parseDate(d);
    if (!date) return "";
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "PP");
}

/**
 * "Last seen" text for the presence indicator.
 *   today      → "last seen 11:54 AM"
 *   yesterday  → "last seen yesterday, 11:54 AM"
 *   this week  → "last seen Monday, 11:54 AM"
 *   older      → "last seen Oct 5, 11:54 AM"
 *   no date    → "offline"
 */
export function formatLastSeen(d) {
    const date = parseDate(d);
    if (!date) return "offline";

    const time = format(date, "p"); // 11:54 AM

    if (isToday(date)) {
        return `last seen ${time}`;
    }

    if (isYesterday(date)) {
        return `last seen yesterday, ${time}`;
    }

    if (isThisWeek(date, { weekStartsOn: 1 })) {
        return `last seen ${format(date, "EEEE")}, ${time}`; // Monday, 11:54 AM
    }

    return `last seen ${format(date, "MMM d")}, ${time}`; // Oct 5, 11:54 AM
}

/* ─────────────────────────────────────────────
 |  Presence
 * ───────────────────────────────────────────── */

/**
 * Is a user online?
 *
 * Priority:
 *   1. Explicit `presenceEntry.isOnline` flag (live broadcast state)
 *   2. Freshness of `lastActiveAt` / `lastActiveAt` fallback within 2 minutes
 *
 * The 2-minute threshold matches the backend `ONLINE_TTL` (60s) plus a
 * margin for reaper cadence (60s). If the peer's clock is skewed or the
 * event was missed, we still catch it via the freshness check.
 */
export function isOnline(lastActiveAt, presenceEntry) {
    if (presenceEntry?.isOnline) return true;

    const ts = presenceEntry?.lastActiveAt ?? lastActiveAt;
    const date = parseDate(ts);
    if (!date) return false;

    return date.getTime() > Date.now() - 2 * 60 * 1000;
}

/* ─────────────────────────────────────────────
 |  Distance
 * ───────────────────────────────────────────── */

const METERS_PER_MILE = 1609.344;

/**
 * Detect the user's preferred unit system from the browser locale.
 * US, Liberia and Myanmar → imperial; everyone else → metric.
 */
export function getUnitSystem() {
    if (typeof navigator === "undefined") return "metric";
    const locale = navigator.language || "en";
    const region = locale.split("-")[1]?.toUpperCase();
    return ["US", "LR", "MM"].includes(region) ? "imperial" : "metric";
}

/**
 * Human-friendly distance.
 *
 * @param {number|null|undefined} km
 *   Distance in kilometers (as delivered by the backend).
 * @param {object} [options]
 * @param {"metric"|"imperial"|"auto"} [options.unit="auto"]
 *   Which unit family to render in. "auto" uses the browser locale.
 * @param {boolean} [options.compact=true]
 *   When true, prefers the shortest readable form.
 *
 * @returns {string|null} Formatted distance, or null when the input
 *   is missing / non-finite / negative (caller should skip rendering).
 */
export function formatDistance(km, options = {}) {
    const { unit = "auto", compact = true } = options;

    const n = Number(km);
    if (!Number.isFinite(n) || n < 0) return null;

    const system = unit === "auto" ? getUnitSystem() : unit;

    if (system === "imperial") {
        const miles = n / (METERS_PER_MILE / 1000); // km → mi

        if (miles < 0.1) return "< 0.1 mi";
        if (miles < 1) return `${miles.toFixed(1)} mi`;
        if (miles < 10) return `${miles.toFixed(1)} mi`;
        if (miles < 100) return `${Math.round(miles)} mi`;
        return `${Math.round(miles)} mi`;
    }

    // ── metric ──
    const meters = n * 1000;

    if (meters < 10) return "< 10 m";
    if (meters < 1000) {
        const rounded = Math.round(meters / 10) * 10;
        return `${rounded} m`;
    }
    if (!compact) return `${n.toFixed(2)} km`;
    if (n < 10) return `${n.toFixed(1)} km`;
    if (n < 100) return `${Math.round(n)} km`;
    return `${Math.round(n)} km`;
}

/* ─────────────────────────────────────────────
 |  Avatar
 * ───────────────────────────────────────────── */

/**
 * Get a user's avatar URL with a reliable fallback.
 *
 * Resolution order:
 *   1. Explicit avatar URL on the user object
 *   2. Nested avatar (e.g. `user.avatar_url`, `user.profile.avatar`)
 *   3. Generated initials avatar via ui-avatars.com
 *
 * @param {object|string|null} user - User object, or a raw name string
 * @param {object} [options]
 * @param {number} [options.size=128] - Pixel size for the fallback avatar
 * @param {string} [options.background='random'] - Fallback bg color (hex without #, or 'random')
 * @param {string} [options.color='fff'] - Fallback text color (hex without #)
 * @param {string} [options.fallbackName='User'] - Name to use if none can be derived
 * @returns {string} Avatar URL (never empty — always returns a usable string)
 */
export function getUserAvatar(user, options = {}) {
    const {
        size = 128,
        background = "random",
        color = "fff",
        fallbackName = "User",
    } = options;

    // Allow passing a bare string as the name
    const rawName =
        typeof user === "string"
            ? user
            : (user?.name ?? user?.full_name ?? user?.username ?? fallbackName);

    // Try every plausible avatar field before falling back
    const explicitAvatar =
        (typeof user === "object" && user !== null
            ? (user.avatar ?? null)
            : null) || null;

    if (explicitAvatar) return explicitAvatar;

    // Fallback: generated initials avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        rawName,
    )}&background=${background}&color=${color}&size=${size}`;
}

/* ─────────────────────────────────────────────
 |  Conversation normalizer
 * ───────────────────────────────────────────── */

/**
 * Normalize a raw conversation payload into the UI shape.
 *
 * Handles both Inertia and API payloads:
 *   - `other_user` present at the top level
 *   - `other_user` nested under `raw`
 *   - only `user_one` / `user_two` present (derives the peer)
 *
 * @param {object} c
 * @param {number} [currentUserId]
 */
export function normalizeConversation(c, currentUserId = null) {
    if (!c) return null;

    // 1. Server-provided other_user (preferred — most direct).
    let other = c.other_user ?? c.otherUser ?? c.raw?.other_user;

    // 2. Derive from user_one / user_two using the current user id.
    if (!other && currentUserId && c.user_one && c.user_two) {
        other = c.user_one.id === currentUserId ? c.user_two : c.user_one;
    }

    // 3. Absolute last resort — pick user_one so the row at least renders.
    if (!other && c.user_one && c.user_two) {
        other = c.user_one;
    }

    const latest = c.latest_message ?? c.latestMessage ?? null;

    const name = other?.name ?? c.name ?? "Unknown";
    const avatar = getUserAvatar(other ?? { name }, { fallbackName: name });

    // ── Tick state for the last message ──
    // Only meaningful when the last message was sent by me.
    const lastMessageOwn =
        !!latest && !!currentUserId && latest.sender_id === currentUserId;

    let lastMessageStatus = null;

    if (lastMessageOwn) {
        if (latest.is_read_by_peer) {
            lastMessageStatus = "read";
        } else if (latest.delivered_at) {
            lastMessageStatus = "delivered";
        } else {
            lastMessageStatus = "sent";
        }
    }

    const unreadCount = c.unread_count ?? c.unreadCount ?? 0;

    return {
        id: c.id,

        // ── Peer identity ──
        name,
        avatar,
        otherUserId: other?.id ?? null,
        isOnline: other?.is_online ?? false,
        lastActiveAt: other?.last_active_at ?? null,

        // ── Last message ──
        preview:
            c.last_message_preview ??
            latest?.body ??
            (latest?.attachment ? "[attachment]" : ""),
        time: c.last_message_at ?? latest?.created_at ?? null,
        lastMessageType: latest?.type ?? "text",
        lastMessageSenderId: latest?.sender_id ?? null,

        // ── Tick metadata ──
        lastMessageOwn,
        lastMessageStatus,

        // ── Inbox state ──
        unreadCount,
        read: unreadCount === 0,
        isMuted: !!c.is_muted,
        isArchived: !!c.is_archived,

        // ── Raw payload (for consumers that need it) ──
        raw: c,
    };
}

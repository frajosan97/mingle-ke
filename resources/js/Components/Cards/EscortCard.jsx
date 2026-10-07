// resources/js/Components/Escort/EscortCard.jsx
import { Link, router } from "@inertiajs/react";
import { Card, Badge } from "react-bootstrap";
import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";

import {
    getUserAvatar,
    isOnline,
    formatLastSeen,
    formatDistance,
} from "@/Helpers/Functions";

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay, ease: "easeOut" },
    }),
};

const EscortCard = ({ e, delay = 0, unit = "auto" }) => {
    const hasProfile = !!e.profile;
    const isPremium = e.tier === "premium";
    const [starting, setStarting] = useState(false);

    // ── Avatar: single source of truth ──
    const avatarSrc = getUserAvatar(e, { fallbackName: e?.name ?? "User" });

    // ── Distance: locale-aware (metric / imperial) ──
    const distLabel = formatDistance(e.distance_km, { unit });

    // ── Area: prefer user.area, fall back to profile.area ──
    const areaLabel = e.area ?? e.profile?.area ?? null;

    // ── Presence: prefer a broadcast presence entry, else flat fields ──
    const presenceEntry = e.presence ?? e.presenceEntry ?? null;
    const lastActiveAt = e.last_active_at ?? e.lastActiveAt ?? null;
    const online = isOnline(lastActiveAt, presenceEntry);

    const presenceTitle = online ? "Online now" : formatLastSeen(lastActiveAt);

    const startChat = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        if (starting) return;
        setStarting(true);

        const loadingToast = toast.loading("Opening conversation…");

        router.post(
            route("conversations.store"),
            { user_id: e.id },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Conversation ready", { id: loadingToast });
                },
                onError: (errors) => {
                    toast.error(
                        errors.user_id || "Could not start conversation.",
                        { id: loadingToast },
                    );
                },
                onFinish: () => setStarting(false),
            },
        );
    };

    return (
        <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            custom={delay}
            className="h-100"
        >
            <Card
                as={Link}
                href={`/profile/${e.id}`}
                className="escort-card border-0 text-decoration-none h-100 d-flex flex-column"
            >
                <div className="escort-photo">
                    <Card.Img
                        src={avatarSrc}
                        alt={e.name}
                        loading="lazy"
                        onError={(ev) => {
                            // Last-resort: deterministic initials avatar
                            ev.currentTarget.src = getUserAvatar(
                                { name: e.name ?? "User" },
                                { fallbackName: "User", size: 500 },
                            );
                        }}
                    />
                    <div className="card-shine"></div>

                    {hasProfile && (
                        <Badge className={`tier-badge tier-${e.tier}`} bg="">
                            <i
                                className={`bi ${
                                    isPremium ? "bi-crown-fill" : "bi-star-fill"
                                } me-1`}
                            ></i>
                            {isPremium ? "PREMIUM" : "REGULAR"}
                        </Badge>
                    )}

                    {online && (
                        <span
                            className="online-dot"
                            title={presenceTitle}
                            aria-label={presenceTitle}
                        />
                    )}

                    {e.profile?.verified && (
                        <span className="verified-badge" title="Verified">
                            <i className="bi bi-patch-check-fill"></i>
                        </span>
                    )}

                    {e.profile?.rating != null && (
                        <div className="rating-chip">
                            <i className="bi bi-star-fill"></i>{" "}
                            {Number(e.profile.rating).toFixed(1)}
                        </div>
                    )}

                    <div className="photo-overlay">
                        <button
                            type="button"
                            className="chat-cta"
                            onClick={startChat}
                            disabled={starting}
                        >
                            <i className="bi bi-chat-fill me-1"></i>
                            {starting ? "Opening…" : "Chat · 5 coins"}
                        </button>
                    </div>
                </div>

                <Card.Body className="escort-info d-flex flex-column flex-grow-1">
                    <div className="escort-name text-truncate">
                        {e.name}
                        {e.age ? `, ${e.age}` : ""}
                    </div>

                    <div className="escort-dist">
                        {distLabel && (
                            <>
                                <i className="bi bi-geo-alt-fill"></i>{" "}
                                {distLabel}
                                {areaLabel ? " · " : ""}
                            </>
                        )}
                        {areaLabel && (
                            <>
                                {!distLabel && (
                                    <i className="bi bi-geo-alt-fill"></i>
                                )}{" "}
                                {areaLabel}
                            </>
                        )}
                        {!distLabel && !areaLabel && (
                            <span className="text-muted">
                                <i className="bi bi-geo-alt"></i> Location
                                unavailable
                            </span>
                        )}
                    </div>

                    {hasProfile && e.profile?.bio && (
                        <div className="escort-bio text-truncate mt-1 text-muted small">
                            {e.profile.bio}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </motion.div>
    );
};

export default EscortCard;

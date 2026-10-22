// resources/js/components/discover/swipe-card.tsx
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { MapPin, BadgeCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Profile {
    id: number;
    name: string;
    age: number | null;
    gender: "male" | "female" | "other" | null;
    bio: string | null;
    avatarUrl: string | null;
    distanceKm: number;
    isEscort: boolean;
    services: string[];
    available: boolean;
    availabilityStatus: "online" | "offline" | "busy" | "incall" | "outcall";
    rate1Hour: number | null;
    ratingAvg: number;
    verified: boolean;
    online: boolean;
}

interface SwipeCardProps {
    profile: Profile;
    onSwipe: (direction: "left" | "right") => void;
    isTop: boolean;
}

const SWIPE_THRESHOLD = 120;

export default function SwipeCard({ profile, onSwipe, isTop }: SwipeCardProps) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
    const likeOpacity = useTransform(x, [0, 150], [0, 1]);
    const nopeOpacity = useTransform(x, [0, -150], [1, 0]);

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        if (info.offset.x > SWIPE_THRESHOLD) onSwipe("right");
        else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe("left");
    };

    const availabilityLabel = profile.available
        ? profile.availabilityStatus.charAt(0).toUpperCase() +
          profile.availabilityStatus.slice(1)
        : "Offline";

    return (
        <motion.div
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            style={{ x, rotate }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 12 }}
            animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 12 }}
        >
            <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg">
                {/* ── Media area ─────────────────────────────────── */}
                <div className="relative h-[62%] w-full bg-muted">
                    {profile.avatarUrl ? (
                        <img
                            src={profile.avatarUrl}
                            alt={profile.name}
                            className="h-full w-full object-cover"
                            draggable={false}
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-brand-soft text-6xl font-light text-brand-pink/60">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                    )}

                    {/* Availability pill — escorts only */}
                    {profile.isEscort && (
                        <span
                            className={cn(
                                "absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm",
                                profile.available
                                    ? "bg-brand-green shadow-sm"
                                    : "bg-muted-foreground/70",
                            )}
                        >
                            {availabilityLabel}
                        </span>
                    )}

                    {/* Online indicator — everyone */}
                    {profile.online && !profile.isEscort && (
                        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white backdrop-blur-sm">
                            <span className="h-2 w-2 rounded-full bg-brand-green" />
                            Online
                        </span>
                    )}

                    {/* Distance */}
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-0.5 text-xs text-white backdrop-blur-sm">
                        <MapPin className="h-3 w-3" />
                        {profile.distanceKm} km
                    </span>

                    {/* Swipe overlays */}
                    {isTop && (
                        <>
                            <motion.div
                                className="absolute left-4 top-1/2 -translate-y-1/2 rotate-[-15deg] rounded-lg border-4 border-brand-green bg-brand-green/10 px-3 py-1 text-2xl font-bold text-brand-green"
                                style={{ opacity: likeOpacity }}
                            >
                                LIKE
                            </motion.div>
                            <motion.div
                                className="absolute right-4 top-1/2 -translate-y-1/2 rotate-[15deg] rounded-lg border-4 border-destructive bg-destructive/10 px-3 py-1 text-2xl font-bold text-destructive"
                                style={{ opacity: nopeOpacity }}
                            >
                                NOPE
                            </motion.div>
                        </>
                    )}
                </div>

                {/* ── Info area ──────────────────────────────────── */}
                <div className="flex h-[38%] flex-col justify-between gap-2 p-4">
                    <div className="min-h-0">
                        <div className="flex items-center gap-2">
                            <h2 className="truncate text-xl font-semibold text-foreground">
                                {profile.name}
                                {profile.age !== null && (
                                    <span className="font-normal text-muted-foreground">
                                        , {profile.age}
                                    </span>
                                )}
                            </h2>
                            {profile.verified && (
                                <BadgeCheck className="h-4 w-4 shrink-0 text-brand-pink" />
                            )}
                        </div>

                        {profile.isEscort && (
                            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                                {profile.ratingAvg > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Star className="h-3.5 w-3.5 fill-brand-gold text-brand-gold" />
                                        {profile.ratingAvg.toFixed(1)}
                                    </span>
                                )}
                                {profile.rate1Hour && (
                                    <span className="font-semibold text-foreground">
                                        ${(profile.rate1Hour / 100).toFixed(0)}
                                        /hr
                                    </span>
                                )}
                            </div>
                        )}

                        {profile.bio && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {profile.bio}
                            </p>
                        )}
                    </div>

                    {profile.isEscort && profile.services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {profile.services.slice(0, 4).map((s) => (
                                <span
                                    key={s}
                                    className="rounded-full bg-gradient-brand-soft px-2.5 py-1 text-xs font-medium text-brand-pink"
                                >
                                    {s}
                                </span>
                            ))}
                            {profile.services.length > 4 && (
                                <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                    +{profile.services.length - 4}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

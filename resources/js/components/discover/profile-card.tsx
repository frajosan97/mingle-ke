import {
    Star,
    MapPin,
    BadgeCheck,
    Heart,
    MessageSquare,
    Eye,
} from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { useState } from "react";

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
    locationName?: string;
    isVip?: boolean;
}

interface AuthUser {
    id: number;
    name: string;
    avatar_url?: string | null;
}

interface ProfileCardProps {
    profile: Profile;
    onClick?: (profile: Profile) => void;
}

export default function ProfileCard({ profile, onClick }: ProfileCardProps) {
    const { auth } = usePage<{ auth: { user: AuthUser | null } }>().props;
    const isLoggedIn = !!auth?.user;

    // If the stored avatar file is missing/broken, fall back to the initial.
    const [avatarFailed, setAvatarFailed] = useState(false);
    const showAvatar = Boolean(profile.avatarUrl) && !avatarFailed;

    const handleCardClick = () => {
        if (onClick) {
            onClick(profile);
        } else {
            router.post(`/discover/${profile.id}/like`);
        }
    };

    const handleAction = (
        e: React.MouseEvent,
        action: "like" | "chat" | "view",
    ) => {
        e.stopPropagation();

        if (action !== "view" && !isLoggedIn) {
            router.visit("/login");
            return;
        }

        switch (action) {
            case "like":
                router.post(`/discover/${profile.id}/like`);
                break;
            case "chat":
                router.post(`/discover/${profile.id}/like`);
                break;
            case "view":
                router.visit(`/escorts/${profile.id}`);
                break;
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className="group relative flex aspect-[3/4] w-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-muted shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-pink/20"
        >
            {/* Background Image */}
            {showAvatar ? (
                <img
                    src={profile.avatarUrl!}
                    alt={profile.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    onError={() => setAvatarFailed(true)}
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-brand-soft text-5xl font-light text-brand-pink/60">
                    {profile.name.charAt(0).toUpperCase()}
                </div>
            )}

            {/* Gradient Overlay for Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Top Badges */}
            <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3">
                {profile.isVip || profile.isEscort ? (
                    <span className="flex items-center gap-1 rounded-md bg-brand-gold px-2 py-0.5 text-[10px] font-bold tracking-wide text-black shadow-sm backdrop-blur-sm">
                        <Star className="h-3 w-3 fill-black" />
                        VIP
                    </span>
                ) : (
                    <div />
                )}

                {profile.verified && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                        <BadgeCheck className="h-5 w-5 fill-blue-500 text-white" />
                    </div>
                )}
            </div>

            {/* Bottom Info Area */}
            <div className="relative z-10 mt-auto w-full p-3 text-white">
                <div className="flex items-end justify-between">
                    <h3 className="truncate text-base font-bold leading-tight">
                        {profile.name}
                        {profile.age !== null && `, ${profile.age}`}
                    </h3>
                    {profile.ratingAvg > 0 && (
                        <div className="flex items-center gap-1 text-sm font-semibold">
                            <Star className="h-3.5 w-3.5 fill-white text-white" />
                            <span>{profile.ratingAvg}</span>
                        </div>
                    )}
                </div>

                <div className="mt-1 flex items-center gap-1 text-xs font-medium text-white/80">
                    <MapPin className="h-3 w-3" />
                    <span>
                        {profile.distanceKm}km
                        {profile.locationName && ` • ${profile.locationName}`}
                    </span>
                </div>

                {/* ── HOVER ACTION BAR (ICONS ONLY) ────────────────────────── */}
                <div className="mt-3 grid grid-rows-[0fr] opacity-0 transition-all duration-300 ease-out group-hover:grid-rows-[1fr] group-hover:opacity-100">
                    <div className="overflow-hidden">
                        <div className="mt-1 flex items-center justify-center gap-2">
                            <button
                                onClick={(e) => handleAction(e, "view")}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white hover:text-black active:scale-95"
                                title="View Profile"
                            >
                                <Eye className="h-4 w-4" />
                            </button>

                            {isLoggedIn && (
                                <>
                                    <button
                                        onClick={(e) => handleAction(e, "like")}
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-brand-pink hover:text-white active:scale-95"
                                        title="Like"
                                    >
                                        <Heart className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={(e) => handleAction(e, "chat")}
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-brand-blue-1 hover:text-white active:scale-95"
                                        title="Chat"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

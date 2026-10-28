import {
    Star,
    MapPin,
    BadgeCheck,
    Heart,
    MessageSquare,
    Eye,
    ArrowUpRight,
} from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { useState } from "react";
import { useLike } from "@/hooks/use-like";
import { useStartChat } from "@/hooks/use-start-chat";

export type AvailabilityStatus =
    | "online"
    | "offline"
    | "busy"
    | "incall"
    | "outcall";

export interface Profile {
    id: number;
    name: string;
    age: number | null;
    gender: "male" | "female" | "other" | null;
    bio: string | null;
    avatarUrl: string;
    distanceKm: number;
    locationName?: string;
    isEscort: boolean;
    isVip?: boolean;
    services: string[];
    available: boolean;
    availabilityStatus: AvailabilityStatus;
    rate1Hour: number | null;
    ratingAvg: number;
    verified: boolean;
    online: boolean;
    isLiked: boolean;
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

const AVAILABILITY_META: Record<
    AvailabilityStatus,
    { label: string; dot: string; bg: string; text: string }
> = {
    online: {
        label: "Online now",
        dot: "bg-green-400",
        bg: "bg-black/60",
        text: "text-white",
    },
    incall: {
        label: "Incall",
        dot: "bg-brand-pink",
        bg: "bg-black/60",
        text: "text-white",
    },
    outcall: {
        label: "Outcall",
        dot: "bg-brand-blue-1",
        bg: "bg-black/60",
        text: "text-white",
    },
    busy: {
        label: "Busy",
        dot: "bg-amber-400",
        bg: "bg-black/60",
        text: "text-white/90",
    },
    offline: {
        label: "Offline",
        dot: "bg-gray-400",
        bg: "bg-black/50",
        text: "text-white/70",
    },
};

export default function ProfileCard({ profile, onClick }: ProfileCardProps) {
    const { auth } = usePage<{ auth: { user: AuthUser | null } }>().props;
    const isLoggedIn = !!auth?.user;

    const [avatarFailed, setAvatarFailed] = useState(false);

    // Custom Hooks
    const { isLiked, isLiking, like } = useLike(profile.id, profile.isLiked);
    const { startChat } = useStartChat();

    const showAvatar = Boolean(profile.avatarUrl) && !avatarFailed;
    const availability = AVAILABILITY_META[profile.availabilityStatus];

    const handleCardClick = () => {
        if (onClick) {
            onClick(profile);
        } else if (profile.isEscort) {
            router.visit(`/escorts/${profile.id}`);
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
                like(e);
                break;
            case "chat":
                startChat(profile.id);
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
            {showAvatar ? (
                <img
                    src={profile.avatarUrl}
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

            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3">
                <div className="flex flex-col gap-1.5">
                    {profile.isVip && (
                        <span className="flex items-center gap-1 rounded-md bg-brand-gold px-2 py-0.5 text-[10px] font-bold tracking-wide text-black shadow-sm backdrop-blur-sm">
                            <Star className="h-3 w-3 fill-black" />
                            VIP
                        </span>
                    )}

                    {profile.isEscort && (
                        <span
                            className={`inline-flex items-center gap-1 rounded-md ${availability.bg} px-2 py-0.5 text-[10px] font-semibold ${availability.text} backdrop-blur-sm`}
                        >
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${availability.dot}`}
                            />
                            {availability.label}
                        </span>
                    )}

                    {profile.isEscort && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.visit(`/escorts/${profile.id}`);
                            }}
                            className="inline-flex w-fit items-center gap-1 rounded-md bg-brand-pink/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm transition hover:bg-brand-pink active:scale-95"
                            title="View escort listing"
                        >
                            Escort
                            <ArrowUpRight className="h-2.5 w-2.5" />
                        </button>
                    )}
                </div>

                {profile.verified && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                        <BadgeCheck className="h-5 w-5 fill-blue-500 text-white" />
                    </div>
                )}
            </div>

            <div className="relative z-10 mt-auto w-full p-3 text-white">
                <div className="flex items-end justify-between gap-2">
                    <h3 className="truncate text-base font-bold leading-tight">
                        {profile.name}
                        {profile.age !== null && `, ${profile.age}`}
                    </h3>
                    {profile.ratingAvg > 0 && (
                        <div className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                            <Star className="h-3.5 w-3.5 fill-white text-white" />
                            <span>{profile.ratingAvg.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                <div className="mt-1 flex items-center gap-1 text-xs font-medium text-white/80">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                        {profile.distanceKm > 0 && `${profile.distanceKm}km`}
                        {profile.distanceKm > 0 &&
                            profile.locationName &&
                            " • "}
                        {profile.locationName}
                    </span>
                </div>

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
                                        disabled={isLiked || isLiking}
                                        className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 active:scale-95 ${
                                            isLiked
                                                ? "bg-brand-pink text-white"
                                                : "bg-white/15 text-white hover:scale-110 hover:bg-brand-pink hover:text-white"
                                        }`}
                                        title={isLiked ? "Liked" : "Like"}
                                    >
                                        <Heart
                                            className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
                                        />
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

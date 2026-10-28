import { useState } from "react";
import { router, usePage } from "@inertiajs/react";

interface PageProps {
    auth: { user: any | null };
    csrf_token: string;
    [key: string]: any;
}

export function useLike(profileId: number, initialLiked: boolean) {
    const { auth, csrf_token } = usePage<PageProps>().props;
    const [isLiked, setIsLiked] = useState(initialLiked);
    const [isLiking, setIsLiking] = useState(false);

    const like = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        if (!auth?.user) {
            router.visit("/login");
            return;
        }

        if (isLiked || isLiking) return;

        // 1. Optimistic Update
        setIsLiked(true);
        setIsLiking(true);

        try {
            // 2. Native Fetch to bypass Inertia routing
            const res = await fetch(`/escorts/${profileId}/like`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-CSRF-TOKEN": csrf_token,
                },
            });

            if (!res.ok) throw new Error("Failed to like");
        } catch (error) {
            // 3. Revert on failure
            setIsLiked(false);
            console.error(error);
        } finally {
            setIsLiking(false);
        }
    };

    return { isLiked, isLiking, like };
}
import { router, usePage } from "@inertiajs/react";

interface PageProps {
    auth: { user: { id: number } | null };
    [key: string]: any;
}

export function useStartChat() {
    const { auth } = usePage<PageProps>().props;

    const startChat = (targetUserId: number) => {
        // 1. Ensure user is logged in
        if (!auth?.user) {
            router.visit("/login");
            return;
        }

        // 2. Prevent users from messaging themselves
        if (auth.user.id === targetUserId) {
            return;
        }

        // 3. Navigate to the chat route.
        router.visit(`/messages/new?to=${targetUserId}`);
    };

    return { startChat };
}
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
            // Handle the case where the user tries to message themselves
            return;
        }

        // 3. Navigate to the chat route.
        // Adjust this URL to match your actual Laravel route for starting a conversation.
        // Usually, this is a GET route that finds or creates the conversation and redirects to it.
        router.visit(`/messages/new?to=${targetUserId}`);
    };

    return { startChat };
}
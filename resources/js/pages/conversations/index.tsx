// resources/js/pages/conversations/index.tsx
import { Head } from "@inertiajs/react";
import ConversationEmpty from "@/components/conversation/conversation-empty";

export default function ConversationsIndex() {
    return (
        <>
            <Head title="Conversations" />
            <ConversationEmpty />
        </>
    );
}

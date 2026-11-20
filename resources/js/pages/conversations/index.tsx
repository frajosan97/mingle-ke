// resources/js/pages/conversations/index.tsx
import { Head, Link } from "@inertiajs/react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck } from "lucide-react";

export default function ConversationsIndex() {
    return (
        <>
            <Head title="Conversations" />

            <div className="relative flex h-full flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
                <EmptyState
                    title="No conversations yet"
                    description="When you connect with an escort, your chats will appear here."
                    action={
                        <div className="flex flex-col items-center gap-3 sm:flex-row">
                            <Button asChild>
                                <Link href="/escorts">
                                    <Search className="mr-2 h-4 w-4" />
                                    Browse Escorts
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/bookings">
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    My Bookings
                                </Link>
                            </Button>
                        </div>
                    }
                />
            </div>
        </>
    );
}

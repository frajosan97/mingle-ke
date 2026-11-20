// resources/js/pages/settings/index.tsx
import { Head, Link } from "@inertiajs/react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { UserCog, Sparkles } from "lucide-react";

export default function SettingsIndex() {
    return (
        <>
            <Head title="Settings" />
            <div className="relative flex h-full flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
                <EmptyState
                    title="Set up your account"
                    description="Edit your profile or become an escort to unlock more features."
                    action={
                        <div className="flex flex-col items-center gap-3 sm:flex-row">
                            <Button asChild>
                                <Link href="/settings/profile">
                                    <UserCog className="mr-2 h-4 w-4" />
                                    Edit Profile
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/escorts/manage">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Become an Escort
                                </Link>
                            </Button>
                        </div>
                    }
                />
            </div>
        </>
    );
}

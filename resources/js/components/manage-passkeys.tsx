// resources/js/components/manage-passkeys.tsx
import { router } from "@inertiajs/react";
import { KeyRound } from "lucide-react";
import { destroy } from "@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController";
import PasskeyItem from "@/components/passkey-item";
import PasskeyRegistration from "@/components/passkey-register";
import type { Passkey } from "@/types/auth";

export type Props = {
    canManagePasskeys?: boolean;
    passkeys?: Passkey[];
};

const EmptyState = () => {
    return (
        <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand-soft ring-1 ring-border/50">
                <KeyRound className="h-7 w-7 text-brand-pink" />
            </div>
            <p className="text-sm font-semibold text-foreground">
                No passkeys yet
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Add a passkey to sign in without entering a password — faster,
                safer, and phishing-resistant.
            </p>
        </div>
    );
};

export default function ManagePasskeys(props: Props) {
    const passkeys = props.passkeys ?? [];

    const handleDelete = (id: number, onError: () => void) => {
        router.delete(destroy.url(id), {
            preserveScroll: true,
            onError,
        });
    };

    const handleRegisterSuccess = () => {
        router.reload();
    };

    if (!(props.canManagePasskeys ?? false)) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Modern Header */}
            <div>
                <h3 className="text-lg font-bold text-foreground">Passkeys</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage your passkeys for passwordless sign-in.
                </p>
            </div>

            {/* List Card */}
            <div className="overflow-hidden rounded-xl border border-border bg-card/40">
                {passkeys.length > 0 ? (
                    <div className="divide-y divide-border">
                        {passkeys.map((passkey) => (
                            <PasskeyItem
                                key={passkey.id}
                                passkey={passkey}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState />
                )}
            </div>

            {/* Add New Passkey */}
            <div className="pt-1">
                <PasskeyRegistration onSuccess={handleRegisterSuccess} />
            </div>
        </div>
    );
}

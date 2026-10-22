// resources/js/components/passkey-item.tsx
import { KeyRound, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import type { Passkey } from "@/types/auth";

type Props = {
    passkey: Passkey;
    onDelete: (id: number, onError: () => void) => void;
};

export default function PasskeyItem({ passkey, onDelete }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        onDelete(passkey.id, () => setIsDeleting(false));
    };

    return (
        <div className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-accent/30">
            <div className="flex items-center gap-4">
                {/* Icon Badge — Branded soft pink instead of plain muted */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-pink/10 ring-1 ring-brand-pink/20">
                    <KeyRound className="h-5 w-5 text-brand-pink" />
                </div>

                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                            {passkey.name}
                        </p>
                        {passkey.authenticator && (
                            <span className="inline-flex items-center rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground ring-1 ring-border/50 ring-inset">
                                {passkey.authenticator}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Added {passkey.created_at_diff}
                        {passkey.last_used_at_diff && (
                            <>
                                <span className="mx-1.5 text-muted-foreground/40">
                                    ·
                                </span>
                                Last used {passkey.last_used_at_diff}
                            </>
                        )}
                    </p>
                </div>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 shrink-0 rounded-full p-0 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove passkey</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>Remove passkey?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to remove the{" "}
                        <strong>"{passkey.name}"</strong> passkey? You will no
                        longer be able to use it to sign in.
                    </DialogDescription>
                    <DialogFooter className="gap-2 pt-2">
                        <DialogClose asChild>
                            <Button
                                variant="secondary"
                                className="rounded-full"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-full"
                        >
                            {isDeleting ? "Removing…" : "Remove Passkey"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

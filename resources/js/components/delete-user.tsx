// resources/js/components/delete-user.tsx
import { Form } from "@inertiajs/react";
import { useRef } from "react";
import ProfileController from "@/actions/App/Http/Controllers/Settings/ProfileController";
import InputError from "@/components/input-error";
import PasswordInput from "@/components/password-input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Lock } from "lucide-react";

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-6">
            {/* Danger Header */}
            <div>
                <h3 className="text-lg font-bold text-destructive">
                    Danger Zone
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Once you delete your account, there is no going back. Please
                    be certain.
                </p>
            </div>

            {/* Alert Card */}
            <div className="flex flex-col gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">
                            Delete this account
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            This will permanently delete your profile, messages,
                            and matches.
                        </p>
                    </div>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="destructive"
                            className="shrink-0 rounded-full px-6 shadow-sm hover:bg-destructive/90"
                            data-test="delete-user-button"
                        >
                            Delete Account
                        </Button>
                    </DialogTrigger>

                    {/* SMALLER MODAL: max-w-sm and reduced padding */}
                    <DialogContent className="max-w-[400px] p-5 sm:rounded-xl">
                        <DialogHeader className="space-y-1.5">
                            <DialogTitle className="text-base font-bold">
                                Are you absolutely sure?
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                This action cannot be undone. This will
                                permanently delete your account and remove all
                                your data from our servers.
                            </DialogDescription>
                        </DialogHeader>

                        <Form
                            {...ProfileController.destroy.form()}
                            options={{ preserveScroll: true }}
                            onError={() => passwordInput.current?.focus()}
                            resetOnSuccess
                            className="space-y-3 pt-2"
                        >
                            {({ resetAndClearErrors, processing, errors }) => (
                                <>
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="password"
                                            className="sr-only"
                                        >
                                            Password
                                        </Label>

                                        <div className="relative border-b border-border pb-1 transition-colors focus-within:border-destructive">
                                            <Lock className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                ref={passwordInput}
                                                placeholder="Enter password to confirm"
                                                autoComplete="current-password"
                                                className="h-8 border-0 bg-transparent pl-5 pr-10 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                                            />
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    <DialogFooter className="flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
                                        <DialogClose asChild>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full rounded-full sm:w-auto"
                                                onClick={() =>
                                                    resetAndClearErrors()
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </DialogClose>

                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={processing}
                                            className="w-full rounded-full sm:w-auto"
                                            asChild
                                        >
                                            <button
                                                type="submit"
                                                data-test="confirm-delete-user-button"
                                            >
                                                Yes, delete account
                                            </button>
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

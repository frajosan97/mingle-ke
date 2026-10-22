// resources/js/pages/auth/confirm-password.tsx
import { Form, Head } from "@inertiajs/react";
import { Lock } from "lucide-react";
import InputError from "@/components/input-error";
import PasswordInput from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { store } from "@/routes/password/confirm";
import {
    index as confirmOptions,
    store as confirmStore,
} from "@/actions/Laravel/Passkeys/Http/Controllers/PasskeyConfirmationController";
import PasskeyVerify from "@/components/passkey-verify";

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Confirm password" />

            <PasskeyVerify
                routes={{
                    options: confirmOptions(),
                    submit: confirmStore(),
                }}
                label="Confirm with passkey"
                loadingLabel="Confirming…"
                separator="Or confirm with password"
            />

            <Form {...store.form()} resetOnSuccess={["password"]}>
                {({ processing, errors }) => (
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label
                                htmlFor="password"
                                className="text-sm font-semibold text-muted-foreground"
                            >
                                Password
                            </Label>
                            <div className="relative border-b border-border pb-1 transition-colors focus-within:border-brand-pink">
                                <Lock className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    autoFocus
                                    className="border-0 bg-transparent pl-6 text-foreground shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        <Button
                            className="mt-2 w-full rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong disabled:opacity-70"
                            disabled={processing}
                            data-test="confirm-password-button"
                        >
                            {processing && <Spinner className="mr-2 h-4 w-4" />}
                            Confirm Password
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ConfirmPassword.layout = {
    title: "Confirm your password",
    description:
        "This is a secure area. Please verify your identity to continue.",
};

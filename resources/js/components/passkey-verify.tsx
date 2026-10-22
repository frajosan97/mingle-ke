// resources/js/components/passkey-verify.tsx
import type { UrlMethodPair } from "@inertiajs/core";
import { router } from "@inertiajs/react";
import { usePasskeyVerify } from "@laravel/passkeys/react";
import { KeyRound } from "lucide-react";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

type Props = {
    routes?: {
        options: UrlMethodPair;
        submit: UrlMethodPair;
    };
    label?: string;
    loadingLabel?: string;
    separator?: string;
};

export default function PasskeyVerify({
    routes,
    label,
    loadingLabel,
    separator,
}: Props = {}) {
    const { verify, isLoading, error, isSupported } = usePasskeyVerify({
        ...(routes && {
            routes: {
                options: routes.options.url,
                submit: routes.submit.url,
            },
        }),
        onSuccess: (response) => {
            router.visit(response.redirect ?? "/dashboard");
        },
    });

    if (!isSupported) {
        return null;
    }

    return (
        <>
            <div className="grid gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full border-border bg-transparent px-6 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-brand-pink/40 hover:bg-brand-pink/5 hover:text-brand-pink"
                    onClick={verify}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                        <KeyRound className="mr-2 h-4 w-4" />
                    )}
                    {isLoading
                        ? (loadingLabel ?? "Authenticating…")
                        : (label ?? "Sign in with a passkey")}
                </Button>
                {error && (
                    <InputError message={error} className="text-center" />
                )}
            </div>

            {/* Divider — matches the brand card background, not the page bg */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-wider">
                    <span className="bg-card px-3 text-muted-foreground">
                        {separator ?? "Or continue with email"}
                    </span>
                </div>
            </div>
        </>
    );
}

// resources/js/pages/auth/two-factor-challenge.tsx
import { Form, Head, setLayoutProps } from "@inertiajs/react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { OTP_MAX_LENGTH } from "@/hooks/use-two-factor-auth";
import { store } from "@/routes/two-factor/login";

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>("");

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: "Recovery code",
                description:
                    "Please confirm access to your account by entering one of your emergency recovery codes.",
                toggleText: "login using an authentication code",
            };
        }

        return {
            title: "Authentication code",
            description:
                "Enter the authentication code provided by your authenticator application.",
            toggleText: "login using a recovery code",
        };
    }, [showRecoveryInput]);

    setLayoutProps({
        title: authConfigContent.title,
        description: authConfigContent.description,
    });

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode("");
    };

    return (
        <>
            <Head title="Two-factor authentication" />

            <div className="space-y-6">
                <Form
                    {...store.form()}
                    className="space-y-5"
                    resetOnError
                    resetOnSuccess={!showRecoveryInput}
                >
                    {({ errors, processing, clearErrors }) => (
                        <>
                            {showRecoveryInput ? (
                                <div className="space-y-2">
                                    <div className="relative border-b border-border pb-1 transition-colors focus-within:border-brand-pink">
                                        <ShieldCheck className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            name="recovery_code"
                                            type="text"
                                            placeholder="Enter recovery code"
                                            autoFocus={showRecoveryInput}
                                            required
                                            className="border-0 bg-transparent pl-6 text-foreground shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                                        />
                                    </div>
                                    <InputError
                                        message={errors.recovery_code}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                                    <div className="flex w-full items-center justify-center">
                                        <InputOTP
                                            name="code"
                                            maxLength={OTP_MAX_LENGTH}
                                            value={code}
                                            onChange={(value) => setCode(value)}
                                            disabled={processing}
                                            pattern={REGEXP_ONLY_DIGITS}
                                            autoFocus
                                            // Custom styling for OTP slots
                                            containerClassName="gap-2"
                                        >
                                            <InputOTPGroup className="gap-2">
                                                {Array.from(
                                                    { length: OTP_MAX_LENGTH },
                                                    (_, index) => (
                                                        <InputOTPSlot
                                                            key={index}
                                                            index={index}
                                                            className="h-12 w-10 rounded-lg border-border text-lg font-semibold data-[state=active]:border-brand-pink data-[state=active]:ring-2 data-[state=active]:ring-brand-pink/20"
                                                        />
                                                    ),
                                                )}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                    <InputError message={errors.code} />
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="mt-2 w-full rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong disabled:opacity-70"
                                disabled={processing}
                            >
                                Verify & Continue
                            </Button>

                            <div className="text-center text-sm text-muted-foreground">
                                <span>or you can </span>
                                <button
                                    type="button"
                                    className="font-bold text-brand-pink underline decoration-brand-pink/40 underline-offset-4 transition-all hover:text-brand-pink/80 hover:decoration-brand-pink"
                                    onClick={() =>
                                        toggleRecoveryMode(clearErrors)
                                    }
                                >
                                    {authConfigContent.toggleText}
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

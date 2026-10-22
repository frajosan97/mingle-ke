// resources/js/components/two-factor-setup-modal.tsx
import { Form } from "@inertiajs/react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Check, Copy, ShieldCheck, Smartphone } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AlertError from "@/components/alert-error";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";
import { useAppearance } from "@/hooks/use-appearance";
import { useClipboard } from "@/hooks/use-clipboard";
import { OTP_MAX_LENGTH } from "@/hooks/use-two-factor-auth";
import { confirm } from "@/routes/two-factor";

function TwoFactorSetupStep({
    qrCodeSvg,
    manualSetupKey,
    buttonText,
    onNextStep,
    errors,
}: {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    buttonText: string;
    onNextStep: () => void;
    errors: string[];
}) {
    const { resolvedAppearance } = useAppearance();
    const [copiedText, copy] = useClipboard();
    const IconComponent = copiedText === manualSetupKey ? Check : Copy;

    return (
        <>
            {errors?.length ? (
                <AlertError errors={errors} />
            ) : (
                <div className="space-y-6">
                    {/* QR Code Area */}
                    <div className="mx-auto flex w-full max-w-[240px] items-center justify-center rounded-2xl border border-border bg-muted/30 p-4">
                        {qrCodeSvg ? (
                            <div
                                className="aspect-square w-full rounded-xl bg-white p-2 [&_svg]:size-full"
                                dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                                style={{
                                    filter:
                                        resolvedAppearance === "dark"
                                            ? "invert(1) brightness(1.5)"
                                            : undefined,
                                }}
                            />
                        ) : (
                            <Spinner className="h-8 w-8 text-brand-pink" />
                        )}
                    </div>

                    {/* Manual Key Input */}
                    <div className="space-y-2">
                        <p className="text-center text-xs font-medium text-muted-foreground">
                            Can't scan? Enter this code manually:
                        </p>
                        <div className="flex h-10 w-full items-center justify-between overflow-hidden rounded-xl border border-border bg-background px-3">
                            {!manualSetupKey ? (
                                <Spinner className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <>
                                    <code className="font-mono text-sm tracking-widest text-foreground">
                                        {manualSetupKey}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => copy(manualSetupKey)}
                                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                        title="Copy to clipboard"
                                    >
                                        <IconComponent className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button
                        className="w-full rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong"
                        onClick={onNextStep}
                    >
                        {buttonText}
                    </Button>
                </div>
            )}
        </>
    );
}

function TwoFactorVerificationStep({
    onClose,
    onBack,
}: {
    onClose: () => void;
    onBack: () => void;
}) {
    const [code, setCode] = useState<string>("");
    const pinInputContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => {
            pinInputContainerRef.current?.querySelector("input")?.focus();
        }, 0);
    }, []);

    return (
        <Form
            {...confirm.form()}
            onSuccess={() => onClose()}
            resetOnError
            resetOnSuccess
        >
            {({
                processing,
                errors,
            }: {
                processing: boolean;
                errors?: { confirmTwoFactorAuthentication?: { code?: string } };
            }) => (
                <div ref={pinInputContainerRef} className="space-y-6">
                    <div className="flex w-full flex-col items-center space-y-3">
                        <InputOTP
                            id="otp"
                            name="code"
                            maxLength={OTP_MAX_LENGTH}
                            onChange={setCode}
                            disabled={processing}
                            pattern={REGEXP_ONLY_DIGITS}
                            autoFocus
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
                        <InputError
                            message={
                                errors?.confirmTwoFactorAuthentication?.code
                            }
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 rounded-full"
                            onClick={onBack}
                            disabled={processing}
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 rounded-full bg-gradient-brand text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong disabled:opacity-70"
                            disabled={
                                processing || code.length < OTP_MAX_LENGTH
                            }
                        >
                            {processing ? (
                                <Spinner className="h-4 w-4" />
                            ) : (
                                "Verify"
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </Form>
    );
}

type Props = {
    isOpen: boolean;
    onClose: () => void;
    requiresConfirmation: boolean;
    twoFactorEnabled: boolean;
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    clearSetupData: () => void;
    fetchSetupData: () => Promise<void>;
    errors: string[];
};

export default function TwoFactorSetupModal({
    isOpen,
    onClose,
    requiresConfirmation,
    twoFactorEnabled,
    qrCodeSvg,
    manualSetupKey,
    clearSetupData,
    fetchSetupData,
    errors,
}: Props) {
    const [showVerificationStep, setShowVerificationStep] =
        useState<boolean>(false);

    const modalConfig = useMemo<{
        title: string;
        description: string;
        buttonText: string;
    }>(() => {
        if (twoFactorEnabled) {
            return {
                title: "Two-factor enabled",
                description:
                    "You're all set! Your account is now more secure. Keep your recovery codes somewhere safe.",
                buttonText: "Done",
            };
        }

        if (showVerificationStep) {
            return {
                title: "Verify your app",
                description:
                    "Enter the 6-digit code generated by your authenticator app.",
                buttonText: "Verify",
            };
        }

        return {
            title: "Set up two-factor",
            description:
                "Scan the QR code with your authenticator app to link your account.",
            buttonText: "Continue",
        };
    }, [twoFactorEnabled, showVerificationStep]);

    const resetModalState = useCallback(() => {
        if (twoFactorEnabled) {
            clearSetupData();
        }
        setShowVerificationStep(false);
    }, [clearSetupData, twoFactorEnabled]);

    const handleClose = useCallback(() => {
        resetModalState();
        onClose();
    }, [onClose, resetModalState]);

    const handleModalNextStep = useCallback(() => {
        if (requiresConfirmation) {
            setShowVerificationStep(true);
            return;
        }
        clearSetupData();
        handleClose();
    }, [requiresConfirmation, clearSetupData, handleClose]);

    const fetchSetupDataRef = useRef(fetchSetupData);

    useEffect(() => {
        fetchSetupDataRef.current = fetchSetupData;
    }, [fetchSetupData]);

    useEffect(() => {
        if (isOpen && !qrCodeSvg) {
            void fetchSetupDataRef.current();
        }
    }, [isOpen, qrCodeSvg]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-[420px] p-6 sm:rounded-2xl">
                <DialogHeader className="flex flex-col items-center justify-center space-y-3 pb-2 text-center">
                    {/* Branded Icon Badge */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand-soft ring-1 ring-brand-pink/20">
                        {twoFactorEnabled ? (
                            <ShieldCheck className="h-7 w-7 text-brand-pink" />
                        ) : (
                            <Smartphone className="h-7 w-7 text-brand-pink" />
                        )}
                    </div>

                    <div className="space-y-1">
                        <DialogTitle className="text-xl font-bold text-foreground">
                            {modalConfig.title}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            {modalConfig.description}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex flex-col items-center pt-2">
                    {showVerificationStep ? (
                        <TwoFactorVerificationStep
                            onClose={handleClose}
                            onBack={() => setShowVerificationStep(false)}
                        />
                    ) : (
                        <TwoFactorSetupStep
                            qrCodeSvg={qrCodeSvg}
                            manualSetupKey={manualSetupKey}
                            buttonText={modalConfig.buttonText}
                            onNextStep={handleModalNextStep}
                            errors={errors}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

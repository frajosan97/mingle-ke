// resources/js/components/manage-two-factor.tsx
import { Form } from "@inertiajs/react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TwoFactorRecoveryCodes from "@/components/two-factor-recovery-codes";
import TwoFactorSetupModal from "@/components/two-factor-setup-modal";
import { Button } from "@/components/ui/button";
import { useTwoFactorAuth } from "@/hooks/use-two-factor-auth";
import { disable, enable } from "@/routes/two-factor";

export type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function ManageTwoFactor(props: Props) {
    const requiresConfirmation = props.requiresConfirmation ?? false;
    const twoFactorEnabled = props.twoFactorEnabled ?? false;

    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        clearTwoFactorAuthData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
    const prevTwoFactorEnabled = useRef(twoFactorEnabled);

    useEffect(() => {
        if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
            clearTwoFactorAuthData();
        }

        prevTwoFactorEnabled.current = twoFactorEnabled;
    }, [twoFactorEnabled, clearTwoFactorAuthData]);

    if (!(props.canManageTwoFactor ?? false)) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Modern Header */}
            <div>
                <h3 className="text-lg font-bold text-foreground">
                    Two-Factor Authentication
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Add an extra layer of security to your account by requiring
                    a secure pin during login.
                </p>
            </div>

            {twoFactorEnabled ? (
                <div className="space-y-6">
                    {/* Enabled State Card */}
                    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">
                                    Two-factor is active
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    You will be prompted for a secure pin during
                                    login. This pin can be retrieved from your
                                    TOTP app.
                                </p>
                            </div>
                        </div>

                        <Form {...disable.form()}>
                            {({ processing }) => (
                                <Button
                                    variant="destructive"
                                    type="submit"
                                    disabled={processing}
                                    className="shrink-0 rounded-full px-6 shadow-sm hover:bg-destructive/90"
                                >
                                    Disable 2FA
                                </Button>
                            )}
                        </Form>
                    </div>

                    {/* Recovery Codes section */}
                    <div className="pt-2">
                        <TwoFactorRecoveryCodes
                            recoveryCodesList={recoveryCodesList}
                            fetchRecoveryCodes={fetchRecoveryCodes}
                            errors={errors}
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Disabled State Card */}
                    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-pink/10 text-brand-pink">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">
                                    Two-factor is currently disabled
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Enable it to require a secure pin during
                                    login, using an authenticator app.
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0">
                            {hasSetupData ? (
                                <Button
                                    onClick={() => setShowSetupModal(true)}
                                    className="rounded-full bg-gradient-brand px-6 text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong"
                                >
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Continue Setup
                                </Button>
                            ) : (
                                <Form
                                    {...enable.form()}
                                    onSuccess={() => setShowSetupModal(true)}
                                >
                                    {({ processing }) => (
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="rounded-full bg-gradient-brand px-6 text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong"
                                        >
                                            Enable 2FA
                                        </Button>
                                    )}
                                </Form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <TwoFactorSetupModal
                isOpen={showSetupModal}
                onClose={() => setShowSetupModal(false)}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={twoFactorEnabled}
                qrCodeSvg={qrCodeSvg}
                manualSetupKey={manualSetupKey}
                clearSetupData={clearSetupData}
                fetchSetupData={fetchSetupData}
                errors={errors}
            />
        </div>
    );
}

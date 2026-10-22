// resources/js/pages/settings/security.tsx
import { Form, Head } from "@inertiajs/react";
import { useRef } from "react";
import SecurityController from "@/actions/App/Http/Controllers/Settings/SecurityController";
import InputError from "@/components/input-error";
import PasswordInput from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { edit } from "@/routes/security";
import type { Props as ManagePasskeysProps } from "@/components/manage-passkeys";
import ManagePasskeys from "@/components/manage-passkeys";
import type { Props as ManageTwoFactorProps } from "@/components/manage-two-factor";
import ManageTwoFactor from "@/components/manage-two-factor";

type Props = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Security settings" />

            <div className="space-y-10">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">
                        Security
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Ensure your account is using a long, random password to
                        stay secure.
                    </p>
                </div>

                <Form
                    {...SecurityController.update.form()}
                    options={{ preserveScroll: true }}
                    resetOnError={[
                        "password",
                        "password_confirmation",
                        "current_password",
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) passwordInput.current?.focus();
                        if (errors.current_password)
                            currentPasswordInput.current?.focus();
                    }}
                    className="space-y-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="current_password"
                                    className="text-sm font-semibold text-muted-foreground"
                                >
                                    Current Password
                                </Label>
                                <div className="border-b border-border pb-2 focus-within:border-brand-pink">
                                    <PasswordInput
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        className="w-full border-0 bg-transparent p-0 text-lg text-foreground shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                        autoComplete="current-password"
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <InputError message={errors.current_password} />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="text-sm font-semibold text-muted-foreground"
                                >
                                    New Password
                                </Label>
                                <div className="border-b border-border pb-2 focus-within:border-brand-pink">
                                    <PasswordInput
                                        id="password"
                                        ref={passwordInput}
                                        name="password"
                                        className="w-full border-0 bg-transparent p-0 text-lg text-foreground shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                        autoComplete="new-password"
                                        placeholder="Enter new password"
                                        passwordrules={props.passwordRules}
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="password_confirmation"
                                    className="text-sm font-semibold text-muted-foreground"
                                >
                                    Confirm New Password
                                </Label>
                                <div className="border-b border-border pb-2 focus-within:border-brand-pink">
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        className="w-full border-0 bg-transparent p-0 text-lg text-foreground shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                        autoComplete="new-password"
                                        placeholder="Confirm new password"
                                        passwordrules={props.passwordRules}
                                    />
                                </div>
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-password-button"
                                    className="rounded-full bg-gradient-brand px-8 py-2 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong"
                                >
                                    Update Password
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            {/* Separators and Cards for the advanced security options */}
            <div className="mt-16 space-y-10 pt-10 border-t border-border">
                <ManageTwoFactor
                    canManageTwoFactor={props.canManageTwoFactor}
                    requiresConfirmation={props.requiresConfirmation}
                    twoFactorEnabled={props.twoFactorEnabled}
                />

                <ManagePasskeys
                    canManagePasskeys={props.canManagePasskeys}
                    passkeys={props.passkeys}
                />
            </div>
        </>
    );
}

Security.layout = {
    breadcrumbs: [{ title: "Security settings", href: edit() }],
};

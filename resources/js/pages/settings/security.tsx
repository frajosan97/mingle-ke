// resources/js/pages/settings/security.tsx
import { Form, Head } from "@inertiajs/react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { edit } from "@/routes/security";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { Field } from "@/components/ui/fields";
import { PageHeader } from "@/components/page-header";
import type { Props as ManagePasskeysProps } from "@/components/manage-passkeys";
import ManagePasskeys from "@/components/manage-passkeys";
import type { Props as ManageTwoFactorProps } from "@/components/manage-two-factor";
import ManageTwoFactor from "@/components/manage-two-factor";
import SecurityController from "@/actions/App/Http/Controllers/Settings/SecurityController";
import PasswordInput from "@/components/password-input";

// oxfmt-ignore
type Props = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

/* ─── Section wrapper ────────────────────────────────────── */
function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-5">
            <header>
                <h3 className="text-base font-semibold text-foreground">
                    {title}
                </h3>
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </header>
            {children}
        </section>
    );
}

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Profile settings" />

            <div className="space-y-10 pb-8">
                {/* ── Header ─────────────────────────────── */}
                <PageHeader
                    title="Security settings"
                    description="Manage your password, two-factor authentication and passkeys. Keep your account secure with a long, random password."
                    backHref="/settings"
                    backHrefTitle="Back to Settings"
                />

                {/* ── Password ───────────────────────────── */}
                <Form
                    {...SecurityController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnError={[
                        "password",
                        "password_confirmation",
                        "current_password",
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInput.current?.focus();
                        }

                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        }
                    }}
                    className="space-y-8"
                >
                    {({ errors, processing }) => (
                        <>
                            <Section
                                title="Update password"
                                description="Ensure your account is using a long, random password to stay secure."
                            >
                                <div className="grid grid-cols-1 gap-6">
                                    <Field
                                        label="Current password"
                                        htmlFor="current_password"
                                        icon={Lock}
                                        error={errors.current_password}
                                    >
                                        <PasswordInput
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            name="current_password"
                                            autoComplete="current-password"
                                            placeholder="Current password"
                                        />
                                    </Field>

                                    <Field
                                        label="New password"
                                        htmlFor="password"
                                        icon={KeyRound}
                                        hint="Use a long, random password to keep your account secure."
                                        error={errors.password}
                                    >
                                        <PasswordInput
                                            id="password"
                                            ref={passwordInput}
                                            name="password"
                                            autoComplete="new-password"
                                            placeholder="New password"
                                            passwordrules={props.passwordRules}
                                        />
                                    </Field>

                                    <Field
                                        label="Confirm password"
                                        htmlFor="password_confirmation"
                                        icon={ShieldCheck}
                                        error={errors.password_confirmation}
                                    >
                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            autoComplete="new-password"
                                            placeholder="Confirm password"
                                            passwordrules={props.passwordRules}
                                        />
                                    </Field>
                                </div>
                            </Section>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-password-button"
                                    className="rounded-full bg-primary px-8 py-2 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong"
                                >
                                    Save changes
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                {/* ── Two-factor ─────────────────────────── */}
                <div className="border-t border-border pt-8">
                    <ManageTwoFactor
                        canManageTwoFactor={props.canManageTwoFactor}
                        requiresConfirmation={props.requiresConfirmation}
                        twoFactorEnabled={props.twoFactorEnabled}
                    />
                </div>

                {/* ── Passkeys ───────────────────────────── */}
                <div className="border-t border-border pt-8">
                    <ManagePasskeys
                        canManagePasskeys={props.canManagePasskeys}
                        passkeys={props.passkeys}
                    />
                </div>
            </div>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: "Security settings",
            href: edit(),
        },
    ],
};

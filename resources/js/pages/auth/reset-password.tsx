// resources/js/pages/auth/reset-password.tsx
import { Form, Head } from "@inertiajs/react";
import { Mail, Lock } from "lucide-react";
import InputError from "@/components/input-error";
import PasswordInput from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { update } from "@/routes/password";

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <>
            <Head title="Reset password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={["password", "password_confirmation"]}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-5">
                        {/* Email (read-only) */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="text-sm font-semibold text-muted-foreground"
                            >
                                Email Address
                            </Label>
                            <div className="relative border-b border-border pb-1">
                                <Mail className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    className="cursor-not-allowed border-0 bg-transparent pl-6 text-foreground/70 shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                    readOnly
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        {/* New password */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="password"
                                className="text-sm font-semibold text-muted-foreground"
                            >
                                New Password
                            </Label>
                            <div className="relative border-b border-border pb-1 transition-colors focus-within:border-brand-pink">
                                <Lock className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    autoFocus
                                    placeholder="••••••••"
                                    passwordrules={passwordRules}
                                    className="border-0 bg-transparent pl-6 text-foreground shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        {/* Confirm password */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="password_confirmation"
                                className="text-sm font-semibold text-muted-foreground"
                            >
                                Confirm Password
                            </Label>
                            <div className="relative border-b border-border pb-1 transition-colors focus-within:border-brand-pink">
                                <Lock className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    passwordrules={passwordRules}
                                    className="border-0 bg-transparent pl-6 text-foreground shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                            </div>
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="mt-2 w-full rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong disabled:opacity-70"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner className="mr-2 h-4 w-4" />}
                            Reset Password
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: "Set a new password",
    description: "Choose a strong password to secure your account",
};

// resources/js/pages/auth/login.tsx
import { Form, Head } from "@inertiajs/react";
import GoogleLogin from "@/components/google-login";
import InputError from "@/components/input-error";
import PasswordInput from "@/components/password-input";
import PasskeyVerify from "@/components/passkey-verify";
import TextLink from "@/components/text-link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { register } from "@/routes";
import { store } from "@/routes/login";
import { request } from "@/routes/password";
import { Mail, Lock } from "lucide-react";

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Log in" />

            <div className="mb-6">
                <GoogleLogin
                    label="Continue with Google"
                    separator="Or continue with email"
                />
            </div>

            <PasskeyVerify />

            <Form
                {...store.form()}
                resetOnSuccess={["password"]}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-sm font-semibold text-muted-foreground"
                                >
                                    Email Address
                                </Label>
                                <div className="relative border-b border-border pb-1 focus-within:border-brand-pink transition-colors">
                                    <Mail className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="email@example.com"
                                        className="border-0 bg-transparent pl-6 shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground/50"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="password"
                                        className="text-sm font-semibold text-muted-foreground"
                                    >
                                        Password
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-xs font-medium text-brand-pink hover:text-brand-pink/80 hover:underline"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <div className="relative border-b border-border pb-1 focus-within:border-brand-pink transition-colors">
                                    <Lock className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        className="border-0 bg-transparent pl-6 shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground/50"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="data-[state=checked]:bg-brand-pink data-[state=checked]:border-brand-pink"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm font-medium text-muted-foreground cursor-pointer"
                                >
                                    Remember me for 30 days
                                </Label>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="mt-2 w-full rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong disabled:opacity-70"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && (
                                    <Spinner className="mr-2 h-4 w-4" />
                                )}
                                Sign In
                            </Button>
                        </div>

                        {/* Footer Link */}
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <TextLink
                                href={register()}
                                tabIndex={5}
                                className="font-bold text-brand-pink hover:text-brand-pink/80 hover:underline"
                            >
                                Sign up
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {/* Status Message */}
            {status && (
                <div className="mt-4 rounded-lg bg-brand-green/10 p-3 text-center text-sm font-medium text-brand-green">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: "Welcome back",
    description: "Log in to your account to continue",
};

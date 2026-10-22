// resources/js/pages/auth/register.tsx
import { Form, Head } from "@inertiajs/react";
import { Mail, Lock, User } from "lucide-react";
import GoogleLogin from "@/components/google-login";
import InputError from "@/components/input-error";
import PasswordInput from "@/components/password-input";
import TextLink from "@/components/text-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { login } from "@/routes";
import { store } from "@/routes/register";

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    return (
        <>
            <Head title="Register" />

            <div className="mb-6">
                <GoogleLogin
                    label="Sign up with Google"
                    separator="Or sign up with email"
                    showSeparator={true}
                />
            </div>

            <Form
                {...store.form()}
                resetOnSuccess={["password", "password_confirmation"]}
                disableWhileProcessing
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="name"
                                    className="text-sm font-semibold text-muted-foreground"
                                >
                                    Full Name
                                </Label>
                                <div className="relative border-b border-border pb-1 transition-colors focus-within:border-brand-pink">
                                    <User className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="name"
                                        name="name"
                                        placeholder="Your full name"
                                        className="border-0 bg-transparent pl-6 text-foreground shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    />
                                </div>
                                <InputError message={errors.name} />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-sm font-semibold text-muted-foreground"
                                >
                                    Email Address
                                </Label>
                                <div className="relative border-b border-border pb-1 transition-colors focus-within:border-brand-pink">
                                    <Mail className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        tabIndex={2}
                                        autoComplete="email"
                                        name="email"
                                        placeholder="email@example.com"
                                        className="border-0 bg-transparent pl-6 text-foreground shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            {/* Password */}
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
                                        required
                                        tabIndex={3}
                                        autoComplete="new-password"
                                        name="password"
                                        placeholder="••••••••"
                                        passwordrules={passwordRules}
                                        className="border-0 bg-transparent pl-6 text-foreground shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* Confirm Password */}
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
                                        required
                                        tabIndex={4}
                                        autoComplete="new-password"
                                        name="password_confirmation"
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
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && (
                                    <Spinner className="mr-2 h-4 w-4" />
                                )}
                                Create Account
                            </Button>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <TextLink
                                href={login()}
                                tabIndex={6}
                                className="font-bold text-brand-pink hover:text-brand-pink/80 hover:underline"
                            >
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: "Create your account",
    description: "Join thousands of members finding real connections",
};

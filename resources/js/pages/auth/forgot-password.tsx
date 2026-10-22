// resources/js/pages/auth/forgot-password.tsx
import { Form, Head } from "@inertiajs/react";
import { LoaderCircle, Mail } from "lucide-react";
import InputError from "@/components/input-error";
import TextLink from "@/components/text-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/routes";
import { email } from "@/routes/password";

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Forgot password" />

            {status && (
                <div className="mb-6 rounded-lg bg-brand-green/10 p-3 text-center text-sm font-medium text-brand-green">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <>
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
                                        name="email"
                                        autoComplete="off"
                                        autoFocus
                                        placeholder="email@example.com"
                                        className="border-0 bg-transparent pl-6 text-foreground shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="pt-2">
                                <Button
                                    className="w-full rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong disabled:opacity-70"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing && (
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Send Reset Link
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="text-center text-sm text-muted-foreground">
                    Or, return to{" "}
                    <TextLink
                        href={login()}
                        className="font-bold text-brand-pink hover:text-brand-pink/80 hover:underline"
                    >
                        log in
                    </TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: "Forgot password?",
    description: "Enter your email and we'll send you a link to reset it",
};

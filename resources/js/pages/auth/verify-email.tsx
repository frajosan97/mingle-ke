// resources/js/pages/auth/verify-email.tsx
import { Form, Head } from "@inertiajs/react";
import { MailCheck } from "lucide-react";
import TextLink from "@/components/text-link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { logout } from "@/routes";
import { send } from "@/routes/verification";

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Email verification" />

            {/* Optional status from server */}
            {status === "verification-link-sent" && (
                <div className="mb-6 rounded-lg bg-brand-green/10 p-3 text-center text-sm font-medium text-brand-green">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            <Form
                {...send.form()}
                className="flex flex-col items-center space-y-6 text-center"
            >
                {({ processing }) => (
                    <>
                        {/* Icon Badge */}
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand-soft shadow-sm ring-1 ring-border/50">
                            <MailCheck className="h-8 w-8 text-brand-pink" />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Didn't receive the email? Check your spam
                                folder, or request another link below.
                            </p>
                        </div>

                        <Button
                            disabled={processing}
                            className="w-full rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong disabled:opacity-70"
                        >
                            {processing && <Spinner className="mr-2 h-4 w-4" />}
                            Resend Verification Email
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm font-medium text-muted-foreground hover:text-brand-pink"
                        >
                            Log out
                        </TextLink>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: "Verify your email",
    description:
        "We just sent a verification link to your inbox. Please click it to continue.",
};

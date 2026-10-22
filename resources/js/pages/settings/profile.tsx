// resources/js/pages/settings/profile.tsx
import { Form, Head, usePage, Link } from "@inertiajs/react";
import ProfileController from "@/actions/App/Http/Controllers/Settings/ProfileController";
import DeleteUser from "@/components/delete-user";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { edit } from "@/routes/profile";
import type { Auth } from "@/types";
import { send } from "@/routes/verification";
import { Check } from "lucide-react";

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profile settings" />

            <div className="space-y-10">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">
                        Profile Details
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Update your name and email address so people know who
                        you are.
                    </p>
                </div>

                <Form
                    {...ProfileController.update.form()}
                    options={{ preserveScroll: true }}
                    className="space-y-8"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="name"
                                    className="text-sm font-semibold text-brand-pink"
                                >
                                    Your Name
                                </Label>
                                <div className="flex items-center gap-2 border-b-2 border-brand-pink pb-2">
                                    <Input
                                        id="name"
                                        className="w-full border-0 bg-transparent p-0 text-lg text-foreground shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />
                                    <Check className="h-5 w-5 text-brand-pink" />
                                </div>
                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-sm font-semibold text-muted-foreground"
                                >
                                    Email Address
                                </Label>
                                <div className="border-b border-border pb-2 focus-within:border-brand-pink">
                                    <Input
                                        id="email"
                                        type="email"
                                        className="w-full border-0 bg-transparent p-0 text-lg text-foreground shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />
                                </div>
                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                                        <p className="text-sm text-warning-foreground">
                                            Your email address is unverified.{" "}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="font-semibold underline underline-offset-4 hover:text-warning"
                                            >
                                                Click here to re-send the
                                                verification email.
                                            </Link>
                                        </p>
                                        {status ===
                                            "verification-link-sent" && (
                                            <div className="mt-2 text-sm font-medium text-brand-green">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                    className="rounded-full bg-gradient-brand px-8 py-2 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            {/* The DeleteUser component should ideally be styled as a danger card internally */}
            <div className="mt-8 pt-8 pb-8 border-t border-border">
                <DeleteUser />
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [{ title: "Profile settings", href: edit() }],
};

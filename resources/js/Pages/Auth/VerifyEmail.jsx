import { Form, Button, Alert } from "react-bootstrap";
import { Head, Link, useForm } from "@inertiajs/react";

import GuestLayout from "@/Layouts/GuestLayout";
import ApplicationLogo from "@/Components/ApplicationLogo";

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route("verification.send"));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="auth-card">
                {/* Logo + heading */}
                <div className="d-flex flex-column align-items-center text-center mb-4">
                    <Link
                        href="/"
                        className="d-inline-flex align-items-center gap-2 text-decoration-none mb-3"
                    >
                        <ApplicationLogo />
                    </Link>
                    <h3 className="auth-title text-white-50">Verify Email</h3>
                </div>

                {/* Info note */}
                <p className="text-center text-muted-light small mb-4">
                    Thanks for signing up! Before getting started, could you
                    verify your email address by clicking on the link we just
                    emailed to you? If you didn't receive the email, we will
                    gladly send you another.
                </p>

                {/* Status message (new link sent) */}
                {status === "verification-link-sent" && (
                    <Alert variant="success" className="auth-alert">
                        A new verification link has been sent to the email
                        address you provided during registration.
                    </Alert>
                )}

                <Form onSubmit={submit}>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="grad-btn w-100 rounded-pill border-0 fw-semibold p-2 mb-3"
                    >
                        {processing ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Sending...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-envelope-check-fill me-2"></i>
                                Resend Verification Email
                            </>
                        )}
                    </Button>

                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="btn btn-link w-100 text-gradient text-decoration-none p-0 small"
                    >
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Log Out
                    </Link>
                </Form>
            </div>
        </GuestLayout>
    );
}

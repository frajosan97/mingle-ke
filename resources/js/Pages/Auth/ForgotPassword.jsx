import { Form, Button, Alert, InputGroup } from "react-bootstrap";
import { Head, Link, useForm } from "@inertiajs/react";

import GuestLayout from "@/Layouts/GuestLayout";
import ApplicationLogo from "@/Components/ApplicationLogo";

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("password.email"));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="auth-card">
                {/* Logo + heading */}
                <div className="d-flex flex-column align-items-center text-center mb-4">
                    <Link
                        href="/"
                        className="d-inline-flex align-items-center gap-2 text-decoration-none mb-3"
                    >
                        <ApplicationLogo />
                    </Link>
                    <h3 className="auth-title text-white-50">
                        Forgot Password
                    </h3>
                </div>

                {/* Info note */}
                <p className="text-center text-muted-light small mb-4">
                    Forgot your password? No problem. Just let us know your
                    email address and we will email you a password reset link
                    that will allow you to choose a new one.
                </p>

                {/* Status message (reset link sent) */}
                {status && (
                    <Alert variant="success" className="auth-alert">
                        {status}
                    </Alert>
                )}

                <Form onSubmit={submit} noValidate>
                    <Form.Group className="mb-3" controlId="email">
                        <InputGroup className="auth-input-group">
                            <InputGroup.Text>
                                <i className="bi bi-envelope-fill"></i>
                            </InputGroup.Text>
                            <Form.Control
                                type="email"
                                name="email"
                                value={data.email}
                                autoComplete="username"
                                autoFocus
                                placeholder="Enter your email"
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                isInvalid={!!errors.email}
                                required
                            />
                        </InputGroup>
                        {errors.email && (
                            <div className="auth-error">{errors.email}</div>
                        )}
                    </Form.Group>

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
                                Sending link...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-envelope-arrow-up me-2"></i>
                                Email Password Reset Link
                            </>
                        )}
                    </Button>
                </Form>

                {/* Back to login */}
                <p className="text-center text-muted-light small">
                    Remembered your password?{" "}
                    <Link href={route("login")} className="text-gradient">
                        Back to sign in
                    </Link>
                </p>
            </div>
        </GuestLayout>
    );
}

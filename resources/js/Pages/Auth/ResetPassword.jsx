import { Form, Button, InputGroup } from "react-bootstrap";
import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";

import GuestLayout from "@/Layouts/GuestLayout";
import ApplicationLogo from "@/Components/ApplicationLogo";

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: "",
        password_confirmation: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route("password.store"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <div className="auth-card">
                {/* Logo + heading */}
                <div className="d-flex flex-column align-items-center text-center mb-4">
                    <Link
                        href="/"
                        className="d-inline-flex align-items-center gap-2 text-decoration-none mb-3"
                    >
                        <ApplicationLogo />
                    </Link>
                    <h3 className="auth-title text-white-50">Reset Password</h3>
                </div>

                <Form onSubmit={submit} noValidate>
                    {/* Email */}
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

                    {/* Password */}
                    <Form.Group className="mb-3" controlId="password">
                        <InputGroup className="auth-input-group">
                            <InputGroup.Text>
                                <i className="bi bi-lock-fill"></i>
                            </InputGroup.Text>
                            <Form.Control
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={data.password}
                                autoComplete="new-password"
                                autoFocus
                                placeholder="New password"
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                isInvalid={!!errors.password}
                                required
                            />
                            <InputGroup.Text
                                role="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                style={{ cursor: "pointer" }}
                            >
                                <i
                                    className={`bi ${
                                        showPassword
                                            ? "bi-eye-fill"
                                            : "bi-eye-slash"
                                    }`}
                                ></i>
                            </InputGroup.Text>
                        </InputGroup>
                        {errors.password && (
                            <div className="auth-error">{errors.password}</div>
                        )}
                    </Form.Group>

                    {/* Confirm Password */}
                    <Form.Group
                        className="mb-3"
                        controlId="password_confirmation"
                    >
                        <InputGroup className="auth-input-group">
                            <InputGroup.Text>
                                <i className="bi bi-shield-lock-fill"></i>
                            </InputGroup.Text>
                            <Form.Control
                                type={showConfirmPassword ? "text" : "password"}
                                name="password_confirmation"
                                value={data.password_confirmation}
                                autoComplete="new-password"
                                placeholder="Confirm new password"
                                onChange={(e) =>
                                    setData(
                                        "password_confirmation",
                                        e.target.value,
                                    )
                                }
                                isInvalid={!!errors.password_confirmation}
                                required
                            />
                            <InputGroup.Text
                                role="button"
                                onClick={() =>
                                    setShowConfirmPassword((prev) => !prev)
                                }
                                style={{ cursor: "pointer" }}
                            >
                                <i
                                    className={`bi ${
                                        showConfirmPassword
                                            ? "bi-eye-fill"
                                            : "bi-eye-slash"
                                    }`}
                                ></i>
                            </InputGroup.Text>
                        </InputGroup>
                        {errors.password_confirmation && (
                            <div className="auth-error">
                                {errors.password_confirmation}
                            </div>
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
                                Resetting...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-arrow-repeat me-2"></i>
                                Reset Password
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

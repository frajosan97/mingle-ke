import { Form, Button, Alert, Stack, InputGroup } from "react-bootstrap";
import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

import GuestLayout from "@/Layouts/GuestLayout";
import ApplicationLogo from "@/Components/ApplicationLogo";

export default function Register({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const [googleError, setGoogleError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    const handleGoogleSuccess = async (tokenResponse) => {
        setGoogleError("");
        try {
            await axios.post(route("google.verify"), {
                credential:
                    tokenResponse.credential || tokenResponse.access_token,
            });
            window.location.href = "/browse";
        } catch (err) {
            setGoogleError("Google sign-up failed. Please try again.");
        }
    };

    const handleGoogleError = () => {
        setGoogleError("Google sign-up was cancelled or failed.");
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="auth-card">
                {/* Logo + heading */}
                <div className="d-flex flex-column align-items-center text-center mb-4">
                    <Link
                        href="/"
                        className="d-inline-flex align-items-center gap-2 text-decoration-none mb-3"
                    >
                        <ApplicationLogo />
                    </Link>
                    <h3 className="auth-title text-white-50">Create Account</h3>
                </div>

                {/* Status / errors */}
                {status && (
                    <Alert variant="success" className="auth-alert">
                        {status}
                    </Alert>
                )}

                {googleError && (
                    <Alert variant="danger" className="auth-alert">
                        {googleError}
                    </Alert>
                )}

                {/* Google sign-in */}
                <div className="google-login-wrapper text-center mb-3">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        title="signup_with"
                        size="large"
                        theme="filled_black"
                        shape="pill"
                        locale="en"
                    />
                </div>

                {/* Divider */}
                <div className="auth-divider">
                    <span>Or</span>
                </div>

                {/* Register by email */}
                <Form onSubmit={submit} noValidate>
                    <Form.Group className="mb-3" controlId="name">
                        <InputGroup className="auth-input-group">
                            <InputGroup.Text>
                                <i className="bi bi-person-fill"></i>
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                name="name"
                                value={data.name}
                                autoComplete="name"
                                autoFocus
                                placeholder="Enter your name"
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                isInvalid={!!errors.name}
                                required
                            />
                        </InputGroup>
                        {errors.name && (
                            <div className="auth-error">{errors.name}</div>
                        )}
                    </Form.Group>

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
                                placeholder="••••••••"
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
                                placeholder="Confirm password"
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
                                Creating account...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-person-plus-fill me-2"></i>
                                Create Account
                            </>
                        )}
                    </Button>
                </Form>

                {/* Login link */}
                <p className="text-center text-muted-light small">
                    Already have an account?{" "}
                    <Link href={route("login")} className="text-gradient">
                        Sign in
                    </Link>
                </p>

                {/* Legal note */}
                <p className="text-center text-muted-light small">
                    By continuing, you agree to our{" "}
                    <Link href="/terms" className="text-gradient">
                        Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-gradient">
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </GuestLayout>
    );
}

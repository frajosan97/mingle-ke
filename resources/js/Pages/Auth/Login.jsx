import { Form, Button, Alert, Stack, InputGroup } from "react-bootstrap";
import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

import GuestLayout from "@/Layouts/GuestLayout";
import ApplicationLogo from "@/Components/ApplicationLogo";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const [googleError, setGoogleError] = useState("");
    const [loginMethod, setLoginMethod] = useState("otp");
    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    const handleGoogleSuccess = async (tokenResponse) => {
        setGoogleError("");
        try {
            await axios.post(route("google.verify"), {
                credential:
                    tokenResponse.credential || tokenResponse.access_token,
            });
            window.location.href = route("escort.index");
        } catch (err) {
            setGoogleError("Google sign-in failed. Please try again.");
        }
    };

    const handleGoogleError = () => {
        setGoogleError("Google sign-in was cancelled or failed.");
    };

    const toggleLoginMethod = () => {
        setLoginMethod((prev) => (prev === "otp" ? "password" : "otp"));
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="auth-card">
                {/* Logo + heading */}
                <div className="d-flex flex-column align-items-center text-center mb-4">
                    <Link
                        href="/"
                        className="d-inline-flex align-items-center gap-2 text-decoration-none mb-3"
                    >
                        <ApplicationLogo />
                    </Link>
                    <h3 className="auth-title text-white-50">Sign In</h3>
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
                        title="signin_with"
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

                {/* Login by email */}
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
                            />
                        </InputGroup>
                        {errors.email && (
                            <div className="auth-error">{errors.email}</div>
                        )}
                    </Form.Group>

                    {/* Password method — password field + remember/forgot */}
                    {loginMethod === "password" && (
                        <>
                            <Form.Group className="mb-3" controlId="password">
                                <InputGroup className="auth-input-group">
                                    <InputGroup.Text>
                                        <i className="bi bi-lock-fill"></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        name="password"
                                        value={data.password}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        isInvalid={!!errors.password}
                                    />
                                    <InputGroup.Text
                                        role="button"
                                        onClick={() =>
                                            setShowPassword((prev) => !prev)
                                        }
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
                                    <div className="auth-error">
                                        {errors.password}
                                    </div>
                                )}
                            </Form.Group>

                            <Stack
                                direction="horizontal"
                                className="justify-content-between align-items-center mb-4"
                            >
                                <Form.Check
                                    id="remember"
                                    className="auth-check"
                                    label="Remember me"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
                                />

                                <Link
                                    href={route("password.request")}
                                    className="text-gradient text-decoration-none"
                                >
                                    Forgot password?
                                </Link>
                            </Stack>
                        </>
                    )}

                    <Stack direction="horizontal">
                        <Button
                            variant="link"
                            type="button"
                            size="sm"
                            onClick={toggleLoginMethod}
                            className="text-gradient text-decoration-none p-0 mb-3"
                        >
                            {loginMethod === "otp"
                                ? "Login with password instead"
                                : "Login with OTP instead"}
                        </Button>
                    </Stack>

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
                                Signing in...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                {loginMethod === "otp" ? "Send OTP" : "Sign In"}
                            </>
                        )}
                    </Button>
                </Form>

                {/* Create an account */}
                <p className="text-center text-muted-light small">
                    Don't have an account?{" "}
                    <Link href={route("register")} className="text-gradient">
                        Create one free
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

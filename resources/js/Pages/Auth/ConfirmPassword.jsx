import { Form, Button, InputGroup } from "react-bootstrap";
import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";

import GuestLayout from "@/Layouts/GuestLayout";
import ApplicationLogo from "@/Components/ApplicationLogo";

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route("password.confirm"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

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
                        Confirm Password
                    </h3>
                </div>

                {/* Info note */}
                <p className="text-center text-muted-light small mb-4">
                    This is a secure area of the application. Please confirm
                    your password before continuing.
                </p>

                <Form onSubmit={submit} noValidate>
                    <Form.Group className="mb-3" controlId="password">
                        <InputGroup className="auth-input-group">
                            <InputGroup.Text>
                                <i className="bi bi-lock-fill"></i>
                            </InputGroup.Text>
                            <Form.Control
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={data.password}
                                autoComplete="current-password"
                                autoFocus
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
                                Confirming...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-shield-check me-2"></i>
                                Confirm
                            </>
                        )}
                    </Button>
                </Form>
            </div>
        </GuestLayout>
    );
}

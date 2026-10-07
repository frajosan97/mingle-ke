import { Form, Button, InputGroup } from "react-bootstrap";
import { useForm } from "@inertiajs/react";
import { useRef, useState } from "react";
import { Transition } from "@headlessui/react";

export default function UpdatePasswordForm() {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route("password.update"), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset("password", "password_confirmation");
                    passwordInput.current?.focus();
                }
                if (errors.current_password) {
                    reset("current_password");
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section>
            <header className="mb-3">
                <h4 className="auth-title text-white-50 mb-1">
                    Update Password
                </h4>
                <p className="text-muted-light small mb-0">
                    Ensure your account is using a long, random password to stay
                    secure.
                </p>
            </header>

            <Form onSubmit={updatePassword} noValidate>
                <Form.Group className="mb-3" controlId="current_password">
                    <InputGroup className="auth-input-group">
                        <InputGroup.Text>
                            <i className="bi bi-lock-fill"></i>
                        </InputGroup.Text>
                        <Form.Control
                            ref={currentPasswordInput}
                            type={showCurrent ? "text" : "password"}
                            name="current_password"
                            value={data.current_password}
                            autoComplete="current-password"
                            placeholder="Current password"
                            onChange={(e) =>
                                setData("current_password", e.target.value)
                            }
                            isInvalid={!!errors.current_password}
                        />
                        <InputGroup.Text
                            role="button"
                            onClick={() => setShowCurrent((p) => !p)}
                            style={{ cursor: "pointer" }}
                        >
                            <i
                                className={`bi ${
                                    showCurrent ? "bi-eye-fill" : "bi-eye-slash"
                                }`}
                            ></i>
                        </InputGroup.Text>
                    </InputGroup>
                    {errors.current_password && (
                        <div className="auth-error">
                            {errors.current_password}
                        </div>
                    )}
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                    <InputGroup className="auth-input-group">
                        <InputGroup.Text>
                            <i className="bi bi-key-fill"></i>
                        </InputGroup.Text>
                        <Form.Control
                            ref={passwordInput}
                            type={showNew ? "text" : "password"}
                            name="password"
                            value={data.password}
                            autoComplete="new-password"
                            placeholder="New password"
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            isInvalid={!!errors.password}
                        />
                        <InputGroup.Text
                            role="button"
                            onClick={() => setShowNew((p) => !p)}
                            style={{ cursor: "pointer" }}
                        >
                            <i
                                className={`bi ${
                                    showNew ? "bi-eye-fill" : "bi-eye-slash"
                                }`}
                            ></i>
                        </InputGroup.Text>
                    </InputGroup>
                    {errors.password && (
                        <div className="auth-error">{errors.password}</div>
                    )}
                </Form.Group>

                <Form.Group className="mb-3" controlId="password_confirmation">
                    <InputGroup className="auth-input-group">
                        <InputGroup.Text>
                            <i className="bi bi-shield-lock-fill"></i>
                        </InputGroup.Text>
                        <Form.Control
                            type={showConfirm ? "text" : "password"}
                            name="password_confirmation"
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            placeholder="Confirm password"
                            onChange={(e) =>
                                setData("password_confirmation", e.target.value)
                            }
                            isInvalid={!!errors.password_confirmation}
                        />
                        <InputGroup.Text
                            role="button"
                            onClick={() => setShowConfirm((p) => !p)}
                            style={{ cursor: "pointer" }}
                        >
                            <i
                                className={`bi ${
                                    showConfirm ? "bi-eye-fill" : "bi-eye-slash"
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

                <div className="d-flex align-items-center gap-3">
                    <Button
                        type="submit"
                        disabled={processing}
                        className="grad-btn rounded-pill border-0 fw-semibold px-4"
                    >
                        {processing ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-lg me-2"></i>
                                Save
                            </>
                        )}
                    </Button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <span className="text-success small">Saved.</span>
                    </Transition>
                </div>
            </Form>
        </section>
    );
}

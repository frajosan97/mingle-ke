import { Form, Button, Alert, InputGroup } from "react-bootstrap";
import { Link, useForm, usePage } from "@inertiajs/react";
import { Transition } from "@headlessui/react";

export default function UpdateProfileInformationForm({
    mustVerifyEmail,
    status,
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route("profile.update"));
    };

    return (
        <section>
            <header className="mb-3">
                <h4 className="auth-title text-white-50 mb-1">
                    Profile Information
                </h4>
                <p className="text-muted-light small mb-0">
                    Update your account's profile information and email address.
                </p>
            </header>

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
                            placeholder="Enter your name"
                            onChange={(e) => setData("name", e.target.value)}
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
                            onChange={(e) => setData("email", e.target.value)}
                            isInvalid={!!errors.email}
                            required
                        />
                    </InputGroup>
                    {errors.email && (
                        <div className="auth-error">{errors.email}</div>
                    )}
                </Form.Group>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <Alert variant="warning" className="auth-alert">
                        Your email address is unverified.{" "}
                        <Link
                            href={route("verification.send")}
                            method="post"
                            as="button"
                            className="btn btn-link p-0 text-gradient text-decoration-underline small"
                        >
                            Click here to re-send the verification email.
                        </Link>
                        {status === "verification-link-sent" && (
                            <div className="text-success small mt-2">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </Alert>
                )}

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

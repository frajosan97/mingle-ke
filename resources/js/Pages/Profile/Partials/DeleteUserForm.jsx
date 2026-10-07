import { Button, Modal, Form, InputGroup } from "react-bootstrap";
import { useForm } from "@inertiajs/react";
import { useRef, useState } from "react";

export default function DeleteUserForm() {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: "",
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route("profile.destroy"), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <section>
            <header className="mb-3">
                <h4 className="auth-title text-white-50 mb-1">
                    Delete Account
                </h4>
                <p className="text-muted-light small mb-0">
                    Once your account is deleted, all of its resources and data
                    will be permanently deleted. Before deleting your account,
                    please download any data or information that you wish to
                    retain.
                </p>
            </header>

            <Button
                variant="danger"
                className="rounded-pill fw-semibold px-4"
                onClick={confirmUserDeletion}
            >
                <i className="bi bi-trash-fill me-2"></i>
                Delete Account
            </Button>

            <Modal
                show={confirmingUserDeletion}
                onHide={closeModal}
                centered
                contentClassName="auth-card-modal"
            >
                <Form onSubmit={deleteUser}>
                    <Modal.Header closeButton closeVariant="white">
                        <Modal.Title className="auth-title text-white-50">
                            Are you sure you want to delete your account?
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <p className="text-muted-light small">
                            Once your account is deleted, all of its resources
                            and data will be permanently deleted. Please enter
                            your password to confirm you would like to
                            permanently delete your account.
                        </p>

                        <Form.Group controlId="password">
                            <InputGroup className="auth-input-group">
                                <InputGroup.Text>
                                    <i className="bi bi-lock-fill"></i>
                                </InputGroup.Text>
                                <Form.Control
                                    ref={passwordInput}
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    isInvalid={!!errors.password}
                                />
                            </InputGroup>
                            {errors.password && (
                                <div className="auth-error">
                                    {errors.password}
                                </div>
                            )}
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            className="rounded-pill"
                            onClick={closeModal}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="danger"
                            className="rounded-pill fw-semibold"
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-trash-fill me-2"></i>
                                    Delete Account
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </section>
    );
}

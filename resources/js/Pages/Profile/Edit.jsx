import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Container, Col } from "react-bootstrap";

import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={<h2 className="profile-page-title mb-0">Profile</h2>}
        >
            <Head title="Profile" />

            <div className="profile-page">
                <Container className="py-4">
                    <Col
                        md={10}
                        lg={8}
                        className="d-flex flex-column gap-4 mx-auto"
                    >
                        <div className="profile-section">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                            />
                        </div>

                        <div className="profile-section">
                            <UpdatePasswordForm />
                        </div>

                        <div className="profile-section">
                            <DeleteUserForm />
                        </div>
                    </Col>
                </Container>
            </div>
        </AuthenticatedLayout>
    );
}

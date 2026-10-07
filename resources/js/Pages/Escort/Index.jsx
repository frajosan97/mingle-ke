import EscortCard from "@/Components/Cards/EscortCard";
import EscortCardLoader from "@/Components/Skeleton/EscortCardLoader";
import useApiData from "@/Hooks/useApiData";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { Row, Col } from "react-bootstrap";

const SKELETON_COUNT = 12;

const EscortIndex = () => {
    const { auth } = usePage().props;

    const { escorts, isLoading, error, refreshEscorts } = useApiData({
        currentUserId: auth?.user?.id,
    });

    const showSkeletons = isLoading;
    const showError = !isLoading && !!error;
    const showEmpty = !isLoading && !error && escorts.length === 0;
    const showList = !isLoading && !error && escorts.length > 0;

    return (
        <AuthenticatedLayout>
            <Head title="Escorts" />

            <Row className="g-3 g-md-4 p-3">
                {showSkeletons &&
                    Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                        <Col key={`skeleton-${i}`} xs={6} sm={4} md={2}>
                            <EscortCardLoader />
                        </Col>
                    ))}

                {showError && (
                    <Col xs={12}>
                        <div className="text-center py-5 text-white-50">
                            <p className="mb-3">
                                Something went wrong. Please try again.
                            </p>
                            <button
                                type="button"
                                className="btn btn-outline-light btn-sm"
                                onClick={refreshEscorts}
                            >
                                Retry
                            </button>
                        </div>
                    </Col>
                )}

                {showEmpty && (
                    <Col xs={12}>
                        <div className="text-center py-5 text-white-50">
                            No escorts available right now.
                        </div>
                    </Col>
                )}

                {showList &&
                    escorts.map((escort) => (
                        <Col key={escort.id} xs={6} sm={4} md={2}>
                            <EscortCard e={escort} />
                        </Col>
                    ))}
            </Row>
        </AuthenticatedLayout>
    );
};

export default EscortIndex;

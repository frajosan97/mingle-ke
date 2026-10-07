import { Container, Row, Col } from "react-bootstrap";

export default function GuestLayout({ children }) {
    return (
        <div className="fixed-layout">
            <div
                className="fixed-layout-glow fixed-layout-glow-1"
                aria-hidden="true"
            />
            <div
                className="fixed-layout-glow fixed-layout-glow-2"
                aria-hidden="true"
            />

            <Container className="auth-layout-content">
                <Row className="justify-content-center align-items-center">
                    <Col xs={12} sm={10} md={8} lg={5} xl={4}>
                        {children}
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

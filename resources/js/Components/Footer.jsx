import { Link } from "@inertiajs/react";
import { Container, Row, Col, Form, Button, ListGroup } from "react-bootstrap";
import ApplicationLogo from "./ApplicationLogo";

const FOOTER_COLS = [
    {
        title: "Discover",
        links: [
            "VVIP Escorts",
            "Premium Escorts",
            "New Members",
            "Browse All",
            "Near Me",
        ],
    },
    {
        title: "Company",
        links: ["About Us", "Careers", "Press Kit", "Blog", "Contact"],
    },
    {
        title: "Support",
        links: [
            "Help Center",
            "Safety Tips",
            "Report User",
            "Coin Packs",
            "FAQ",
        ],
    },
    {
        title: "Legal",
        links: [
            "Terms of Service",
            "Privacy Policy",
            "Cookie Policy",
            "18+ Notice",
            "Refunds",
        ],
    },
];

const TRUST_ITEMS = [
    {
        icon: "bi-shield-lock-fill",
        title: "SSL Secured",
        sub: "256-bit encryption",
    },
    {
        icon: "bi-patch-check-fill",
        title: "Verified Profiles",
        sub: "ID-checked members",
    },
    { icon: "bi-phone-fill", title: "M-Pesa Ready", sub: "Instant payments" },
    { icon: "bi-headset", title: "24/7 Support", sub: "Always here to help" },
];

export default function Footer() {
    return (
        <footer className="footer-section">
            {/* LOVE PATTERN BACKGROUND */}
            <div className="footer-pattern">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="120"
                    height="120"
                    viewBox="0 0 120 120"
                >
                    <defs>
                        <pattern
                            id="lovePattern"
                            x="0"
                            y="0"
                            width="120"
                            height="120"
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d="M60 82 C 60 82, 30 62, 30 45 C 30 34, 39 26, 48 26 C 54 26, 58 30, 60 35 C 62 30, 66 26, 72 26 C 81 26, 90 34, 90 45 C 90 62, 60 82, 60 82 Z"
                                fill="none"
                                stroke="url(#heartGrad)"
                                strokeWidth="1.2"
                            />
                            <path
                                d="M25 30 C 25 30, 17 24, 17 17 C 17 13, 20 10, 24 10 C 26 10, 27 12, 25 15 C 23 12, 24 10, 26 10 C 30 10, 33 13, 33 17 C 33 24, 25 30, 25 30 Z"
                                fill="url(#heartGradFill)"
                                opacity="0.35"
                            />
                            <path
                                d="M96 96 C 96 96, 90 92, 90 87 C 90 84, 92 82, 95 82 C 96 82, 97 83, 96 85 C 95 83, 96 82, 97 82 C 100 82, 102 84, 102 87 C 102 92, 96 96, 96 96 Z"
                                fill="url(#heartGradFill)"
                                opacity="0.25"
                            />
                            <circle
                                cx="105"
                                cy="45"
                                r="1.2"
                                fill="#ff6b35"
                                opacity="0.4"
                            />
                            <circle
                                cx="15"
                                cy="70"
                                r="1"
                                fill="#ff2d75"
                                opacity="0.35"
                            />
                        </pattern>
                        <linearGradient
                            id="heartGrad"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#ff2d75"
                                stopOpacity="0.7"
                            />
                            <stop
                                offset="100%"
                                stopColor="#ff6b35"
                                stopOpacity="0.4"
                            />
                        </linearGradient>
                        <linearGradient
                            id="heartGradFill"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                        >
                            <stop offset="0%" stopColor="#ff2d75" />
                            <stop offset="100%" stopColor="#ffd700" />
                        </linearGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#lovePattern)" />
                </svg>
            </div>

            <div className="footer-glow"></div>
            <div className="footer-glow footer-glow-2"></div>

            <Container className="position-relative">
                {/* NEWSLETTER */}
                <div className="newsletter-card">
                    <Row className="align-items-center g-4">
                        <Col lg={6}>
                            <h3 className="newsletter-title mb-2">
                                Get <span className="grad">exclusive</span>{" "}
                                matches in your inbox
                            </h3>
                            <p className="newsletter-sub mb-0">
                                Weekly picks of verified VVIP & Premium members
                                near you.
                            </p>
                        </Col>
                        <Col lg={6}>
                            <Form
                                className="newsletter-form"
                                onSubmit={(e) => e.preventDefault()}
                            >
                                <div className="input-wrap">
                                    <i className="bi bi-envelope-fill"></i>
                                    <Form.Control
                                        type="email"
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="grad-btn border-0 px-4"
                                >
                                    Subscribe{" "}
                                    <i className="bi bi-arrow-right ms-1"></i>
                                </Button>
                            </Form>
                        </Col>
                    </Row>
                </div>

                {/* MAIN GRID */}
                <Row className="g-4 pt-5">
                    <Col lg={4}>
                        <Link
                            href="/"
                            className="d-flex align-items-center gap-2 mb-3 text-decoration-none"
                        >
                            <ApplicationLogo />
                        </Link>
                        <p
                            className="text-muted-light small mb-4"
                            style={{ maxWidth: 340 }}
                        >
                            Kenya's most trusted platform for real connections.
                            Meet verified singles, companions, and new friends
                            near you — safely and instantly.
                        </p>

                        <div className="d-flex flex-wrap gap-2 mb-4">
                            <a href="#" className="app-badge">
                                <i className="bi bi-apple"></i>
                                <div>
                                    <small>Download on the</small>
                                    <strong>App Store</strong>
                                </div>
                            </a>
                            <a href="#" className="app-badge">
                                <i className="bi bi-google-play"></i>
                                <div>
                                    <small>Get it on</small>
                                    <strong>Google Play</strong>
                                </div>
                            </a>
                        </div>

                        <div className="d-flex gap-2">
                            {[
                                "facebook",
                                "instagram",
                                "twitter-x",
                                "tiktok",
                                "whatsapp",
                            ].map((s, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="social-btn"
                                    aria-label={s}
                                >
                                    <i className={`bi bi-${s}`}></i>
                                </a>
                            ))}
                        </div>
                    </Col>

                    {FOOTER_COLS.map((col, i) => (
                        <Col xs={6} lg={2} key={i}>
                            <h6 className="footer-title">{col.title}</h6>
                            <ListGroup variant="flush" className="footer-links">
                                {col.links.map((l, j) => (
                                    <a
                                        key={j}
                                        href="#"
                                        className="footer-link-item"
                                    >
                                        <i className="bi bi-chevron-right"></i>{" "}
                                        {l}
                                    </a>
                                ))}
                            </ListGroup>
                        </Col>
                    ))}
                </Row>

                {/* TRUST STRIP */}
                <div className="trust-strip">
                    {TRUST_ITEMS.map((item, i) => (
                        <div className="trust-item" key={i}>
                            <i className={`bi ${item.icon}`}></i>
                            <div>
                                <strong>{item.title}</strong>
                                <small>{item.sub}</small>
                            </div>
                        </div>
                    ))}
                </div>

                <hr className="footer-divider my-4" />

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <p className="text-muted-light small mb-0">
                        © {new Date().getFullYear()} MingleKE. All rights
                        reserved. Made in Kenya 🇰🇪
                    </p>
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                        <span className="age-badge">
                            <i className="bi bi-exclamation-circle-fill"></i>{" "}
                            18+ Only
                        </span>
                        <span className="text-muted-light small">
                            <i className="bi bi-globe2 me-1"></i> English (KE)
                        </span>
                    </div>
                </div>
            </Container>
        </footer>
    );
}

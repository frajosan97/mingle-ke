import { Head, Link } from "@inertiajs/react";
import {
    Container,
    Row,
    Col,
    Button,
    Card,
    Badge,
    Stack,
} from "react-bootstrap";
import { motion } from "framer-motion";
import AppLayout from "@/Layouts/AppLayout";
import EscortCard from "@/Components/Cards/EscortCard";

const PREMIUM_ESCORTS = [
    {
        id: 1,
        img: 20,
        name: "Wanjiku",
        age: 24,
        dist: "0.8 km",
        area: "Westlands",
        tier: "premium",
        rating: 4.9,
        verified: true,
    },
    {
        id: 2,
        img: 45,
        name: "Aisha",
        age: 26,
        dist: "1.2 km",
        area: "Kilimani",
        tier: "premium",
        rating: 5.0,
        verified: true,
    },
    {
        id: 5,
        img: 44,
        name: "Cynthia",
        age: 27,
        dist: "3.4 km",
        area: "Karen",
        tier: "premium",
        rating: 4.8,
        verified: true,
    },
    {
        id: 9,
        img: 49,
        name: "Zawadi",
        age: 25,
        dist: "1.9 km",
        area: "Kileleshwa",
        tier: "premium",
        rating: 4.9,
        verified: true,
    },
];

const REGULAR_ESCORTS = [
    {
        id: 3,
        img: 47,
        name: "Brenda",
        age: 23,
        dist: "2.1 km",
        area: "Parklands",
        tier: "regular",
        rating: 4.7,
        verified: true,
    },
    {
        id: 4,
        img: 32,
        name: "Njeri",
        age: 25,
        dist: "2.6 km",
        area: "Lavington",
        tier: "regular",
        rating: 4.8,
        verified: true,
    },
    {
        id: 7,
        img: 31,
        name: "Sharon",
        age: 24,
        dist: "5.2 km",
        area: "South B",
        tier: "regular",
        rating: 4.6,
        verified: true,
    },
    {
        id: 10,
        img: 26,
        name: "Diana",
        age: 28,
        dist: "4.5 km",
        area: "Riverside",
        tier: "regular",
        rating: 4.9,
        verified: true,
    },
];

const HERO_PROFILES = [
    { img: 20, name: "Wanjiku, 24", dist: "0.8 km", tag: "PREMIUM" },
    { img: 45, name: "Brian, 28", dist: "1.2 km", tag: "Premium" },
    { img: 47, name: "Aisha, 26", dist: "2.1 km", tag: "Regular" },
];

const MARQUEE_ITEMS = [
    "Real-time GPS",
    "Verified profiles",
    "M-Pesa payments",
    "Instant chat",
    "Coin system",
    "PREMIUM priority",
    "24/7 support",
    "18+ only",
];

const TESTIMONIALS = [
    {
        img: 32,
        name: "Wanjiku M.",
        city: "Nairobi",
        text: "I met my partner here 6 months ago. The location feature made it so easy to find someone in my area.",
    },
    {
        img: 12,
        name: "Brian O.",
        city: "Mombasa",
        text: "Premium is worth every shilling. The priority ranking means my profile actually gets seen.",
    },
    {
        img: 47,
        name: "Aisha K.",
        city: "Kisumu",
        text: "Finally an app built for Kenya. M-Pesa payments make it so simple. Highly recommend!",
    },
];

// Reusable animation variants
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, delay, ease: "easeOut" },
    }),
};

export default function Home() {
    return (
        <AppLayout>
            <Head title="MingleKE — Meet Someone Near You" />

            {/* HERO */}
            <section className="hero-section">
                <div className="hero-glow hero-glow-1"></div>
                <div className="hero-glow hero-glow-2"></div>
                <div className="hero-glow hero-glow-3"></div>

                <i className="bi bi-heart-fill float-heart h1"></i>
                <i className="bi bi-heart-fill float-heart h2"></i>
                <i className="bi bi-heart-fill float-heart h3"></i>

                <Container className="position-relative">
                    <Row className="align-items-center min-vh-100 py-5">
                        <Col lg={6} className="text-center text-lg-start">
                            <motion.h1
                                className="hero-title mb-4"
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                custom={0}
                            >
                                Find{" "}
                                <span className="text-gradient animated-gradient">
                                    Real Connections
                                </span>{" "}
                                Near You
                            </motion.h1>

                            <motion.p
                                className="hero-subtitle mb-4"
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                custom={0.1}
                            >
                                Discover singles, companions, and new friends
                                within your neighborhood. Real-time location.
                                Verified profiles. Instant chat.
                            </motion.p>

                            <motion.div
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                custom={0.2}
                            >
                                <Stack
                                    direction="horizontal"
                                    gap={3}
                                    className="justify-content-center justify-content-lg-start flex-wrap mb-4"
                                >
                                    <Button
                                        as={Link}
                                        href="/register"
                                        size="lg"
                                        className="btn-gradient pulse-btn rounded-pill fw-semibold border-0 px-4 py-3"
                                    >
                                        <i className="bi bi-heart-fill me-2"></i>{" "}
                                        Start Free Today
                                    </Button>
                                    <Button
                                        href="#premium"
                                        variant="outline-light"
                                        size="lg"
                                        className="rounded-pill px-4 py-3"
                                    >
                                        <i className="bi bi-play-circle me-2"></i>{" "}
                                        Browse Nearby
                                    </Button>
                                </Stack>
                            </motion.div>

                            <motion.div
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                custom={0.3}
                            >
                                <Stack
                                    direction="horizontal"
                                    gap={3}
                                    className="justify-content-center justify-content-lg-start"
                                >
                                    <div className="avatar-stack">
                                        <img
                                            src="https://i.pravatar.cc/60?img=1"
                                            alt=""
                                        />
                                        <img
                                            src="https://i.pravatar.cc/60?img=5"
                                            alt=""
                                        />
                                        <img
                                            src="https://i.pravatar.cc/60?img=12"
                                            alt=""
                                        />
                                        <img
                                            src="https://i.pravatar.cc/60?img=32"
                                            alt=""
                                        />
                                        <span className="avatar-more">
                                            +12K
                                        </span>
                                    </div>
                                    <div className="text-start">
                                        <div className="fw-bold text-white">
                                            12,000+ Members
                                        </div>
                                        <div className="small text-muted-light">
                                            joined this month
                                        </div>
                                    </div>
                                </Stack>
                            </motion.div>
                        </Col>

                        <Col
                            lg={6}
                            className="d-none d-lg-flex justify-content-center position-relative"
                        >
                            <motion.div
                                className="phone-mockup"
                                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    duration: 0.7,
                                    delay: 0.2,
                                    ease: "easeOut",
                                }}
                            >
                                <div className="phone-notch"></div>
                                <div className="phone-screen">
                                    <div className="phone-header">
                                        <i className="bi bi-geo-alt-fill text-gradient"></i>
                                        <span>Nearby • 2km</span>
                                        <span className="ms-auto live-badge">
                                            <span className="pulse-dot-sm"></span>{" "}
                                            LIVE
                                        </span>
                                    </div>

                                    {HERO_PROFILES.map((u, i) => (
                                        <div key={i} className="match-card">
                                            <img
                                                src={`https://i.pravatar.cc/60?img=${u.img}`}
                                                alt=""
                                            />
                                            <div className="flex-grow-1">
                                                <div className="fw-bold text-white small">
                                                    {u.name}
                                                </div>
                                                <div
                                                    className="text-muted-light"
                                                    style={{
                                                        fontSize: "0.7rem",
                                                    }}
                                                >
                                                    <i className="bi bi-geo-alt"></i>{" "}
                                                    {u.dist} away
                                                </div>
                                            </div>
                                            <span
                                                className={`tag-badge tag-${u.tag.toLowerCase()}`}
                                            >
                                                {u.tag}
                                            </span>
                                        </div>
                                    ))}

                                    <div className="chat-preview">
                                        <i className="bi bi-chat-dots-fill text-gradient"></i>
                                        <span>New message from Wanjiku...</span>
                                        <span className="chat-dots">
                                            <i></i>
                                            <i></i>
                                            <i></i>
                                        </span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="float-card fc-1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                            >
                                <i className="bi bi-heart-fill"></i>
                                <div>
                                    <div className="fc-title">New Match!</div>
                                    <div className="fc-sub">
                                        Aisha liked you
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="float-card fc-2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.0, duration: 0.5 }}
                            >
                                <i className="bi bi-geo-alt-fill"></i>
                                <div>
                                    <div className="fc-title">3 nearby</div>
                                    <div className="fc-sub">within 1km</div>
                                </div>
                            </motion.div>
                        </Col>
                    </Row>
                </Container>

                {/* MARQUEE */}
                <div className="marquee">
                    <div className="marquee-track">
                        {[...Array(2)].map((_, k) => (
                            <div className="marquee-group" key={k}>
                                {MARQUEE_ITEMS.map((t, i) => (
                                    <span key={i}>
                                        <i className="bi bi-check-circle-fill"></i>{" "}
                                        {t}
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PREMIUM ESCORTS */}
            <section id="premium" className="py-5 section-pad">
                <Container>
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                    >
                        <div className="section-head">
                            <div>
                                <Badge className="pill-premium mb-2" bg="">
                                    <i className="bi bi-crown-fill me-1"></i>{" "}
                                    PREMIUM
                                </Badge>
                                <h2 className="section-title mb-0">
                                    PREMIUM Escorts Near You
                                </h2>
                                <p className="section-desc">
                                    Top-tier, verified, and always prioritized
                                    in your search.
                                </p>
                            </div>
                            <Link
                                href="/browse?tier=premium"
                                className="see-all"
                            >
                                See All <i className="bi bi-arrow-right"></i>
                            </Link>
                        </div>
                    </motion.div>

                    <Row className="g-3">
                        {PREMIUM_ESCORTS.map((e, i) => (
                            <Col xs={6} md={4} lg={3} key={e.id}>
                                <EscortCard
                                    e={e}
                                    tier="premium"
                                    delay={i * 0.06}
                                />
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* REGULAR ESCORTS */}
            <section id="regular" className="py-5 section-pad">
                <Container>
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                    >
                        <div className="section-head">
                            <div>
                                <Badge className="pill-regular mb-2" bg="">
                                    <i className="bi bi-star-fill me-1"></i>{" "}
                                    Premium
                                </Badge>
                                <h2 className="section-title mb-0">
                                    Premium Escorts Near You
                                </h2>
                                <p className="section-desc">
                                    Verified members with priority ranking and
                                    extra perks.
                                </p>
                            </div>
                            <Link
                                href="/browse?tier=regular"
                                className="see-all"
                            >
                                See All <i className="bi bi-arrow-right"></i>
                            </Link>
                        </div>
                    </motion.div>

                    <Row className="g-3">
                        {REGULAR_ESCORTS.map((e, i) => (
                            <Col xs={6} md={4} lg={3} key={e.id}>
                                <EscortCard e={e} delay={i * 0.06} />
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* TESTIMONIALS */}
            <section className="py-5 section-pad">
                <Container>
                    <motion.div
                        className="text-center mb-5"
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                    >
                        <Badge className="section-tag" bg="">
                            Stories
                        </Badge>
                        <h2 className="section-title mt-3 mb-2">
                            Real People. Real Connections.
                        </h2>
                        <p className="section-desc mx-auto">
                            Thousands of Kenyans finding meaningful
                            relationships every day.
                        </p>
                    </motion.div>

                    <Row className="g-4">
                        {TESTIMONIALS.map((t, i) => (
                            <Col md={4} key={i}>
                                <motion.div
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.2 }}
                                    custom={i * 0.1}
                                >
                                    <Card className="testimonial-card border-0 h-100">
                                        <i className="bi bi-quote quote-icon"></i>
                                        <div className="text-warning mb-3">
                                            {[...Array(5)].map((_, j) => (
                                                <i
                                                    key={j}
                                                    className="bi bi-star-fill"
                                                ></i>
                                            ))}
                                        </div>
                                        <p className="testimonial-text">
                                            "{t.text}"
                                        </p>
                                        <Stack
                                            direction="horizontal"
                                            gap={3}
                                            className="align-items-center mt-4"
                                        >
                                            <div className="testimonial-avatar">
                                                <img
                                                    src={`https://i.pravatar.cc/50?img=${t.img}`}
                                                    alt=""
                                                />
                                                <span className="verified-tick">
                                                    <i className="bi bi-check"></i>
                                                </span>
                                            </div>
                                            <div>
                                                <div className="fw-bold text-white">
                                                    {t.name}
                                                </div>
                                                <div className="small text-muted-light">
                                                    <i className="bi bi-geo-alt-fill me-1"></i>
                                                    {t.city}
                                                </div>
                                            </div>
                                        </Stack>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>
        </AppLayout>
    );
}

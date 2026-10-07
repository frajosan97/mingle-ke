// resources/js/Layouts/AuthenticatedLayout.jsx
import ApplicationLogo from "@/Components/ApplicationLogo";
import { useGpsLocation } from "@/Hooks/useGpsLocation";
import { usePresence } from "@/Hooks/usePresence";
import { Link, router, usePage } from "@inertiajs/react";
import { useCallback, useMemo, useState } from "react";
import {
    Button,
    Image,
    Nav,
    Navbar,
    Tooltip,
    OverlayTrigger,
    Container,
    Row,
    Col,
    Stack,
} from "react-bootstrap";
import { Toaster } from "react-hot-toast";

const RAIL_TOP_ITEMS = [
    {
        key: "chats",
        icon: "bi-chat-left-text-fill",
        label: "Chats",
        route: "conversations.index",
    },
    {
        key: "calls",
        icon: "bi-telephone-fill",
        label: "Calls",
        route: "call.index",
    },
    {
        key: "escorts",
        icon: "bi-people-fill",
        label: "Escorts",
        route: "escort.index",
    },
    {
        key: "favourites",
        icon: "bi-heart-fill",
        label: "Favourites",
        route: "favourite.index",
    },
    {
        key: "reviews",
        icon: "bi-star-fill",
        label: "Reviews",
        route: "review.index",
    },
];

const RAIL_BOTTOM_ITEMS = [
    { key: "wallet", icon: "bi-coin", label: "Wallet", route: "wallet.index" },
    {
        key: "subscription",
        icon: "bi-gem",
        label: "Subscription",
        route: "subscriptions.index",
    },
];

const RAIL_WIDTH = 72;
const RAIL_BUTTON_SIZE = 40;
const TOPBAR_HEIGHT = 56;

export default function AuthenticatedLayout({
    header,
    children,
    activeRail: controlledRail,
}) {
    const user = usePage().props.auth?.user;

    useGpsLocation({ enabled: !!user });

    // ⭐ Presence lives at the layout level — active for the whole
    //    authenticated session, across every page.
    const { sendOffline } = usePresence(user?.id);

    const [internalRail, setInternalRail] = useState("chats");
    const activeRail = controlledRail ?? internalRail;

    const railBottomItems = useMemo(
        () => [
            ...RAIL_BOTTOM_ITEMS,
            {
                key: "you",
                imagePath:
                    user?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user?.name ?? "User",
                    )}&background=ff2d75&color=fff`,
                label: "You",
                route: "profile.edit",
            },
        ],
        [user?.avatar, user?.name],
    );

    const handleRailClick = useCallback(
        (item) => {
            if (!controlledRail) setInternalRail(item.key);
            if (item.route) router.visit(route(item.route));
        },
        [controlledRail],
    );

    /**
     * ⭐ Logout flow:
     *   1. Fire /presence/offline via sendBeacon (fire-and-forget).
     *   2. Give the beacon ~50ms to leave the browser.
     *   3. POST /logout and redirect.
     *
     * Beacon is used because the browser may unload the page during
     * the logout redirect — an axios call could be cancelled.
     */
    const handleLogout = useCallback(
        (e) => {
            e?.preventDefault?.();

            sendOffline(true);

            setTimeout(() => {
                router.post(route("logout"));
            }, 50);
        },
        [sendOffline],
    );

    const renderRailItem = (item) => {
        const isActive = activeRail === item.key;

        return (
            <OverlayTrigger
                key={item.key}
                placement="right"
                overlay={<Tooltip>{item.label}</Tooltip>}
            >
                <Button
                    type="button"
                    variant="light"
                    onClick={() => handleRailClick(item)}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    className={`d-inline-flex align-items-center justify-content-center rounded-circle border-0 p-0 flex-shrink-0 app-rail-btn ${
                        isActive ? "app-rail-btn-active" : ""
                    }`}
                    style={{
                        width: RAIL_BUTTON_SIZE,
                        height: RAIL_BUTTON_SIZE,
                    }}
                >
                    {item.imagePath ? (
                        <Image
                            src={item.imagePath}
                            roundedCircle
                            width={32}
                            height={32}
                            alt=""
                            style={{ objectFit: "cover" }}
                        />
                    ) : (
                        <i
                            className={`bi ${item.icon}`}
                            aria-hidden="true"
                            style={{ fontSize: "1.15rem", lineHeight: 1 }}
                        />
                    )}
                </Button>
            </OverlayTrigger>
        );
    };

    return (
        <Container
            fluid
            className="vh-100 d-flex flex-column p-0 overflow-hidden app-shell"
        >
            <Toaster
                position="top-right"
                toastOptions={{ duration: 4000, style: { fontSize: "0.9rem" } }}
            />

            <Navbar
                expand={false}
                className="app-topbar px-3 flex-shrink-0"
                style={{ height: TOPBAR_HEIGHT }}
            >
                <Navbar.Brand
                    as={Link}
                    href="/"
                    className="d-inline-flex align-items-center m-0 p-0"
                    aria-label="Home"
                >
                    <ApplicationLogo />
                </Navbar.Brand>

                <Stack direction="horizontal" gap={1} className="ms-auto">
                    {/* ⭐ Logout — fires offline first */}
                    <OverlayTrigger
                        placement="bottom"
                        overlay={<Tooltip>Log out</Tooltip>}
                    >
                        <Button
                            type="button"
                            variant="light"
                            className="app-topbar-btn d-inline-flex align-items-center justify-content-center border-0 p-0"
                            aria-label="Log out"
                            style={{ width: 36, height: 36 }}
                            onClick={handleLogout}
                        >
                            <i
                                className="bi bi-box-arrow-right"
                                aria-hidden="true"
                            />
                        </Button>
                    </OverlayTrigger>
                </Stack>
            </Navbar>

            <Row
                className="g-0 flex-grow-1 overflow-hidden"
                style={{ minHeight: 0 }}
            >
                <Col
                    xs="auto"
                    className="app-rail d-none d-md-flex flex-column h-100"
                    style={{
                        width: RAIL_WIDTH,
                        minWidth: RAIL_WIDTH,
                        minHeight: 0,
                    }}
                >
                    <Nav
                        as="div"
                        className="d-flex flex-column align-items-center gap-2 py-3 flex-grow-1"
                        style={{
                            overflowY: "auto",
                            overflowX: "hidden",
                            minHeight: 0,
                        }}
                        role="navigation"
                        aria-label="Primary navigation"
                    >
                        {RAIL_TOP_ITEMS.map(renderRailItem)}
                    </Nav>

                    <Nav
                        as="div"
                        className="d-flex flex-column align-items-center gap-2 pt-2 pb-3 flex-shrink-0"
                        aria-label="Secondary navigation"
                    >
                        {railBottomItems.map(renderRailItem)}
                    </Nav>
                </Col>

                <Col
                    className="d-flex flex-column h-100 app-main"
                    style={{ minWidth: 0, minHeight: 0, overflow: "hidden" }}
                >
                    {header && (
                        <div className="app-header px-4 py-3 flex-shrink-0">
                            {header}
                        </div>
                    )}

                    <div
                        className="flex-grow-1 d-flex flex-column"
                        style={{ minWidth: 0, minHeight: 0 }}
                    >
                        {children}
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

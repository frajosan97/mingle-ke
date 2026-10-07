import { Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Container, Navbar, Nav, Button, Dropdown } from "react-bootstrap";
import ApplicationLogo from "./ApplicationLogo";

export default function MainNav({ fluid = false }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <Navbar
            fixed="top"
            expand="lg"
            className={`app-navbar py-3 py-3 ${scrolled ? "scrolled" : ""}`}
        >
            <Container fluid={fluid}>
                <Navbar.Brand as={Link} href="/">
                    <ApplicationLogo />
                </Navbar.Brand>

                <Navbar.Toggle
                    aria-controls="nav"
                    className="border-0 shadow-none"
                >
                    <i className="bi bi-list fs-2 text-white"></i>
                </Navbar.Toggle>

                <Navbar.Collapse id="nav">
                    <Nav className="ms-auto align-items-lg-center gap-lg-3">
                        <Nav.Link href="/#vvip" className="app-nav-link">
                            VVIP
                        </Nav.Link>
                        <Nav.Link href="/#premium" className="app-nav-link">
                            Premium
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            href={route("escort.index")}
                            className="app-nav-link"
                        >
                            Browse All
                        </Nav.Link>

                        {user ? (
                            <Dropdown align="end">
                                <Dropdown.Toggle
                                    as="div"
                                    className="user-chip"
                                    role="button"
                                >
                                    <img
                                        src={
                                            user.avatar ||
                                            `https://ui-avatars.com/api/?name=${user.name}&background=ff2d75&color=fff`
                                        }
                                        alt={user.name}
                                        className="user-avatar"
                                    />
                                    <span className="d-none d-lg-inline">
                                        {user.name.split(" ")[0]}
                                    </span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="user-dropdown">
                                    <Dropdown.Item as={Link} href="/profile">
                                        <i className="bi bi-person me-2"></i> My
                                        Profile
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        as={Link}
                                        href={route("conversations.index")}
                                    >
                                        <i className="bi bi-chat-left me-2"></i>{" "}
                                        My Chats
                                    </Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item
                                        as={Link}
                                        href="/logout"
                                        method="post"
                                    >
                                        <i className="bi bi-box-arrow-right me-2"></i>{" "}
                                        Log Out
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        ) : (
                            <>
                                <Nav.Link
                                    as={Link}
                                    href="/login"
                                    className="app-nav-link"
                                >
                                    Login
                                </Nav.Link>
                                <Nav.Item>
                                    <Button
                                        as={Link}
                                        href="/register"
                                        className="grad-btn px-4 py-2 rounded-pill border-0"
                                    >
                                        Join Free
                                    </Button>
                                </Nav.Item>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

import { Card, Placeholder } from "react-bootstrap";

const EscortCardLoader = () => {
    return (
        <Card className="escort-card border-0">
            {/* Photo skeleton */}
            <div className="escort-photo skeleton-photo">
                <Placeholder
                    as="div"
                    animation="glow"
                    className="w-100 h-100"
                    style={{ backgroundColor: "transparent" }}
                >
                    <Placeholder
                        xs={12}
                        style={{ height: "100%", borderRadius: 0 }}
                    />
                </Placeholder>

                {/* Tier badge skeleton */}
                <Placeholder
                    as="div"
                    animation="glow"
                    className="position-absolute"
                    style={{ top: 10, left: 10 }}
                >
                    <Placeholder xs={8} style={{ height: 22, width: 90 }} />
                </Placeholder>

                {/* Online dot skeleton */}
                <Placeholder
                    as="span"
                    animation="glow"
                    className="position-absolute rounded-circle"
                    style={{
                        top: 12,
                        right: 12,
                        width: 14,
                        height: 14,
                    }}
                />

                {/* Verified badge skeleton */}
                <Placeholder
                    as="span"
                    animation="glow"
                    className="position-absolute rounded-circle"
                    style={{
                        top: 12,
                        right: 34,
                        width: 20,
                        height: 20,
                    }}
                />

                {/* Rating chip skeleton */}
                <Placeholder
                    as="div"
                    animation="glow"
                    className="position-absolute"
                    style={{ bottom: 10, right: 10 }}
                >
                    <Placeholder xs={8} style={{ height: 22, width: 50 }} />
                </Placeholder>
            </div>

            {/* Info skeleton */}
            <Card.Body className="escort-info">
                {/* Name, age */}
                <Placeholder as="div" animation="glow" className="mb-2">
                    <Placeholder xs={7} style={{ height: 18 }} />
                </Placeholder>

                {/* Distance · Area */}
                <Placeholder as="div" animation="glow">
                    <Placeholder xs={9} style={{ height: 14 }} />
                </Placeholder>
            </Card.Body>
        </Card>
    );
};

export default EscortCardLoader;

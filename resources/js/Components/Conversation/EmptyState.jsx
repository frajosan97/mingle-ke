// resources/js/Components/Conversation/EmptyState.jsx
import { Button, Stack } from "react-bootstrap";

const EMPTY_ACTIONS = [
    { icon: "bi-search-heart", label: "Find someone" },
    { icon: "bi-people", label: "Browse escorts" },
    { icon: "bi-shield-check", label: "Safety tips" },
];

export default function EmptyState({ onAction }) {
    return (
        <div
            className="chat-empty flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-4 h-100"
            style={{ minHeight: 0 }}
        >
            <Stack
                direction="horizontal"
                gap={3}
                className="justify-content-center flex-wrap position-relative"
                style={{ zIndex: 1 }}
            >
                {EMPTY_ACTIONS.map(({ icon, label }) => (
                    <Button
                        key={label}
                        variant="light"
                        onClick={() => onAction?.(label)}
                        className="chat-empty-action d-flex flex-column align-items-center gap-2 border-0 bg-transparent px-3 py-2"
                    >
                        <span
                            className="chat-empty-action-icon d-inline-flex align-items-center justify-content-center rounded-circle"
                            style={{ width: 56, height: 56 }}
                        >
                            <i
                                className={`bi ${icon} fs-4`}
                                aria-hidden="true"
                            />
                        </span>
                        <span className="small chat-empty-action-label">
                            {label}
                        </span>
                    </Button>
                ))}
            </Stack>
        </div>
    );
}

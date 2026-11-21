
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
} from "react";

interface UseSidebarDragOptions {
    enabled?: boolean;
    storageKey?: string;
    defaultWidth?: number;
    minWidth?: number;
    maxWidth?: number;
}

export function useSidebarDrag({
    enabled = true,
    storageKey = "settings-sidebar-width",
    defaultWidth = 375,
    minWidth = 260,
    maxWidth = 550,
}: UseSidebarDragOptions = {}) {
    const [width, setWidth] = useState(defaultWidth);
    const [isDragging, setIsDragging] = useState(false);

    const sidebarRef = useRef<HTMLElement>(null);

    const isDraggingRef = useRef(false);
    const dragStartX = useRef(0);
    const dragStartWidth = useRef(defaultWidth);
    const widthRef = useRef(defaultWidth);

    const clampWidth = useCallback(
        (value: number) =>
            Math.min(maxWidth, Math.max(minWidth, value)),
        [minWidth, maxWidth],
    );

    // Restore saved width.
    useEffect(() => {
        try {
            const savedWidth = localStorage.getItem(storageKey);

            if (savedWidth === null) {
                const initialWidth = clampWidth(defaultWidth);

                widthRef.current = initialWidth;
                dragStartWidth.current = initialWidth;
                setWidth(initialWidth);

                return;
            }

            const parsedWidth = Number(savedWidth);

            if (!Number.isFinite(parsedWidth) || parsedWidth <= 0) {
                return;
            }

            const restoredWidth = clampWidth(parsedWidth);

            widthRef.current = restoredWidth;
            dragStartWidth.current = restoredWidth;
            setWidth(restoredWidth);
        } catch {
            // Ignore localStorage errors.
        }
    }, [storageKey, defaultWidth, clampWidth]);

    // Update width without waiting for a React render.
    const updateWidth = useCallback(
        (value: number) => {
            const nextWidth = clampWidth(value);

            widthRef.current = nextWidth;
            setWidth(nextWidth);
        },
        [clampWidth],
    );

    // Persist the current width.
    const saveWidth = useCallback(() => {
        try {
            localStorage.setItem(storageKey, String(widthRef.current));
        } catch {
            // Ignore localStorage errors.
        }
    }, [storageKey]);

    // Begin resizing.
    const handlePointerDown = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (!enabled || event.button !== 0) return;
            if (isDraggingRef.current) return;

            event.preventDefault();

            isDraggingRef.current = true;

            dragStartX.current = event.clientX;
            dragStartWidth.current = widthRef.current;

            setIsDragging(true);

            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";

            if (sidebarRef.current) {
                sidebarRef.current.style.transition = "none";
            }

            event.currentTarget.setPointerCapture(event.pointerId);
        },
        [enabled],
    );

    // Resize relative to the original pointer position.
    const handlePointerMove = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (!isDraggingRef.current) return;

            const deltaX = event.clientX - dragStartX.current;

            updateWidth(dragStartWidth.current + deltaX);
        },
        [updateWidth],
    );

    // Finish resizing.
    const handlePointerUp = useCallback(() => {
        if (!isDraggingRef.current) return;

        isDraggingRef.current = false;

        setIsDragging(false);

        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        if (sidebarRef.current) {
            sidebarRef.current.style.transition = "";
        }

        saveWidth();
    }, [saveWidth]);

    // Reset to the configured default width.
    const resetWidth = useCallback(() => {
        if (isDraggingRef.current) return;

        updateWidth(defaultWidth);
        saveWidth();
    }, [defaultWidth, saveWidth, updateWidth]);

    // Cleanup.
    useEffect(() => {
        return () => {
            isDraggingRef.current = false;

            document.body.style.cursor = "";
            document.body.style.userSelect = "";

            if (sidebarRef.current) {
                sidebarRef.current.style.transition = "";
            }
        };
    }, []);

    return {
        width,
        isDragging,
        sidebarRef,
        resetWidth,

        resizeHandleProps: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerCancel: handlePointerUp,
            onLostPointerCapture: handlePointerUp,
            onDoubleClick: resetWidth,
        },
    };
}

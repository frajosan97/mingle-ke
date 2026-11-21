
import { useCallback, useEffect, useState } from "react";

interface UseSidebarCollapseOptions {
    storageKey?: string;
    defaultCollapsed?: boolean;
}

export function useSidebarCollapse({
    storageKey = "settings-sidebar-collapsed",
    defaultCollapsed = false,
}: UseSidebarCollapseOptions = {}) {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    // Restore the saved collapse preference.
    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);

            setIsCollapsed(
                saved === null ? defaultCollapsed : saved === "true",
            );
        } catch {
            // Local storage may be unavailable.
            setIsCollapsed(defaultCollapsed);
        }
    }, [storageKey, defaultCollapsed]);

    // Update state and persist the preference.
    const setCollapsed = useCallback(
        (collapsed: boolean) => {
            setIsCollapsed(collapsed);

            try {
                localStorage.setItem(storageKey, String(collapsed));
            } catch {
                // Local storage may be unavailable.
            }
        },
        [storageKey],
    );

    // Toggle collapse state.
    const toggleCollapse = useCallback(() => {
        setIsCollapsed((current) => {
            const next = !current;

            try {
                localStorage.setItem(storageKey, String(next));
            } catch {
                // Local storage may be unavailable.
            }

            return next;
        });
    }, [storageKey]);

    const expand = useCallback(() => {
        setCollapsed(false);
    }, [setCollapsed]);

    const collapse = useCallback(() => {
        setCollapsed(true);
    }, [setCollapsed]);

    return {
        isCollapsed,
        toggleCollapse,
        expand,
        collapse,
    };
}

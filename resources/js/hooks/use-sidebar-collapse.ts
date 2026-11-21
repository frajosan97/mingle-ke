import { useEffect, useState } from "react";

const STORAGE_KEY = "settings-sidebar-collapsed";

export function useSidebarCollapse() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Restore saved collapse preference.
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            setIsCollapsed(saved === "true");
        } catch {
            // Local storage may be unavailable.
        }
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed((current) => {
            const next = !current;

            try {
                localStorage.setItem(STORAGE_KEY, String(next));
            } catch {
                // Local storage may be unavailable.
            }

            return next;
        });
    };

    const expand = () => {
        setIsCollapsed(false);

        try {
            localStorage.setItem(STORAGE_KEY, "false");
        } catch {
            // Local storage may be unavailable.
        }
    };

    const collapse = () => {
        setIsCollapsed(true);

        try {
            localStorage.setItem(STORAGE_KEY, "true");
        } catch {
            // Local storage may be unavailable.
        }
    };

    return {
        isCollapsed,
        toggleCollapse,
        expand,
        collapse,
    };
}
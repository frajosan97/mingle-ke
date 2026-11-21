// resources/js/lib/nav-items.ts
import { MessageCircle, Compass, BadgeCheck, Wallet, Home, LayoutDashboard } from "lucide-react";
import type { NavItem } from "@/types";

export type AppNavItem = NavItem & {
    isProfile?: boolean;
};

export function buildNavItems(url: string): AppNavItem[] {
    return [
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            isActive: url.startsWith("/dashboard"),
        },
        {
            title: "Messages",
            href: "/conversations",
            icon: MessageCircle,
            isActive: url.startsWith("/conversations"),
        },
        {
            title: "Escorts",
            href: "/escorts",
            icon: Compass,
            isActive: url.startsWith("/escorts"),
        },
        {
            title: "Wallet",
            href: "/wallets",
            icon: Wallet,
            isActive: url.startsWith("/wallets"),
        },
    ];
}


export function isProfileActive(url: string): boolean {
    return url.startsWith("/settings");
}

/** Mobile nav = desktop items + profile tab */
export function buildMobileNavItems(url: string): AppNavItem[] {
    return [
        ...buildNavItems(url),
        {
            title: "Settings",
            href: "/settings",
            icon: BadgeCheck,
            isActive: isProfileActive(url),
            isProfile: true,
        },
    ];
}
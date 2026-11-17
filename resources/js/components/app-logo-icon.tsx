import type { ImgHTMLAttributes } from "react";

export default function AppLogoIcon({
    className,
    alt = "GBV Logo",
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <>
            <img
                src="/logos/light-mode-logo.png"
                alt={alt}
                {...props}
                className={`block dark:hidden ${className ?? ""}`}
            />
            <img
                src="/logos/dark-mode-logo.png"
                alt={alt}
                {...props}
                className={`hidden dark:block ${className ?? ""}`}
            />
        </>
    );
}

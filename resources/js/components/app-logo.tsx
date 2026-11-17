import AppLogoIcon from "@/components/app-logo-icon";

interface AppLogoProps {
    className?: string;
}

export default function AppLogo({ className }: AppLogoProps) {
    return (
        <div className="flex items-center">
            <AppLogoIcon
                className={className ?? "h-10 w-auto object-contain"}
            />
        </div>
    );
}

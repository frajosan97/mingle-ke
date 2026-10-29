import { usePage } from "@inertiajs/react";
import { Heart } from "lucide-react";

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-glow-pink">
                <Heart
                    className="h-5 w-5 fill-white text-white"
                    aria-hidden="true"
                />
            </div>
            <span className="text-base font-extrabold tracking-tight text-foreground">
                Mingle
                <span className="text-gradient-brand">KE</span>
            </span>
        </div>
    );
}

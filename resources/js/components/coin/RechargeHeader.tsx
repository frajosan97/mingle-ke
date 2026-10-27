// resources/js/components/coin/RechargeHeader.tsx
import { Info } from "lucide-react";

export default function RechargeHeader() {
    return (
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-base font-bold text-foreground sm:text-lg">
                Recharge
            </h2>
            <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-semibold text-brand-green">
                Save ~25% on fees
            </span>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
    );
}

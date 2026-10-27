// resources/js/components/coin/PackageGrid.tsx
import PackageCard from "./PackageCard";
import { COIN_PACKAGES } from "@/types/coin";

interface Props {
    selectedId: number;
    isCustomValid: boolean;
    customAmount: string;
    customPrice: number;
    onSelect: (id: number) => void;
    onCustomChange: (value: string) => void;
}

export default function PackageGrid({
    selectedId,
    isCustomValid,
    customAmount,
    customPrice,
    onSelect,
    onCustomChange,
}: Props) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {COIN_PACKAGES.map((pkg) => (
                <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    isSelected={selectedId === pkg.id}
                    isCustomValid={isCustomValid}
                    customAmount={customAmount}
                    customPrice={customPrice}
                    onSelect={() => onSelect(pkg.id)}
                    onCustomChange={onCustomChange}
                />
            ))}
        </div>
    );
}

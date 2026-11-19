import { MapPin } from "lucide-react";
import { SelectField, CheckboxField } from "@/components/ui/fields";
import {
    AVAILABILITY_STATUSES,
    type EscortProfile,
    type AvailabilityStatus,
} from "@/types/escort";

type Props = {
    value: Pick<
        EscortProfile,
        "availability_status" | "is_available" | "incall" | "outcall"
    >;
    errors: Record<string, string>;
    onChange: <K extends keyof Props["value"]>(
        key: K,
        value: Props["value"][K],
    ) => void;
};

export default function AvailabilityTab({ value, errors, onChange }: Props) {
    return (
        <div className="space-y-6">
            <SelectField
                label="Status"
                name="availability_status"
                icon={MapPin}
                value={value.availability_status}
                onChange={(v) =>
                    onChange(
                        "availability_status",
                        (v ?? "offline") as AvailabilityStatus,
                    )
                }
                options={AVAILABILITY_STATUSES}
                error={errors.availability_status}
                placeholder="Select status"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <CheckboxField
                    label="Available now"
                    name="is_available"
                    checked={value.is_available}
                    onChange={(c) => onChange("is_available", c)}
                    description="Show as online right now."
                />
                <CheckboxField
                    label="Incall"
                    name="incall"
                    checked={value.incall}
                    onChange={(c) => onChange("incall", c)}
                    description="Clients come to you."
                />
                <CheckboxField
                    label="Outcall"
                    name="outcall"
                    checked={value.outcall}
                    onChange={(c) => onChange("outcall", c)}
                    description="You travel to clients."
                />
            </div>
        </div>
    );
}

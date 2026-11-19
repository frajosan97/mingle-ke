import { Input } from "@/components/ui/input";
import { CURRENCIES, toOptions, type EscortProfile } from "@/types/escort";
import { Field, SelectField } from "@/components/ui/fields";

type Props = {
    value: Pick<
        EscortProfile,
        "currency" | "rate_15min" | "rate_30min" | "rate_1hour" | "rate_night"
    >;
    errors: Record<string, string>;
    onChange: <K extends keyof Props["value"]>(
        key: K,
        value: Props["value"][K],
    ) => void;
};

const RATE_FIELDS = [
    { name: "rate_15min", label: "15 minutes" },
    { name: "rate_30min", label: "30 minutes" },
    { name: "rate_1hour", label: "1 hour" },
    { name: "rate_night", label: "Overnight" },
] as const;

export default function RatesTab({ value, errors, onChange }: Props) {
    return (
        <div className="space-y-6">
            <SelectField
                label="Currency"
                name="currency"
                value={value.currency}
                onChange={(v) => onChange("currency", v ?? "KES")}
                options={toOptions(CURRENCIES)}
                error={errors.currency}
                placeholder="Select currency"
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {RATE_FIELDS.map(({ name, label }) => (
                    <Field
                        key={name}
                        label={label}
                        htmlFor={name}
                        error={errors[name]}
                    >
                        <Input
                            id={name}
                            type="number"
                            min={0}
                            value={value[name] ?? ""}
                            onChange={(e) =>
                                onChange(
                                    name,
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                            placeholder="0"
                        />
                    </Field>
                ))}
            </div>
        </div>
    );
}

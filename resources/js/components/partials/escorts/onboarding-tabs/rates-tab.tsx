import { Input } from "@/components/ui/input";
import CustomReactSelect from "@/components/custom-react-select";
import { CURRENCIES, toOptions, type EscortProfile } from "@/types/escort";
import { Field } from "@/components/ui/fields";

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
            <Field label="Currency" htmlFor="currency" error={errors.currency}>
                <CustomReactSelect
                    id="currency"
                    value={value.currency ?? "KES"}
                    onChange={(v) => onChange("currency", v || "KES")}
                    options={toOptions(CURRENCIES)}
                    placeholder="Select currency"
                />
            </Field>

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

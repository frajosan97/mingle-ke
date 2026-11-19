import { Input } from "@/components/ui/input";
import { User as UserIcon } from "lucide-react";
import { Field, SelectField, CheckboxField } from "@/components/ui/fields";
import {
    BODY_TYPES,
    ETHNICITIES,
    EYE_COLORS,
    HAIR_COLORS,
    ORIENTATIONS,
    toOptions,
} from "@/types/escort";
import type { EscortProfile } from "@/types/escort";

type Props = {
    value: Pick<
        EscortProfile,
        | "orientation"
        | "body_type"
        | "height_cm"
        | "weight_kg"
        | "hair_color"
        | "eye_color"
        | "ethnicity"
        | "smoking"
        | "drinking"
    >;
    errors: Record<string, string>;
    onChange: <K extends keyof Props["value"]>(
        key: K,
        value: Props["value"][K],
    ) => void;
};

export default function AppearanceTab({ value, errors, onChange }: Props) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <SelectField
                    label="Orientation"
                    name="orientation"
                    icon={UserIcon}
                    value={value.orientation}
                    onChange={(v) => onChange("orientation", v)}
                    options={toOptions(ORIENTATIONS)}
                    error={errors.orientation}
                />
                <SelectField
                    label="Body type"
                    name="body_type"
                    value={value.body_type}
                    onChange={(v) => onChange("body_type", v)}
                    options={toOptions(BODY_TYPES)}
                    error={errors.body_type}
                />

                <Field
                    label="Height (cm)"
                    htmlFor="height_cm"
                    error={errors.height_cm}
                >
                    <Input
                        id="height_cm"
                        type="number"
                        min={100}
                        max={250}
                        value={value.height_cm ?? ""}
                        onChange={(e) =>
                            onChange(
                                "height_cm",
                                e.target.value ? Number(e.target.value) : null,
                            )
                        }
                        placeholder="e.g. 170"
                    />
                </Field>
                <Field
                    label="Weight (kg)"
                    htmlFor="weight_kg"
                    error={errors.weight_kg}
                >
                    <Input
                        id="weight_kg"
                        type="number"
                        min={30}
                        max={200}
                        value={value.weight_kg ?? ""}
                        onChange={(e) =>
                            onChange(
                                "weight_kg",
                                e.target.value ? Number(e.target.value) : null,
                            )
                        }
                        placeholder="e.g. 60"
                    />
                </Field>

                <SelectField
                    label="Hair color"
                    name="hair_color"
                    value={value.hair_color}
                    onChange={(v) => onChange("hair_color", v)}
                    options={toOptions(HAIR_COLORS)}
                    error={errors.hair_color}
                />
                <SelectField
                    label="Eye color"
                    name="eye_color"
                    value={value.eye_color}
                    onChange={(v) => onChange("eye_color", v)}
                    options={toOptions(EYE_COLORS)}
                    error={errors.eye_color}
                />
                <SelectField
                    label="Ethnicity"
                    name="ethnicity"
                    value={value.ethnicity}
                    onChange={(v) => onChange("ethnicity", v)}
                    options={toOptions(ETHNICITIES)}
                    error={errors.ethnicity}
                />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CheckboxField
                    label="Smoking"
                    name="smoking"
                    checked={value.smoking}
                    onChange={(c) => onChange("smoking", c)}
                />
                <CheckboxField
                    label="Drinking"
                    name="drinking"
                    checked={value.drinking}
                    onChange={(c) => onChange("drinking", c)}
                />
            </div>
        </div>
    );
}

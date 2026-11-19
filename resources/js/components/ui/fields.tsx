// resources/js/components/settings/fields.tsx
import Select from "react-select";
import { Label } from "@/components/ui/label";
import { buildSelectStyles } from "@/components/ui/select-styles";
import type { Option } from "@/types/escort";
import InputError from "@/components/input-error";

const selectStyles = buildSelectStyles<Option, false>({ menuIsPortal: false });

export function Field({
    label,
    htmlFor,
    icon: Icon,
    hint,
    error,
    children,
}: {
    label: string;
    htmlFor?: string;
    icon?: React.ComponentType<{ className?: string }>;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label
                htmlFor={htmlFor}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
            >
                {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                {label}
            </Label>
            {children}
            {hint && !error && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            <InputError message={error} />
        </div>
    );
}

export function SelectField({
    label,
    name,
    value,
    onChange,
    options,
    error,
    placeholder = "Prefer not to say",
    icon,
}: {
    label: string;
    name: string;
    value: string | null;
    onChange: (v: string | null) => void;
    options: Option[];
    error?: string;
    placeholder?: string;
    icon?: React.ComponentType<{ className?: string }>;
}) {
    const current = options.find((o) => o.value === value) ?? null;
    return (
        <Field label={label} htmlFor={name} icon={icon} error={error}>
            <Select<Option, false>
                inputId={name}
                name={name}
                options={options}
                value={current}
                onChange={(opt) => onChange(opt?.value ?? null)}
                placeholder={placeholder}
                isClearable
                isSearchable={false}
                styles={selectStyles}
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
            />
        </Field>
    );
}

export function CheckboxField({
    label,
    name,
    checked,
    onChange,
    description,
}: {
    label: string;
    name: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description?: string;
}) {
    return (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3 transition hover:border-brand-pink/40">
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-pink"
            />
            <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                    {label}
                </span>
                {description && (
                    <span className="block text-xs text-muted-foreground">
                        {description}
                    </span>
                )}
            </span>
        </label>
    );
}

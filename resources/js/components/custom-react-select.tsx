// resources/js/components/custom-react-select.tsx
import Select, { type SingleValue, type StylesConfig } from "react-select";

export type SelectOption = {
    value: string;
    label: string;
};

type Props = {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    isDisabled?: boolean;
    isClearable?: boolean;
};

// Tailwind v4 exposes theme tokens as --color-*; they're already oklch().
// No `as const` — properties widen to `string` so they can be reassigned.
const C = {
    background: "var(--color-background)",
    foreground: "var(--color-foreground)",
    popover: "var(--color-popover)",
    popoverForeground: "var(--color-popover-foreground)",
    primary: "var(--color-primary)",
    primaryForeground: "var(--color-primary-foreground)",
    accent: "var(--color-accent)",
    accentForeground: "var(--color-accent-foreground)",
    mutedForeground: "var(--color-muted-foreground)",
    border: "var(--color-border)",
    input: "var(--color-input)",
    ring: "var(--color-ring)",
};

const styles: StylesConfig<SelectOption, false> = {
    control: (base, state) => ({
        ...base,
        minHeight: "2.25rem",
        backgroundColor: C.background,
        borderColor: state.isFocused ? C.ring : C.input,
        boxShadow: state.isFocused
            ? `0 0 0 2px color-mix(in oklch, ${C.ring} 30%, transparent)`
            : "none",
        "&:hover": { borderColor: C.input },
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: C.popover,
        color: C.popoverForeground,
        border: `1px solid ${C.border}`,
        borderRadius: "0.5rem",
        overflow: "hidden",
        zIndex: 50,
    }),
    // Explicit solid bg — default is transparent
    menuList: (base) => ({
        ...base,
        backgroundColor: C.popover,
        padding: 0,
    }),
    option: (base, state) => {
        let backgroundColor: string = C.popover;
        let color: string = C.popoverForeground;

        if (state.isSelected) {
            backgroundColor = C.primary;
            color = C.primaryForeground;
        } else if (state.isFocused) {
            backgroundColor = C.accent;
            color = C.accentForeground;
        }

        return {
            ...base,
            backgroundColor,
            color,
            cursor: "pointer",
            padding: "0.5rem 0.75rem",
            ":active": { backgroundColor },
        };
    },
    singleValue: (base) => ({ ...base, color: C.foreground }),
    placeholder: (base) => ({ ...base, color: C.mutedForeground }),
    input: (base) => ({ ...base, color: C.foreground }),
    dropdownIndicator: (base) => ({
        ...base,
        color: C.mutedForeground,
        "&:hover": { color: C.foreground },
    }),
    indicatorSeparator: (base) => ({
        ...base,
        backgroundColor: C.border,
    }),
    noOptionsMessage: (base) => ({
        ...base,
        color: C.mutedForeground,
    }),
};

export default function CustomReactSelect({
    id,
    value,
    onChange,
    options,
    placeholder,
    isDisabled,
    isClearable,
}: Props) {
    const selected = options.find((o) => o.value === value) ?? null;

    return (
        <Select<SelectOption, false>
            inputId={id}
            instanceId={id} // <-- FIX: Prevents SSR hydration mismatch from random IDs
            value={selected}
            onChange={(opt: SingleValue<SelectOption>) =>
                onChange(opt?.value ?? "")
            }
            options={options}
            placeholder={placeholder}
            isDisabled={isDisabled}
            isClearable={isClearable}
            styles={styles}
            classNamePrefix="system-select"
        />
    );
}

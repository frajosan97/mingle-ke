// resources/js/components/ui/select-styles.ts
import type { GroupBase, StylesConfig } from "react-select";

export function buildSelectStyles<Option, IsMulti extends boolean = false>({
    menuIsPortal = true,
}: { menuIsPortal?: boolean } = {}): StylesConfig<Option, IsMulti, GroupBase<Option>> {
    return {
        control: (base, state) => ({
            ...base,
            backgroundColor: "var(--background)",
            borderColor: state.isFocused ? "var(--brand-pink-strong)" : "var(--border)",
            borderRadius: "9999px",
            minHeight: 38,
            boxShadow: state.isFocused ? "0 0 0 2px var(--brand-pink-soft)" : "none",
            paddingLeft: 4,
            paddingRight: 4,
            transition: "border-color 150ms, box-shadow 150ms",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            opacity: state.isDisabled ? 0.6 : 1,
            "&:hover": { borderColor: "var(--border)" },
        }),
        valueContainer: (base) => ({ ...base, paddingLeft: 10, paddingRight: 4, gap: 4 }),
        singleValue: (base) => ({ ...base, color: "var(--foreground)", fontSize: 14 }),
        multiValue: (base) => ({ ...base, backgroundColor: "var(--brand-pink-soft)", borderRadius: 6 }),
        multiValueLabel: (base) => ({ ...base, color: "var(--brand-pink)", fontSize: 13, fontWeight: 600 }),
        multiValueRemove: (base) => ({
            ...base,
            color: "var(--brand-pink)",
            "&:hover": { backgroundColor: "var(--brand-pink-strong)", color: "var(--foreground)" },
        }),
        placeholder: (base) => ({ ...base, color: "var(--muted-foreground)", fontSize: 14 }),
        input: (base) => ({ ...base, color: "var(--foreground)", fontSize: 14 }),
        menu: (base) => ({
            ...base,
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: menuIsPortal
                ? "0 10px 30px -10px rgba(0,0,0,.25), 0 4px 8px -4px rgba(0,0,0,.15)"
                : "0 4px 12px -4px rgba(0,0,0,.15)",
            zIndex: 9999,
        }),
        menuList: (base) => ({
            ...base,
            backgroundColor: "var(--card)",
            paddingTop: 4,
            paddingBottom: 4,
            maxHeight: 260,
        }),
        menuPortal: (base) => ({ ...base, zIndex: 10000 }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? "var(--brand-pink-soft)"
                : state.isFocused
                    ? "var(--accent)"
                    : "transparent",
            color: state.isSelected ? "var(--brand-pink)" : "var(--foreground)",
            fontSize: 14,
            padding: "8px 12px",
            cursor: "pointer",
            "&:active": { backgroundColor: "var(--accent)" },
        }),
        indicatorSeparator: () => ({ display: "none" }),
        dropdownIndicator: (base) => ({
            ...base,
            color: "var(--muted-foreground)",
            padding: 4,
            "&:hover": { color: "var(--foreground)" },
        }),
        clearIndicator: (base) => ({
            ...base,
            color: "var(--muted-foreground)",
            padding: 4,
            "&:hover": { color: "var(--destructive)" },
        }),
        loadingIndicator: (base) => ({ ...base, color: "var(--brand-pink)" }),
        noOptionsMessage: (base) => ({ ...base, color: "var(--muted-foreground)", fontSize: 13 }),
        loadingMessage: (base) => ({ ...base, color: "var(--muted-foreground)", fontSize: 13 }),
    };
}
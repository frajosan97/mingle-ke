// resources/js/components/ui/filter-bar.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import Select, { type SingleValue, type MultiValue } from "react-select";
import { MoreVertical, SlidersHorizontal, X } from "lucide-react";
import { buildSelectStyles } from "./select-styles";
import { useLocations } from "@/hooks/use-locations";

/* ═══════════ Option + Select primitives ═══════════ */

export interface FilterOption<V = string> {
    value: V;
    label: string;
    description?: string;
    badge?: string;
    isDisabled?: boolean;
}

export interface FilterSelectProps<V = string> {
    options: FilterOption<V>[];
    value: V | null;
    onChange: (value: V | null) => void;
    placeholder?: string;
    isClearable?: boolean;
    isSearchable?: boolean;
    isDisabled?: boolean;
    isLoading?: boolean;
    className?: string;
    noOptionsMessage?: string;
    menuPlacement?: "auto" | "top" | "bottom";
    usePortal?: boolean;
}

export function FilterSelect<V = string>({
    options,
    value,
    onChange,
    placeholder = "Select…",
    isClearable = true,
    isSearchable = true,
    isDisabled = false,
    isLoading = false,
    className,
    noOptionsMessage = "No matches",
    menuPlacement = "auto",
    usePortal = true,
}: FilterSelectProps<V>) {
    const selected = options.find((o) => o.value === value) ?? null;
    return (
        <div className={className}>
            <Select<FilterOption<V>, false>
                options={options}
                value={selected}
                onChange={(opt: SingleValue<FilterOption<V>>) =>
                    onChange(opt ? opt.value : null)
                }
                placeholder={placeholder}
                isClearable={isClearable}
                isSearchable={isSearchable}
                isDisabled={isDisabled}
                isLoading={isLoading}
                styles={buildSelectStyles<FilterOption<V>, false>({
                    menuIsPortal: usePortal,
                })}
                menuPlacement={menuPlacement}
                menuPortalTarget={
                    usePortal && typeof document !== "undefined"
                        ? document.body
                        : undefined
                }
                formatOptionLabel={(option, { context }) => (
                    <OptionRow
                        label={option.label}
                        description={option.description}
                        badge={option.badge}
                        compact={context === "value"}
                    />
                )}
                noOptionsMessage={() => noOptionsMessage}
                classNamePrefix="filter-select"
            />
        </div>
    );
}

export interface FilterSelectMultiProps<V = string> {
    options: FilterOption<V>[];
    value: V[];
    onChange: (value: V[]) => void;
    placeholder?: string;
    isSearchable?: boolean;
    isDisabled?: boolean;
    isLoading?: boolean;
    className?: string;
    noOptionsMessage?: string;
    menuPlacement?: "auto" | "top" | "bottom";
    usePortal?: boolean;
    maxSelected?: number;
}

export function FilterSelectMulti<V = string>({
    options,
    value,
    onChange,
    placeholder = "Select…",
    isSearchable = true,
    isDisabled = false,
    isLoading = false,
    className,
    noOptionsMessage = "No matches",
    menuPlacement = "auto",
    usePortal = true,
    maxSelected,
}: FilterSelectMultiProps<V>) {
    const selected = options.filter((o) => value.includes(o.value));
    return (
        <div className={className}>
            <Select<FilterOption<V>, true>
                options={options}
                value={selected}
                onChange={(opts: MultiValue<FilterOption<V>>) =>
                    onChange(opts.map((o) => o.value))
                }
                placeholder={placeholder}
                isSearchable={isSearchable}
                isDisabled={isDisabled}
                isLoading={isLoading}
                isOptionDisabled={() =>
                    maxSelected !== undefined && value.length >= maxSelected
                }
                isMulti
                closeMenuOnSelect={false}
                styles={buildSelectStyles<FilterOption<V>, true>({
                    menuIsPortal: usePortal,
                })}
                menuPlacement={menuPlacement}
                menuPortalTarget={
                    usePortal && typeof document !== "undefined"
                        ? document.body
                        : undefined
                }
                formatOptionLabel={(option, { context }) => (
                    <OptionRow
                        label={option.label}
                        description={option.description}
                        badge={option.badge}
                        compact={context === "value"}
                    />
                )}
                noOptionsMessage={() => noOptionsMessage}
                classNamePrefix="filter-select"
            />
        </div>
    );
}

function OptionRow({
    label,
    description,
    badge,
    compact,
}: {
    label: string;
    description?: string;
    badge?: string;
    compact?: boolean;
}) {
    if (!description && !badge) return <span>{label}</span>;
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
                <div className="truncate text-sm font-medium">{label}</div>
                {description && !compact && (
                    <div className="truncate text-xs text-muted-foreground">
                        {description}
                    </div>
                )}
            </div>
            {badge && (
                <span className="shrink-0 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {badge}
                </span>
            )}
        </div>
    );
}

/* ═══════════ Filter bar ═══════════ */

const RADIUS_OPTIONS: FilterOption<string>[] = [
    { value: "10", label: "Within 10 km" },
    { value: "25", label: "Within 25 km" },
    { value: "50", label: "Within 50 km" },
    { value: "100", label: "Within 100 km" },
    { value: "250", label: "Within 250 km" },
    { value: "any", label: "Any distance" },
];

const GENDER_OPTIONS: FilterOption<string>[] = [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
    { value: "other", label: "Other" },
];

const SERVICE_OPTIONS: FilterOption<string>[] = [
    "Girlfriend Experience (GFE)",
    "Boyfriend Experience (BFE)",
    "Dinner dates",
    "Overnight",
    "Massage",
    "Role play",
    "Couples",
    "Travel companion",
    "Photo / video shoots",
    "Companionship only",
].map((s) => ({ value: s, label: s }));

/* Kenyan communities / ethnic groups */
const ETHNICITY_OPTIONS: FilterOption<string>[] = [
    "Kikuyu",
    "Luhya",
    "Kalenjin",
    "Luo",
    "Kamba",
    "Kisii",
    "Meru",
    "Mijikenda",
    "Maasai",
    "Turkana",
    "Somali",
    "Taita",
    "Embu",
    "Samburu",
    "Other",
].map((s) => ({ value: s, label: s }));

const BODY_TYPE_OPTIONS: FilterOption<string>[] = [
    "Slim",
    "Athletic",
    "Average",
    "Curvy",
    "Muscular",
    "Plus-size",
].map((s) => ({ value: s, label: s }));

const TIER_OPTIONS: FilterOption<string>[] = [
    { value: "premium", label: "Premium", badge: "★" },
    { value: "regular", label: "Regular" },
];

export interface DiscoverFilters {
    radius: string;
    county: string | null;
    town: string | null;
    gender: string | null;
    service: string | null;
    ethnicity: string | null;
    body_type: string | null;
    age_min: number | null;
    age_max: number | null;
    tier: string | null;
    incall: boolean;
    outcall: boolean;
}

interface FilterBarProps {
    filters: DiscoverFilters;
    onChange?: (filters: DiscoverFilters) => void;
}

/** Advanced filters that live inside the more panel. */
const ADVANCED_KEYS: (keyof DiscoverFilters)[] = [
    "age_min",
    "age_max",
    "body_type",
    "ethnicity",
    "tier",
    "incall",
    "outcall",
];

/** Inline controls in priority order (least → most likely to overflow). */
type InlineKey = "radius" | "county" | "town" | "gender" | "service";

const INLINE_WIDTHS: Record<InlineKey, number> = {
    radius: 170,
    county: 170,
    town: 170,
    gender: 160,
    service: 210,
};

const GAP = 12; // gap-3
const PADDING_X = 24; // px-3 * 2
const DOTS_WIDTH = 38; // more button
const CLEAR_WIDTH = 70; // approximate — only reserved when activeCount > 0

export function FilterBar({ filters, onChange }: FilterBarProps) {
    const {
        counties,
        loading: locationsLoading,
        error: locationsError,
    } = useLocations();

    /* ── Container measurement ───────────────────────────── */
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        ro.observe(el);
        setContainerWidth(el.getBoundingClientRect().width);
        return () => ro.disconnect();
    }, []);

    /* ── More panel state ────────────────────────────────── */
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);
    const dotsRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!moreOpen) return;
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (moreRef.current?.contains(t)) return;
            if (dotsRef.current?.contains(t)) return;
            setMoreOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMoreOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [moreOpen]);

    /* ── County / town cascade ───────────────────────────── */
    const countyOptions: FilterOption<string>[] = useMemo(
        () =>
            (Array.isArray(counties) ? counties : []).map((c) => ({
                value: c.name,
                label: c.name,
            })),
        [counties],
    );

    const townOptions: FilterOption<string>[] = useMemo(() => {
        if (!filters.county) return [];
        const county = (Array.isArray(counties) ? counties : []).find(
            (c) => c.name === filters.county,
        );
        if (!county || !Array.isArray(county.towns)) return [];
        return county.towns.map((t) => ({
            value: t.name,
            label: t.name,
            badge: t.is_major ? "★" : undefined,
        }));
    }, [counties, filters.county]);

    const townPlaceholder = !filters.county
        ? "Pick a county first"
        : townOptions.length === 0
          ? "No towns in this county"
          : `All towns in ${filters.county}`;

    /* ── Counters ────────────────────────────────────────── */
    const totalActive = useMemo(
        () =>
            [
                filters.county,
                filters.town,
                filters.gender,
                filters.service,
                filters.ethnicity,
                filters.body_type,
                filters.age_min,
                filters.age_max,
                filters.tier,
                filters.incall ? 1 : null,
                filters.outcall ? 1 : null,
            ].filter(Boolean).length,
        [filters],
    );

    const advancedCount = useMemo(
        () =>
            ADVANCED_KEYS.filter((k) => {
                const v = filters[k];
                return (
                    v === true ||
                    (typeof v === "string" && v.length > 0) ||
                    typeof v === "number"
                );
            }).length,
        [filters],
    );

    /* ── Responsive overflow calc ────────────────────────── */
    const { visible, hidden } = useMemo(() => {
        if (!containerWidth) {
            // First paint — show everything, observer will catch up.
            return {
                visible: Object.keys(INLINE_WIDTHS) as InlineKey[],
                hidden: [] as InlineKey[],
            };
        }

        const reserveClear = totalActive > 0 ? CLEAR_WIDTH : 0;
        // Always reserve space for label badge + dots button
        let budget =
            containerWidth - PADDING_X - DOTS_WIDTH - reserveClear - GAP * 2;

        const order = Object.keys(INLINE_WIDTHS) as InlineKey[];
        const vis: InlineKey[] = [];
        const hid: InlineKey[] = [];

        for (const key of order) {
            const need = INLINE_WIDTHS[key] + GAP;
            if (budget - need >= 0) {
                vis.push(key);
                budget -= need;
            } else {
                hid.push(key);
            }
        }

        return { visible: vis, hidden: hid };
    }, [containerWidth, totalActive]);

    /* ── Navigation ──────────────────────────────────────── */
    function update(partial: Partial<DiscoverFilters>) {
        const next = { ...filters, ...partial };
        onChange?.(next);
        const clean: Record<string, unknown> = {};
        Object.entries(next).forEach(([k, v]) => {
            if (v === null || v === undefined || v === "" || v === false)
                return;
            clean[k] = v;
        });
        router.get("/discover", clean as any, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }

    function clearAll() {
        router.get("/discover", {}, { preserveScroll: true, replace: true });
    }

    function clearAdvanced() {
        const reset: Partial<DiscoverFilters> = {};
        ADVANCED_KEYS.forEach((k) => {
            (reset as any)[k] =
                k === "incall" || k === "outcall" ? false : null;
        });
        update(reset);
    }

    const radiusValue = filters.radius ?? "50";

    const dotsBadge = advancedCount + hidden.length;

    /* ── Inline control renderers ────────────────────────── */
    const renderInline = (k: InlineKey): React.ReactNode => {
        switch (k) {
            case "radius":
                return (
                    <div key={k} className="w-[170px] shrink-0">
                        <FilterSelect
                            options={RADIUS_OPTIONS}
                            value={radiusValue}
                            onChange={(v) => update({ radius: v ?? "50" })}
                            placeholder="Distance"
                            isClearable={false}
                            isSearchable={false}
                        />
                    </div>
                );
            case "county":
                return (
                    <div key={k} className="w-[170px] shrink-0">
                        <FilterSelect<string>
                            options={countyOptions}
                            value={filters.county}
                            onChange={(v) => update({ county: v, town: null })}
                            placeholder={
                                locationsLoading
                                    ? "Loading counties…"
                                    : locationsError
                                      ? "Could not load"
                                      : "All counties"
                            }
                            isLoading={locationsLoading}
                            isDisabled={
                                locationsLoading || countyOptions.length === 0
                            }
                            noOptionsMessage={
                                locationsError ?? "No counties found"
                            }
                            isSearchable={countyOptions.length > 8}
                        />
                    </div>
                );
            case "town":
                return (
                    <div key={k} className="w-[170px] shrink-0">
                        <FilterSelect<string>
                            options={townOptions}
                            value={filters.town}
                            onChange={(v) => update({ town: v })}
                            placeholder={townPlaceholder}
                            isDisabled={
                                !filters.county || townOptions.length === 0
                            }
                            noOptionsMessage="No towns here"
                            isSearchable={townOptions.length > 8}
                        />
                    </div>
                );
            case "gender":
                return (
                    <div key={k} className="w-[160px] shrink-0">
                        <FilterSelect
                            options={GENDER_OPTIONS}
                            value={filters.gender}
                            onChange={(v) => update({ gender: v })}
                            placeholder="Any gender"
                            isSearchable={false}
                        />
                    </div>
                );
            case "service":
                return (
                    <div key={k} className="w-[210px] shrink-0">
                        <FilterSelect
                            options={SERVICE_OPTIONS}
                            value={filters.service}
                            onChange={(v) => update({ service: v })}
                            placeholder="Any service"
                        />
                    </div>
                );
        }
    };

    /* ── Hidden-control renderers (in popover) ───────────── */
    const renderHidden = (k: InlineKey): React.ReactNode => {
        switch (k) {
            case "radius":
                return (
                    <LabeledRow key={k} label="Distance">
                        <FilterSelect
                            options={RADIUS_OPTIONS}
                            value={radiusValue}
                            onChange={(v) => update({ radius: v ?? "50" })}
                            isClearable={false}
                            isSearchable={false}
                        />
                    </LabeledRow>
                );
            case "county":
                return (
                    <LabeledRow key={k} label="County">
                        <FilterSelect<string>
                            options={countyOptions}
                            value={filters.county}
                            onChange={(v) => update({ county: v, town: null })}
                            placeholder="All counties"
                            isLoading={locationsLoading}
                            isDisabled={
                                locationsLoading || countyOptions.length === 0
                            }
                            isSearchable={countyOptions.length > 8}
                        />
                    </LabeledRow>
                );
            case "town":
                return (
                    <LabeledRow key={k} label="Town">
                        <FilterSelect<string>
                            options={townOptions}
                            value={filters.town}
                            onChange={(v) => update({ town: v })}
                            placeholder={townPlaceholder}
                            isDisabled={
                                !filters.county || townOptions.length === 0
                            }
                            isSearchable={townOptions.length > 8}
                        />
                    </LabeledRow>
                );
            case "gender":
                return (
                    <LabeledRow key={k} label="Gender">
                        <FilterSelect
                            options={GENDER_OPTIONS}
                            value={filters.gender}
                            onChange={(v) => update({ gender: v })}
                            isSearchable={false}
                        />
                    </LabeledRow>
                );
            case "service":
                return (
                    <LabeledRow key={k} label="Service">
                        <FilterSelect
                            options={SERVICE_OPTIONS}
                            value={filters.service}
                            onChange={(v) => update({ service: v })}
                        />
                    </LabeledRow>
                );
        }
    };

    return (
        <div className="relative z-30 mb-6">
            <div
                ref={containerRef}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-3"
            >
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-pink">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                    {totalActive > 0 && (
                        <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-pink px-1 text-[10px] text-white">
                            {totalActive}
                        </span>
                    )}
                </span>

                {visible.map((k) => renderInline(k))}

                {/* More (dots) — anchored */}
                <div className="static shrink-0">
                    <button
                        ref={dotsRef}
                        type="button"
                        onClick={() => setMoreOpen((o) => !o)}
                        aria-label="More filters"
                        aria-expanded={moreOpen}
                        className={`relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border transition ${
                            moreOpen
                                ? "border-brand-pink bg-gradient-brand-soft text-brand-pink"
                                : "border-border bg-card text-muted-foreground hover:border-brand-pink/50 hover:text-foreground"
                        }`}
                    >
                        <MoreVertical className="h-4 w-4" />
                        {dotsBadge > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-pink px-1 text-[10px] font-semibold text-white">
                                {dotsBadge}
                            </span>
                        )}
                    </button>

                    {moreOpen && (
                        <div
                            ref={moreRef}
                            role="dialog"
                            aria-label="More filters"
                            className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                        >
                            <div className="max-h-[70vh] overflow-y-auto p-5">
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    {/* ── Hidden Primary Filters ── */}
                                    {hidden.length > 0 && (
                                        <>
                                            <div className="col-span-full border-b border-border/40 pb-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    More filters
                                                </p>
                                            </div>
                                            {hidden.map((k) => renderHidden(k))}

                                            <div className="col-span-full border-b border-border/40 pb-2 mt-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Advanced
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* ── Advanced Filters (Grid Items) ── */}
                                    <LabeledRow label="Age">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                min={18}
                                                max={99}
                                                placeholder="Min"
                                                value={filters.age_min ?? ""}
                                                onChange={(e) =>
                                                    update({
                                                        age_min: e.target.value
                                                            ? Number(
                                                                  e.target
                                                                      .value,
                                                              )
                                                            : null,
                                                    })
                                                }
                                                className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring"
                                            />
                                            <input
                                                type="number"
                                                min={18}
                                                max={99}
                                                placeholder="Max"
                                                value={filters.age_max ?? ""}
                                                onChange={(e) =>
                                                    update({
                                                        age_max: e.target.value
                                                            ? Number(
                                                                  e.target
                                                                      .value,
                                                              )
                                                            : null,
                                                    })
                                                }
                                                className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring"
                                            />
                                        </div>
                                    </LabeledRow>

                                    <LabeledRow label="Body type">
                                        <FilterSelect
                                            options={BODY_TYPE_OPTIONS}
                                            value={filters.body_type}
                                            onChange={(v) =>
                                                update({ body_type: v })
                                            }
                                            placeholder="Any"
                                            isSearchable={false}
                                        />
                                    </LabeledRow>

                                    <LabeledRow label="Ethnicity">
                                        <FilterSelect
                                            options={ETHNICITY_OPTIONS}
                                            value={filters.ethnicity}
                                            onChange={(v) =>
                                                update({ ethnicity: v })
                                            }
                                            placeholder="Any"
                                            isSearchable={false}
                                        />
                                    </LabeledRow>

                                    <LabeledRow label="Tier">
                                        <FilterSelect
                                            options={TIER_OPTIONS}
                                            value={filters.tier}
                                            onChange={(v) =>
                                                update({ tier: v })
                                            }
                                            placeholder="Any tier"
                                            isSearchable={false}
                                        />
                                    </LabeledRow>

                                    <div className="col-span-full">
                                        <LabeledRow label="Service type">
                                            <div className="grid grid-cols-2 gap-3">
                                                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground hover:bg-accent/50 transition">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.incall}
                                                        onChange={(e) =>
                                                            update({
                                                                incall: e.target
                                                                    .checked,
                                                            })
                                                        }
                                                        className="accent-brand-pink"
                                                    />
                                                    Incall
                                                </label>
                                                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground hover:bg-accent/50 transition">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            filters.outcall
                                                        }
                                                        onChange={(e) =>
                                                            update({
                                                                outcall:
                                                                    e.target
                                                                        .checked,
                                                            })
                                                        }
                                                        className="accent-brand-pink"
                                                    />
                                                    Outcall
                                                </label>
                                            </div>
                                        </LabeledRow>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-3">
                                <button
                                    type="button"
                                    onClick={clearAdvanced}
                                    className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
                                >
                                    Reset advanced
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMoreOpen(false)}
                                    className="rounded-full bg-gradient-brand px-5 py-2 text-xs font-semibold text-white shadow-glow-pink transition hover:shadow-glow-pink-bright"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {totalActive > 0 && (
                    <button
                        type="button"
                        onClick={clearAll}
                        className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}

function LabeledRow({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
                {label}
            </label>
            {children}
        </div>
    );
}

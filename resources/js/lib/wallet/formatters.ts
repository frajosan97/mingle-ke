export const formatCurrency = (amount: number | null | undefined) =>
    new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        maximumFractionDigits: 0,
    }).format(amount ?? 0);

export const formatNumber = (value: number | null | undefined) =>
    new Intl.NumberFormat("en-KE").format(value ?? 0);

export const formatDate = (value: string | null | undefined) => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
};

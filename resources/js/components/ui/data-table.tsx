import { Link } from "@inertiajs/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PaginatedData<T> = {
    data: T[];
    links?: PaginationLink[];
    from?: number | null;
    to?: number | null;
    total?: number;
};

export type DataTableColumn<T> = {
    key: string;
    header: ReactNode;
    cell: (row: T) => ReactNode;
    className?: string;
    hideOnDesktop?: boolean;
};

export type DataTableProps<T> = {
    data: T[] | PaginatedData<T> | null | undefined;
    columns: DataTableColumn<T>[];
    getRowKey: (row: T) => string | number;
    renderMobileCard?: (row: T) => ReactNode;
    emptyState?: {
        icon?: ReactNode;
        title: string;
        description?: string;
    };
    showPagination?: boolean;
    loading?: boolean;
    ariaLabel?: string;
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function decodePaginationLabel(label: string): string {
    return label.replace(/<[^>]*>/g, "").trim();
}

function normalizePaginator<T>(
    data: T[] | PaginatedData<T> | null | undefined,
): PaginatedData<T> {
    if (!data) {
        return { data: [], links: [], from: null, to: null, total: 0 };
    }

    if (Array.isArray(data)) {
        return { data };
    }

    return {
        data: data.data ?? [],
        links: data.links ?? [],
        from: data.from ?? null,
        to: data.to ?? null,
        total: data.total ?? data.data?.length ?? 0,
    };
}

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

function DataTablePagination({
    links,
    from,
    to,
    total,
}: {
    links: PaginationLink[];
    from?: number | null;
    to?: number | null;
    total?: number;
}) {
    if (!links.length) return null;

    const showSummary = from != null || to != null || typeof total === "number";

    return (
        <div className="flex flex-col gap-4 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            {showSummary && (
                <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium text-foreground">
                        {from ?? 0}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium text-foreground">
                        {to ?? 0}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">
                        {total ?? 0}
                    </span>{" "}
                    results
                </p>
            )}

            <nav
                aria-label="Pagination"
                className="flex flex-wrap items-center gap-1"
            >
                {links.map((link, index) => {
                    const isPrevious = index === 0;
                    const isNext = index === links.length - 1;

                    return (
                        <Link
                            key={`${index}-${link.label}`}
                            href={link.url ?? "#"}
                            preserveScroll
                            aria-disabled={!link.url}
                            aria-current={link.active ? "page" : undefined}
                            className={[
                                "inline-flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                                link.active
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                !link.url
                                    ? "pointer-events-none opacity-40"
                                    : "",
                            ].join(" ")}
                        >
                            {isPrevious ? (
                                <ArrowLeft className="size-4" />
                            ) : isNext ? (
                                <ArrowRight className="size-4" />
                            ) : (
                                decodePaginationLabel(link.label)
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Loading skeleton
|--------------------------------------------------------------------------
*/

function DataTableSkeleton({
    rows = 5,
    cols,
}: {
    rows?: number;
    cols: number;
}) {
    return (
        <div className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 px-4 py-4">
                    {Array.from({ length: cols }).map((_, colIndex) => (
                        <div
                            key={colIndex}
                            className="h-4 flex-1 animate-pulse rounded bg-muted"
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| DataTable
|--------------------------------------------------------------------------
*/

export function DataTable<T>({
    data,
    columns,
    getRowKey,
    renderMobileCard,
    emptyState,
    showPagination = true,
    loading = false,
    ariaLabel,
}: DataTableProps<T>) {
    const paginator = normalizePaginator(data);
    const rows = paginator.data;
    const links = paginator.links ?? [];

    if (loading) {
        return <DataTableSkeleton cols={columns.length} />;
    }

    if (!rows.length) {
        return (
            <EmptyState
                icon={emptyState?.icon}
                title={emptyState?.title ?? "No records found"}
                description={
                    emptyState?.description ??
                    "There are no records to display at the moment."
                }
            />
        );
    }

    return (
        <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
                <Table aria-label={ariaLabel}>
                    <TableHeader>
                        <TableRow>
                            {columns
                                .filter((col) => !col.hideOnDesktop)
                                .map((col) => (
                                    <TableHead
                                        key={col.key}
                                        className={col.className}
                                    >
                                        {col.header}
                                    </TableHead>
                                ))}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={getRowKey(row)}>
                                {columns
                                    .filter((col) => !col.hideOnDesktop)
                                    .map((col) => (
                                        <TableCell
                                            key={col.key}
                                            className={col.className}
                                        >
                                            {col.cell(row)}
                                        </TableCell>
                                    ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-4 md:hidden">
                {renderMobileCard
                    ? rows.map((row) => (
                          <div key={getRowKey(row)}>
                              {renderMobileCard(row)}
                          </div>
                      ))
                    : rows.map((row) => (
                          <div
                              key={getRowKey(row)}
                              className="rounded-xl border bg-card p-4"
                          >
                              {columns
                                  .filter((col) => !col.hideOnDesktop)
                                  .map((col) => (
                                      <div
                                          key={col.key}
                                          className="flex justify-between gap-3 py-1 text-sm"
                                      >
                                          <span className="text-muted-foreground">
                                              {col.header}
                                          </span>
                                          <span className="text-right font-medium">
                                              {col.cell(row)}
                                          </span>
                                      </div>
                                  ))}
                          </div>
                      ))}
            </div>

            {showPagination && (
                <DataTablePagination
                    links={links}
                    from={paginator.from}
                    to={paginator.to}
                    total={paginator.total}
                />
            )}
        </>
    );
}

export default DataTable;

import { Link } from "@inertiajs/react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { decodePaginationLabel } from "@/lib/wallet/transaction-utils";
import { formatNumber } from "@/lib/wallet/formatters";
import type { PaginationLink as PaginationLinkType } from "@/types/transactions";

export default function TransactionPagination({
    links,
    from,
    to,
    total,
}: {
    links: PaginationLinkType[];
    from: number | null;
    to: number | null;
    total: number;
}) {
    return (
        <div className="flex flex-col gap-4 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">{from ?? 0}</span>{" "}
                to{" "}
                <span className="font-medium text-foreground">{to ?? 0}</span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                    {formatNumber(total)}
                </span>{" "}
                transactions
            </p>
            <nav
                aria-label="Transaction pages"
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
                            only={["transactions", "summary"]}
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

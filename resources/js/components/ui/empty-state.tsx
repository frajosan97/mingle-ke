// resources/js/components/ui/empty-state.tsx
export function EmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon?: React.ReactNode;
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
            {icon && <div className="rounded-2xl bg-muted p-4">{icon}</div>}
            {(title || description) && (
                <div>
                    {title && (
                        <p className="font-medium text-foreground">{title}</p>
                    )}
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            )}
            {action && <div className="pt-1">{action}</div>}
        </div>
    );
}

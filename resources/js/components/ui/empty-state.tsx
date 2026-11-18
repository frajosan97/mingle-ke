// resources/js/components/ui/empty-state.tsx
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="rounded-2xl bg-muted p-4">
                <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
                <p className="font-medium text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {action && <div className="pt-1">{action}</div>}
        </div>
    );
}

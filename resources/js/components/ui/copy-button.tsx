import { useCallback, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const COPY_FEEDBACK_MS = 1_500;

interface CopyButtonProps {
    value: string;
    label?: string;
    copiedLabel?: string;
    successMessage?: string;
    className?: string;
}

export function CopyButton({
    value,
    label = "Copy",
    copiedLabel = "Copied",
    successMessage = "Copied to clipboard",
    className = "",
}: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(value);

            setCopied(true);
            toast.success(successMessage);

            window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
        } catch {
            toast.error("Couldn't copy — please copy manually.");
        }
    }, [value, successMessage]);

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent ${className}`}
        >
            <Copy className="size-4" />
            {copied ? copiedLabel : label}
        </button>
    );
}

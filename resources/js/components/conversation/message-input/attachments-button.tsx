// resources/js/components/conversation/message-input/attachments-button.tsx
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
    Camera,
    FileText,
    Headphones,
    Image as ImageIcon,
    Paperclip,
} from "lucide-react";

export type MediaType = "document" | "media" | "camera" | "audio";

const MENU = [
    { type: "document" as const, label: "Document", Icon: FileText },
    { type: "media" as const, label: "Photos & videos", Icon: ImageIcon },
    { type: "camera" as const, label: "Camera", Icon: Camera },
    { type: "audio" as const, label: "Audio file", Icon: Headphones },
];

interface Props {
    disabled?: boolean;
    onFilesSelected: (files: File[]) => void;
}

export default function AttachmentsButton({
    disabled,
    onFilesSelected,
}: Props) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const onOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                wrapRef.current &&
                !wrapRef.current.contains(target) &&
                !buttonRef.current?.contains(target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onOutside);
        return () => document.removeEventListener("mousedown", onOutside);
    }, []);

    const trigger = (type: MediaType) => {
        const input = fileRef.current;
        if (!input) return;
        input.value = "";
        input.removeAttribute("capture");
        switch (type) {
            case "document":
                input.accept =
                    ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip";
                break;
            case "media":
                input.accept = "image/*,video/*";
                break;
            case "camera":
                input.accept = "image/*";
                input.setAttribute("capture", "environment");
                break;
            case "audio":
                input.accept = "audio/*";
                break;
        }
        input.click();
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length) onFilesSelected(files);
        e.target.value = "";
        setOpen(false);
    };

    return (
        <div ref={wrapRef} className="relative shrink-0">
            {open && (
                <div className="absolute bottom-14 left-0 z-50 w-60 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-popover py-2 text-popover-foreground shadow-xl">
                    {MENU.map(({ type, label, Icon }) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => trigger(type)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                        >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white">
                                <Icon className="h-5 w-5" />
                            </span>
                            {label}
                        </button>
                    ))}
                </div>
            )}
            <button
                ref={buttonRef}
                type="button"
                aria-label="Attach files"
                aria-expanded={open}
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
                <Paperclip className="h-[22px] w-[22px]" />
            </button>
            <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleChange}
            />
        </div>
    );
}

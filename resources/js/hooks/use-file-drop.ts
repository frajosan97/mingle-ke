// resources/js/hooks/use-file-drop.ts
import { useCallback, useState } from "react";

export function useFileDrop(onFiles: (files: File[]) => void) {
    const [isDragging, setIsDragging] = useState(false);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            const files = Array.from(e.dataTransfer.files ?? []);
            if (files.length) onFiles(files);
        },
        [onFiles],
    );

    return { isDragging, onDragOver, onDragLeave, onDrop };
}
import { useCallback, useEffect, useState } from "react";

export default function useTextSelection() {
    const [selection, setSelection] = useState(null);

    const clearSelection = useCallback(() => {
        setSelection(null);
        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();
    }, []);

    useEffect(() => {
        const handleMouseUp = () => {
            const sel = window.getSelection();

            if (!sel || !sel.rangeCount) return;

            const text = sel.toString().trim();
            if (!text) {
                setSelection(null);
                return;
            }

            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            setSelection({
                text,
                rect: {
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    right: rect.right + window.scrollX,
                },
            });
        };

        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    return { selection, clearSelection };
}
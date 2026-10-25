// resources/js/contexts/coins-context.tsx
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type PropsWithChildren,
} from "react";

export interface TopUpPrompt {
    required: number;
    available: number;
}

interface CoinsContextValue {
    /** Whether the top-up modal is currently visible. */
    isOpen: boolean;
    /** Snapshot of the prompt that opened the modal (null when closed). */
    prompt: TopUpPrompt | null;
    /** Open the modal. Called from anywhere a 402 may surface. */
    promptTopUp: (prompt: TopUpPrompt) => void;
    /** Close the modal (X button, overlay click, cancel). */
    close: () => void;
}

const CoinsContext = createContext<CoinsContextValue | null>(null);

export function CoinsProvider({ children }: PropsWithChildren) {
    const [prompt, setPrompt] = useState<TopUpPrompt | null>(null);

    const promptTopUp = useCallback((next: TopUpPrompt) => {
        setPrompt(next);
    }, []);

    const close = useCallback(() => {
        setPrompt(null);
    }, []);

    const value = useMemo<CoinsContextValue>(
        () => ({
            isOpen: prompt !== null,
            prompt,
            promptTopUp,
            close,
        }),
        [prompt, promptTopUp, close],
    );

    return (
        <CoinsContext.Provider value={value}>{children}</CoinsContext.Provider>
    );
}

export function useCoins(): CoinsContextValue {
    const ctx = useContext(CoinsContext);
    if (!ctx) {
        throw new Error("useCoins must be used within a <CoinsProvider>.");
    }
    return ctx;
}

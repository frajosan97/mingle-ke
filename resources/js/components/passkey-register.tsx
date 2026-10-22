// resources/js/components/passkey-register.tsx
import { usePasskeyRegister } from "@laravel/passkeys/react";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
    onSuccess: () => void;
};

export default function PasskeyRegistration({ onSuccess }: Props) {
    const [name, setName] = useState(() => {
        const ua = navigator.userAgent;

        const browser = [
            { pattern: /Edg|Edge/, name: "Edge" },
            { pattern: /OPR|Opera|OPiOS/, name: "Opera" },
            { pattern: /Firefox|FxiOS/, name: "Firefox" },
            { pattern: /Chrome|CriOS/, name: "Chrome" },
            { pattern: /Safari/, name: "Safari" },
        ].find(({ pattern }) => pattern.test(ua))?.name;

        const os = [
            { pattern: /iPhone/, name: "iPhone" },
            { pattern: /iPad|Macintosh(?=.*Mobile)/, name: "iPad" },
            { pattern: /Android/, name: "Android" },
            { pattern: /Mac/, name: "Mac" },
            { pattern: /Windows/, name: "Windows" },
        ].find(({ pattern }) => pattern.test(ua))?.name;

        return [browser, os].filter(Boolean).join(" on ") || "";
    });

    const [showForm, setShowForm] = useState(false);
    const { register, isLoading, error, isSupported } = usePasskeyRegister({
        onSuccess: () => {
            setName("");
            setShowForm(false);
            onSuccess();
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            return;
        }

        await register(name);
    };

    const handleCancel = () => {
        setShowForm(false);
        setName("");
    };

    if (!isSupported) {
        return (
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Passkeys are not supported in this browser.
            </div>
        );
    }

    if (!showForm) {
        return (
            <Button
                variant="outline"
                onClick={() => setShowForm(true)}
                className="w-full rounded-full border-border bg-transparent px-6 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-brand-pink/40 hover:bg-brand-pink/5 hover:text-brand-pink sm:w-auto"
            >
                <KeyRound className="mr-2 h-4 w-4" />
                Add Passkey
            </Button>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-xl border border-border bg-card/40 p-5"
        >
            <div className="space-y-2">
                <Label
                    htmlFor="passkey-name"
                    className="text-sm font-semibold text-muted-foreground"
                >
                    Passkey Name
                </Label>
                <div className="relative border-b border-border pb-1 transition-colors focus-within:border-brand-pink">
                    <KeyRound className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id="passkey-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., MacBook Pro, iPhone"
                        autoFocus
                        className="border-0 bg-transparent pl-6 text-foreground shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    A name helps you identify this passkey later.
                </p>
            </div>

            {error && <InputError message={error} />}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancel}
                    className="rounded-full"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading || !name.trim()}
                    className="rounded-full bg-gradient-brand px-6 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong disabled:opacity-70"
                >
                    {isLoading ? "Registering…" : "Register Passkey"}
                </Button>
            </div>
        </form>
    );
}

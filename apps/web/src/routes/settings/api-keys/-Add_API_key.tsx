import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuid } from "uuid";
import React from "react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supportedProvider } from "@repo/shared";
import { APIKeyType, useAddApiKeyMutation } from "@/client-data/apikeyQuery";
import { useTRPC } from "@/server/trpc/react";
import { Plus, Trash2, Zap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const singleKeySchema = z.object({
    provider: z.string().min(1, "Required"),
    name: z.string().min(1, "Required"),
    apiKey: z.string().min(1, "Required"),
});

const formSchema = z.object({
    keys: z.array(singleKeySchema).min(1, "Add at least one key"),
});

type FormData = z.infer<typeof formSchema>;

export function AddAPIKeySheet({
    children,
}: {
    children: React.ReactNode;
}): React.JSX.Element {
    const [open, setOpen] = React.useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            keys: [{ provider: "", name: "", apiKey: "" }],
        },
    });

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "keys",
    });

    const trpc = useTRPC();
    const encryptApiKeyMutation = useMutation(trpc.encrypt.mutationOptions());
    const addApiKeyMutation = useAddApiKeyMutation();

    const guessProvider = (name: string, key: string): string => {
        const lowerName = name.toLowerCase();
        const lowerKey = key.toLowerCase();
        if (lowerName.includes("openai") || lowerKey.startsWith("sk-"))
            return "openai";
        if (lowerName.includes("anthropic") || lowerKey.startsWith("sk-ant"))
            return "anthropic";
        if (lowerName.includes("google") || lowerName.includes("gemini"))
            return "google-ai-studio";
        if (lowerName.includes("openrouter")) return "openrouter";
        if (lowerName.includes("mistral")) return "mistral";
        if (lowerName.includes("groq")) return "groq";
        if (lowerName.includes("cerebras")) return "cerebras";
        return "";
    };

    const handlePaste = (e: React.ClipboardEvent, index: number) => {
        const paste = e.clipboardData.getData("text");
        if (!paste.includes("\n") && !paste.includes("=")) return;

        e.preventDefault();
        const lines = paste
            .split(/\r?\n/)
            .filter((line) => line.trim() && !line.startsWith("#"));
        const newKeys = lines.map((line) => {
            let name = "";
            let apiKey = "";
            if (line.includes("=")) {
                const [n, ...k] = line.split("=");
                name = n.trim();
                apiKey = k.join("=").trim();
            } else if (line.includes(":")) {
                const [n, ...k] = line.split(":");
                name = n.trim();
                apiKey = k.join(":").trim();
            } else {
                apiKey = line.trim();
            }
            name = name.replace(/^export\s+/, "").replace(/^["']|["']$/g, "");
            apiKey = apiKey.replace(/^["']|["']$/g, "");
            return {
                name: name || "New Key",
                apiKey: apiKey,
                provider: guessProvider(name, apiKey),
            };
        });

        if (newKeys.length > 0) {
            const currentKeys = form.getValues("keys");
            if (
                currentKeys.length === 1 &&
                !currentKeys[0].apiKey &&
                !currentKeys[0].name
            ) {
                replace(newKeys);
            } else {
                const updatedKeys = [...currentKeys];
                updatedKeys.splice(index, 1, ...newKeys);
                replace(updatedKeys);
            }
            toast.success(`Smart Import: ${newKeys.length} keys added.`);
        }
    };

    const onSubmit = async (data: FormData) => {
        toast(`Processing ${data.keys.length} key(s)...`);
        try {
            const payloads: APIKeyType[] = [];
            for (const item of data.keys) {
                const encrypted_key = await encryptApiKeyMutation.mutateAsync({
                    apiKey: item.apiKey,
                });
                payloads.push({
                    id: uuid(),
                    name: item.name,
                    encrypted_key,
                    provider: item.provider,
                });
            }
            await addApiKeyMutation.mutateAsync(payloads);
            setOpen(false);
            form.reset({ keys: [{ provider: "", name: "", apiKey: "" }] });
            toast.success("API keys saved successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save keys.");
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="sm:max-w-xl border-l-4 border-black dark:border-white p-0 flex flex-col bg-white dark:bg-zinc-950 h-full">
                <SheetHeader className="p-6 py-4 bg-yellow-300 dark:bg-yellow-600 border-b-4 border-black dark:border-white shrink-0">
                    <SheetTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                        Add API Keys
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 flex flex-col min-h-0">
                    {/* Fixed Info Box */}
                    <div className="p-6 py-2 shrink-0 w-full">
                        <div className="flex items-center w-full gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-none font-mono text-[11px] leading-tight">
                            <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>
                                Smart Paste: Paste .env content directly into
                                any API Key field.
                            </span>
                        </div>
                    </div>

                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex-1 flex flex-col min-h-0 pb-6"
                    >
                        {/* Scrollable list area */}
                        <ScrollArea className="flex-1 overflow-y-auto min-h-0 px-6 py-2 scrollbar-thin scrollbar-thumb-black dark:scrollbar-thumb-white">
                            <FieldGroup className="gap-4">
                                {fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className="p-4 border-2 border-black dark:border-white bg-zinc-50 dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col gap-4 relative"
                                    >
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field>
                                                <FieldLabel className="text-[10px] font-black uppercase font-mono tracking-wider opacity-60">
                                                    Provider
                                                </FieldLabel>
                                                <Select
                                                    value={form.watch(
                                                        `keys.${index}.provider`,
                                                    )}
                                                    onValueChange={(val) =>
                                                        form.setValue(
                                                            `keys.${index}.provider`,
                                                            val,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="h-9 border-2 border-black dark:border-white text-xs font-mono shadow-none rounded-none focus:ring-0 bg-white dark:bg-zinc-950">
                                                        <SelectValue placeholder="Select..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="border-2 border-black dark:border-white font-mono rounded-none">
                                                        {supportedProvider.map(
                                                            (p) => (
                                                                <SelectItem
                                                                    key={
                                                                        p.value
                                                                    }
                                                                    value={
                                                                        p.value
                                                                    }
                                                                    className="text-xs"
                                                                >
                                                                    {p.label}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor={`keys.${index}.name`} className="text-[10px] font-black uppercase font-mono tracking-wider opacity-60">
                                                    Name
                                                </FieldLabel>
                                                <Input
                                                id={`keys.${index}.name`}
                                                    {...form.register(
                                                        `keys.${index}.name`,
                                                    )}
                                                    className="h-9 text-xs font-mono border-2 border-black dark:border-white shadow-none rounded-none focus-visible:translate-x-0 focus-visible:translate-y-0"
                                                    placeholder="Key name"
                                                />
                                            </Field>
                                        </div>

                                        <Field>
                                            <FieldLabel htmlFor={`keys.${index}.apiKey`} className="text-[10px] font-black uppercase font-mono tracking-wider opacity-60">
                                                API Key
                                            </FieldLabel>
                                            <Input
                                                id={`keys.${index}.apiKey`}
                                                type="password"
                                                {...form.register(
                                                    `keys.${index}.apiKey`,
                                                )}
                                                onPaste={(e) =>
                                                    handlePaste(e, index)
                                                }
                                                className="h-9 text-xs font-mono border-2 border-black dark:border-white shadow-none rounded-none focus-visible:translate-x-0 focus-visible:translate-y-0"
                                                placeholder="Paste key here..."
                                            />
                                        </Field>

                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                size="xs"
                                                onClick={() => remove(index)}
                                                className="absolute top-1.5 right-1.5 bg-white dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950 text-red-600 hover:bg-red-100"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </FieldGroup>
                        </ScrollArea>

                        {/* Fixed Actions */}
                        <div className="px-6 pt-4 flex flex-col gap-3 shrink-0 bg-white dark:bg-zinc-950 border-t-2 border-black/10 dark:border-white/10 mt-auto">
                            <Button
                                type="button"
                                onClick={() =>
                                    append({
                                        provider: "",
                                        name: "",
                                        apiKey: "",
                                    })
                                }
                                variant="outline"
                                className="w-full h-10 border-2 border-black dark:border-white border-dashed bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 font-mono text-[10px] uppercase font-black"
                            >
                                <Plus className="w-3 h-3 mr-2" />
                                Add Row
                            </Button>

                            <Button
                                disabled={form.formState.isSubmitting}
                                type="submit"
                                className="w-full h-12 text-sm font-black uppercase tracking-widest border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-zinc-800 dark:bg-zinc-100 text-white dark:text-black "
                            >
                                {form.formState.isSubmitting
                                    ? "Saving..."
                                    : "Save All Keys"}
                            </Button>
                        </div>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
}

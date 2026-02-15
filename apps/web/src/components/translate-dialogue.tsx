import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import ReactSelect from "react-select";
import { Field, FieldError } from "./ui/field";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Input } from "./ui/input";

import { Button } from "./ui/button";
import { toast } from "sonner";
import { authClient } from "@/server/better-auth/auth-client";

import { Link } from "@tanstack/react-router";
import { useApikeyQuery } from "@/client-data/apikeyQuery";
import { useFolderIdQuery } from "@/client-data/folderIdQuery";
import type { DecomposedURL } from "@repo/shared";
import { useTRPC } from "@/server/trpc/react";
import { supportedProvider } from "@repo/shared";

const translateFormSchema = z.object({
    provider: z.string().min(1, "Please select a provider"),
    encrypted_api_key: z.string().min(1, "Encrypted API key is required"),
    model_id: z.string().min(1, "Please select a model"),
    concurrency: z.number().min(1, "Concurrency must be at least 1"),
    batch_size: z.number().min(1, "Batch size must be at least 1"),
});
type FormData = z.infer<typeof translateFormSchema>;
const selectedFolderSchema = z.object({
    id: z.string(),
    name: z.string(),
});
type SelectedFolderType = z.infer<typeof selectedFolderSchema>;

export default function TranslateDialogue({
    checkedItems,
    data,
    dialogueOpen,
    SetDialogueOpen,
}: {
    checkedItems: boolean[];
    data: DecomposedURL[];
    dialogueOpen: boolean;
    SetDialogueOpen: React.Dispatch<React.SetStateAction<boolean>>;
}): React.JSX.Element {
    const checkedurls = data?.filter((_, index) => checkedItems[index]) ?? [];

    return (
        <Dialog open={dialogueOpen} modal={true} onOpenChange={SetDialogueOpen}>
            <DialogContent>
                <DialogTitle>
                    Translate from {checkedurls.length} URL
                    {checkedurls.length > 1 ? "s" : ""}
                </DialogTitle>
                <TranlationForm
                    checkedurls={checkedurls}
                    SetDialogueOpen={SetDialogueOpen}
                />
            </DialogContent>
        </Dialog>
    );
}

function TranlationForm({
    checkedurls,
    SetDialogueOpen,
}: {
    checkedurls: DecomposedURL[];
    SetDialogueOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const form = useForm<FormData>({
        resolver: zodResolver(translateFormSchema),
        defaultValues: {
            concurrency: 1,
            batch_size: 5,
        },
    });
    const { data: api_keys } = useApikeyQuery();
    const filteredApiKeys = api_keys?.filter(
        (key) => key.provider === form.watch("provider"),
    );

    const trpc = useTRPC();
    const modelListQuery = useQuery(
        trpc.model_list.queryOptions(
            { provider: form.watch("provider") },
            { enabled: !!form.watch("provider") },
        ),
    );
    const queryClient = useQueryClient();
    const session = authClient.useSession();

    const submitTranslationMutation = useMutation(
        trpc.workflow.translate.mutationOptions(),
    );
    const { data: selectedFolderData } = useFolderIdQuery(
        session.data?.user.id ?? "",
    );
    const onSubmit = async (translationSettings: FormData) => {
        if (!session.data) {
            toast.error("Please connect to a Google Drive account...");
            return;
        }
        if (!selectedFolderData) {
            toast.error("Please select an output folder...");
            return;
        }
        const payload = {
            ...translationSettings,
            api_key_name: filteredApiKeys?.find(
                (k) =>
                    k.encrypted_key === translationSettings.encrypted_api_key,
            )?.name,
            urls: checkedurls.map((d) => d.url),
            folder_id: selectedFolderData.folder_id,
        };
        toast.info("Submitting translation request...");
        // console.log(payload);
        try {
            await submitTranslationMutation
                .mutateAsync(payload)
                .then(() =>
                    queryClient.invalidateQueries(
                        trpc.history.list_history.queryOptions({}),
                    ),
                );
            toast.info("Successfully create translation request!");
            SetDialogueOpen(false);
        } catch (e) {
            console.error(e);
            toast.error("Failed to create translation request");
        }
    };
    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
                <Field data-invalid={!!form.formState.errors.provider}>
                    <Label>Select Provider</Label>
                    <Select
                        value={form.watch("provider")}
                        onValueChange={(value) => {
                            form.setValue("provider", value);
                            form.setValue("encrypted_api_key", "");
                            form.setValue("model_id", "");
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                            {supportedProvider.map((provider) => (
                                <SelectItem
                                    key={provider.value}
                                    value={provider.value}
                                >
                                    {provider.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FieldError errors={[form.formState.errors.provider]} />
                </Field>
                <Field data-invalid={!!form.formState.errors.encrypted_api_key}>
                    <Label>Select API Key</Label>
                    <Select
                        disabled={!form.watch("provider")}
                        value={form.watch("encrypted_api_key")}
                        onValueChange={(value) =>
                            form.setValue("encrypted_api_key", value)
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue
                                placeholder={
                                    filteredApiKeys &&
                                    filteredApiKeys.length > 0
                                        ? "Select an API key"
                                        : "No API keys available"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredApiKeys?.map((key) => (
                                <SelectItem
                                    key={key.encrypted_key}
                                    value={key.encrypted_key}
                                >
                                    {key.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FieldError
                        errors={[form.formState.errors.encrypted_api_key]}
                    />
                </Field>
                <Field data-invalid={!!form.formState.errors.model_id}>
                    <Label>Select Model</Label>
                    <ReactSelect
                        unstyled
                        classNames={{
                            control: ({ isFocused, isDisabled }) =>
                                cn(
                                    "flex h-9 w-full items-center justify-between border-2 border-black dark:border-white bg-white dark:bg-zinc-900 px-3 py-2 text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] ring-offset-background placeholder:text-muted-foreground focus:outline-none transition-all",
                                    isFocused &&
                                        "translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]",
                                    isDisabled &&
                                        "cursor-not-allowed opacity-50",
                                    form.formState.errors.model_id &&
                                        "border-red-500 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]",
                                ),
                            placeholder: () => "text-muted-foreground",
                            input: () =>
                                "flex h-full w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-foreground",
                            option: ({ isFocused, isSelected }) =>
                                cn(
                                    "relative flex w-full cursor-default select-none items-center py-1.5 pl-2 pr-8 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-yellow-200 dark:hover:bg-yellow-800",
                                    isFocused &&
                                        "bg-yellow-200 dark:bg-yellow-800 text-black dark:text-white",
                                    isSelected &&
                                        "bg-yellow-400 dark:bg-yellow-600 font-bold text-black dark:text-white",
                                ),
                            menu: () =>
                                "relative z-50 min-w-[8rem] overflow-hidden border-2 border-black dark:border-white bg-white dark:bg-zinc-900 text-popover-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] animate-in fade-in-80",
                            singleValue: () => "text-foreground",
                        }}
                        isDisabled={
                            !form.watch("provider") ||
                            !form.watch("encrypted_api_key")
                        }
                        isSearchable
                        options={modelListQuery.data?.map(
                            ({ name, value }) => ({
                                value,
                                label: name,
                            }),
                        )}
                        onChange={(e) => {
                            const model_id = e?.value;
                            if (model_id) {
                                form.setValue("model_id", model_id);
                            }
                        }}
                    />
                    <FieldError errors={[form.formState.errors.model_id]} />
                </Field>
                <Field data-invalid={!!form.formState.errors.concurrency}>
                    <Label htmlFor="concurrency">Concurrency</Label>
                    <Input
                        id="concurrency"
                        type="number"
                        min={1}
                        value={form.watch("concurrency")}
                        onChange={(e) =>
                            form.setValue(
                                "concurrency",
                                parseInt(e.target.value, 10),
                            )
                        }
                    />
                    <FieldError errors={[form.formState.errors.concurrency]} />
                </Field>
                <Field data-invalid={!!form.formState.errors.batch_size}>
                    <Label htmlFor="batch_size">Batch Size</Label>
                    <Input
                        id="batch_size"
                        type="number"
                        min={1}
                        value={form.watch("batch_size")}
                        onChange={(e) =>
                            form.setValue(
                                "batch_size",
                                parseInt(e.target.value, 10),
                            )
                        }
                    />
                    <FieldError errors={[form.formState.errors.batch_size]} />
                </Field>

                <Field>
                    <Label>Output Folder</Label>
                    {selectedFolderData ? (
                        <div className="p-2 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] font-bold">
                            {selectedFolderData.name}
                        </div>
                    ) : (
                        <Link to="/settings/storage" className="w-full">
                            <Button variant="outline" className="w-full">
                                No folder selected — Go to Settings
                            </Button>
                        </Link>
                    )}
                </Field>
            </div>
            <DialogFooter className="mt-6">
                <Button
                    disabled={
                        form.formState.isSubmitting ||
                        submitTranslationMutation.isPending
                    }
                    type="submit"
                >
                    {form.formState.isSubmitting ||
                    submitTranslationMutation.isPending
                        ? "Submitting..."
                        : "Start Translation"}
                </Button>
            </DialogFooter>
        </form>
    );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuid } from "uuid";
import React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supportedProvider } from "@repo/shared";
import { APIKeyType, useAddApiKeyMutation } from "@/client-data/apikeyQuery";
import { useTRPC } from "@/server/trpc/react";

const formSchema = z.object({
    provider: z.string().min(1, "Please select a provider"),
    name: z.string().min(1, "Name is required"),
    apiKey: z.string().min(1, "API Key is required"),
});

type FormData = z.infer<typeof formSchema>;

export function AddAPIKeyDialog({
    children,
}: {
    children: React.ReactNode;
}): React.JSX.Element {
    const [open, setOpen] = React.useState(false);
    const [providerSelectMenuOpen, setProviderSelectMenuOpen] =
        React.useState(false);
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            provider: "",
            name: "",
            apiKey: "",
        },
    });
    const trpc = useTRPC();
    const encryptApiKeyMutation = useMutation(trpc.encrypt.mutationOptions());
    const addApiKeyMutation = useAddApiKeyMutation();

    const onSubmit = async (data: FormData) => {
        toast("Encrypting and saving API key...");

        const encrypted_key = await encryptApiKeyMutation.mutateAsync(data);
        const payload = {
            id: uuid(),
            name: data.name,
            encrypted_key,
            provider: data.provider,
        } satisfies APIKeyType;
        await addApiKeyMutation.mutateAsync([payload]);
        setOpen(false);
        form.reset();
        toast.success("API key added successfully!");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-lg border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-900">
                <DialogTitle className="p-6 pb-4 text-2xl font-black uppercase tracking-tighter bg-yellow-300 dark:bg-yellow-600 border-b-2 border-black dark:border-white">
                    Add New API Key
                </DialogTitle>
                <div className="p-6">
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="flex flex-col gap-6"
                    >
                        <div className="flex flex-col gap-4">
                            <Field className="flex flex-col gap-2">
                                <Label
                                    onClick={() =>
                                        setProviderSelectMenuOpen(true)
                                    }
                                    htmlFor="provider"
                                    className="text-sm font-bold uppercase font-mono bg-yellow-300 dark:bg-yellow-600 w-fit px-1 border-2 border-black dark:border-white"
                                >
                                    Provider
                                </Label>
                                <Select
                                    open={providerSelectMenuOpen}
                                    onOpenChange={setProviderSelectMenuOpen}
                                    value={form.watch("provider")}
                                    onValueChange={(value) =>
                                        form.setValue("provider", value)
                                    }
                                >
                                    <SelectTrigger className="w-full border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] h-12 font-mono focus:ring-0 focus:ring-offset-0 bg-white dark:bg-zinc-900">
                                        <SelectValue placeholder="Select a provider" />
                                    </SelectTrigger>
                                    <SelectContent className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900">
                                        {supportedProvider.map((provider) => (
                                            <SelectItem
                                                key={provider.value}
                                                value={provider.value}
                                                className="focus:bg-yellow-100 dark:focus:bg-yellow-900 focus:font-bold font-mono cursor-pointer border-b-2 border-transparent focus:border-black dark:focus:border-white"
                                            >
                                                {provider.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.provider &&
                                    !form.watch("provider") && (
                                        <p className="text-sm text-red-600 font-bold font-mono bg-red-100 dark:bg-red-900 p-1 border-2 border-red-600 dark:border-red-400">
                                            {
                                                form.formState.errors.provider
                                                    .message
                                            }
                                        </p>
                                    )}
                            </Field>

                            <Field className="flex flex-col gap-2">
                                <Label
                                    htmlFor="name"
                                    className="text-sm font-bold uppercase font-mono bg-yellow-300 dark:bg-yellow-600 w-fit px-1 border-2 border-black dark:border-white"
                                >
                                    Name
                                </Label>
                                <Input
                                    type="text"
                                    id="name"
                                    placeholder="e.g., Production, Development"
                                    {...form.register("name")}
                                    className="bg-white dark:bg-zinc-900"
                                />
                                {form.formState.errors.name && (
                                    <p className="text-sm text-red-600 font-bold font-mono bg-red-100 dark:bg-red-900 p-1 border-2 border-red-600 dark:border-red-400">
                                        {form.formState.errors.name.message}
                                    </p>
                                )}
                            </Field>

                            <Field className="flex flex-col gap-2">
                                <Label
                                    htmlFor="apiKey"
                                    className="text-sm font-bold uppercase font-mono bg-yellow-300 dark:bg-yellow-600 w-fit px-1 border-2 border-black dark:border-white"
                                >
                                    API Key
                                </Label>
                                <Input
                                    type="password"
                                    id="apiKey"
                                    placeholder="Enter your API key"
                                    {...form.register("apiKey")}
                                    className="bg-white dark:bg-zinc-900"
                                />
                                {form.formState.errors.apiKey && (
                                    <p className="text-sm text-red-600 font-bold font-mono bg-red-100 dark:bg-red-900 p-1 border-2 border-red-600 dark:border-red-400">
                                        {form.formState.errors.apiKey.message}
                                    </p>
                                )}
                            </Field>
                        </div>

                        <DialogFooter className="mt-2 gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 mr-2"
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={form.formState.isSubmitting}
                                type="submit"
                                className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-stone-500 dark:bg-stone-700 text-white hover:bg-stone-600 dark:hover:bg-stone-800"
                            >
                                Add API Key
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

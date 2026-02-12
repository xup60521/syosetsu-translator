"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supportedProvider } from "@repo/shared";
import { createFileRoute } from "@tanstack/react-router";
import { useApikeyQuery } from "@/client-data/apikeyQuery";
import { useTRPC } from "@/server/trpc/react";

export const Route = createFileRoute("/settings/api-keys")({
    component: APIKeysPanel,
});

function APIKeysPanel(): React.JSX.Element {
    const queryClient = useQueryClient();
    const { data: api_keys, isPending } = useApikeyQuery()
    const deleteApiKeyMutation = useMutation({
        mutationFn: async (index: number) => {
            const storedKeys = localStorage.getItem("api_keys");
            const keys = storedKeys ? JSON.parse(storedKeys) : [];
            keys.splice(index, 1);
            localStorage.setItem("api_keys", JSON.stringify(keys));
        },
        onSuccess: () => {
            toast.success("API key deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
        },
    });



    return (


        <section className="flex flex-col gap-6 pb-8">
            <div className="border-b-4 border-black dark:border-white pb-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter">API Keys</h3>
                <p className="mt-2 text-base font-mono bg-yellow-100 dark:bg-yellow-900 p-2 border-2 border-black dark:border-white inline-block">
                    Manage your API keys. Keys are stored locally.
                </p>
            </div>

            <div className="flex flex-col gap-6">
                {isPending ? (
                    <div className="flex flex-col gap-6">
                        {[1, 2].map((i) => (
                            <div
                                key={i}
                                className="flex flex-col gap-4 p-4 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900"
                            >
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                                    <div className="flex flex-col gap-2 flex-1 w-full">
                                        <Skeleton className="h-6 w-20 rounded-none" />
                                        <Skeleton className="h-11 w-full rounded-none" />
                                    </div>
                                    <div className="flex flex-col gap-2 flex-[2] w-full">
                                        <Skeleton className="h-6 w-20 rounded-none" />
                                        <Skeleton className="h-11 w-full rounded-none" />
                                    </div>
                                    <Skeleton className="h-11 w-20 rounded-none" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    api_keys?.map((key, index) => (
                        <div
                            key={index}
                            className="flex flex-col gap-4 p-4 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900 transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]"
                        >
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                                <div className="flex flex-col gap-2 flex-1 w-full">
                                    <label className="text-sm font-bold uppercase font-mono bg-yellow-300 dark:bg-yellow-600 w-fit px-1 border-2 border-black dark:border-white">
                                        Provider
                                    </label>
                                    <div className="w-full font-mono text-lg font-bold border-b-2 border-black dark:border-white px-2 py-1 bg-gray-50 dark:bg-zinc-800">
                                        {key.provider}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 flex-[2] w-full">
                                    <label
                                        htmlFor={`key-name-${index}`}
                                        className="text-sm font-bold uppercase font-mono bg-yellow-300 dark:bg-yellow-600 w-fit px-1 border-2 border-black dark:border-white"
                                    >
                                        Key Name
                                    </label>
                                    <Input
                                        type="text"
                                        readOnly
                                        id={`key-name-${index}`}
                                        value={key.name}
                                        className="w-full"
                                        placeholder="e.g., Production, Development"
                                    />
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            className="shrink-0"
                                        >
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="font-black uppercase text-xl">
                                                Are you sure?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="font-mono text-black dark:text-white">
                                                This action cannot be undone.
                                                This will permanently delete the
                                                API key <span className="font-bold bg-yellow-300 dark:bg-yellow-600 px-1 border border-black dark:border-white">"{key.name}"</span>
                                                for {key.provider}.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800">
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() =>
                                                    deleteApiKeyMutation.mutate(
                                                        index
                                                    )
                                                }
                                                className="bg-red-600 text-white border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-red-700 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))
                )}

                {!isPending && (!api_keys || api_keys.length === 0) && (
                    <div className="p-8 border-2 border-dashed border-black dark:border-white bg-gray-50 dark:bg-zinc-900 text-center font-mono text-gray-500 dark:text-gray-400">
                        No API keys found. Add one to get started.
                    </div>
                )}

                <div className="flex gap-2 pt-4">
                    <AddAPIKeyDialog>
                        <Button variant="default" className="w-full sm:w-auto text-lg px-8 py-6">
                            + Add New Key
                        </Button>
                    </AddAPIKeyDialog>
                </div>
            </div>
        </section>

    );
}

const formSchema = z.object({
    provider: z.string().min(1, "Please select a provider"),
    name: z.string().min(1, "Name is required"),
    apiKey: z.string().min(1, "API Key is required"),
});

type FormData = z.infer<typeof formSchema>;

function AddAPIKeyDialog({
    children,
}: {
    children: React.ReactNode;
}): React.JSX.Element {
    const [open, setOpen] = React.useState(false);
    const [providerSelectMenuOpen, setProviderSelectMenuOpen] =
        React.useState(false);
    const queryClient = useQueryClient();
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            provider: "",
            name: "",
            apiKey: "",
        },
    });
    const trpc = useTRPC()
    const mutateApiKey = useMutation(trpc.encrypt.mutationOptions());

    const onSubmit = (data: FormData) => {
        toast("Encrypting and saving API key...");

        mutateApiKey.mutate(data, {
            onSuccess: (encryptedKey) => {
                const currentKeys = JSON.parse(
                    localStorage.getItem("api_keys") || "[]"
                ) as {
                    provider: string;
                    name: string;
                    encrypted_key: string;
                }[];
                currentKeys.push({
                    provider: data.provider,
                    name: data.name,
                    encrypted_key: encryptedKey,
                });
                localStorage.setItem("api_keys", JSON.stringify(currentKeys));
                setOpen(false);
                form.reset();
                toast.success("API key added successfully!");
                queryClient.invalidateQueries({ queryKey: ["api-keys"] });
            },
        });

        // Handle form submission here
        // setOpen(false);
        // form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-lg border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-900">
                <DialogTitle className="p-6 pb-4 text-2xl font-black uppercase tracking-tighter bg-yellow-300 dark:bg-yellow-600 border-b-2 border-black dark:border-white">
                    Add New API Key
                </DialogTitle>
                <div className="p-6">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            <Field className="flex flex-col gap-2">
                                <Label
                                    onClick={() => setProviderSelectMenuOpen(true)}
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
                                            {form.formState.errors.provider.message}
                                        </p>
                                    )}
                            </Field>

                            <Field className="flex flex-col gap-2">
                                <Label htmlFor="name" className="text-sm font-bold uppercase font-mono bg-yellow-300 dark:bg-yellow-600 w-fit px-1 border-2 border-black dark:border-white">Name</Label>
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
                                <Label htmlFor="apiKey" className="text-sm font-bold uppercase font-mono bg-yellow-300 dark:bg-yellow-600 w-fit px-1 border-2 border-black dark:border-white">API Key</Label>
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

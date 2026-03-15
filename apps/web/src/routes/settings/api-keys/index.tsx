"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuid } from "uuid";
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
import {
    APIKeyType,
    useAddApiKeyMutation,
    useApikeyQuery,
    useDeleteApiKeyMutation,
} from "@/client-data/apikeyQuery";
import { useTRPC } from "@/server/trpc/react";
import { AddAPIKeyDialog } from "./-Add_API_key";

export const Route = createFileRoute("/settings/api-keys/")({
    component: APIKeysPanel,
});

function APIKeysPanel(): React.JSX.Element {
    const { data: api_keys, isPending } = useApikeyQuery();

    return (
        <section className="flex flex-col gap-6 pb-8">
            <div className="border-b-4 border-black dark:border-white pb-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter">
                    API Keys
                </h3>
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
                    api_keys?.map((api_key_object) => (
                        <APIKeyCard api_key_object={api_key_object} />
                    ))
                )}

                {!isPending && (!api_keys || api_keys.length === 0) && (
                    <div className="p-8 border-2 border-dashed border-black dark:border-white bg-gray-50 dark:bg-zinc-900 text-center font-mono text-gray-500 dark:text-gray-400">
                        No API keys found. Add one to get started.
                    </div>
                )}

                <div className="flex gap-2 pt-4">
                    <AddAPIKeyDialog>
                        <Button
                            variant="default"
                            className="w-full sm:w-auto text-lg px-8 py-6"
                        >
                            + Add New Key
                        </Button>
                    </AddAPIKeyDialog>
                </div>
            </div>
        </section>
    );
}

function APIKeyCard({ api_key_object }: { api_key_object: APIKeyType }) {
    const deleteApiKeyMutation = useDeleteApiKeyMutation();
    return (
        <div className="flex flex-col gap-4 p-4 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900 transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex flex-col gap-2 flex-1 w-full">
                    <label className="text-sm font-bold uppercase font-mono bg-yellow-300 dark:bg-yellow-600 w-fit px-1 border-2 border-black dark:border-white">
                        Provider
                    </label>
                    <div className="w-full font-mono text-lg font-bold border-b-2 border-black dark:border-white px-2 py-1 bg-gray-50 dark:bg-zinc-800">
                        {api_key_object.provider}
                    </div>
                </div>
                <div className="flex flex-col gap-2 flex-[2] w-full">
                    <label
                        htmlFor={`key-name-${api_key_object.id}`}
                        className="text-sm font-bold uppercase font-mono bg-yellow-300 dark:bg-yellow-600 w-fit px-1 border-2 border-black dark:border-white"
                    >
                        Key Name
                    </label>
                    <Input
                        type="text"
                        readOnly
                        id={`key-name-${api_key_object.id}`}
                        value={api_key_object.name}
                        className="w-full"
                        placeholder="e.g., Production, Development"
                    />
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="shrink-0">
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-black uppercase text-xl">
                                Are you sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="font-mono text-black dark:text-white">
                                This action cannot be undone. This will
                                permanently delete the API key{" "}
                                <span className="font-bold bg-yellow-300 dark:bg-yellow-600 px-1 border border-black dark:border-white">
                                    "{api_key_object.name}"
                                </span>
                                for {api_key_object.provider}.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() =>
                                    deleteApiKeyMutation
                                        .mutateAsync({
                                            id: api_key_object.id,
                                        })
                                        .then(() => {
                                            toast.success(
                                                "API key deleted successfully!",
                                            );
                                        })
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
    );
}

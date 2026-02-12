import { Button } from "@/components/ui/button";
import { get_sessionFn } from "@/server_function/get_session.serverfn";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useFolderIdQuery } from "@/client-data/folderIdQuery";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Folder, Search, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { authClient } from "@/server/better-auth/auth-client";
import { Skeleton } from "@/components/ui/skeleton";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { z } from "zod";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/server/trpc/react";

const folderSearchSchema = z.object({
    query: z.string().optional(),
    order_by: z.enum(["name", "modifiedTime"]).default("name"),
    sort_order: z.enum(["asc", "desc"]).default("asc"),
});

export const Route = createFileRoute("/view/")({
    validateSearch: folderSearchSchema,
    loader: async ({ context }) => {
        const session = await get_sessionFn();
        return { session };
    },
    component: RouteComponent,
});

function RouteComponent() {
    const { session } = Route.useLoaderData();
    const { data: authSession } = authClient.useSession();
    const userId = authSession?.user?.id;
    const queryClient = useQueryClient();
    // Use the hook which uses folderIdGetter internally
    const { data: selectedFolder, isLoading: isFolderLoading } =
        useFolderIdQuery(userId || "");

    React.useEffect(() => {
        if (userId) {
            queryClient.invalidateQueries({ queryKey: ["selectedFolder"] });
        }
    }, [userId]);

    if (!session?.session) {
        return <UnauthorizedPage />;
    }

    if (isFolderLoading) {
        return <LoadingPage />;
    }

    if (!selectedFolder) {
        return <NoFolderSelectedPage />;
    }

    return <FolderListView rootFolderId={selectedFolder.folder_id} />;
}

function FolderListView({ rootFolderId }: { rootFolderId: string }) {
    const navigate = useNavigate();
    const search = Route.useSearch();
    const [localSearch, setLocalSearch] = useState(search.query || "");

    const [debouncedSearch] = useDebouncedValue(localSearch, {
        wait: 500,
        onExecute: () => {
            navigate({
                to: ".",
                search: (prev) => ({
                    ...prev,
                    query: debouncedSearch || undefined,
                }),
                replace: true,
            });
        },
    });

    const sortOrderString =
        `${search.order_by} ${search.sort_order === "desc" ? "desc" : ""}`.trim();
    const trpc = useTRPC();
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
    } = useInfiniteQuery(
        trpc.drive.listFolders.infiniteQueryOptions(
            {
                parentId: rootFolderId,
                query: search.query,
                orderBy: sortOrderString,
            },
            {
                // Native TanStack options go here
                getNextPageParam: (lastPage) =>
                    lastPage.nextPageToken ?? undefined,
                enabled: !!rootFolderId,
                // tRPC v11 handles initialPageParam as undefined by default
            },
        ),
        // }
    );

    const folders = data?.pages.flatMap((page) => page.folders) || [];

    const handleSortChange = (value: string) => {
        const [orderBy, order] = value.split(" ");
        navigate({
            to: ".",
            search: (prev) => ({
                ...prev,
                order_by: orderBy as "name" | "modifiedTime",
                sort_order: (order as "desc" | undefined) || "asc",
            }),
            replace: true,
        });
    };

    return (
        <div className="min-h-screen bg-bg-main bg-[radial-gradient(var(--bg-pattern-color)_1px,transparent_1px)] bg-size-[16px_16px]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 border-b-4 border-black dark:border-white pb-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mb-4 font-mono uppercase h-10 px-4"
                                onClick={() => navigate({ to: "/" })}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                            <h1 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">
                                Novel Viewer
                            </h1>
                            <p className="mt-2 text-base font-mono bg-yellow-100 dark:bg-yellow-900 p-2 border-2 border-black dark:border-white inline-block text-black dark:text-white">
                                Browse your Google Drive folders
                            </p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex gap-2 w-full">
                            <div className="relative grow group/search">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10 group-focus-within/search:translate-x-0.5 group-focus-within/search:translate-y-0.5 transition-all" />
                                <Input
                                    placeholder="Search folders..."
                                    className="pl-10 h-12 text-lg font-mono border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded-none focus-visible:ring-0"
                                    value={localSearch}
                                    onChange={(e) =>
                                        setLocalSearch(e.target.value)
                                    }
                                />
                            </div>
                            <Select
                                value={sortOrderString}
                                onValueChange={handleSortChange}
                            >
                                <SelectTrigger className="w-[180px] h-full rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono font-bold uppercase bg-white dark:bg-zinc-800 focus:ring-0">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent className="rounded-none border-2 border-black dark:border-white font-mono">
                                    <SelectItem value="name">
                                        Name (A-Z)
                                    </SelectItem>
                                    <SelectItem value="name desc">
                                        Name (Z-A)
                                    </SelectItem>
                                    <SelectItem value="modifiedTime desc">
                                        Newest First
                                    </SelectItem>
                                    <SelectItem value="modifiedTime">
                                        Oldest First
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {isLoading && (
                        <div className="grid grid-cols-1 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton
                                    key={i}
                                    className="h-24 w-full border-2 border-black dark:border-white rounded-none"
                                />
                            ))}
                        </div>
                    )}

                    {!isLoading && folders.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-black dark:border-white bg-white dark:bg-black">
                            <Folder className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-xl font-bold uppercase">
                                No folders found
                            </h3>
                            <p className="text-gray-500 font-mono">
                                {search.query
                                    ? `No results for "${search.query}"`
                                    : "This folder is empty."}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {folders.map((folder) => (
                            <div
                                key={folder.id}
                                onClick={() =>
                                    navigate({ to: `/view/${folder.id}` })
                                }
                                className="group cursor-pointer bg-white dark:bg-zinc-900 border-2 border-black dark:border-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all duration-150 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-yellow-300 dark:bg-yellow-600 p-3 border-2 border-black dark:border-white group-hover:bg-yellow-400 dark:group-hover:bg-yellow-500 transition-colors">
                                        <Folder className="h-6 w-6 text-black dark:text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight group-hover:underline decoration-2">
                                            {folder.name}
                                        </h3>
                                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">
                                            ID: {folder.id}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="h-6 w-6 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        ))}
                    </div>

                    {hasNextPage && (
                        <div className="flex justify-center pt-8">
                            <Button
                                variant="outline"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="font-mono uppercase border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all active:translate-y-1 active:shadow-none"
                            >
                                {isFetchingNextPage ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    "Load More Folders"
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function LoadingPage(): React.JSX.Element {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-main dark:bg-zinc-950">
            <div className="border-4 border-black bg-white p-8 text-center space-y-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-zinc-900 dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                <h1 className="text-3xl font-black  uppercase text-black dark:text-zinc-100">
                    Loading
                </h1>
                <p className="font-mono text-gray-600 dark:text-zinc-400">
                    Please wait while we prepare your content...
                </p>
                <div className="mt-4 flex justify-center">
                    <div className="h-12 w-12 animate-spin border-4 border-black border-t-transparent dark:border-white dark:border-t-transparent"></div>
                </div>
            </div>
        </div>
    );
}

function UnauthorizedPage(): React.JSX.Element {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-main dark:bg-zinc-950">
            <div className="border-4 border-black bg-white p-8 text-center space-y-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-zinc-900 dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                <h1 className="text-3xl font-black uppercase dark:text-black">
                    Access Denied
                </h1>
                <p className="font-mono text-gray-600 dark:text-zinc-400">
                    You need to login to access this page.
                </p>
                <Button
                    asChild
                    className="mt-4 w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-white dark:text-black dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]"
                >
                    <Link preload="render" to="/settings/storage">
                        Login in Settings
                    </Link>
                </Button>
            </div>
        </div>
    );
}

function NoFolderSelectedPage(): React.JSX.Element {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-main dark:bg-zinc-950">
            <div className="max-w-md border-4 border-black bg-white p-8 text-center space-y-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-zinc-900 dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                <Folder className="mx-auto mb-4 h-16 w-16 dark:text-white" />
                <h1 className="text-3xl font-black uppercase dark:text-white">
                    No Folder Selected
                </h1>
                <p className="font-mono text-gray-600 dark:text-zinc-400">
                    Please select an Output Folder in settings to browse your
                    novels.
                </p>
                <Button
                    asChild
                    className="mt-4 w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-white dark:text-black dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]"
                >
                    <Link preload="render" to="/settings/storage">
                        Go to Settings
                    </Link>
                </Button>
            </div>
        </div>
    );
}

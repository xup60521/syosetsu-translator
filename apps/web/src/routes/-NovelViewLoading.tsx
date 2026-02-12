import React from "react";
import { ScrollArea } from "../components/ui/scroll-area";
import { Skeleton } from "../components/ui/skeleton";
import { Separator } from "../components/ui/separator";

export function NovelViewLoading(): React.JSX.Element {
    return (
        <div className="w-full flex flex-nowrap gap-2 h-full">
            <div className="grow min-h-0 max-h-full h-full overflow-hidden border-2 border-black dark:border-white bg-white dark:bg-black hidden md:block">
                <NovelContentLoading />
            </div>
            <div className="w-full md:w-[400px] bg-stone-50 dark:bg-zinc-900 border-2 border-black dark:border-white flex flex-col">
                <h2 className="text-lg font-bold p-3 w-full bg-yellow-300 dark:bg-yellow-600 border-b-2 border-black dark:border-white font-mono uppercase tracking-tight">
                    Novel Queue List
                </h2>
                <div className="grow overflow-hidden">
                    <SidePanelLoading />
                </div>
                <div className="w-full p-3 py-1.5 flex items-center bg-white dark:bg-zinc-900 border-t-2 border-black dark:border-white gap-2">
                    <div className="flex items-center gap-2.5">
                        <Skeleton className="h-4 w-4 rounded" />
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    </div>
                    <div className="grow"></div>
                    <Skeleton className="h-8 w-24 rounded" />
                </div>
            </div>
        </div>
    );
}

export function NovelContentLoading(): React.JSX.Element {
    return (
        <ScrollArea className="w-full min-w-0 flex-1 mx-auto overflow-auto h-full p-4 py-0 pl-0 min-h-0 max-h-full">
            <div className="max-w-5xl mx-auto pl-4">
                <div className="flex justify-between border-b-4 border-black dark:border-white pb-4 mb-6 mr-0.5 mt-8">
                    <Skeleton className="h-11 w-2/3" />
                    <Skeleton className="h-10 w-20" />
                </div>

                <div className="flex gap-4 items-baseline mb-8">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-96" />
                </div>

                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="mb-4 space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-[95%]" />
                        <Skeleton className="h-6 w-[98%]" />
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}

export function SidePanelLoading(): React.JSX.Element {
    return (
        <div className="flex flex-col w-full">
            {Array.from({ length: 16 }).map((_, i) => (
                <React.Fragment key={i}>
                    {i === 0 ? null : <Separator />}
                    <div className="py-3 px-3 flex gap-2.5 items-center">
                        <Skeleton className="h-4 w-4 shrink-0 rounded" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
}
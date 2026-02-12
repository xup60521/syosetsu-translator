import { Skeleton } from "@/components/ui/skeleton";

export function HistoryCardSkeleton() {
    return (
        <div className="border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b-2 border-black dark:border-white bg-yellow-300 dark:bg-yellow-600 px-2 py-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-0">
                    <div className="flex items-stretch border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] overflow-hidden">
                        <div className="px-1.5 py-0.5 border-r-2 border-black dark:border-white bg-black dark:bg-white">
                            <Skeleton className="h-3 w-10 bg-white/20 dark:bg-black/20" />
                        </div>
                        <div className="w-20 h-6 bg-white dark:bg-zinc-800 flex items-center justify-center">
                            <Skeleton className="h-3 w-12 rounded-none" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <Skeleton className="h-7 w-7 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] rounded-none bg-white dark:bg-zinc-800" />
                    <Skeleton className="h-7 w-7 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] rounded-none bg-white dark:bg-zinc-800" />
                    <Skeleton className="h-7 w-7 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] rounded-none bg-white dark:bg-zinc-800" />
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex-1 space-y-4">
                <div className="flex flex-wrap gap-2">
                    <div className="h-7 w-24 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] flex items-center px-2">
                        <Skeleton className="h-3 w-16 rounded-none" />
                    </div>
                    <div className="h-7 w-32 bg-gray-100 dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] flex items-center px-2">
                        <Skeleton className="h-3 w-24 rounded-none" />
                    </div>
                </div>

                {/* Time Skeleton */}
                <div className="flex items-center gap-1">
                    <div className="h-3.5 w-3.5 bg-gray-200 rounded-full animate-pulse" />
                    <Skeleton className="h-4 w-32 bg-gray-200" />
                </div>
            </div>
        </div>
    );
}

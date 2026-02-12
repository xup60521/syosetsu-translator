import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Clock,
    FileText,
    Eye,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Trash2,
    RotateCcw,
    StopCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { toast } from "sonner";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useTRPC } from "@/server/trpc/react";

export interface Task {
    taskId: string;
    status: string;
    progress: number;
    current: number;
    total: number;
    urls: unknown;
    errorMessage: string | null;
    createdAt: number | null;
    provider: string | null;
    model: string | null;
    apiKeyName: string | null;
}

interface HistoryCardProps {
    item: Task;
    openRetryDialog: (urls: string[]) => void;
}

export function HistoryCard({ item, openRetryDialog }: HistoryCardProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    const parseUrls = (urls: unknown): string[] => {
        if (!urls) return [];
        if (Array.isArray(urls)) return urls as string[];
        try {
            const parsed = JSON.parse(String(urls));
            return Array.isArray(parsed) ? parsed : [String(urls)];
        } catch {
            return [String(urls)];
        }
    };

    const statusVariant = (status: string | undefined) => {
        if (!status) return "default";
        const s = status.toLowerCase();
        if (s.includes("error") || s.includes("failed")) return "destructive";
        if (s.includes("done") || s.includes("completed")) return "default";
        if (s.includes("cancel")) return "outline";
        return "secondary";
    };

    const getStatusIcon = (status: string | undefined) => {
        if (!status) return <Clock className="h-3 w-3" />;
        const s = status.toLowerCase();
        if (s.includes("error") || s.includes("failed"))
            return <AlertCircle className="h-3 w-3" />;
        if (s.includes("done") || s.includes("completed"))
            return <CheckCircle2 className="h-3 w-3" />;
        if (s.includes("cancel")) return <StopCircle className="h-3 w-3" />;
        return <Loader2 className="h-3 w-3 animate-spin" />;
    };

    const cancelMutation = useMutation(trpc.workflow.cancel.mutationOptions());

    const deleteMutation = useMutation(
        trpc.history.delete_history.mutationOptions(),
    );

    const urls = parseUrls(item.urls);
    const s = (item.status || "").toLowerCase();
    const canRetry =
        s.includes("done") ||
        s.includes("completed") ||
        s.includes("failed") ||
        s.includes("cancel") ||
        s.includes("error");
    const isInProgress = !canRetry;
    const unfinishedUrls = urls.slice(item.current);

    return (
        <div className="border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all overflow-hidden flex flex-col group/card">
            {/* Card Header - Consolidated Identifiers and Actions */}
            <div className="border-b-2 border-black dark:border-white bg-yellow-300 dark:bg-yellow-600 px-2 py-1.5 flex items-center justify-between gap-2 overflow-hidden">
                <div className="flex items-center gap-0 min-w-0">
                    {/* ID & Status Group */}
                    <div className="flex items-stretch border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] overflow-hidden shrink-0">
                        <span className="font-black text-xs font-mono tracking-tighter px-1.5 py-0.5 border-r-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black uppercase">
                            ID:{item.taskId.slice(0, 6)}
                        </span>
                        <div
                            className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 font-mono font-bold text-[10px] uppercase flex-1",
                                statusVariant(item.status) === "destructive"
                                    ? "bg-red-500 text-white"
                                    : statusVariant(item.status) === "secondary"
                                      ? "bg-blue-400 text-white"
                                      : statusVariant(item.status) === "outline"
                                        ? "bg-stone-200 dark:bg-stone-800 text-black dark:text-white"
                                        : "bg-green-500 text-white",
                            )}
                        >
                            {getStatusIcon(item.status)}
                            <span>{item.status ?? "Unknown"}</span>
                        </div>
                    </div>
                </div>

                {/* Actions Grouped in Header */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {urls.length > 0 &&
                        (unfinishedUrls.length > 0 &&
                        unfinishedUrls.length < urls.length ? (
                            //    Use popover to show "View All" and "View Unfinished" instead of select. Same for retry below.
                            <Popover>
                                <PopoverTrigger asChild>
                                    <ViewButton />
                                </PopoverTrigger>
                                <PopoverContent className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900 rounded-none p-0 w-auto">
                                    <div className="flex flex-col gap-0">
                                        <Link
                                            to="/"
                                            state={{
                                                url_string: urls.join(" "),
                                            }}
                                            className="w-full"
                                        >
                                            <div className="px-2 py-1.5 hover:bg-blue-200 dark:hover:bg-blue-900 font-mono font-bold uppercase text-xs cursor-pointer border-b border-gray-200 dark:border-zinc-700 last:border-b-0">
                                                View All
                                            </div>
                                        </Link>
                                        <Link
                                            to="/"
                                            state={{
                                                url_string:
                                                    unfinishedUrls.join(" "),
                                            }}
                                            className="w-full"
                                        >
                                            <div className="px-2 py-1.5 hover:bg-blue-200 dark:hover:bg-blue-900 font-mono font-bold uppercase text-xs cursor-pointer border-b border-gray-200 dark:border-zinc-700 last:border-b-0">
                                                View Unfinished
                                            </div>
                                        </Link>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        ) : (
                            <ViewButton
                                onClick={() =>
                                    navigate({
                                        to: "/",
                                        state: { url_string: urls.join(" ") },
                                    })
                                }
                            />
                        ))}

                    {canRetry &&
                        (unfinishedUrls.length > 0 &&
                        unfinishedUrls.length < urls.length ? (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <RetryButton />
                                </PopoverTrigger>
                                <PopoverContent className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900 rounded-none p-0 w-auto">
                                    <div className="flex flex-col gap-0">
                                        <button
                                            onClick={() =>
                                                openRetryDialog(urls)
                                            }
                                            className="px-2 py-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-900 font-mono font-bold uppercase text-xs cursor-pointer border-b border-gray-200 dark:border-zinc-700 last:border-b-0 text-left bg-transparent"
                                        >
                                            Retry All
                                        </button>
                                        <button
                                            onClick={() =>
                                                openRetryDialog(unfinishedUrls)
                                            }
                                            className="px-2 py-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-900 font-mono font-bold uppercase text-xs cursor-pointer border-b border-gray-200 dark:border-zinc-700 last:border-b-0 text-left bg-transparent"
                                        >
                                            Retry Unfinished
                                        </button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        ) : (
                            <RetryButton onClick={() => openRetryDialog(urls)}>
                                <RotateCcw className="h-3.5 w-3.5" />
                            </RetryButton>
                        ))}

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DeleteButton />
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900 rounded-none">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-black uppercase text-2xl tracking-tighter">
                                    {isInProgress
                                        ? "Cancel Workflow?"
                                        : "Delete Item?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="font-mono font-bold text-black dark:text-white border-l-4 border-red-500 pl-2">
                                    {isInProgress
                                        ? "STOP THE CURRENT PROCESS."
                                        : "THIS ACTION CANNOT BE UNDONE."}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel className="border-2 border-black dark:border-white rounded-none font-bold uppercase">
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() =>
                                        isInProgress
                                            ? cancelMutation.mutate(
                                                  { workflow_id: item.taskId },
                                                  {
                                                      onSuccess: () => {
                                                          toast.success(
                                                              "Workflow cancelled",
                                                          );
                                                          queryClient.invalidateQueries(
                                                              trpc.history.list_history.queryOptions(),
                                                          );
                                                      },
                                                      onError: (e: unknown) => {
                                                          toast.error(
                                                              e instanceof Error
                                                                  ? e.message
                                                                  : "Cancel failed",
                                                          );
                                                      },
                                                  },
                                              )
                                            : deleteMutation.mutate(
                                                  { taskId: item.taskId },
                                                  {
                                                      onSuccess: () => {
                                                          toast.success(
                                                              "Deleted",
                                                          );
                                                          queryClient.invalidateQueries(
                                                              trpc.history.list_history.queryOptions(),
                                                          );
                                                      },
                                                      onError: (e: unknown) => {
                                                          toast.error(
                                                              e instanceof Error
                                                                  ? e.message
                                                                  : "Delete failed",
                                                          );
                                                      },
                                                  },
                                              )
                                    }
                                >
                                    {isInProgress ? "Stop" : "Delete"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Card Body - Metadata */}
            <div className="p-4 flex-1 space-y-4">
                <div className="flex flex-wrap gap-2">
                    {/* Files Count */}
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] text-xs font-black font-mono">
                        <FileText className="h-3.5 w-3.5" />
                        <span>
                            {item.total > 0
                                ? `${item.current}/${item.total}`
                                : urls.length}{" "}
                            <span className="text-[10px] opacity-60 uppercase">
                                Files
                            </span>
                        </span>
                    </div>
                    {/* API Key Name */}
                    {item.apiKeyName && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-400 text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] text-xs font-black font-mono uppercase">
                            <span className="text-[10px] opacity-70 mr-1.5">
                                Key:
                            </span>
                            <span>{String(item.apiKeyName)}</span>
                        </div>
                    )}
                    {/* Provider / Model - NO TRUNCATION */}
                    {(item.provider || item.model) && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-stone-100 dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] text-xs font-black font-mono">
                            <span className="break-all uppercase">
                                <span className="text-[10px] opacity-60 mr-1.5">
                                    Model:
                                </span>
                                {[item.provider, item.model]
                                    .filter(Boolean)
                                    .join(" / ")}
                            </span>
                        </div>
                    )}
                </div>

                {/* Time & Detailed Status */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-tight">
                    <div className="flex items-center gap-1 shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                        {item.createdAt
                            ? new Date(item.createdAt).toLocaleString()
                            : "Unknown"}
                    </div>
                </div>
            </div>

            {/* Progress Bar - Full Width at Bottom */}
            {isInProgress && (
                <Progress
                    value={item.progress ?? 0}
                    indicatorClassName="bg-yellow-400"
                    className="h-4 border-t-2 border-black dark:border-white"
                >
                    <div className="absolute inset-0 flex items-center justify-end px-1.5 pointer-events-none">
                        <span className="text-[9px] font-black text-black dark:text-white drop-shadow-sm">
                            {Math.round(item.progress ?? 0)}%
                        </span>
                    </div>
                </Progress>
            )}

            {/* Error Message */}
            {item.errorMessage && (
                <div className="px-4 py-3 bg-red-100 dark:bg-red-900 border-t-2 border-black dark:border-white text-xs font-bold font-mono text-black dark:text-white flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                        <span className="bg-red-600 text-white px-1.5 font-black mr-2 uppercase">
                            System Error
                        </span>
                        <span className="leading-tight break-all">
                            {JSON.stringify(item.errorMessage)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

function DeleteButton({
    onClick,
    isInProgress,
    ...props
}: React.ComponentProps<"button"> & { isInProgress?: boolean }) {
    return (
        <Button
            size="xs"
            {...props}
            className="bg-white dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950 text-red-600 hover:bg-red-100"
            onClick={onClick}
        >
            {isInProgress ? (
                <StopCircle className="h-3.5 w-3.5" />
            ) : (
                <Trash2 className="h-3.5 w-3.5" />
            )}
        </Button>
    );
}

function RetryButton({ onClick, ...props }: React.ComponentProps<"button">) {
    return (
        <Button
            size="xs"
            {...props}
            className="bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-yellow-200 dark:hover:bg-yellow-900 border-2 border-black dark:border-white"
            onClick={onClick}
        >
            <RotateCcw className="h-3.5 w-3.5" />
        </Button>
    );
}

function ViewButton({ onClick, ...props }: React.ComponentProps<"button">) {
    return (
        <Button
            size="xs"
            {...props}
            className="bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-blue-200 dark:hover:bg-blue-900"
            onClick={onClick}
        >
            <Eye className="h-3.5 w-3.5" />
        </Button>
    );
}

import React from "react";
import {
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    ArrowLeft,
    RefreshCw,
    Clock,
} from "lucide-react";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TranslateDialogue from "@/components/translate-dialogue";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { HistoryCard } from "@/routes/history/-history-card";
import { HistoryCardSkeleton } from "@/routes/history/-history-card-skeleton";
import { useGoBack } from "@/hooks/use-goback";
import { useTRPC } from "@/server/trpc/react";

export default function HistoryClientPage() {
    return <ActualPage />;
}

function ActualPage() {
    const trpc = useTRPC()
    const { data: history, isLoading, isFetching, refetch } = useQuery(trpc.history.list_history.queryOptions({},{refetchInterval: 10000}));
    const navigate = useNavigate();

    const { handleBack } = useGoBack()

    const [retryDialogOpen, setRetryDialogOpen] = React.useState(false);
    const [retryUrls, setRetryUrls] = React.useState<string[]>([]);

    const openRetryDialog = (urls: string[]) => {
        setRetryUrls(urls);
        setRetryDialogOpen(true);
    };

    return (
        <div className="min-h-screen bg-bg-main bg-[radial-gradient(var(--bg-pattern-color)_1px,transparent_1px)] bg-size-[16px_16px]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 border-b-4 border-black dark:border-white pb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-4 font-mono uppercase h-10 px-4"
                        onClick={handleBack}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    {/* <Button variant={"destructive"}>test</Button> */}

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white">
                                    Translation History
                                </h1>
                            </div>
                            <p className="mt-2 text-base font-mono bg-yellow-100 dark:bg-yellow-900 p-2 border-2 border-black dark:border-white inline-block text-black dark:text-white">
                                View and manage your recent translation tasks
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isFetching}
                            onClick={()=>refetch()}
                            className=" hover:bg-yellow-300 dark:hover:bg-yellow-700 font-mono uppercase"
                        >
                            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                            {isFetching ? "Refreshing..." : "Refresh"}
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {isLoading && (
                        <>
                            {[1, 2, 3].map((i) => (
                                <HistoryCardSkeleton key={i} />
                            ))}
                        </>
                    )}

                    {!isLoading && (!history || history.length === 0) && (
                        <Card className="border-2 border-dashed border-black dark:border-white bg-gray-50 dark:bg-zinc-900">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="rounded-full bg-white dark:bg-zinc-800 border-2 border-black dark:border-white p-4 mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                                    <Clock className="h-8 w-8 text-black dark:text-white" />
                                </div>
                                <h3 className="text-xl font-black uppercase mb-2">
                                    No history yet
                                </h3>
                                <p className="text-sm font-mono text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
                                    Your translation tasks will appear here.
                                    Start translating to build your history.
                                </p>
                                <Button
                                    variant="default"
                                    onClick={() => navigate({ to: "/" })}
                                    className="uppercase tracking-tight"
                                >
                                    Start Translating
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {history?.map((item) => (
                        <HistoryCard
                            key={`history-${item!.taskId}`}
                            item={item!}
                            openRetryDialog={openRetryDialog}
                        />
                    ))}
                </div>
            </div>

            <TranslateDialogue
                checkedItems={retryUrls.map(() => true)}
                data={retryUrls.map((u) => ({ url: u, title: undefined }))}
                dialogueOpen={retryDialogOpen}
                SetDialogueOpen={setRetryDialogOpen}
            />
        </div>
    );
}

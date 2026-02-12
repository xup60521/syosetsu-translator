import { useQuery } from "@tanstack/react-query";
import React from "react";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Button } from "../components/ui/button";
import {
    NovelContentLoading,
    SidePanelLoading,
    NovelViewLoading,
} from "./-NovelViewLoading";
import { cn } from "@/lib/utils";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import TranslateDialogue from "../components/translate-dialogue";
import { authClient } from "@/server/better-auth/auth-client";

import { useIsMobile } from "@/hooks/use-mobile";
import {
    ResizablePanel,
    ResizablePanelGroup,
} from "../components/ui/resizable";
import { ClientOnly } from "@tanstack/react-router";
import { useTRPC } from "@/server/trpc/react";

export default function NovelView({
    url_string,
}: {
    url_string: string;
}): React.JSX.Element {
    const [selectedNovelURL, setSelectedNovelURL] = React.useState<
        string | undefined
    >(undefined);
    const [fetchedTitles, setFetchedTitles] = React.useState<
        Record<string, string>
    >({});

    const updateTitle = React.useCallback((url: string, title: string) => {
        setFetchedTitles((prev) => ({ ...prev, [url]: title }));
    }, []);
    const isMobile = useIsMobile();

    const trpc = useTRPC();
    const query = useQuery(
        trpc.novel.novel_handler.queryOptions(
            { url: selectedNovelURL!, with_Cookies: false },
            { enabled: !!selectedNovelURL },
        ),
    );

    // Update title when data is fetched
    React.useEffect(() => {
        if (query.data?.title && selectedNovelURL) {
            updateTitle(selectedNovelURL, query.data.title);
        }
    }, [query.data, selectedNovelURL, updateTitle]);

    return (
        <div className="flex flex-row flex-1 w-full grow min-h-0 gap-2">
            <ClientOnly fallback={<NovelViewLoading />}>
                <ResizablePanelGroup className="w-full flex flex-nowrap ">
                    {!isMobile && (
                        <ResizablePanel className="grow">
                            <NovelContentView
                                selectedNovelURL={selectedNovelURL}
                                data={query.data}
                                error={query.error}
                                isLoading={query.isLoading}
                            />
                        </ResizablePanel>
                    )}
                    <ResizablePanel
                        defaultSize={400}
                        className="bg-stone-50 dark:bg-zinc-900 border-2 border-black dark:border-white"
                    >
                        <SidePanel
                            url_string={url_string}
                            selectedNovelURL={selectedNovelURL}
                            setSelectedNovelURL={setSelectedNovelURL}
                            fetchedTitles={fetchedTitles}
                        />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </ClientOnly>
        </div>
    );
}

function NovelContentView({
    selectedNovelURL,
    data,
    error,
    isLoading,
}: {
    selectedNovelURL: string | undefined;
    data: any;
    error: any;
    isLoading: boolean;
}): React.JSX.Element {
    return (
        <div className="min-h-0 max-h-full h-full grow overflow-hidden border-2 border-black dark:border-white bg-white dark:bg-black">
            {/* {selectedNovelURL} */}
            {error && (
                <div className="p-4 text-red-600">
                    Error:{" "}
                    {error instanceof Error ? error.message : "Unknown error"}
                </div>
            )}
            {isLoading && <NovelContentLoading />}
            {!selectedNovelURL && !isLoading && !error && (
                <div className="flex items-center justify-center h-full text-gray-400">
                    <p className="text-lg">Select an episode to view</p>
                </div>
            )}
            {data && (
                <ScrollArea className="w-full min-w-0 flex-1 mx-auto overflow-auto h-full p-4 py-0 pl-0 min-h-0 max-h-full">
                    <div className=" max-w-5xl mx-auto  pl-4">
                        <div className="flex justify-between border-b-4 border-black dark:border-white pb-4 mb-6 mr-0.5 mt-8">
                            <h1 className="text-4xl font-black mb-0 uppercase tracking-tighter">
                                {data.title}
                            </h1>
                            <Button
                                variant={"outline"}
                                onClick={() => {
                                    const content =
                                        "# " +
                                        data.title +
                                        "\n\n" +
                                        data.author +
                                        "\n\n" +
                                        selectedNovelURL +
                                        "\n\n" +
                                        data.content;
                                    navigator.clipboard.writeText(content);
                                    toast.info(
                                        "Copied novel content to clipboard!",
                                    );
                                }}
                            >
                                Copy
                            </Button>
                        </div>
                        <div className="flex gap-4 items-baseline mb-8 ">
                            <h2 className="text-xl font-bold bg-black dark:bg-white text-white dark:text-black px-2 py-1">
                                BY {data.author}
                            </h2>

                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 break-all underline decoration-2 decoration-black dark:decoration-white">
                                <a target="_blank" href={selectedNovelURL}>
                                    {selectedNovelURL}
                                </a>
                            </h3>
                        </div>
                        {data.tags && data.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-8">
                                {data.tags.map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="text-xs font-bold border-2 border-black dark:border-white px-2 py-0.5 uppercase"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {data.content
                            .split("\n")
                            .map((paragraph: string, index: number) => (
                                <p
                                    key={`${selectedNovelURL}-${index}`}
                                    className="mb-4 leading-relaxed"
                                >
                                    {paragraph}
                                </p>
                            ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}

function SidePanel({
    selectedNovelURL,
    setSelectedNovelURL,
    fetchedTitles,
    url_string,
}: {
    selectedNovelURL: string | undefined;
    url_string: string;
    setSelectedNovelURL: React.Dispatch<
        React.SetStateAction<string | undefined>
    >;
    fetchedTitles: Record<string, string>;
}): React.JSX.Element {
    // const decompose_url = useServerFn(decompose_url_serverfn);

    const trpc = useTRPC();
    const { isLoading, error, data } = useQuery(
        trpc.novel.decompose_url.queryOptions({ url_string }),
    );
    const [checkedItems, setCheckedItems] = React.useState<boolean[]>([]);
    const [dialogueOpen, SetDialogueOpen] = React.useState(false);
    const session = authClient.useSession();
    React.useEffect(() => {
        if (
            isLoading === false &&
            error == null &&
            data != null &&
            data.length > 0
        ) {
            setSelectedNovelURL(data[0]!.url);
            setCheckedItems([...new Array(data.length).fill(true)]);
        }
    }, [data, error, isLoading, setSelectedNovelURL]);
    return (
        <div className="min-h-0 h-full flex flex-none flex-col w-full ">
            <h2 className="text-lg font-bold p-3 w-full bg-yellow-300 dark:bg-yellow-600 border-b-2 border-black dark:border-white font-mono uppercase tracking-tight">
                Novel Queue List
            </h2>
            <ScrollArea className="grow min-h-0 h-full w-full overflow-auto py-0">
                {error && (
                    <div className="p-4 text-red-600">
                        Error:{" "}
                        {error instanceof Error
                            ? error.message
                            : "Unknown error"}
                    </div>
                )}
                {isLoading && <SidePanelLoading />}

                {data &&
                    data.map((item, index) => (
                        <React.Fragment key={index}>
                            {index === 0 ? null : <Separator className="" />}
                            <div
                                rel="noopener noreferrer"
                                onClick={() =>
                                    setSelectedNovelURL(
                                        item.url === selectedNovelURL
                                            ? undefined
                                            : item.url,
                                    )
                                }
                                className={cn(
                                    "text-black dark:text-white text-sm py-3 px-3 cursor-pointer flex gap-2.5 hover:bg-yellow-100 dark:hover:bg-yellow-900 transition border-y-2 border-transparent",
                                    selectedNovelURL === item.url &&
                                        "bg-yellow-300 dark:bg-yellow-700 font-bold border-black dark:border-white border-y-2 last:border-b-2 first:border-t-2",
                                )}
                            >
                                <Checkbox
                                    checked={checkedItems[index] ?? false}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newCheckedItems = [
                                            ...checkedItems,
                                        ];
                                        newCheckedItems[index] =
                                            !newCheckedItems[index];
                                        setCheckedItems(newCheckedItems);
                                    }}
                                />
                                <span>
                                    {fetchedTitles[item.url] ??
                                        item.title ??
                                        item.url}
                                </span>
                            </div>
                        </React.Fragment>
                    ))}
            </ScrollArea>
            <div className="w-full p-3 py-1.5 flex items-center bg-white dark:bg-zinc-900 border-t-2 border-black dark:border-white gap-2">
                <div className=" flex items-center gap-2.5 mb-1.5">
                    <Checkbox
                        id="select-all-checkbox"
                        className="border-black dark:border-white"
                        checked={isButtonAllChecked(checkedItems)}
                        onClick={() => {
                            if (isButtonAllChecked(checkedItems)) {
                                setCheckedItems([
                                    ...checkedItems.map(() => false),
                                ]);
                            } else {
                                setCheckedItems([
                                    ...checkedItems.map(() => true),
                                ]);
                            }
                        }}
                    />
                    <Label
                        className="text-xs font-bold uppercase pt-1"
                        htmlFor="select-all-checkbox"
                    >
                        Select All
                    </Label>
                </div>
                <div className="grow"></div>
                <TranslateDialogue
                    dialogueOpen={dialogueOpen}
                    SetDialogueOpen={SetDialogueOpen}
                    checkedItems={checkedItems}
                    data={data ? data : []}
                />
                <Button
                    disabled={
                        !checkedItems.some((item) => item === true) || !data
                    }
                    className="mb-1"
                    size="sm"
                    onClick={() => {
                        if (!session.data) {
                            toast.info(
                                "Please connect to a Google Drive account in settings to continue...",
                            );
                            return;
                        }
                        SetDialogueOpen(true);
                    }}
                >
                    Translate
                </Button>
            </div>
        </div>
    );
}

function isButtonAllChecked(checkedItems: boolean[]): boolean {
    return checkedItems.every((item) => item === true);
}

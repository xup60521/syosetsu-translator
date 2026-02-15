import {
    ClientOnly,
    createFileRoute,
    useNavigate,
    useRouter,
} from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Menu, ArrowLeft, SquareMenu, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
    HistoryIcon,
    Settings as SettingsIcon,
    HomeIcon,
    MenuIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { NovelContentLoading, SidePanelLoading } from "../-NovelViewLoading";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { ThemeMenu } from "@/components/theme-menu";
import { atom, useAtom, useSetAtom } from "jotai";
import { useTRPC } from "@/server/trpc/react";

export const Route = createFileRoute("/view/$subFolderId")({
    validateSearch: zodValidator(
        z.object({
            selectedFileId: z.string().optional().default("").catch(""),
        }),
    ),
    component: RouteComponent,
});

const sidebarOpenAtom = atom(false);

function RouteComponent() {
    const { subFolderId } = Route.useParams();
    const { selectedFileId } = Route.useSearch();
    const isMobile = useIsMobile();
    const [mobileOpen, setMobileOpen] = useAtom(sidebarOpenAtom);
    const navigate = useNavigate();
    const router = useRouter();
    const trpc = useTRPC();

    // Fetch Files List
    const {
        data: filesData,
        isLoading: isFilesLoading,
        error: filesError,
    } = useQuery(trpc.drive.listFiles.queryOptions({ folderId: subFolderId }));

    // Fetch File Content

    function updateSelectedFileId(id: string) {
        navigate({
            to: ".",
            search: (prev) => ({ ...prev, selectedFileId: id }),
            replace: true,
        });
    }

    // Select first file by default if valid
    useEffect(() => {
        if (!selectedFileId && filesData?.files && filesData.files.length > 0) {
            navigate({
                to: ".",
                search: (prev) => ({
                    ...prev,
                    selectedFileId: filesData.files[0].id,
                }),
                replace: true,
            });
        }
    }, [filesData, selectedFileId]);

    // Find current folder name (this might need an extra query if not available, strictly speaking,
    // but we can just use "Folder View" or similar if we don't want to add overhead now.
    // For now, let's keep it simple.)

    return (
        <div className="flex flex-col h-screen max-h-screen bg-bg-main bg-[radial-gradient(var(--bg-pattern-color)_1px,transparent_1px)] bg-size-[16px_16px] overflow-hidden">
            {/* Header */}
            <div className="flex-none border-b-4 border-black dark:border-white bg-bg-main p-2 pb-3">
                <div className="flex items-center gap-4 justify-between w-full">
                    <div className="flex w-full items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="font-mono uppercase h-10 px-4 border-2 border-transparent hover:border-black dark:hover:border-white"
                            onClick={() =>
                                router.history.canGoBack()
                                    ? router.history.back()
                                    : navigate({ to: "/view" })
                            }
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white leading-none">
                                Reader
                            </h1>
                        </div>
                        <div className="grow flex-1"></div>
                        <div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className="mr-1"
                                    >
                                        <MenuIcon />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900 p-0 w-56 rounded-none">
                                    <ThemeMenu />
                                    <Link
                                        to="/"
                                        preload={"render"}
                                        className="flex items-center gap-3 p-3 font-mono font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors group"
                                    >
                                        <HomeIcon className="size-4" />
                                        <span>Home</span>
                                    </Link>
                                    <Link
                                        preload={"render"}
                                        to="/history"
                                        className="flex items-center gap-3 p-3 font-mono font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors group"
                                    >
                                        <HistoryIcon className="size-4" />
                                        <span>History</span>
                                    </Link>
                                    <Link
                                        preload={"render"}
                                        to="/settings"
                                        className="flex items-center gap-3 p-3 font-mono font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors group"
                                    >
                                        <SettingsIcon className="size-4 group-hover:rotate-90 transition-transform" />
                                        <span>Settings</span>
                                    </Link>
                                    {isMobile && (
                                        <button
                                            onClick={() => setMobileOpen(true)}
                                            className="flex items-center gap-3 p-3 font-mono font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors group"
                                        >
                                            <SquareMenu className="size-4" />
                                            <span>Select Episodes</span>
                                        </button>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Header / Navigation - Combined or Separate? 
                The above header serves as the main nav. 
                The mobile menu toggle should probably be part of the sub-layout or just below.
            */}

            <div className="flex-1 flex min-h-0 relative">
                {isMobile && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetContent
                                side="left"
                                className="p-0 border-r-2 border-black dark:border-white w-[85vw] bg-stone-50 dark:bg-zinc-900"
                            >
                                <SidePanel
                                    files={filesData?.files}
                                    isLoading={isFilesLoading}
                                    error={filesError}
                                    selectedFileId={selectedFileId}
                                    onSelect={(id) => {
                                        updateSelectedFileId(id);
                                        setMobileOpen(false);
                                    }}
                                />
                            </SheetContent>
                        </Sheet>
                    </div>
                )}
                <ClientOnly>
                    <ResizablePanelGroup className="w-full h-full">
                        <ResizablePanel defaultSize={75} className="h-full">
                            <ContentView
                                selectedFileId={selectedFileId}
                                files={filesData?.files}
                                onSelectFile={updateSelectedFileId}
                            />
                        </ResizablePanel>

                        {!isMobile && (
                            <>
                                <ResizableHandle className="w-2 bg-transparent hover:bg-yellow-400 transition-colors" />
                                <ResizablePanel
                                    defaultSize={25}
                                    className="h-full border-l-2 border-black dark:border-white bg-white dark:bg-zinc-900"
                                >
                                    <SidePanel
                                        files={filesData?.files}
                                        isLoading={isFilesLoading}
                                        error={filesError}
                                        selectedFileId={selectedFileId}
                                        onSelect={updateSelectedFileId}
                                    />
                                </ResizablePanel>
                            </>
                        )}
                    </ResizablePanelGroup>
                </ClientOnly>
            </div>
        </div>
    );
}

function SidePanel({
    files,
    isLoading,
    error,
    selectedFileId,
    onSelect,
}: {
    files?: { id: string; name: string }[];
    isLoading: boolean;
    error: any;
    selectedFileId: string | undefined;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="min-h-0 h-full flex flex-none flex-col w-full">
            <h2 className="text-lg font-bold p-3 w-full bg-yellow-300 dark:bg-yellow-600 border-b-2 border-black dark:border-white font-mono uppercase tracking-tight">
                Novel Files
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

                {files &&
                    files.map((file, index) => (
                        <React.Fragment key={file.id}>
                            {index === 0 ? null : <Separator className="" />}
                            <div
                                onClick={() => onSelect(file.id)}
                                className={cn(
                                    "text-black dark:text-white text-sm py-3 px-3 cursor-pointer flex gap-2.5 hover:bg-yellow-100 dark:hover:bg-yellow-900 transition border-y-2 border-transparent",
                                    selectedFileId === file.id &&
                                        "bg-yellow-300 dark:bg-yellow-700 font-bold border-black dark:border-white border-y-2 last:border-b-2 first:border-t-2",
                                )}
                            >
                                <span className="break-all line-clamp-2">
                                    {file.name}
                                </span>
                            </div>
                        </React.Fragment>
                    ))}
                {files && files.length === 0 && (
                    <div className="p-4 text-center text-gray-500 font-mono text-sm">
                        No text files found.
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

function ContentView({
    selectedFileId,
    files,
    onSelectFile,
}: {
    selectedFileId: string | undefined;
    files?: { id: string; name: string }[];
    onSelectFile: (id: string) => void;
}) {
    const setMobileOpen = useSetAtom(sidebarOpenAtom);
    const scrollAreaRef = React.useRef<HTMLDivElement>(null!);
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();
    const trpc = useTRPC();
    const {
        data: fileContent,
        isLoading,
        error,
    } = useQuery(
        trpc.drive.fileContent.queryOptions(
            {
                fileId: selectedFileId ?? "",
            },
            {
                enabled: !!selectedFileId,
            },
        ),
    ); // Pass empty string if undefined to avoid query errors
    // Find current file index to determine if we can go to previous/next
    const currentFileIndex =
        files && selectedFileId
            ? files.findIndex((f) => f.id === selectedFileId)
            : -1;

    const canGoPrevious = currentFileIndex > 0;
    const canGoNext =
        currentFileIndex >= 0 && currentFileIndex < (files?.length ?? 0) - 1;

    const handlePrevious = () => {
        if (canGoPrevious && files && onSelectFile) {
            onSelectFile(files[currentFileIndex - 1].id);
            // Smooth scroll to top
        }
    };

    const handleNext = () => {
        if (canGoNext && files) {
            onSelectFile(files[currentFileIndex + 1].id);
        }
    };

    useEffect(() => {
        if (canGoNext && files) {
            const nextFileId = files[currentFileIndex + 1].id;
            queryClient.prefetchQuery(
                trpc.drive.fileContent.queryOptions({ fileId: nextFileId }),
            );
        }
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [selectedFileId]);

    return (
        <div className="min-h-0 max-h-full h-full grow overflow-hidden border-2 border-black dark:border-white bg-white dark:bg-black">
            {error && (
                <div className="p-4 text-red-600">
                    Error:{" "}
                    {error instanceof Error ? error.message : "Unknown error"}
                </div>
            )}
            {(isLoading || !files) && <NovelContentLoading />}
            {!selectedFileId && !isLoading && !error && (
                <div className="flex items-center justify-center h-full text-gray-400">
                    <p className="text-lg">Select a file to view</p>
                </div>
            )}
            {fileContent && (
                <ScrollArea
                    ref={scrollAreaRef}
                    className="w-full min-w-0 flex-1 mx-auto overflow-auto h-full p-4 py-0 pl-0 min-h-0 max-h-full scroll-smooth"
                >
                    <div className=" max-w-5xl mx-auto  pl-4 pb-32">
                        <div className="flex justify-between border-b-4 border-black dark:border-white pb-4 mb-6 mr-0.5 mt-8 min-w-0">
                            <h1 className="text-4xl font-black mb-0 uppercase tracking-tighter break-all">
                                {fileContent.title}
                            </h1>
                        </div>

                        {fileContent.content
                            .split("\n")
                            .map((paragraph: string, index: number) => (
                                <p
                                    key={`${selectedFileId}-${index}`}
                                    className="mb-4 leading-relaxed text-wrap min-w-0 break-all"
                                >
                                    {paragraph}
                                </p>
                            ))}
                        <div className="flex gap-4 mt-8 pb-4 w-full justify-between items-center max-w-lg mx-auto h-fit min-h-0 overflow-hidden">
                            <Button
                                variant={"outline"}
                                className="flex-1"
                                onClick={handlePrevious}
                                disabled={!canGoPrevious}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className={cn(isMobile ? "hidden" : "")}>
                                    Previous
                                </span>
                            </Button>

                            {isMobile && (
                                <Button
                                    variant={"outline"}
                                    className="px-4"
                                    onClick={() => setMobileOpen(true)}
                                >
                                    <Menu className="h-4 w-4" />
                                </Button>
                            )}

                            <Button
                                variant={"default"} // Primary action
                                className="flex-1 mr-1"
                                onClick={handleNext}
                                disabled={!canGoNext}
                            >
                                <span className={cn(isMobile ? "hidden" : "")}>
                                    Next
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}

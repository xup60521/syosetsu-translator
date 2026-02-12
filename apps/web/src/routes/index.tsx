import {
    useLocation,
    useNavigate,
    useRouterState,
    createFileRoute,
} from "@tanstack/react-router";

import z from "zod";
import NovelView from "@/routes/-NovelView";
import { toast } from "sonner";
import { useEffect } from "react";
import React from "react";
import { cn } from "@/lib/utils";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

import {
    HistoryIcon,
    Settings as SettingsIcon,
    Moon,
    Sun,
    HomeIcon,
    MenuIcon,
    ViewIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "next-themes";
import { ThemeMenu } from "@/components/theme-menu";

export const Route = createFileRoute("/")({
    component: App,
    ssr: false,
});

function App() {
    // Don't use Route.useSearch because the length of url_string may be too long for URL query params
    // use location.state instead
    const urlString =
        useRouterState({
            select: (state) => state.location.state.url_string,
        }) ?? "";

    return (
        <div className="w-full h-screen flex flex-col md:px-8 md:py-3 px-3 py-2 md:gap-3 gap-2 bg-amber-50 dark:bg-zinc-950/50 bg-[radial-gradient(var(--bg-pattern-color)_1px,transparent_1px)] bg-size-[16px_16px]">
            <InputBar urlString={urlString} />
            {urlString !== "" && urlString !== null && (
                <NovelView url_string={urlString} />
            )}
        </div>
    );
}

const urlString_schema = z.string().refine((value) => {
    const urls = value.split(" ");
    for (const url of urls) {
        try {
            new URL(url);
        } catch (e) {
            return false;
        }
    }
    return true;
});

function InputBar({ urlString }: { urlString: string }): React.JSX.Element {
    const navigate = useNavigate();
    const ref = React.useRef<HTMLInputElement>(null);
    const location = useLocation();

    function onClickTranslate() {
        const inputValue = ref.current?.value;
        if (inputValue && urlString_schema.safeParse(inputValue).success) {
            // navigate({ to: `?url_string=${inputValue}` });
            navigate({ state: { url_string: inputValue } });
        } else {
            toast.error("Please enter valid URLs separated by spaces.", {
                className: "!bg-red-800 !text-white",
            });
        }
    }
    function onClickToLandingPage() {
        if (ref.current?.value) {
            ref.current.value = "";
        }
    }
    const isDetailPage = urlString !== "";
    useEffect(() => {
        if (typeof window !== undefined) {
            const path = location.pathname;
            if (path === "/") {
                localStorage.setItem("preview_url_string", urlString);
            }
        }
    }, [location]);
    return (
        <div
            className={cn(
                "w-full h-screen flex justify-center items-center pr-1",
                isDetailPage && "h-fit",
            )}
        >
            <div
                className={cn(
                    "max-w-150 w-full flex flex-col items-center gap-4",
                    isDetailPage &&
                    "flex-row max-w-screen w-full gap-2 justify-between",
                )}
            >
                <h1
                    className={cn(
                        "font-bold text-xl sm:text-2xl font-mono text-center sm:text-left w-fit",
                    )}
                >
                    <Link
                        onClick={onClickToLandingPage}
                        to="/"
                        preload="viewport"
                    >
                        {isDetailPage ? (
                            <Button variant={"outline"}>
                                <HomeIcon />
                            </Button>
                        ) : (
                            <span>Syosetsu Translator</span>
                        )}
                    </Link>
                </h1>
                <div
                    className={cn(
                        "flex w-full gap-2 flex-col items-center flex-wrap",
                        isDetailPage && "flex-row grow flex-nowrap",
                    )}
                >
                    <Input
                        placeholder="Input novel urls, separated by space"
                        className="placeholder:text-gray-400 min-w-0 py-2"
                        ref={ref}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") return onClickTranslate();
                        }}
                        defaultValue={urlString ?? ""}
                    />
                    <Button onClick={onClickTranslate}>Enter</Button>
                </div>
                <div
                    className={cn(
                        "fixed top-2 right-3 z-50 flex gap-2",
                        isDetailPage && "relative top-0 right-0 shrink-0 w-fit",
                    )}
                >
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"}>
                                <MenuIcon />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900 p-0 w-56 rounded-none">
                            <ThemeMenu />
                            <Link
                                to="/view"
                                preload={"render"}
                                className="flex items-center gap-3 p-3 font-mono font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors group"
                            >
                                <ViewIcon className="size-4" />
                                <span>View</span>
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
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
}


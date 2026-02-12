import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeMenu(): React.JSX.Element {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex flex-col">
            <div className="px-3 py-2 bg-yellow-300 dark:bg-yellow-600 border-b-2 border-black dark:border-white">
                <span className="text-sm font-mono font-black uppercase tracking-tight">
                    Appearance
                </span>
            </div>
            <div className="grid grid-cols-2 border-b-2 border-black dark:border-white divide-x-2 divide-black dark:divide-white">
                <button
                    onClick={() => setTheme("light")}
                    className={cn(
                        "flex items-center justify-center gap-2 p-3 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900 transition-colors outline-none",
                        theme === "light" &&
                        "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90",
                    )}
                >
                    <Sun className="size-4" />
                    <span className="font-mono font-bold text-sm">Light</span>
                </button>
                <button
                    onClick={() => setTheme("dark")}
                    className={cn(
                        "flex items-center justify-center gap-2 p-3 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900 transition-colors outline-none",
                        theme === "dark" &&
                        "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90",
                    )}
                >
                    <Moon className="size-4" />
                    <span className="font-mono font-bold text-sm">Dark</span>
                </button>
            </div>
        </div>
    );
}

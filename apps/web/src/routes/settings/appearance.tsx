import { createFileRoute } from '@tanstack/react-router'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

export const Route = createFileRoute('/settings/appearance')({
    component: AppearancePanel,
})


function AppearancePanel(): React.JSX.Element {
    const { theme, setTheme } = useTheme()

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 pb-8">
            <div className="border-b-4 border-black dark:border-white pb-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Appearance</h3>
                <p className="mt-2 text-base font-mono bg-yellow-100 dark:bg-yellow-900 p-2 border-2 border-black dark:border-white inline-block">
                    Customize the look and feel of the application.
                </p>
            </div>
            {/* {typeof theme} */}
            <div className="p-6 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <div className="mb-6 pb-4 border-b-2 border-black dark:border-white">
                    <h4 className="text-xl font-black uppercase tracking-tight">Theme</h4>
                    <p className="mt-1 text-sm font-mono text-gray-600 dark:text-gray-400">Choose your preferred color scheme</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant={(theme === "light") ? "secondary" : "outline"}
                        size="lg"
                        onClick={() => setTheme("light")}
                        className="flex-1"
                    >
                        <Sun className="size-5" />
                        <span>Light</span>
                    </Button>
                    <Button
                        variant={(theme === "dark" || theme === undefined) ? "secondary" : "outline"}
                        size="lg"
                        onClick={() => setTheme("dark")}
                        className="flex-1"
                    >
                        <Moon className="size-5" />
                        <span>Dark</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}


import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/language')({
    component: LanguageRegionPanel,
})

function LanguageRegionPanel(): React.JSX.Element {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 pb-8">
            <div className="border-b-4 border-black dark:border-white pb-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Language & Region</h3>
                <p className="mt-2 text-base font-mono bg-yellow-100 dark:bg-yellow-900 p-2 border-2 border-black dark:border-white inline-block">
                    Set your preferred language and regional settings.
                </p>
            </div>
            <div className="p-12 border-2 border-dashed border-black dark:border-white bg-gray-50 dark:bg-zinc-900 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 bg-blue-300 dark:bg-blue-600 border-2 border-black dark:border-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                </div>
                <h4 className="text-2xl font-black uppercase text-black dark:text-white">Coming Soon</h4>
                <p className="font-mono text-gray-500 dark:text-gray-400 max-w-md">
                    Global support is on the roadmap. Check back later for updates.
                </p>
            </div>
        </div>
    );
}

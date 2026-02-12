import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/connected-accounts')({
    component: ConnectedAccountsPanel,
})

function ConnectedAccountsPanel(): React.JSX.Element {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 pb-8">
            <div className="border-b-4 border-black dark:border-white pb-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Connected Accounts</h3>
                <p className="mt-2 text-base font-mono bg-yellow-100 dark:bg-yellow-900 p-2 border-2 border-black dark:border-white inline-block">
                    Manage your connected third-party services.
                </p>
            </div>
            <div className="p-12 border-2 border-dashed border-black dark:border-white bg-gray-50 dark:bg-zinc-900 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 bg-green-300 dark:bg-green-600 border-2 border-black dark:border-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                </div>
                <h4 className="text-2xl font-black uppercase text-black dark:text-white">Coming Soon</h4>
                <p className="font-mono text-gray-500 dark:text-gray-400 max-w-md">
                    Integration with more services is under development.
                </p>
            </div>
        </div>
    );
}

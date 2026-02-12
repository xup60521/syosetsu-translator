import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import HistoryClientPage from "./-historyClient";
import {  get_sessionFn } from "@/server_function/get_session.serverfn";

/**
 * Server function to check session status.
 * TanStack Start uses 'getWebRequest' to access headers/cookies.
 */


export const Route = createFileRoute("/history/")({
    loader: async ({ context }) => {
        const session = await get_sessionFn();

        return { session };
    },
    component: HistoryPage,
});

function HistoryPage() {
    const { session } = Route.useLoaderData();

    if (!session?.session) {
        return <UnauthorizedPage />;
    }

    return <HistoryClientPage />;
}

function UnauthorizedPage(): React.JSX.Element {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">
                    You need to connect a Google Drive account to access your
                    history.
                </p>
            </div>
            {/* 
          In TanStack Router, it's better to use the 'asChild' pattern 
          or pass the component to the 'Link' to maintain proper routing. 
      */}
            <Button asChild>
                <Link preload="render" to="/settings/storage">Go to Settings</Link>
            </Button>
        </div>
    );
}

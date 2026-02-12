import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
    const rqContext = TanstackQuery.getContext();

    const router = createRouter({
        routeTree,
        context: {
            ...rqContext,
        },
        defaultNotFoundComponent: () => (
            <main className="p-8">
                <h1 className="text-2xl font-bold">Not Found</h1>
                <p>Sorry, we couldn't find that page.</p>
            </main>
        ),
        defaultPreload: "intent",
    });

    setupRouterSsrQueryIntegration({
        router,
        queryClient: rqContext.queryClient,
    });

    return router;
};

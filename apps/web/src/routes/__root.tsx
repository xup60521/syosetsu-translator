import {
    HeadContent,
    ScriptOnce,
    Scripts,
    createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

import type { TRPCRouter } from "@/server/trpc/trpc-router";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { Provider } from "@/integrations/tanstack-query/root-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

interface MyRouterContext {
    queryClient: QueryClient;

    trpc: TRPCOptionsProxy<TRPCRouter>;
}

declare module "@tanstack/react-router" {
    interface HistoryState {
        // 在這裡定義你的 state 結構
        // 建議使用可選屬性 (?)，因為並不是每個頁面都有這個 state
        url_string?: string;
    }
}

const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme') || 'system';
      var resolved = theme;
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.classList.add(resolved);
    } catch (e) {}
  })()
`;

export const Route = createRootRouteWithContext<MyRouterContext>()({
    head: () => ({
        meta: [
            {
                charSet: "utf-8",
            },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            {
                title: "Syosetsu Translator",
                description:
                    "A modern web application for translating Syosetsu novels.",
            },
        ],
        links: [
            {
                rel: "stylesheet",
                href: appCss,
            },
            { rel: "icon", href: "/icon.png" },
        ],
    }),

    shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
    const { queryClient } = Route.useRouteContext();
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className="bg-bg-main"
            style={{
                backgroundImage:
                    "radial-gradient(var(--bg-pattern-color) 1px,transparent 1px)",
                backgroundSize: "16px 16px",
            }}
        >
            <head>
                <ScriptOnce>{themeScript}</ScriptOnce>
                <HeadContent />
            </head>
            <body>
                <Toaster position="top-center" />
                <Provider queryClient={queryClient}>
                    <ThemeProvider attribute="class" defaultTheme="system">
                        {children}
                    </ThemeProvider>
                </Provider>
                <TanStackDevtools
                    config={{
                        position: "bottom-right",
                    }}
                    plugins={[
                        {
                            name: "Tanstack Router",
                            render: <TanStackRouterDevtoolsPanel />,
                        },
                        TanStackQueryDevtools,
                    ]}
                />
                <Scripts />
            </body>
        </html>
    );
}

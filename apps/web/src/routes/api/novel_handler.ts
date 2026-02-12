import { novel_handler } from "@/lib/novel_handler/novel_handler";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/novel_handler")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const { url, with_Cookies } = (await request.json()) as {
                    url: string;
                    with_Cookies?: boolean;
                };
                const data = await novel_handler(url, {
                    with_Cookies: with_Cookies,
                });
                return Response.json(data);
            },
        },
    },
});

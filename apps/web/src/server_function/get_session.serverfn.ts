import { auth } from "@/server/better-auth/auth";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";


export const get_sessionFn = createServerFn().handler(async () => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({
        headers,
    });
    return session;
});
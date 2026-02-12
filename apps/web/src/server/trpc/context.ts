// app/trpc/context.ts
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { auth } from '@/server/better-auth/auth';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // 在這裡處理身份驗證 (Auth) 或 初始化 DB
  const session = await auth.api.getSession({ headers: opts.req.headers });
  return {
    user: session?.user || null,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
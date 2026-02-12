import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { trpcRouter } from '@/server/trpc/trpc-router'
import { createFileRoute } from '@tanstack/react-router'
import { createContext } from '@/server/trpc/context'

function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    req: request,
    router: trpcRouter,
    createContext,
    endpoint: '/api/trpc',
  })
}

export const Route = createFileRoute('/api/trpc/$')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
})

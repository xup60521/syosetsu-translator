import { useTRPC } from "@/server/trpc/react"
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/test/')({
  component: RouteComponent,
})

function RouteComponent() {
    const trpc = useTRPC()
    const publicQuery = useQuery(trpc.hello.queryOptions())
    const protectedQuery = useQuery(trpc.protected_hello.queryOptions())
    
    return (
        <div>
            <h1>Hello "/test/"!</h1>
            <div>Public: {publicQuery.data}</div>
            <div>Protected: {protectedQuery.data} {protectedQuery.isError && protectedQuery.error.message}</div>
        </div>
    )
}

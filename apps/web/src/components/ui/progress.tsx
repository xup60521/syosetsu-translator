import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

function Progress({
    className,
    value,
    indicatorClassName,
    ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
    return (
        <ProgressPrimitive.Root
            data-slot="progress"
            className={cn(
                "bg-stone-200 dark:bg-zinc-800 relative h-4 w-full overflow-hidden rounded-none border-t-2 border-black dark:border-white",
                className
            )}
            {...props}
        >
            <ProgressPrimitive.Indicator
                data-slot="progress-indicator"
                className={cn("bg-black dark:bg-white h-full w-full flex-1 transition-all border-r-2 border-black dark:border-white", indicatorClassName)}
                style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
            />
            {props.children}
        </ProgressPrimitive.Root>
    )
}

export { Progress }

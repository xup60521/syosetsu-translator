import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center justify-center border-2 border-black px-2 py-0.5 text-[10px] font-bold font-mono uppercase w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none transition-all overflow-hidden",
    {
        variants: {
            variant: {
                default:
                    "bg-green-300 text-black hover:bg-green-400",
                secondary:
                    "bg-yellow-200 text-black hover:bg-yellow-300",
                destructive:
                    "bg-red-300 text-black hover:bg-red-400",
                outline:
                    "bg-gray-200 text-black hover:bg-gray-300",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Badge({
    className,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<"span"> &
    VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : "span"

    return (
        <Comp
            data-slot="badge"
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    )
}

export { Badge, badgeVariants }

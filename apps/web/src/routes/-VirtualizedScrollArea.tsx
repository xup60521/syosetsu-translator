import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ScrollArea } from "@/components/ui/scroll-area"

export function VirtualizedScrollArea() {
  // 1. This ref goes on the ScrollArea component
  const scrollAreaRef = React.useRef<HTMLDivElement>(null!)
  
  // 2. We need a state to hold the actual scrollable viewport element
  const [scrollElement, setScrollElement] = React.useState<HTMLDivElement | null>(null)

  // 3. Find the viewport after mount
  React.useEffect(() => {
    // Radix/Shadcn always adds a [data-radix-scroll-area-viewport] attribute
    const viewport = scrollAreaRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    )
    if (viewport instanceof HTMLDivElement) {
      setScrollElement(viewport)
    }
  }, [])

  const rowVirtualizer = useVirtualizer({
    count: 10000,
    getScrollElement: () => scrollElement, // Pass the viewport here
    estimateSize: () => 35,
    overscan: 5,
  })

  return (
    <ScrollArea 
      ref={scrollAreaRef} 
      className="h-[400px] w-full rounded-md border"
    >
      {/* The inner container with total height */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            Item {virtualItem.index}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
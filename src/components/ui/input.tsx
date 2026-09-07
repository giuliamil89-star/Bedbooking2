import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-14 w-full rounded-2xl border border-foreground/15 bg-white px-5 text-base text-foreground placeholder:text-foreground/40 shadow-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

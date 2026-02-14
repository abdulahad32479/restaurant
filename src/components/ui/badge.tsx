import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/src/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-white hover:bg-primary-hover",
        secondary:
          "border-transparent bg-dukes-bg-secondary text-dukes-text-primary hover:bg-dukes-bg-secondary/80",
        destructive:
          "border-transparent bg-red-900 text-white hover:bg-red-900/80",
        outline: "text-dukes-text-primary border-dukes-border",
        success: "border-transparent bg-green-900/30 text-green-400 border border-green-900",
        warning: "border-transparent bg-yellow-900/30 text-yellow-400 border border-yellow-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/src/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-hover shadow-soft hover:shadow-active border border-transparent",
        secondary:
          "bg-transparent border border-dukes-border text-dukes-text-primary hover:border-accent hover:text-accent",
        danger:
          "bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40",
        ghost: "hover:bg-dukes-bg-secondary hover:text-accent",
        link: "text-primary underline-offset-4 hover:underline",
        icon: "rounded-full p-0 aspect-square hover:bg-dukes-bg-secondary text-dukes-text-secondary hover:text-white",
        active: "bg-primary text-white shadow-active scale-[0.98]",
      },
      size: {
        default: "h-12 px-6 py-2 rounded-md",
        sm: "h-9 rounded-md px-3",
        lg: "h-14 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

import * as React from "react"
import { cn } from "@/src/lib/utils"
import { Button as ShadcnButton, buttonVariants } from "@/src/components/ui/button"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  fullWidth?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, icon, children, ...props }, ref) => {
    
    // Map custom variants to styles
    const getVariantClasses = (v: string) => {
      switch (v) {
        case 'primary': return "bg-[#8B0000] hover:bg-[#A00000] text-white border-transparent"
        case 'secondary': return "bg-[#2A2A2A] hover:bg-[#333333] text-white border-transparent" 
        case 'accent': return "bg-[#D4AF37] hover:bg-[#E5C04A] text-black border-transparent font-semibold"
        case 'ghost': return "bg-transparent hover:bg-[#2A2A2A] text-[#B3B3B3] hover:text-white border-transparent"
        case 'outline': return "bg-transparent border-[#2A2A2A] text-white hover:border-[#D4AF37] hover:text-[#D4AF37]"
        case 'danger': return "bg-[#EF444415] text-[#EF4444] hover:bg-[#EF444430] border-[#EF444430]"
        default: return "bg-[#8B0000] text-white"
      }
    }

    const getSizeClasses = (s: string) => {
      switch (s) {
        case 'sm': return "h-8 px-3 text-xs"
        case 'md': return "h-10 px-4 py-2"
        case 'lg': return "h-12 px-6 text-lg"
        case 'icon': return "h-10 w-10 p-2 justify-center"
        default: return "h-10 px-4 py-2"
      }
    }

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          getVariantClasses(variant),
          getSizeClasses(size),
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

interface IconButtonProps extends ButtonProps {
  icon: React.ReactNode
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, ...props }, ref) => {
    return (
      <Button 
        ref={ref} 
        size="icon" 
        className={cn("rounded-lg", className)} 
        {...props} 
        icon={icon} 
      />
    )
  }
)
IconButton.displayName = "IconButton"

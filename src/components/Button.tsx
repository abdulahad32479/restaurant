import * as React from "react"
import { cn } from "@/src/lib/utils"
import { Loader2 } from "lucide-react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  fullWidth?: boolean
  icon?: React.ReactNode
  isLoading?: boolean
  children?: React.ReactNode
  className?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, icon, isLoading, children, disabled, ...props }, ref) => {
    
    // Map custom variants to styles
    const getVariantClasses = (v: string) => {
      switch (v) {
        case 'primary': return "bg-[#8B0000] hover:bg-[#A00000] text-white border-white/10 shadow-[0_8px_20px_rgba(139,0,0,0.3)]"
        case 'secondary': return "bg-white/[0.05] hover:bg-white/[0.1] text-white border-white/10" 
        case 'accent': return "bg-[#D4AF37] hover:bg-[#E5C04A] text-black border-white/10 shadow-[0_8px_20px_rgba(212,175,55,0.2)] font-black uppercase tracking-widest text-[10px]"
        case 'ghost': return "bg-transparent hover:bg-white/5 text-[#808080] hover:text-white border-transparent"
        case 'outline': return "bg-transparent border-white/10 text-white hover:border-accent hover:text-accent hover:bg-accent/5 shadow-sm"
        case 'danger': return "bg-[#EF444415] text-[#EF4444] hover:bg-[#EF444430] border-[#EF444430] shadow-[0_8px_20px_rgba(239,68,68,0.15)]"
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
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-black uppercase tracking-widest text-[11px] transition-all duration-300 hover:-translate-y-1 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/5 disabled:pointer-events-none disabled:opacity-50 border",
          getVariantClasses(variant),
          getSizeClasses(size),
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          icon && <span className={children ? "mr-2" : ""}>{icon}</span>
        )}
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

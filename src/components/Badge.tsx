import * as React from "react"
import { cn } from "@/src/lib/utils"
// import { Badge as ShadcnBadge } from "@/src/components/ui/badge"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'error' | 'info' | 'completed' | 'pending' | 'preparing' | 'ready' | 'cancelled' | 'secondary' | 'accent'
  size?: 'sm' | 'md'
  children: React.ReactNode
}

export function Badge({ variant = 'default', size = 'md', className, children, ...props }: BadgeProps) {
  
  const getVariantStyles = (v: string) => {
    switch (v) {
      case 'default': return "bg-[#2A2A2A] text-white border-transparent"
      case 'outline': return "text-white border-[#2A2A2A]"
      case 'success': 
      case 'active':
      case 'ready':
      case 'completed': return "bg-[#10B98115] text-[#10B981] border-[#10B98130]"
      case 'warning': 
      case 'pending': 
      case 'low': return "bg-[#F59E0B15] text-[#F59E0B] border-[#F59E0B30]"
      case 'error': 
      case 'cancelled': 
      case 'out': 
      case 'inactive': return "bg-[#EF444415] text-[#EF4444] border-[#EF444430]"
      case 'info': 
      case 'preparing': return "bg-[#3B82F615] text-[#3B82F6] border-[#3B82F630]"
      case 'secondary': return "bg-white/5 text-tertiary border-base/50"
      case 'accent': return "bg-accent/10 text-accent border-accent/20"
      default: return "bg-[#2A2A2A] text-white border-transparent"
    }
  }

  const getSizeStyles = (s: string) => {
    switch (s) {
      case 'sm': return "text-xs px-2 py-0.5"
      case 'md': return "text-xs px-2.5 py-1"
      default: return "text-xs px-2.5 py-1"
    }
  }

  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-lg border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        getVariantStyles(variant),
        getSizeStyles(size),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

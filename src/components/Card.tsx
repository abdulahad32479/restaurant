import * as React from "react"
import { cn } from "@/src/lib/utils"
// import { Card as ShadcnCard, CardContent as ShadcnCardContent, CardHeader as ShadcnCardHeader, CardTitle as ShadcnCardTitle } from "@/src/components/ui/card"
// Actually, let's create custom ones that map to our style but expose what Figma expects
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hover?: boolean
  className?: string
}

export function Card({ children, hover, className, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-white/[0.03] border border-white/5 rounded-2xl p-6 shadow-2xl transition-all duration-500 overflow-hidden relative group", 
        hover && "hover:border-white/10 hover:bg-white/[0.05] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface KPICardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  iconBg?: string
  className?: string
}

export function KPICard({ title, value, change, changeType, icon, iconBg, className }: KPICardProps) {
  return (
    <Card hover className={cn("animate-slide-up", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#808080] mb-2">{title}</p>
          <h3 className="text-2xl font-black text-white  uppercase tracking-tighter mb-2 drop-shadow-md">{value}</h3>
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            changeType === 'positive' && "text-[#10B981]",
            changeType === 'negative' && "text-[#EF4444]",
            changeType === 'neutral' && "text-[#B3B3B3]"
          )}>
            {changeType === 'positive' && <TrendingUp className="w-4 h-4" />}
            {changeType === 'negative' && <TrendingDown className="w-4 h-4" />}
            {changeType === 'neutral' && <Minus className="w-4 h-4" />}
            <span>{change}</span>
          </div>
        </div>
        <div
          className={cn(
            "p-3 rounded-xl flex items-center justify-center text-white",
            (typeof iconBg === 'string' && iconBg.startsWith('bg-')) ? iconBg : ''
          )}
          style={typeof iconBg === 'string' && !iconBg.startsWith('bg-') ? { backgroundColor: iconBg.replace('bg-[', '').replace(']', '') } : undefined}
        >
          {/* Handle arbitrary bg colors or Tailwind classes */}
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6 text-current" })
            : icon}
        </div>
      </div>
    </Card>
  )
}

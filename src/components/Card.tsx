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
        "bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-6 shadow-md transition-all duration-300", 
        hover && "hover:border-[#333333] hover:shadow-lg hover:-translate-y-1",
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
  iconBg: string
}

export function KPICard({ title, value, change, changeType, icon, iconBg }: KPICardProps) {
  return (
    <Card hover className="animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-[#B3B3B3] mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
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
        <div className={cn("p-3 rounded-xl flex items-center justify-center text-white", iconBg.startsWith('bg-') ? iconBg : '')} style={!iconBg.startsWith('bg-') ? { backgroundColor: iconBg.replace('bg-[', '').replace(']', '') } : undefined}>
          {/* Handle arbitrary bg colors or Tailwind classes */}
          {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6 text-current" })}
        </div>
      </div>
    </Card>
  )
}

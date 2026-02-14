import * as React from "react"
import { cn } from "@/src/lib/utils"

interface TabOption {
  id: string
  label: string
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: TabOption[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'default' | 'pills'
}

export function Tabs({ tabs, activeTab, onChange, variant = 'default' }: TabsProps) {
  return (
    <div className="flex space-x-1 border-b border-[#2A2A2A] mb-6">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-6 py-3 font-medium text-sm transition-all relative",
              isActive 
                ? "text-[#D4AF37]" 
                : "text-[#B3B3B3] hover:text-white"
            )}
          >
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37]" />
            )}
          </button>
        )
      })}
    </div>
  )
}

interface VerticalTabsProps {
  tabs: TabOption[]
  activeTab: string
  onChange: (id: string) => void
}

export function VerticalTabs({ tabs, activeTab, onChange }: VerticalTabsProps) {
  return (
    <div className="space-y-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200",
              isActive 
                ? "bg-[#8B0000] text-white shadow-md" 
                : "text-[#B3B3B3] hover:bg-[#252525] hover:text-white"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

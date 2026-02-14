import * as React from "react"
import { cn } from "@/src/lib/utils"
// import { Switch } from "@/src/components/ui/switch"
import { Switch } from "@/src/components/ui/switch"

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-white font-medium">{label}</span>}
      <Switch 
        checked={checked} 
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-[#10B981]"
      />
    </div>
  )
}

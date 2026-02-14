import * as React from "react"
import { cn } from "@/src/lib/utils"
import { Search, ChevronDown, Check } from "lucide-react"

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  fullWidth?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, icon, fullWidth = true, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && <label className="text-sm font-medium text-[#B3B3B3]">{label}</label>}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3B3B3]">
              {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
            </div>
          )}
          <input
            ref={ref}
            className={cn( 
              "flex h-12 w-full rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-sm text-white placeholder:text-[#808080] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
              icon && "pl-10",
              className
            )}
            {...props}
          />
        </div>
      </div>
    )
  }
)
Input.displayName = "Input"

// --- TextArea ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-sm font-medium text-[#B3B3B3]">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            "flex w-full rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-sm text-white placeholder:text-[#808080] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 min-h-[80px]",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
TextArea.displayName = "TextArea"

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options?: { value: string; label: string }[]
  fullWidth?: boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options = [], fullWidth = true, children, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && <label className="text-sm font-medium text-[#B3B3B3]">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "flex h-12 w-full appearance-none rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 pr-10 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#B3B3B3]">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    )
  }
)
Select.displayName = "Select"

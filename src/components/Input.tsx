import * as React from "react"
import { cn } from "@/src/lib/utils"
import { Search, ChevronDown, Check } from "lucide-react"

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  fullWidth?: boolean
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, icon, fullWidth = true, helperText, ...props }, ref) => {
    const isLight = className?.includes('bg-white') || className?.includes('text-slate-900');
    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && <label className={cn("text-sm font-medium text-[#B3B3B3]", isLight && "text-[11px] font-bold text-slate-500 uppercase tracking-widest")}>{label}</label>}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3B3B3]">
              {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
            </div>
          )}
          <input
            ref={ref}
            className={cn( 
              "flex h-12 w-full rounded-xl border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 drop-shadow-sm",
              isLight 
                ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-white" 
                : "border-base bg-[#0A0A0A] text-white placeholder:text-[#808080] focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 focus:bg-[#111111]",
              icon && "pl-10",
              className
            )}
            {...props}
          />
        </div>
        {helperText && <p className="text-[10px] text-[#808080] ml-1 mt-0.5">{helperText}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

// --- TextArea ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, helperText, ...props }, ref) => {
    const isLight = className?.includes('bg-white') || className?.includes('text-slate-900');
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className={cn("text-[10px] font-black uppercase tracking-[0.25em] text-[#808080] ml-1 mb-1.5", isLight && "text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-0 mb-0")}>{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            "flex w-full rounded-xl border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 min-h-[80px] drop-shadow-sm",
            isLight 
              ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-white" 
              : "border-base bg-[#0A0A0A] text-white placeholder:text-[#808080] focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 focus:bg-[#111111]",
            className
          )}
          {...props}
        />
        {helperText && <p className="text-[10px] text-[#808080] ml-1 mt-0.5">{helperText}</p>}
      </div>
    )
  }
)
TextArea.displayName = "TextArea"

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  icon?: React.ReactNode
  options?: { value: string; label: string }[]
  fullWidth?: boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, icon, options = [], fullWidth = true, children, ...props }, ref) => {
    const isLight = className?.includes('bg-white') || className?.includes('text-slate-900');
    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && <label className={cn("text-sm font-medium text-[#B3B3B3]", isLight && "text-[11px] font-bold text-slate-500 uppercase tracking-widest")}>{label}</label>}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3B3B3]">
              {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
            </div>
          )}
          <select
            ref={ref}
            className={cn(
              "flex h-12 w-full appearance-none rounded-xl border px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-4 transition-all duration-300 shadow-xl backdrop-blur-md",
              isLight 
                ? "bg-white border-slate-200 text-slate-900 focus:border-primary focus:ring-primary/10" 
                : "border-base bg-surface text-white focus:border-primary focus:ring-primary/10",
              icon && "pl-11",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option 
                key={opt.value} 
                value={opt.value} 
                className={isLight ? "bg-white text-slate-800" : "bg-surface text-white"}
              >
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

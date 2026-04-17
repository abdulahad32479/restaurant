import * as React from "react"
import { cn } from "@/src/lib/utils"
// import { Dialog as ShadcnDialog, DialogContent as ShadcnDialogContent, DialogHeader as ShadcnDialogHeader, DialogTitle as ShadcnDialogTitle, DialogFooter as ShadcnDialogFooter } from "@/src/components/ui/dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl'
  theme?: 'light' | 'dark'
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md', theme = 'dark' }: ModalProps) {
  
  const getSizeClasses = (s: string) => {
    switch (s) {
      case 'sm': return "max-w-sm"
      case 'md': return "max-w-md"
      case 'lg': return "max-w-2xl"
      case 'xl': return "max-w-4xl"
      case '2xl': return "max-w-5xl"
      case '4xl': return "max-w-6xl"
      case '7xl': return "max-w-[90vw] lg:max-w-[85vw] xl:max-w-7xl 2xl:max-w-[1500px]"
      default: return "max-w-md"
    }
  }

  const themeClasses = theme === 'light' 
    ? "bg-white border-0 shadow-xl text-slate-900 rounded-xl p-0 gap-0 overflow-hidden [&>button]:text-slate-400 [&>button:hover]:text-slate-700 hover:[&>button]:bg-slate-100 [&>button]:!right-5 [&>button]:!top-5 [&>button]:rounded-md [&>button]:p-1.5" 
    : "bg-[#1F1F1F] glass border-[#2A2A2A] shadow-2xl text-white";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(themeClasses, getSizeClasses(size))}>
        <DialogHeader className={cn(theme === 'light' ? "px-6 py-5 border-b border-slate-100" : "")}>
          <DialogTitle className={cn("text-lg font-bold", theme === 'light' ? "text-slate-800" : "text-xl")}>{title}</DialogTitle>
        </DialogHeader>
        <div className={cn(theme === 'light' ? "custom-scrollbar-light px-6 py-6 pr-4 max-h-[500px] overflow-y-scroll" : "custom-scrollbar py-4 max-h-[calc(85vh-120px)] pr-1 overflow-y-auto")}>
          {children}
        </div>
        {footer && (
          <DialogFooter className={cn("gap-2 sm:justify-end", theme === 'light' ? "px-6 py-5 border-t border-slate-100 bg-white" : "")}>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

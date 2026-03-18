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
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("bg-[#1F1F1F] glass border-[#2A2A2A] shadow-2xl text-white", getSizeClasses(size))}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
        {footer && (
          <DialogFooter className="gap-2 sm:justify-end">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

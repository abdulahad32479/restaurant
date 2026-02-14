import { Bell, Search, LogOut, Command, Menu } from "lucide-react"
import { Button } from "@/src/components/ui/button"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-16 md:h-20 items-center justify-between border-b border-base bg-secondary/50 backdrop-blur-md px-4 md:px-8 sticky top-0 z-20">
      <div className="flex flex-1 items-center gap-4">
         {/* Mobile Menu Trigger */}
         <Button 
           variant="ghost" 
           size="icon" 
           onClick={onMenuClick}
           className="lg:hidden text-secondary hover:text-white hover:bg-white/5 h-10 w-10 flex-shrink-0"
         >
           <Menu className="h-6 w-6" />
         </Button>

         <div className="relative flex-1 max-w-md hidden lg:flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-tertiary" />
            <input 
              type="text" 
              placeholder="Search or press ⌘K"
              className="w-full h-10 bg-main/50 border border-base rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-tertiary focus:outline-none focus:border-accent/50 transition-all"
            />
         </div>
         
         {/* Small screen brand name - hidden on lg where sidebar is usually visible */}
         <div className="lg:hidden flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold shadow-glow-primary text-xs">D</div>
            <span className="font-black text-white tracking-widest text-xs uppercase">Duke's</span>
         </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="icon" className="relative text-secondary hover:text-white hover:bg-white/5 transition-all h-9 w-9 md:h-10 md:w-10">
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-primary ring-2 ring-secondary animate-pulse" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex text-secondary hover:text-white hover:bg-white/5 transition-all">
            <Command className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="h-6 w-[1px] bg-base hidden sm:block" />

        <div className="flex items-center gap-2 md:gap-4 md:pl-2">
          <div className="flex flex-col items-end hidden lg:flex">
            <p className="text-sm font-bold text-white leading-none">Admin User</p>
            <p className="text-[11px] font-medium text-accent mt-1">Manager</p>
          </div>
          <div className="group relative cursor-pointer">
            <div className="flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-xl md:rounded-2xl bg-gradient-to-br from-accent to-accent-active text-bg-main font-black shadow-glow-accent group-hover:scale-105 transition-transform duration-300">
              A
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 md:h-3.5 md:w-3.5 bg-success rounded-full ring-2 ring-secondary" />
          </div>
          <Button variant="ghost" size="icon" className="text-tertiary hover:text-error hover:bg-error/5 transition-all ml-1 md:ml-2 h-9 w-9">
            <LogOut className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

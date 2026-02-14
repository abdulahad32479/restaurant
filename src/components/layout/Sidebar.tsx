"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/src/lib/utils"
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  ClipboardList,
  UtensilsCrossed,
  Package,
  Users,
  BarChart3,
  Settings,
  ChevronLeft
} from "lucide-react"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ShoppingCart, label: "POS Billing", href: "/dashboard/pos" },
  { icon: ChefHat, label: "Kitchen Display", href: "/dashboard/kitchen-display" },
  { icon: ClipboardList, label: "Orders", href: "/dashboard/orders" },
  { icon: UtensilsCrossed, label: "Menu", href: "/dashboard/menu" },
  { icon: Package, label: "Inventory", href: "/dashboard/inventory" },
  { icon: Users, label: "Staff", href: "/dashboard/staff" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/reports" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  
  // No longer strictly managing isMobile here for classes, using tailwind breakpoints instead
  // but we can use it for internal logic if needed.
  
  return (
    <>
      {/* Overlay - visible ONLY when drawer is open on mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-base bg-secondary transition-all duration-300 transform lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-20" : "lg:w-64",
          "w-64" // Default mobile width
        )}
      >
        <div className="flex h-20 items-center px-6 border-b border-base overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-glow-primary">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            {(!collapsed || isOpen) && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-xl font-bold tracking-tight text-white leading-none whitespace-nowrap">
                  DUKE'S
                </span>
                <span className="text-[10px] font-medium text-accent tracking-[3px] mt-1 uppercase whitespace-nowrap">
                  Premium POS
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 scrollbar-hide">
          <nav className="grid gap-2 px-3">
            {sidebarItems.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={onClose} // Hide drawer content on click
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-primary text-white shadow-soft"
                      : "text-secondary hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-transform", 
                       isActive ? "scale-110" : "group-hover:scale-110"
                    )}
                  />
                  {/* Label - visible on mobile drawer OR non-collapsed desktop sidebar */}
                  {(!collapsed || isOpen) && (
                    <span className="animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-accent rounded-r-md"/>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 hidden lg:flex h-6 w-6 items-center justify-center rounded-full bg-secondary border border-base text-tertiary hover:text-white shadow-md z-40 transition-colors"
        >
          <ChevronLeft className={cn("h-3 w-3 transition-transform duration-300", collapsed && "rotate-180")} />
        </button>

        {/* Mobile Close Button in Drawer */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-6 right-4 p-1 text-tertiary hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="p-6 border-t border-base overflow-hidden">
          {(!collapsed || isOpen) ? (
            <div className="flex items-center gap-3 px-1 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="w-8 h-8 shrink-0 rounded-full bg-accent text-bg-main flex items-center justify-center font-bold text-xs ring-2 ring-accent/20">
                A
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-white truncate">Admin User</span>
                <span className="text-[10px] text-tertiary">Manager</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent text-bg-main flex items-center justify-center font-bold text-xs mx-auto shrink-0">
              A
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

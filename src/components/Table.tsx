import * as React from "react"
import { cn } from "@/src/lib/utils"
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table"
import { Button } from "./Button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Column<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: T) => React.ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
}

export function Table<T extends { id: string | number }>({ columns, data }: TableProps<T>) {
  return (
    <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl overflow-x-auto shadow-md scrollbar-thin">
      <ShadcnTable>
        <TableHeader className="bg-[#1A1A1A]">
          <TableRow className="border-[#2A2A2A] hover:bg-[#1A1A1A]">
            {columns.map((col) => (
              <TableHead 
                key={col.key} 
                className={cn(
                  "text-[#B3B3B3] font-semibold",
                  col.width,
                  col.align === 'center' && "text-center",
                  col.align === 'right' && "text-right"
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} className="border-[#2A2A2A] hover:bg-[#252525] transition-colors">
              {columns.map((col) => (
                <TableCell 
                  key={`${row.id}-${col.key}`}
                  className={cn(
                    col.align === 'center' && "text-center",
                    col.align === 'right' && "text-right"
                  )}
                >
                  {col.render 
                    ? col.render((row as any)[col.key], row)
                    : (row as any)[col.key]
                  }
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </ShadcnTable>
    </div>
  )
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm text-[#B3B3B3]">
        Page <span className="text-white font-medium">{currentPage}</span> of <span className="text-white font-medium">{totalPages}</span>
      </span>
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

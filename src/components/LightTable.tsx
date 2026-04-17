import * as React from "react"

interface Column<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: T) => React.ReactNode
}

interface LightTableProps<T> {
  columns: Column<T>[]
  data: T[]
  className?: string
}

export function LightTable<T extends { id?: string | number }>({ columns, data, className = '' }: LightTableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-sm text-left">
        <thead className="text-[11px] text-slate-400 uppercase bg-slate-50 border-y border-slate-200 font-bold tracking-wider">
          <tr>
            {columns.map((col: any) => (
              <th key={col.key} className={`px-6 py-3 whitespace-nowrap ${col.align === 'right' ? 'text-right' : ''} ${col.align === 'center' ? 'text-center' : ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, i: number) => (
            <tr key={row.id || i} className="bg-white border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
              {columns.map((col: any) => (
                <td key={`${row.id}-${col.key}`} className={`px-6 py-4 align-middle ${col.align === 'right' ? 'text-right' : ''} ${col.align === 'center' ? 'text-center' : ''}`}>
                  {col.render ? col.render((row as any)[col.key], row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

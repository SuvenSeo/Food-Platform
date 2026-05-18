import type { ReactNode } from 'react'

import { cn } from '../../lib/utils'

type Column<T> = {
  key: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  empty?: ReactNode
  className?: string
}

export function DataTable<T>({ columns, rows, rowKey, empty, className }: DataTableProps<T>) {
  if (!rows.length && empty) {
    return <div className={cn('fp-empty', className)}>{empty}</div>
  }

  return (
    <div className={cn('overflow-x-auto rounded-card border border-border', className)}>
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-elevated/80">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn('eyebrow-label px-4 py-3 font-semibold', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border/60 transition-colors last:border-0 hover:bg-white/[0.03]"
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3 text-foreground', col.className)}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

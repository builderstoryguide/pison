'use client'

import React, { useMemo, useState, useCallback } from 'react'
// import { List } from 'react-window'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: keyof T
  label: string
  width?: number
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, item: T) => React.ReactNode
}

interface VirtualizedTableProps<T> {
  data: T[]
  columns: Column<T>[]
  height?: number
  itemHeight?: number
  onRowClick?: (item: T) => void
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
  className?: string
  emptyMessage?: string
}

export function VirtualizedTable<T extends Record<string, any>>({
  data,
  columns,
  height = 400,
  itemHeight = 50,
  onRowClick,
  searchable = true,
  filterable = true,
  sortable = true,
  className,
  emptyMessage = 'No data available'
}: VirtualizedTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string>>({})

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item =>
        columns.some(column => {
          const value = item[column.key]
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Apply column filters
    Object.entries(filters).forEach(([columnKey, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(item => {
          const value = item[columnKey]
          return value && value.toString().toLowerCase().includes(filterValue.toLowerCase())
        })
      }
    })

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]
        
        if (aValue === bValue) return 0
        
        const comparison = aValue < bValue ? -1 : 1
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [data, searchTerm, filters, sortColumn, sortDirection, columns])

  const handleSort = useCallback((column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }, [sortColumn])

  const handleFilterChange = useCallback((columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }))
  }, [])

  // Row renderer for virtualized list
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = processedData[index]
    if (!item) return null

    return (
      <div style={style} className="border-b">
        <TableRow
          className={cn(
            "hover:bg-muted/50 cursor-pointer",
            onRowClick && "hover:bg-muted"
          )}
          onClick={() => onRowClick?.(item)}
        >
          {columns.map((column, colIndex) => (
            <TableCell
              key={colIndex}
              className="px-4 py-2"
              style={{ width: column.width || 'auto' }}
            >
              {column.render ? column.render(item[column.key], item) : item[column.key]}
            </TableCell>
          ))}
        </TableRow>
      </div>
    )
  }, [processedData, columns, onRowClick])

  if (processedData.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-32", className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filters */}
      {(searchable || filterable) && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
          {searchable && (
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}
          
          {filterable && columns.filter(col => col.filterable).map((column) => (
            <div key={String(column.key)} className="min-w-48">
              <Select
                value={filters[String(column.key)] || ''}
                onValueChange={(value) => handleFilterChange(String(column.key), value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Filter by ${column.label}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {column.label}</SelectItem>
                  {Array.from(new Set(data.map(item => item[column.key]).filter(Boolean))).map((value, index) => {
                    const uniqueKey = `${String(column.key)}-${index}`
                    const displayValue = typeof value === 'object' && value !== null 
                      ? (value.name || value.label || value.title || JSON.stringify(value))
                      : String(value)
                    const selectValue = typeof value === 'object' && value !== null
                      ? JSON.stringify(value)
                      : String(value)
                    
                    return (
                      <SelectItem key={uniqueKey} value={selectValue}>
                        {displayValue}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      {/* Table Header */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className={cn(
                    "px-4 py-3",
                    sortable && column.sortable && "cursor-pointer hover:bg-muted/50"
                  )}
                  style={{ width: column.width || 'auto' }}
                  onClick={() => sortable && column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {sortable && column.sortable && (
                      <div className="flex flex-col">
                        <SortAsc 
                          className={cn(
                            "h-3 w-3",
                            sortColumn === column.key && sortDirection === 'asc' 
                              ? "text-primary" 
                              : "text-muted-foreground"
                          )}
                        />
                        <SortDesc 
                          className={cn(
                            "h-3 w-3 -mt-1",
                            sortColumn === column.key && sortDirection === 'desc' 
                              ? "text-primary" 
                              : "text-muted-foreground"
                          )}
                        />
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>

        {/* Virtualized Table Body */}
        <div className="relative">
          <div style={{ height: height, overflow: 'auto' }}>
            {processedData.map((item, index) => (
              <div key={index} style={{ height: itemHeight }}>
                <Row index={index} style={{}} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {processedData.length} of {data.length} items
        </span>
        {(searchTerm || Object.values(filters).some(Boolean)) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setFilters({})
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}

'use client'

import React, { useMemo, useState, useCallback } from 'react'
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
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, item: T) => React.ReactNode
}

interface SimpleTableProps<T> {
  data: T[]
  columns: Column<T>[]
  height?: number
  onRowClick?: (item: T) => void
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
  className?: string
  emptyMessage?: string
}

export function SimpleTable<T extends Record<string, any>>({
  data,
  columns,
  height = 400,
  onRowClick,
  searchable = true,
  filterable = true,
  sortable = true,
  className,
  emptyMessage = "No data available"
}: SimpleTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string>>({})

  // Process data with search, filter, and sort
  const processedData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (searchTerm && searchable) {
      result = result.filter(item =>
        columns.some(column => {
          const value = item[column.key]
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Apply filters
    if (filterable) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          result = result.filter(item => {
            const itemValue = item[key]
            if (!itemValue) return false
            
            // Handle object values
            if (typeof itemValue === 'object' && itemValue !== null) {
              const itemString = JSON.stringify(itemValue)
              return itemString.toLowerCase().includes(value.toLowerCase())
            }
            
            // Handle primitive values
            return itemValue.toString().toLowerCase().includes(value.toLowerCase())
          })
        }
      })
    }

    // Apply sorting
    if (sortColumn && sortable) {
      result.sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, searchTerm, filters, sortColumn, sortDirection, columns, searchable, filterable, sortable])

  const handleSort = useCallback((column: keyof T) => {
    if (!sortable) return
    
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }, [sortColumn, sortable])

  const handleFilterChange = useCallback((column: keyof T, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }))
  }, [])

  const handleRowClick = useCallback((item: T) => {
    if (onRowClick) {
      onRowClick(item)
    }
  }, [onRowClick])

  if (processedData.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filters */}
      {(searchable || filterable) && (
        <div className="flex items-center gap-4">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          {filterable && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {columns.filter(col => col.filterable).map(column => (
                <Select
                  key={String(column.key)}
                  value={filters[String(column.key)] || 'all'}
                  onValueChange={(value) => handleFilterChange(column.key, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={column.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {Array.from(new Set(data.map(item => item[column.key]).filter(Boolean))).map((value, index) => {
                      // Create a unique key and value for the SelectItem
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => (
                <TableHead
                  key={String(column.key)}
                  className={cn(
                    "cursor-pointer select-none",
                    sortable && column.sortable && "hover:bg-muted/50"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
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
          <TableBody>
            {processedData.map((item, index) => (
              <TableRow
                key={index}
                className={cn(
                  "cursor-pointer hover:bg-muted/50",
                  onRowClick && "hover:bg-muted/50"
                )}
                onClick={() => handleRowClick(item)}
              >
                {columns.map(column => (
                  <TableCell key={String(column.key)}>
                    {column.render 
                      ? column.render(item[column.key], item)
                      : String(item[column.key] || '')
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {processedData.length} of {data.length} results
        </span>
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm('')}
          >
            Clear search
          </Button>
        )}
      </div>
    </div>
  )
}

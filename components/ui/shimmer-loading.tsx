import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ShimmerCardProps {
  className?: string
}

export function ShimmerCard({ className }: ShimmerCardProps) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  )
}

interface ShimmerTableRowProps {
  columns?: number
}

export function ShimmerTableRow({ columns = 6 }: ShimmerTableRowProps) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

interface ShimmerTableProps {
  rows?: number
  columns?: number
  showHeader?: boolean
}

export function ShimmerTable({ rows = 5, columns = 6, showHeader = true }: ShimmerTableProps) {
  return (
    <div className="border rounded-lg">
      {showHeader && (
        <div className="border-b bg-muted/50 px-4 py-3">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-20" />
            ))}
          </div>
        </div>
      )}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-3">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ShimmerListProps {
  items?: number
}

export function ShimmerList({ items = 5 }: ShimmerListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
}

interface ShimmerGridProps {
  items?: number
  columns?: number
}

export function ShimmerGrid({ items = 4, columns = 4 }: ShimmerGridProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-${columns}`}>
      {Array.from({ length: items }).map((_, index) => (
        <ShimmerCard key={index} />
      ))}
    </div>
  )
}

interface ShimmerFormProps {
  fields?: number
}

export function ShimmerForm({ fields = 4 }: ShimmerFormProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}

// Specific shimmer components for common use cases
export function ShimmerStatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <ShimmerCard />
      <ShimmerCard />
      <ShimmerCard />
      <ShimmerCard />
    </div>
  )
}

export function ShimmerDataTable() {
  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
      
      {/* Table */}
      <ShimmerTable rows={8} columns={6} />
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  )
}

export function ShimmerTimetableGrid() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Timetable grid */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-8 gap-0">
          {/* Time slots header */}
          <div className="bg-muted/50 p-2 border-r">
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="bg-muted/50 p-2 border-r text-center">
              <Skeleton className="h-4 w-12 mx-auto" />
            </div>
          ))}
          
          {/* Time slots and periods */}
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <>
              <div key={`time-${rowIndex}`} className="p-2 border-r border-t bg-muted/30">
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
              {Array.from({ length: 7 }).map((_, colIndex) => (
                <div key={`cell-${rowIndex}-${colIndex}`} className="p-2 border-r border-t">
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}

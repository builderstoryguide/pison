"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/currency-utils'

interface FeeStructure {
  id: string
  name: string
  className: string
  academicYear: string
  term: string
  totalAmount: number
  isActive: boolean
}

export function FeeStructureManagement() {
  const { toast } = useToast()
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadFeeStructures()
  }, [])

  const loadFeeStructures = async () => {
    try {
      const response = await fetch('/api/bursar/fee-structures')
      const data = await response.json()
      setFeeStructures(data)
          } catch (error) {
        toast.error("Failed to load fee structures")
      } finally {
        setIsLoading(false)
      }
    }

    const handleDelete = async (id: string) => {
      if (!confirm('Are you sure you want to delete this fee structure?')) return

      try {
        const response = await fetch(`/api/bursar/fee-structures/${id}`, {
          method: 'DELETE',
        })
        const result = await response.json()

        if (result.success) {
          toast.success("Fee structure deleted successfully")
          loadFeeStructures()
        } else {
          toast.error(result.error || "Failed to delete fee structure")
        }
      } catch (error) {
        toast.error("Failed to delete fee structure")
      }
    }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fee Structure Management</h2>
          <p className="text-muted-foreground">Manage fee structures for different classes</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Fee Structure
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee Structures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search fee structures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeStructures.map((structure) => (
                <TableRow key={structure.id}>
                  <TableCell className="font-medium">{structure.name}</TableCell>
                  <TableCell>{structure.className}</TableCell>
                  <TableCell>{structure.academicYear}</TableCell>
                  <TableCell className="capitalize">{structure.term}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(structure.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={structure.isActive ? "default" : "secondary"}>
                      {structure.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(structure.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

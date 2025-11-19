"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { StudentSearch } from '@/components/ui/student-search'
import { useToast } from '@/hooks/use-toast'
import { useCurrencyFormatter } from '@/lib/app-configuration-context-v2'
import { useClassManagement } from '@/lib/class-management-context'
import type { 
  RegistrationFee, 
  RegistrationStats, 
  RegistrationFormData,
  PaymentFormData,
  RegistrationFilters 
} from '@/lib/registration-types'

// Mock data for development
const mockRegistrations: RegistrationFee[] = [
  {
    id: 'REG001',
    student_id: 'STU001',
    student_name: 'John Doe',
    academic_year: '2024-2025',
    term: 'Term 1',
    class: 'Form 5A',
    registration_fee: 50000,
    pta_fee: 15000,
    tuition_fee: 200000,
    total_amount: 265000,
    paid_amount: 265000,
    balance: 0,
    payment_status: 'paid',
    due_date: '2024-09-15',
    payment_date: '2024-09-10',
    payment_method: 'bank_transfer',
    receipt_number: 'RCP001',
    notes: 'Full payment received',
    created_by: 'admin',
    created_at: '2024-09-01T10:00:00Z',
    updated_at: '2024-09-10T10:00:00Z'
  },
  {
    id: 'REG002',
    student_id: 'STU002',
    student_name: 'Jane Smith',
    academic_year: '2024-2025',
    term: 'Term 1',
    class: 'Form 4B',
    registration_fee: 50000,
    pta_fee: 15000,
    tuition_fee: 180000,
    total_amount: 245000,
    paid_amount: 100000,
    balance: 145000,
    payment_status: 'partial',
    due_date: '2024-09-15',
    payment_date: '2024-09-05',
    payment_method: 'cash',
    receipt_number: 'RCP002',
    notes: 'Partial payment - balance due',
    created_by: 'admin',
    created_at: '2024-09-01T10:00:00Z',
    updated_at: '2024-09-05T10:00:00Z'
  },
  {
    id: 'REG003',
    student_id: 'STU003',
    student_name: 'Mike Johnson',
    academic_year: '2024-2025',
    term: 'Term 1',
    class: 'Form 3A',
    registration_fee: 50000,
    pta_fee: 15000,
    tuition_fee: 160000,
    total_amount: 225000,
    paid_amount: 0,
    balance: 225000,
    payment_status: 'pending',
    due_date: '2024-09-15',
    notes: 'Payment pending',
    created_by: 'admin',
    created_at: '2024-09-01T10:00:00Z',
    updated_at: '2024-09-01T10:00:00Z'
  }
]

const mockStats: RegistrationStats = {
  total_registrations: 3,
  total_revenue: 590000,
  pending_payments: 1,
  overdue_payments: 0,
  paid_registrations: 1,
  partial_payments: 1,
  monthly_revenue: 590000,
  class_breakdown: [
    { class: 'Form 5A', count: 1, revenue: 265000 },
    { class: 'Form 4B', count: 1, revenue: 245000 },
    { class: 'Form 3A', count: 1, revenue: 225000 }
  ]
}

interface SelectedStudent {
  id: string
  studentId: string
  fullName: string
  firstName: string
  lastName: string
  email?: string
  className?: string
  enrollmentStatus?: string
}

// Payment Form Component
interface PaymentFormProps {
  registration: RegistrationFee
  onSave: (payment: PaymentFormData) => void
  onCancel: () => void
}

// Edit Registration Form Component
interface EditRegistrationFormProps {
  registration: RegistrationFee
  onSave: (formData: RegistrationFormData) => void
  onCancel: () => void
  classes: any[]
  classesLoading: boolean
}

function EditRegistrationForm({ registration, onSave, onCancel, classes, classesLoading }: EditRegistrationFormProps) {
  const [formData, setFormData] = useState<RegistrationFormData>({
    student_id: registration.student_id,
    student_name: registration.student_name,
    academic_year: registration.academic_year,
    term: registration.term,
    class: registration.class,
    registration_fee: registration.registration_fee,
    pta_fee: registration.pta_fee,
    tuition_fee: registration.tuition_fee,
    installments: '',
    installmentAmount: 0,
    due_date: registration.due_date,
    notes: registration.notes || ''
  })

  const handleSave = () => {
    if (!formData.student_name || !formData.class) {
      return
    }
    onSave(formData)
  }

  const totalAmount = formData.registration_fee + formData.pta_fee + formData.tuition_fee

  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label>Student *</Label>
        <div className="p-3 bg-muted rounded-lg">
          <p className="font-medium">{formData.student_name}</p>
          <p className="text-sm text-muted-foreground">{formData.student_id}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="academicYear">Academic Year *</Label>
          <Select value={formData.academic_year} onValueChange={(value) => setFormData({...formData, academic_year: value})}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-2025">2024-2025</SelectItem>
              <SelectItem value="2025-2026">2025-2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="term">Term *</Label>
          <Select value={formData.term} onValueChange={(value) => setFormData({...formData, term: value})}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Term 1">Term 1</SelectItem>
              <SelectItem value="Term 2">Term 2</SelectItem>
              <SelectItem value="Term 3">Term 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="class">Class *</Label>
        <Select 
          value={formData.class} 
          onValueChange={(value) => setFormData({...formData, class: value})}
          disabled={classesLoading || classes.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue 
              placeholder={
                classesLoading 
                  ? "Loading classes..." 
                  : classes.length === 0 
                  ? "No classes available" 
                  : "Select a class"
              } 
            />
          </SelectTrigger>
          <SelectContent>
            {classes.map((classItem) => (
              <SelectItem key={classItem.id} value={classItem.name}>
                {classItem.name} ({classItem.level} - {classItem.subsystem})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="registrationFee">Reg. Fee ({getCurrencySymbol()})</Label>
          <Input
            id="registrationFee"
            type="number"
            min="0"
            value={formData.registration_fee}
            onChange={(e) => setFormData({...formData, registration_fee: parseFloat(e.target.value) || 0})}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ptaFee">PTA Fee ({getCurrencySymbol()})</Label>
          <Input
            id="ptaFee"
            type="number"
            min="0"
            value={formData.pta_fee}
            onChange={(e) => setFormData({...formData, pta_fee: parseFloat(e.target.value) || 0})}
            placeholder="Optional"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tuitionFee">School Fees ({getCurrencySymbol()})</Label>
          <Input
            id="tuitionFee"
            type="number"
            min="0"
            value={formData.tuition_fee}
            onChange={(e) => setFormData({...formData, tuition_fee: parseFloat(e.target.value) || 0})}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="installments">Installments</Label>
          <Select value={formData.installments || ''} onValueChange={(value) => setFormData({...formData, installments: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select installment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="first">First Installment</SelectItem>
              <SelectItem value="second">Second Installment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="installmentAmount">Amount ({getCurrencySymbol()})</Label>
          <Input
            id="installmentAmount"
            type="number"
            min="0"
            value={formData.installmentAmount || ''}
            onChange={(e) => setFormData({...formData, installmentAmount: parseFloat(e.target.value) || 0})}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date *</Label>
        <Input
          id="dueDate"
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({...formData, due_date: e.target.value})}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Additional notes (optional)"
        />
      </div>

      <div className="p-3 bg-muted rounded-lg">
        <p className="text-sm font-medium">
          Total Amount: {formatCurrency(totalAmount)}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Update Payment
        </Button>
      </DialogFooter>
    </div>
  )
}

function PaymentForm({ registration, onSave, onCancel }: PaymentFormProps) {
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    amount: registration.balance,
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    receipt_number: `RCP${String(Date.now()).slice(-6)}`,
    notes: ''
  })

  const handleSave = () => {
    if (paymentForm.amount <= 0) {
      return
    }
    onSave(paymentForm)
  }

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Student</Label>
          <p className="text-sm font-medium">{registration.student_name}</p>
          <p className="text-xs text-muted-foreground">{registration.student_id}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Balance Due</Label>
          <p className="text-sm font-medium">{formatCurrency(registration.balance)}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Payment Amount ({getCurrencySymbol()}) *</Label>
        <Input
          id="amount"
          type="number"
          min="0"
          max={registration.balance}
          value={paymentForm.amount}
          onChange={(e) => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Payment Method *</Label>
        <Select value={paymentForm.payment_method} onValueChange={(value) => setPaymentForm({...paymentForm, payment_method: value as any})}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="mobile_money">Mobile Money</SelectItem>
            <SelectItem value="check">Check</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentDate">Payment Date *</Label>
        <Input
          id="paymentDate"
          type="date"
          value={paymentForm.payment_date}
          onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="receiptNumber">Receipt Number *</Label>
        <Input
          id="receiptNumber"
          value={paymentForm.receipt_number}
          onChange={(e) => setPaymentForm({...paymentForm, receipt_number: e.target.value})}
          placeholder="Enter receipt number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={paymentForm.notes}
          onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
          placeholder="Additional notes (optional)"
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Record Payment
        </Button>
      </DialogFooter>
    </div>
  )
}

export function RegistrationManagement() {
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()
  const { formatCurrency, getCurrencySymbol } = useCurrencyFormatter()
  const { classes, isLoading: classesLoading } = useClassManagement()
  const [registrations, setRegistrations] = useState<RegistrationFee[]>(mockRegistrations)
  const [stats, setStats] = useState<RegistrationStats>({
    total_registrations: 0,
    total_revenue: 0,
    pending_payments: 0,
    overdue_payments: 0,
    paid_registrations: 0,
    partial_payments: 0,
    monthly_revenue: 0,
    class_breakdown: []
  })
  const [isAddRegistrationOpen, setIsAddRegistrationOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<RegistrationFilters>({
    academic_year: 'all',
    term: 'all',
    class: 'all',
    payment_status: 'all'
  })
  const [isLoading, setIsLoading] = useState(false)

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Calculate stats from live registrations data
  useEffect(() => {
    const calculateStats = () => {
      const totalRegistrations = registrations.length
      const totalRevenue = registrations.reduce((sum, reg) => sum + reg.paid_amount, 0)
      const pendingPayments = registrations.filter(reg => reg.payment_status === 'pending').length
      const overduePayments = registrations.filter(reg => {
        if (reg.payment_status === 'pending' || reg.payment_status === 'partial') {
          const dueDate = new Date(reg.due_date)
          const today = new Date()
          return dueDate < today
        }
        return false
      }).length
      const paidRegistrations = registrations.filter(reg => reg.payment_status === 'paid').length
      const partialPayments = registrations.filter(reg => reg.payment_status === 'partial').length
      
      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRevenue = registrations
        .filter(reg => {
          if (reg.payment_date) {
            const paymentDate = new Date(reg.payment_date)
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
          }
          return false
        })
        .reduce((sum, reg) => sum + reg.paid_amount, 0)

      // Calculate class breakdown
      const classBreakdown = registrations.reduce((acc, reg) => {
        const existing = acc.find(item => item.class === reg.class)
        if (existing) {
          existing.count += 1
          existing.revenue += reg.paid_amount
        } else {
          acc.push({
            class: reg.class,
            count: 1,
            revenue: reg.paid_amount
          })
        }
        return acc
      }, [] as Array<{ class: string; count: number; revenue: number }>)

      setStats({
        total_registrations: totalRegistrations,
        total_revenue: totalRevenue,
        pending_payments: pendingPayments,
        overdue_payments: overduePayments,
        paid_registrations: paidRegistrations,
        partial_payments: partialPayments,
        monthly_revenue: monthlyRevenue,
        class_breakdown: classBreakdown
      })
    }

    calculateStats()
  }, [registrations])

  // Form state for new registration
  const [newRegistration, setNewRegistration] = useState<RegistrationFormData>({
    student_id: '',
    student_name: '',
    academic_year: '2024-2025',
    term: 'Term 1',
    class: '',
    registration_fee: 50000,
    pta_fee: 15000,
    tuition_fee: 200000,
    installments: '',
    installmentAmount: 0,
    due_date: getTodayDate(),
    notes: ''
  })

  // Selected student state
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null)
  
  // Quick actions state
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationFee | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [registrationToDelete, setRegistrationToDelete] = useState<RegistrationFee | null>(null)

  // Handle dialog open - reset due date to today
  const handleDialogOpen = (open: boolean) => {
    setIsAddRegistrationOpen(open)
    if (open) {
      // Reset due date to today when dialog opens
      setNewRegistration(prev => ({
        ...prev,
        due_date: getTodayDate()
      }))
    }
  }

  // Handle student selection
  const handleStudentSelect = (student: SelectedStudent | null) => {
    setSelectedStudent(student)
    if (student) {
      setNewRegistration(prev => ({
        ...prev,
        student_id: student.studentId,
        student_name: student.fullName,
        class: student.className || ''
      }))
    } else {
      setNewRegistration(prev => ({
        ...prev,
        student_id: '',
        student_name: '',
        class: ''
      }))
    }
  }

  // Filter registrations based on search and filters
  const filteredRegistrations = registrations.filter(registration => {
    const matchesSearch = registration.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         registration.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         registration.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAcademicYear = filters.academic_year === 'all' || registration.academic_year === filters.academic_year
    const matchesTerm = filters.term === 'all' || registration.term === filters.term
    const matchesClass = filters.class === 'all' || registration.class === filters.class
    const matchesPaymentStatus = filters.payment_status === 'all' || registration.payment_status === filters.payment_status
    
    return matchesSearch && matchesAcademicYear && matchesTerm && matchesClass && matchesPaymentStatus
  })

  // Handle adding new registration
  const handleAddRegistration = async () => {
    if (!selectedStudent || !newRegistration.class) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select a student",
        variant: "destructive"
      })
      return
    }

    try {
      const totalAmount = newRegistration.registration_fee + newRegistration.pta_fee + newRegistration.tuition_fee
      const newReg: RegistrationFee = {
        id: `REG${String(Date.now()).slice(-6)}`,
        student_id: newRegistration.student_id,
        student_name: newRegistration.student_name,
        academic_year: newRegistration.academic_year,
        term: newRegistration.term,
        class: newRegistration.class,
        registration_fee: newRegistration.registration_fee,
        pta_fee: newRegistration.pta_fee,
        tuition_fee: newRegistration.tuition_fee,
        total_amount: totalAmount,
        paid_amount: 0,
        balance: totalAmount,
        payment_status: 'pending',
        due_date: newRegistration.due_date,
        notes: newRegistration.notes,
        installments: newRegistration.installments,
        installment_amount: newRegistration.installmentAmount,
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setRegistrations(prev => [newReg, ...prev])
      setIsAddRegistrationOpen(false)
      
      toast({
        title: "Payment Registered Successfully! 🎉",
        description: `Payment for ${newRegistration.student_name} has been registered`,
      })
      
        // Reset form
        setNewRegistration({
          student_id: '',
          student_name: '',
          academic_year: '2024-2025',
          term: 'Term 1',
          class: '',
          registration_fee: 50000,
          pta_fee: 15000,
          tuition_fee: 200000,
          installments: '',
          installmentAmount: 0,
          due_date: getTodayDate(),
          notes: ''
        })
      setSelectedStudent(null)
    } catch (error) {
      console.error('Error creating payment:', error)
      toast({
        title: "Failed to register payment",
        description: "An error occurred while registering the payment",
        variant: "destructive"
      })
    }
  }

  // Quick action handlers
  const handleViewRegistration = (registration: RegistrationFee) => {
    setSelectedRegistration(registration)
    setShowViewDialog(true)
  }

  const handleEditRegistration = (registration: RegistrationFee) => {
    setSelectedRegistration(registration)
    setShowEditDialog(true)
  }

  // Handle updating registration
  const handleUpdateRegistration = async (formData: RegistrationFormData) => {
    if (selectedRegistration) {
      try {
        const updatedRegistration = {
          ...selectedRegistration,
          student_name: formData.student_name,
          academic_year: formData.academic_year,
          term: formData.term,
          class: formData.class,
          registration_fee: formData.registration_fee,
          pta_fee: formData.pta_fee,
          tuition_fee: formData.tuition_fee,
          installments: formData.installments,
          installment_amount: formData.installmentAmount,
          due_date: formData.due_date,
          notes: formData.notes,
          total_amount: formData.registration_fee + formData.pta_fee + formData.tuition_fee,
          balance: (formData.registration_fee + formData.pta_fee + formData.tuition_fee) - selectedRegistration.paid_amount,
          updated_at: new Date().toISOString()
        }

        setRegistrations(prev => prev.map(reg => reg.id === selectedRegistration.id ? updatedRegistration : reg))
        setShowEditDialog(false)
        setSelectedRegistration(null)
        
        toast({
          title: "Payment Updated",
          description: `Payment for ${formData.student_name} has been updated`,
        })
      } catch (error) {
        console.error('Error updating payment:', error)
        toast({
          title: "Failed to update payment",
          description: "An error occurred while updating the payment",
          variant: "destructive"
        })
      }
    }
  }

  const handlePaymentRegistration = (registration: RegistrationFee) => {
    setSelectedRegistration(registration)
    setShowPaymentDialog(true)
  }

  const handleDeleteRegistration = (registration: RegistrationFee) => {
    setRegistrationToDelete(registration)
    setShowDeleteDialog(true)
  }

  const confirmDeleteRegistration = async () => {
    if (registrationToDelete) {
      setRegistrations(prev => prev.filter(reg => reg.id !== registrationToDelete.id))
      setShowDeleteDialog(false)
      setRegistrationToDelete(null)
      
      toast({
        title: "Payment Deleted",
        description: `Payment ${registrationToDelete.id} has been successfully deleted.`,
      })
    }
  }

  const handleRecordPayment = async (payment: PaymentFormData) => {
    if (selectedRegistration) {
      // Validate payment amount
      if (payment.amount <= 0) {
        toast({
          title: "Invalid payment amount",
          description: "Payment amount must be greater than 0",
          variant: "destructive"
        })
        return
      }

      if (payment.amount > selectedRegistration.balance) {
        toast({
          title: "Payment exceeds outstanding balance",
          description: `Payment amount (${formatCurrency(payment.amount)}) cannot exceed the outstanding balance (${formatCurrency(selectedRegistration.balance)})`,
          variant: "destructive"
        })
        return
      }

      // Calculate new amounts with safe arithmetic
      const newPaidAmount = selectedRegistration.paid_amount + payment.amount
      const newBalance = Math.max(0, selectedRegistration.balance - payment.amount)
      const newPaymentStatus = newBalance === 0 ? 'paid' : 'partial'

      const updatedRegistration: RegistrationFee = {
        ...selectedRegistration,
        paid_amount: newPaidAmount,
        balance: newBalance,
        payment_status: newPaymentStatus,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        receipt_number: payment.receipt_number,
        notes: payment.notes && payment.notes.trim() !== '' ? payment.notes : selectedRegistration.notes,
        updated_at: new Date().toISOString()
      }

      setRegistrations(prev => prev.map(reg => reg.id === selectedRegistration.id ? updatedRegistration : reg))
      setShowPaymentDialog(false)
      setSelectedRegistration(null)
      
      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatCurrency(payment.amount)} has been recorded.`,
      })
    }
  }

  // Get payment status badge
  const getPaymentStatusBadge = (status: RegistrationFee['payment_status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Partial</Badge>
      case 'pending':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>
      case 'overdue':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finance Management</h1>
          <p className="text-muted-foreground">Manage student payments and fee transactions</p>
        </div>
        <Dialog open={isAddRegistrationOpen} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Register Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Register New Payment</DialogTitle>
              <DialogDescription>
                Register a student payment for the academic year and set up fee transactions
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Select Student *</Label>
                <StudentSearch
                  value={selectedStudent}
                  onSelect={handleStudentSelect}
                  placeholder="Search for a student..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year *</Label>
                  <Select value={newRegistration.academic_year} onValueChange={(value) => setNewRegistration({...newRegistration, academic_year: value})}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term">Term *</Label>
                  <Select value={newRegistration.term} onValueChange={(value) => setNewRegistration({...newRegistration, term: value})}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select 
                  value={newRegistration.class} 
                  onValueChange={(value) => setNewRegistration({...newRegistration, class: value})}
                  disabled={classesLoading || classes.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue 
                      placeholder={
                        classesLoading 
                          ? "Loading classes..." 
                          : classes.length === 0 
                          ? "No classes available" 
                          : "Select a class"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.name}>
                        {classItem.name} ({classItem.level} - {classItem.subsystem})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationFee">Reg. Fee ({getCurrencySymbol()})</Label>
                  <Input
                    id="registrationFee"
                    type="number"
                    min="0"
                    value={newRegistration.registration_fee}
                    onChange={(e) => setNewRegistration({...newRegistration, registration_fee: parseFloat(e.target.value) || 0})}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ptaFee">PTA Fee ({getCurrencySymbol()})</Label>
                  <Input
                    id="ptaFee"
                    type="number"
                    min="0"
                    value={newRegistration.pta_fee}
                    onChange={(e) => setNewRegistration({...newRegistration, pta_fee: parseFloat(e.target.value) || 0})}
                    placeholder="Optional"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tuitionFee">School Fees ({getCurrencySymbol()})</Label>
                  <Input
                    id="tuitionFee"
                    type="number"
                    min="0"
                    value={newRegistration.tuition_fee}
                    onChange={(e) => setNewRegistration({...newRegistration, tuition_fee: parseFloat(e.target.value) || 0})}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="installments">Installments</Label>
                  <Select value={newRegistration.installments || ''} onValueChange={(value) => setNewRegistration({...newRegistration, installments: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select installment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first">First Installment</SelectItem>
                      <SelectItem value="second">Second Installment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="installmentAmount">Amount ({getCurrencySymbol()})</Label>
                  <Input
                    id="installmentAmount"
                    type="number"
                    min="0"
                    value={newRegistration.installmentAmount || ''}
                    onChange={(e) => setNewRegistration({...newRegistration, installmentAmount: parseFloat(e.target.value) || 0})}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newRegistration.due_date}
                  onChange={(e) => setNewRegistration({...newRegistration, due_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newRegistration.notes}
                  onChange={(e) => setNewRegistration({...newRegistration, notes: e.target.value})}
                  placeholder="Additional notes (optional)"
                />
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Total Amount: {formatCurrency(newRegistration.registration_fee + newRegistration.pta_fee + newRegistration.tuition_fee)}
                </p>
              </div>
              </div>
            </div>
            
            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => handleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRegistration}>
                Register Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_registrations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.paid_registrations} paid, {stats.partial_payments} partial
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registration Fees</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(registrations.reduce((sum, reg) => sum + reg.registration_fee, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total registration fees collected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PTA</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(registrations.reduce((sum, reg) => sum + reg.pta_fee, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total PTA fees collected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">School Fees</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(registrations.reduce((sum, reg) => sum + reg.tuition_fee, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total school fees collected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.monthly_revenue)} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>
            View and manage all student payments and transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filters.academic_year} onValueChange={(value) => setFilters({...filters, academic_year: value})}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2024-2025">2024-2025</SelectItem>
                <SelectItem value="2025-2026">2025-2026</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.term} onValueChange={(value) => setFilters({...filters, term: value})}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.payment_status} onValueChange={(value) => setFilters({...filters, payment_status: value})}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">{registration.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{registration.student_name}</div>
                        <div className="text-sm text-muted-foreground">{registration.student_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{registration.class}</TableCell>
                    <TableCell>{registration.academic_year}</TableCell>
                    <TableCell className="font-medium">{registration.total_amount.toLocaleString()} XOF</TableCell>
                    <TableCell>{registration.paid_amount.toLocaleString()} XOF</TableCell>
                    <TableCell className={registration.balance > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                      {registration.balance.toLocaleString()} XOF
                    </TableCell>
                    <TableCell>{getPaymentStatusBadge(registration.payment_status)}</TableCell>
                    <TableCell>{new Date(registration.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewRegistration(registration)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handlePaymentRegistration(registration)}
                          title="Record Payment"
                          disabled={registration.balance === 0}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditRegistration(registration)}
                          title="Edit Payment"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteRegistration(registration)}
                          title="Delete Payment"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRegistrations.length === 0 && (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payments found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filters.academic_year !== 'all' || filters.term !== 'all' || filters.payment_status !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start by registering your first payment'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Registration Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View detailed information about this payment
            </DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment ID</Label>
                  <p className="text-sm">{selectedRegistration.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                  <div className="mt-1">{getPaymentStatusBadge(selectedRegistration.payment_status)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Student</Label>
                  <p className="text-sm font-medium">{selectedRegistration.student_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedRegistration.student_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Class</Label>
                  <p className="text-sm">{selectedRegistration.class}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Academic Year</Label>
                  <p className="text-sm">{selectedRegistration.academic_year}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Term</Label>
                  <p className="text-sm">{selectedRegistration.term}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Reg. Fee</Label>
                  <p className="text-sm">{selectedRegistration.registration_fee.toLocaleString()} XOF</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">PTA Fee</Label>
                  <p className="text-sm">{selectedRegistration.pta_fee.toLocaleString()} XOF</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">School Fees</Label>
                  <p className="text-sm">{selectedRegistration.tuition_fee.toLocaleString()} XOF</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                  <p className="text-lg font-bold">{selectedRegistration.total_amount.toLocaleString()} XOF</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Balance Due</Label>
                  <p className={`text-lg font-bold ${selectedRegistration.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                    {selectedRegistration.balance.toLocaleString()} XOF
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                  <p className="text-sm">{new Date(selectedRegistration.due_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                  <p className="text-sm">{new Date(selectedRegistration.created_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedRegistration.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedRegistration.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Registration Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Update the details of this payment
            </DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <EditRegistrationForm 
                registration={selectedRegistration}
                onSave={handleUpdateRegistration}
                onCancel={() => setShowEditDialog(false)}
                classes={classes}
                classesLoading={classesLoading}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for this registration
            </DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <PaymentForm 
              registration={selectedRegistration} 
              onSave={handleRecordPayment}
              onCancel={() => setShowPaymentDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {registrationToDelete && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium">Payment Details:</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>ID:</strong> {registrationToDelete.id}<br/>
                  <strong>Student:</strong> {registrationToDelete.student_name}<br/>
                  <strong>Class:</strong> {registrationToDelete.class}<br/>
                  <strong>Amount:</strong> {registrationToDelete.total_amount.toLocaleString()} XOF
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteRegistration}>
              Delete Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

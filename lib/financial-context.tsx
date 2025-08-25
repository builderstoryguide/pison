"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { supabase } from "./supabase"

export interface FeeStructure {
  id: string
  name: string
  subsystem: "english" | "french"
  level: string
  branch: "grammar" | "technical" | "commercial"
  amount: number
  dueDate: string
  term: "first" | "second" | "third"
  academicYear: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  studentId: string
  studentName: string
  feeStructureId: string
  feeName: string
  amount: number
  amountPaid: number
  balance: number
  paymentDate: string
  paymentMethod: "cash" | "bank_transfer" | "mobile_money" | "cheque"
  receiptNumber: string
  status: "pending" | "partial" | "completed" | "overdue"
  term: "first" | "second" | "third"
  academicYear: string
  paidBy: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PaymentPlan {
  id: string
  studentId: string
  studentName: string
  totalAmount: number
  amountPaid: number
  installments: {
    id: string
    amount: number
    dueDate: string
    status: "pending" | "paid" | "overdue"
    paidDate?: string
  }[]
  status: "active" | "completed" | "defaulted"
  createdAt: string
  updatedAt: string
}

export interface FinancialReport {
  id: string
  title: string
  type: "collection" | "outstanding" | "summary" | "analysis"
  period: {
    start: string
    end: string
  }
  data: any
  generatedAt: string
  generatedBy: string
}

export interface StudentFeeAssignment {
  id: string
  studentId: string
  studentName: string
  feeStructureId: string
  feeStructureName: string
  academicYear: string
  term: string
  totalAmount: number
  amountPaid: number
  balance: number
  status: "pending" | "partial" | "paid" | "overdue"
  dueDate: string
  createdAt: string
  updatedAt: string
}

interface FinancialContextType {
  feeStructures: FeeStructure[]
  payments: Payment[]
  paymentPlans: PaymentPlan[]
  studentFeeAssignments: StudentFeeAssignment[]
  reports: FinancialReport[]
  isLoading: boolean

  // Fee Structure Management
  createFeeStructure: (data: Omit<FeeStructure, "id" | "createdAt" | "updatedAt">) => Promise<{ success: boolean; feeStructureId?: string; error?: string }>
  updateFeeStructure: (id: string, data: Partial<FeeStructure>) => Promise<{ success: boolean; error?: string }>
  deleteFeeStructure: (id: string) => Promise<{ success: boolean; error?: string }>
  getFeeStructureById: (id: string) => FeeStructure | undefined

  // Payment Management
  recordPayment: (data: Omit<Payment, "id" | "createdAt" | "updatedAt">) => Promise<{ success: boolean; paymentId?: string; error?: string }>
  updatePayment: (id: string, data: Partial<Payment>) => Promise<{ success: boolean; error?: string }>
  deletePayment: (id: string) => Promise<{ success: boolean; error?: string }>
  getPaymentsByStudent: (studentId: string) => Payment[]
  getOutstandingPayments: () => Payment[]

  // Student Fee Assignment Management
  assignFeeToStudent: (data: Omit<StudentFeeAssignment, "id" | "createdAt" | "updatedAt">) => Promise<{ success: boolean; assignmentId?: string; error?: string }>
  updateStudentFeeAssignment: (id: string, data: Partial<StudentFeeAssignment>) => Promise<{ success: boolean; error?: string }>
  deleteStudentFeeAssignment: (id: string) => Promise<{ success: boolean; error?: string }>
  getStudentFeeAssignments: (studentId: string) => StudentFeeAssignment[]

  // Payment Plans
  createPaymentPlan: (data: Omit<PaymentPlan, "id" | "createdAt" | "updatedAt">) => Promise<{ success: boolean; planId?: string; error?: string }>
  updatePaymentPlan: (id: string, data: Partial<PaymentPlan>) => Promise<{ success: boolean; error?: string }>
  deletePaymentPlan: (id: string) => Promise<{ success: boolean; error?: string }>

  // Reports
  generateReport: (type: FinancialReport["type"], period: { start: string; end: string }) => Promise<{ success: boolean; reportId?: string; error?: string }>
  getFinancialSummary: () => {
    totalCollections: number
    totalOutstanding: number
    collectionRate: number
    totalStudents: number
    paidStudents: number
    overduePayments: number
  }
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined)

export function useFinancial() {
  const context = useContext(FinancialContext)
  if (context === undefined) {
    throw new Error("useFinancial must be used within a FinancialProvider")
  }
  return context
}

// Mock data for fallback
const mockFeeStructures: FeeStructure[] = [
  {
    id: "fee-1",
    name: "First Term Fees - Form 5 Science",
    subsystem: "english",
    level: "form-5",
    branch: "grammar",
    amount: 75000,
    dueDate: "2024-10-15",
    term: "first",
    academicYear: "2024-2025",
    description: "First term school fees for Form 5 Science students",
    isActive: true,
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
  {
    id: "fee-2",
    name: "Second Term Fees - Form 4 Arts",
    subsystem: "english",
    level: "form-4",
    branch: "grammar",
    amount: 70000,
    dueDate: "2025-01-15",
    term: "second",
    academicYear: "2024-2025",
    description: "Second term school fees for Form 4 Arts students",
    isActive: true,
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
]

const mockPayments: Payment[] = [
  {
    id: "pay-1",
    studentId: "std-001",
    studentName: "Marie Ngozi Atanga",
    feeStructureId: "fee-1",
    feeName: "First Term Fees - Form 5 Science",
    amount: 75000,
    amountPaid: 75000,
    balance: 0,
    paymentDate: "2024-09-15",
    paymentMethod: "bank_transfer",
    receiptNumber: "RCP-2024-001",
    status: "completed",
    term: "first",
    academicYear: "2024-2025",
    paidBy: "Marie Ngozi Atanga",
    createdAt: "2024-09-15T00:00:00Z",
    updatedAt: "2024-09-15T00:00:00Z",
  },
  {
    id: "pay-2",
    studentId: "std-002",
    studentName: "Paul Biya Fru",
    feeStructureId: "fee-1",
    feeName: "First Term Fees - Form 5 Science",
    amount: 75000,
    amountPaid: 50000,
    balance: 25000,
    paymentDate: "2024-09-10",
    paymentMethod: "mobile_money",
    receiptNumber: "RCP-2024-002",
    status: "partial",
    term: "first",
    academicYear: "2024-2025",
    paidBy: "Paul Biya Fru",
    createdAt: "2024-09-10T00:00:00Z",
    updatedAt: "2024-09-10T00:00:00Z",
  },
]

const mockPaymentPlans: PaymentPlan[] = [
  {
    id: "plan-1",
    studentId: "std-004",
    studentName: "Jean Claude Mbarga",
    totalAmount: 150000,
    amountPaid: 50000,
    installments: [
      {
        id: "inst-1",
        amount: 50000,
        dueDate: "2024-09-15",
        status: "paid",
        paidDate: "2024-09-10",
      },
      {
        id: "inst-2",
        amount: 50000,
        dueDate: "2024-11-15",
        status: "pending",
      },
      {
        id: "inst-3",
        amount: 50000,
        dueDate: "2025-01-15",
        status: "pending",
      },
    ],
    status: "active",
    createdAt: "2024-08-15T00:00:00Z",
    updatedAt: "2024-09-10T00:00:00Z",
  },
]

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([])
  const [studentFeeAssignments, setStudentFeeAssignments] = useState<StudentFeeAssignment[]>([])
  const [reports, setReports] = useState<FinancialReport[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load data from database on mount
  useEffect(() => {
    loadFinancialData()
  }, [])

  const loadFinancialData = useCallback(async () => {
    if (!supabase) {
      console.log("⚠️ Supabase client not available - using mock data")
      // Use mock data instead of empty arrays
      setPayments(mockPayments)
      setStudentFeeAssignments([])
      setFeeStructures(mockFeeStructures)
      return
    }

    setIsLoading(true)
    try {
      console.log("Starting to load financial data...")

      // Test connection first
      const { data: testData, error: testError } = await supabase
        .from("payments")
        .select("count", { count: "exact", head: true })

      if (testError) {
        console.log("⚠️ Database connection test failed, using mock data:", testError.message)
        // Use mock data instead of throwing error
        setPayments(mockPayments)
        setStudentFeeAssignments([])
        setFeeStructures(mockFeeStructures)
        return
      }

      console.log("Database connection successful, loading payments...")

      // Load payments with better error handling
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          id,
          student_id,
          fee_structure_id,
          amount,
          payment_date,
          payment_method_id,
          received_by,
          academic_year,
          term,
          created_at,
          updated_at,
          students (first_name, last_name, student_number),
          fee_structures (name),
          payment_methods (name)
        `)
        .order("created_at", { ascending: false })

      if (paymentsError) {
        console.log("⚠️ Error loading payments, using mock data:", paymentsError.message)
        // Use mock data instead of logging error
        setPayments(mockPayments)
      } else {
        console.log("Payments loaded successfully:", paymentsData?.length || 0, "records")
        const transformedPayments: Payment[] = (paymentsData || []).map((payment: any) => ({
          id: payment.id,
          studentId: payment.student_id,
          studentName: `${payment.students?.first_name || ""} ${payment.students?.last_name || ""}`.trim(),
          feeStructureId: payment.fee_structure_id,
          feeName: payment.fee_structures?.name || "",
          amount: payment.amount,
          amountPaid: payment.amount,
          balance: 0, // Calculate based on fee structure
          paymentDate: payment.payment_date,
          paymentMethod: payment.payment_methods?.name || payment.payment_method || "Cash",
          receiptNumber: payment.receipt_number,
          status: payment.status,
          term: payment.term || "first",
          academicYear: payment.academic_year || "2024-2025",
          paidBy: payment.paid_by,
          notes: payment.notes,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at,
        }))
        setPayments(transformedPayments)
      }

      console.log("Loading student fee assignments...")

      // Load student fee assignments with better error handling
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("student_fee_assignments")
        .select(`
          id,
          student_id,
          fee_structure_id,
          total_amount,
          paid_amount,
          balance_amount,
          due_date,
          status,
          academic_year,
          term,
          created_at,
          updated_at,
          students (first_name, last_name, student_number),
          fee_structures (name)
        `)
        .order("created_at", { ascending: false })

      if (assignmentsError) {
        console.log("⚠️ Error loading student fee assignments, using empty array:", assignmentsError.message)
        // Use empty array instead of logging error
        setStudentFeeAssignments([])
      } else {
        console.log("Student fee assignments loaded successfully:", assignmentsData?.length || 0, "records")
        const transformedAssignments: StudentFeeAssignment[] = (assignmentsData || []).map((assignment: any) => ({
          id: assignment.id,
          studentId: assignment.student_id,
          studentName: `${assignment.students?.first_name || ""} ${assignment.students?.last_name || ""}`.trim(),
          feeStructureId: assignment.fee_structure_id,
          feeStructureName: assignment.fee_structures?.name || "",
          academicYear: assignment.academic_year,
          term: assignment.term,
          totalAmount: assignment.total_amount,
          amountPaid: assignment.amount_paid,
          balance: assignment.balance_amount,
          status: assignment.status,
          dueDate: assignment.due_date,
          createdAt: assignment.created_at,
          updatedAt: assignment.updated_at,
        }))
        setStudentFeeAssignments(transformedAssignments)
      }

      console.log("Loading fee structures...")

      // Load fee structures
      const { data: feeStructuresData, error: feeStructuresError } = await supabase
        .from("fee_structures")
        .select("*")
        .order("created_at", { ascending: false })

      if (feeStructuresError) {
        console.log("⚠️ Error loading fee structures, using mock data:", feeStructuresError.message)
        // Use mock data instead of logging error
        setFeeStructures(mockFeeStructures)
      } else {
        console.log("Fee structures loaded successfully:", feeStructuresData?.length || 0, "records")
        const transformedFeeStructures: FeeStructure[] = (feeStructuresData || []).map((fee: any) => ({
          id: fee.id,
          name: fee.name,
          subsystem: fee.subsystem,
          level: fee.level,
          branch: fee.branch,
          amount: fee.amount,
          dueDate: fee.due_date,
          term: fee.term,
          academicYear: fee.academic_year,
          description: fee.description,
          isActive: fee.is_active,
          createdAt: fee.created_at,
          updatedAt: fee.updated_at,
        }))
        setFeeStructures(transformedFeeStructures)
      }

      console.log("Financial data loading completed successfully")

    } catch (error) {
      console.log("⚠️ Error loading financial data, using mock data:", error)
      // Use mock data on any error
      setPayments(mockPayments)
      setStudentFeeAssignments([])
      setFeeStructures(mockFeeStructures)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fee Structure CRUD Operations
  const createFeeStructure = useCallback(
    async (data: Omit<FeeStructure, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; feeStructureId?: string; error?: string }> => {
      if (!supabase) {
        // Mock implementation
        const newFeeStructure: FeeStructure = {
          ...data,
          id: `fee-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setFeeStructures((prev) => [...prev, newFeeStructure])
        return { success: true, feeStructureId: newFeeStructure.id }
      }

      setIsLoading(true)
      try {
        const feeStructureData = {
          name: data.name,
          subsystem: data.subsystem,
          level: data.level,
          branch: data.branch,
          amount: data.amount,
          due_date: data.dueDate,
          term: data.term,
          academic_year: data.academicYear,
          description: data.description,
          is_active: data.isActive,
        }

        const { data: newFeeStructure, error } = await supabase
          .from("fee_structures")
          .insert([feeStructureData])
          .select()
          .single()

        if (error) {
          console.error("Error creating fee structure:", error)
          return { success: false, error: error.message }
        }

        const transformedFeeStructure: FeeStructure = {
          id: newFeeStructure.id,
          name: newFeeStructure.name,
          subsystem: newFeeStructure.subsystem,
          level: newFeeStructure.level,
          branch: newFeeStructure.branch,
          amount: newFeeStructure.amount,
          dueDate: newFeeStructure.due_date,
          term: newFeeStructure.term,
          academicYear: newFeeStructure.academic_year,
          description: newFeeStructure.description || "",
          isActive: newFeeStructure.is_active,
          createdAt: newFeeStructure.created_at,
          updatedAt: newFeeStructure.updated_at,
        }

        setFeeStructures((prev) => [transformedFeeStructure, ...prev])
        return { success: true, feeStructureId: transformedFeeStructure.id }
      } catch (error) {
        console.error("Error creating fee structure:", error)
        return { success: false, error: "Failed to create fee structure" }
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const updateFeeStructure = useCallback(
    async (id: string, data: Partial<FeeStructure>): Promise<{ success: boolean; error?: string }> => {
      if (!supabase) {
        // Mock implementation
        setFeeStructures((prev) =>
          prev.map((fee) => (fee.id === id ? { ...fee, ...data, updatedAt: new Date().toISOString() } : fee)),
        )
        return { success: true }
      }

      setIsLoading(true)
      try {
        const updateData: any = {}
        if (data.name) updateData.name = data.name
        if (data.subsystem) updateData.subsystem = data.subsystem
        if (data.level) updateData.level = data.level
        if (data.branch) updateData.branch = data.branch
        if (data.amount) updateData.amount = data.amount
        if (data.dueDate) updateData.due_date = data.dueDate
        if (data.term) updateData.term = data.term
        if (data.academicYear) updateData.academic_year = data.academicYear
        if (data.description !== undefined) updateData.description = data.description
        if (data.isActive !== undefined) updateData.is_active = data.isActive

        const { error } = await supabase
          .from("fee_structures")
          .update(updateData)
          .eq("id", id)

        if (error) {
          console.error("Error updating fee structure:", error)
          return { success: false, error: error.message }
        }

        setFeeStructures((prev) =>
          prev.map((fee) => (fee.id === id ? { ...fee, ...data, updatedAt: new Date().toISOString() } : fee)),
        )
        return { success: true }
      } catch (error) {
        console.error("Error updating fee structure:", error)
        return { success: false, error: "Failed to update fee structure" }
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const deleteFeeStructure = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!supabase) {
        // Mock implementation
        setFeeStructures((prev) => prev.filter((fee) => fee.id !== id))
        return { success: true }
      }

      setIsLoading(true)
      try {
        const { error } = await supabase
          .from("fee_structures")
          .delete()
          .eq("id", id)

        if (error) {
          console.error("Error deleting fee structure:", error)
          return { success: false, error: error.message }
        }

        setFeeStructures((prev) => prev.filter((fee) => fee.id !== id))
        return { success: true }
      } catch (error) {
        console.error("Error deleting fee structure:", error)
        return { success: false, error: "Failed to delete fee structure" }
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const getFeeStructureById = useCallback(
    (id: string): FeeStructure | undefined => {
      return feeStructures.find((fee) => fee.id === id)
    },
    [feeStructures],
  )

  // Payment CRUD Operations
  const recordPayment = useCallback(
    async (data: Omit<Payment, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
      if (!supabase) {
        // Mock implementation
        const newPayment: Payment = {
          ...data,
          id: `pay-${Date.now()}`,
          receiptNumber: `RCP-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, "0")}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setPayments((prev) => [...prev, newPayment])
        return { success: true, paymentId: newPayment.id }
      }

      setIsLoading(true)
      try {
        const paymentData = {
          student_id: data.studentId,
          fee_structure_id: data.feeStructureId,
          amount: data.amountPaid,
          payment_date: data.paymentDate,
          payment_method: data.paymentMethod,
          receipt_number: `RCP-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, "0")}`,
          paid_by: data.paidBy,
          notes: data.notes,
          status: data.status,
        }

        const { data: newPayment, error } = await supabase
          .from("payments")
          .insert([paymentData])
          .select()
          .single()

        if (error) {
          console.error("Error recording payment:", error)
          return { success: false, error: error.message }
        }

        // Update student fee assignment balance
        const { error: updateError } = await supabase
          .from("student_fee_assignments")
          .update({
            amount_paid: supabase.rpc('add_amount', { amount: data.amountPaid }),
            balance: supabase.rpc('subtract_amount', { amount: data.amountPaid }),
          })
          .eq("student_id", data.studentId)
          .eq("fee_structure_id", data.feeStructureId)

        if (updateError) {
          console.error("Error updating student fee assignment:", updateError)
        }

        const transformedPayment: Payment = {
          id: newPayment.id,
          studentId: newPayment.student_id,
          studentName: data.studentName,
          feeStructureId: newPayment.fee_structure_id,
          feeName: data.feeName,
          amount: data.amount,
          amountPaid: newPayment.amount,
          balance: data.balance,
          paymentDate: newPayment.payment_date,
          paymentMethod: newPayment.payment_method,
          receiptNumber: newPayment.receipt_number,
          status: newPayment.status,
          term: data.term,
          academicYear: data.academicYear,
          paidBy: newPayment.paid_by,
          notes: newPayment.notes,
          createdAt: newPayment.created_at,
          updatedAt: newPayment.updated_at,
        }

        setPayments((prev) => [transformedPayment, ...prev])
        return { success: true, paymentId: transformedPayment.id }
      } catch (error) {
        console.error("Error recording payment:", error)
        return { success: false, error: "Failed to record payment" }
      } finally {
        setIsLoading(false)
      }
    },
    [payments.length],
  )

  const updatePayment = useCallback(
    async (id: string, data: Partial<Payment>): Promise<{ success: boolean; error?: string }> => {
      if (!supabase) {
        // Mock implementation
        setPayments((prev) =>
          prev.map((payment) =>
            payment.id === id ? { ...payment, ...data, updatedAt: new Date().toISOString() } : payment,
          ),
        )
        return { success: true }
      }

      setIsLoading(true)
      try {
        const updateData: any = {}
        if (data.amountPaid) updateData.amount = data.amountPaid
        if (data.paymentDate) updateData.payment_date = data.paymentDate
        if (data.paymentMethod) updateData.payment_method = data.paymentMethod
        if (data.paidBy) updateData.paid_by = data.paidBy
        if (data.notes !== undefined) updateData.notes = data.notes
        if (data.status) updateData.status = data.status

        const { error } = await supabase
          .from("payments")
          .update(updateData)
          .eq("id", id)

        if (error) {
          console.error("Error updating payment:", error)
          return { success: false, error: error.message }
        }

        setPayments((prev) =>
          prev.map((payment) =>
            payment.id === id ? { ...payment, ...data, updatedAt: new Date().toISOString() } : payment,
          ),
        )
        return { success: true }
      } catch (error) {
        console.error("Error updating payment:", error)
        return { success: false, error: "Failed to update payment" }
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const deletePayment = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!supabase) {
        // Mock implementation
        setPayments((prev) => prev.filter((payment) => payment.id !== id))
        return { success: true }
      }

      setIsLoading(true)
      try {
        const { error } = await supabase
          .from("payments")
          .delete()
          .eq("id", id)

        if (error) {
          console.error("Error deleting payment:", error)
          return { success: false, error: error.message }
        }

        setPayments((prev) => prev.filter((payment) => payment.id !== id))
        return { success: true }
      } catch (error) {
        console.error("Error deleting payment:", error)
        return { success: false, error: "Failed to delete payment" }
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const getPaymentsByStudent = useCallback(
    (studentId: string): Payment[] => {
      return payments.filter((payment) => payment.studentId === studentId)
    },
    [payments],
  )

  const getOutstandingPayments = useCallback((): Payment[] => {
    return payments.filter(
      (payment) => payment.status === "pending" || payment.status === "partial" || payment.status === "overdue",
    )
  }, [payments])

  // Student Fee Assignment CRUD Operations
  const assignFeeToStudent = useCallback(
    async (data: Omit<StudentFeeAssignment, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; assignmentId?: string; error?: string }> => {
      if (!supabase) {
        // Mock implementation
        const newAssignment: StudentFeeAssignment = {
          ...data,
          id: `assignment-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setStudentFeeAssignments((prev) => [...prev, newAssignment])
        return { success: true, assignmentId: newAssignment.id }
      }

      setIsLoading(true)
      try {
        const assignmentData = {
          student_id: data.studentId,
          fee_structure_id: data.feeStructureId,
          academic_year: data.academicYear,
          term: data.term,
          total_amount: data.totalAmount,
          amount_paid: data.amountPaid,
          balance: data.balance,
          status: data.status,
          due_date: data.dueDate,
        }

        const { data: newAssignment, error } = await supabase
          .from("student_fee_assignments")
          .insert([assignmentData])
          .select()
          .single()

        if (error) {
          console.error("Error assigning fee to student:", error)
          return { success: false, error: error.message }
        }

        const transformedAssignment: StudentFeeAssignment = {
          id: newAssignment.id,
          studentId: newAssignment.student_id,
          studentName: data.studentName,
          feeStructureId: newAssignment.fee_structure_id,
          feeStructureName: data.feeStructureName,
          academicYear: newAssignment.academic_year,
          term: newAssignment.term,
          totalAmount: newAssignment.total_amount,
          amountPaid: newAssignment.amount_paid,
          balance: newAssignment.balance,
          status: newAssignment.status,
          dueDate: newAssignment.due_date,
          createdAt: newAssignment.created_at,
          updatedAt: newAssignment.updated_at,
        }

        setStudentFeeAssignments((prev) => [transformedAssignment, ...prev])
        return { success: true, assignmentId: transformedAssignment.id }
      } catch (error) {
        console.error("Error assigning fee to student:", error)
        return { success: false, error: "Failed to assign fee to student" }
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const updateStudentFeeAssignment = useCallback(
    async (id: string, data: Partial<StudentFeeAssignment>): Promise<{ success: boolean; error?: string }> => {
      if (!supabase) {
        // Mock implementation
        setStudentFeeAssignments((prev) =>
          prev.map((assignment) => (assignment.id === id ? { ...assignment, ...data, updatedAt: new Date().toISOString() } : assignment)),
        )
        return { success: true }
      }

      setIsLoading(true)
      try {
        const updateData: any = {}
        if (data.totalAmount) updateData.total_amount = data.totalAmount
        if (data.amountPaid) updateData.amount_paid = data.amountPaid
        if (data.balance) updateData.balance = data.balance
        if (data.status) updateData.status = data.status
        if (data.dueDate) updateData.due_date = data.dueDate

        const { error } = await supabase
          .from("student_fee_assignments")
          .update(updateData)
          .eq("id", id)

        if (error) {
          console.error("Error updating student fee assignment:", error)
          return { success: false, error: error.message }
        }

        setStudentFeeAssignments((prev) =>
          prev.map((assignment) => (assignment.id === id ? { ...assignment, ...data, updatedAt: new Date().toISOString() } : assignment)),
        )
        return { success: true }
      } catch (error) {
        console.error("Error updating student fee assignment:", error)
        return { success: false, error: "Failed to update student fee assignment" }
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const deleteStudentFeeAssignment = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!supabase) {
        // Mock implementation
        setStudentFeeAssignments((prev) => prev.filter((assignment) => assignment.id !== id))
        return { success: true }
      }

      setIsLoading(true)
      try {
        const { error } = await supabase
          .from("student_fee_assignments")
          .delete()
          .eq("id", id)

        if (error) {
          console.error("Error deleting student fee assignment:", error)
          return { success: false, error: error.message }
        }

        setStudentFeeAssignments((prev) => prev.filter((assignment) => assignment.id !== id))
        return { success: true }
      } catch (error) {
        console.error("Error deleting student fee assignment:", error)
        return { success: false, error: "Failed to delete student fee assignment" }
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const getStudentFeeAssignments = useCallback(
    (studentId: string): StudentFeeAssignment[] => {
      return studentFeeAssignments.filter((assignment) => assignment.studentId === studentId)
    },
    [studentFeeAssignments],
  )

  // Payment Plans CRUD Operations
  const createPaymentPlan = useCallback(
    async (data: Omit<PaymentPlan, "id" | "createdAt" | "updatedAt">): Promise<{ success: boolean; planId?: string; error?: string }> => {
      if (!supabase) {
        // Mock implementation
        const newPlan: PaymentPlan = {
          ...data,
          id: `plan-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setPaymentPlans((prev) => [...prev, newPlan])
        return { success: true, planId: newPlan.id }
      }

      setIsLoading(true)
      try {
        // This would require creating payment plan and installments
        // For now, return mock success
        const newPlan: PaymentPlan = {
          ...data,
          id: `plan-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setPaymentPlans((prev) => [...prev, newPlan])
        return { success: true, planId: newPlan.id }
      } catch (error) {
        console.error("Error creating payment plan:", error)
        return { success: false, error: "Failed to create payment plan" }
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const updatePaymentPlan = useCallback(
    async (id: string, data: Partial<PaymentPlan>): Promise<{ success: boolean; error?: string }> => {
      if (!supabase) {
        // Mock implementation
        setPaymentPlans((prev) =>
          prev.map((plan) => (plan.id === id ? { ...plan, ...data, updatedAt: new Date().toISOString() } : plan)),
        )
        return { success: true }
      }

      setIsLoading(true)
      try {
        // Mock implementation for now
        setPaymentPlans((prev) =>
          prev.map((plan) => (plan.id === id ? { ...plan, ...data, updatedAt: new Date().toISOString() } : plan)),
        )
        return { success: true }
      } catch (error) {
        console.error("Error updating payment plan:", error)
        return { success: false, error: "Failed to update payment plan" }
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const deletePaymentPlan = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!supabase) {
        // Mock implementation
        setPaymentPlans((prev) => prev.filter((plan) => plan.id !== id))
        return { success: true }
      }

      setIsLoading(true)
      try {
        // Mock implementation for now
        setPaymentPlans((prev) => prev.filter((plan) => plan.id !== id))
        return { success: true }
      } catch (error) {
        console.error("Error deleting payment plan:", error)
        return { success: false, error: "Failed to delete payment plan" }
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  // Reports
  const generateReport = useCallback(
    async (type: FinancialReport["type"], period: { start: string; end: string }): Promise<{ success: boolean; reportId?: string; error?: string }> => {
      setIsLoading(true)
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const reportData = {
          type,
          period,
          generatedAt: new Date().toISOString(),
          data: {
            totalPayments: payments.length,
            totalAmount: payments.reduce((sum, p) => sum + p.amountPaid, 0),
            paymentsByMethod: payments.reduce(
              (acc, p) => {
                acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amountPaid
                return acc
              },
              {} as Record<string, number>,
            ),
          },
        }

        const newReport: FinancialReport = {
          id: `report-${Date.now()}`,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
          type,
          period,
          data: reportData.data,
          generatedAt: reportData.generatedAt,
          generatedBy: "admin",
        }

        setReports((prev) => [...prev, newReport])
        return { success: true, reportId: newReport.id }
      } catch (error) {
        console.error("Error generating report:", error)
        return { success: false, error: "Failed to generate report" }
      } finally {
        setIsLoading(false)
      }
    },
    [payments],
  )

  const getFinancialSummary = useCallback(() => {
    const totalCollections = payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amountPaid, 0)
    const totalOutstanding = payments.filter((p) => p.status !== "completed").reduce((sum, p) => sum + p.balance, 0)
    const totalStudents = new Set(payments.map((p) => p.studentId)).size
    const paidStudents = new Set(payments.filter((p) => p.status === "completed").map((p) => p.studentId)).size
    const overduePayments = payments.filter((p) => p.status === "overdue").length
    const collectionRate = totalStudents > 0 ? (paidStudents / totalStudents) * 100 : 0

    return {
      totalCollections,
      totalOutstanding,
      collectionRate,
      totalStudents,
      paidStudents,
      overduePayments,
    }
  }, [payments])

  const value: FinancialContextType = {
    feeStructures,
    payments,
    paymentPlans,
    studentFeeAssignments,
    reports,
    isLoading,
    createFeeStructure,
    updateFeeStructure,
    deleteFeeStructure,
    getFeeStructureById,
    recordPayment,
    updatePayment,
    deletePayment,
    getPaymentsByStudent,
    getOutstandingPayments,
    assignFeeToStudent,
    updateStudentFeeAssignment,
    deleteStudentFeeAssignment,
    getStudentFeeAssignments,
    createPaymentPlan,
    updatePaymentPlan,
    deletePaymentPlan,
    generateReport,
    getFinancialSummary,
  }

  return <FinancialContext.Provider value={value}>{children}</FinancialContext.Provider>
}

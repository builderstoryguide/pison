"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

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

interface FinancialContextType {
  feeStructures: FeeStructure[]
  payments: Payment[]
  paymentPlans: PaymentPlan[]
  reports: FinancialReport[]
  isLoading: boolean

  // Fee Structure Management
  createFeeStructure: (data: Omit<FeeStructure, "id" | "createdAt" | "updatedAt">) => Promise<string>
  updateFeeStructure: (id: string, data: Partial<FeeStructure>) => Promise<void>
  deleteFeeStructure: (id: string) => Promise<void>
  getFeeStructureById: (id: string) => FeeStructure | undefined

  // Payment Management
  recordPayment: (data: Omit<Payment, "id" | "createdAt" | "updatedAt">) => Promise<string>
  updatePayment: (id: string, data: Partial<Payment>) => Promise<void>
  getPaymentsByStudent: (studentId: string) => Payment[]
  getOutstandingPayments: () => Payment[]

  // Payment Plans
  createPaymentPlan: (data: Omit<PaymentPlan, "id" | "createdAt" | "updatedAt">) => Promise<string>
  updatePaymentPlan: (id: string, data: Partial<PaymentPlan>) => Promise<void>

  // Reports
  generateReport: (type: FinancialReport["type"], period: { start: string; end: string }) => Promise<string>
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

// Mock data
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
  {
    id: "fee-3",
    name: "Première Trimestre - Terminale C",
    subsystem: "french",
    level: "terminale",
    branch: "grammar",
    amount: 80000,
    dueDate: "2024-11-30",
    term: "first",
    academicYear: "2024-2025",
    description: "Premier trimestre frais de scolarité pour Terminale C",
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
    paidBy: "Parent - John Atanga",
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
    amountPaid: 45000,
    balance: 30000,
    paymentDate: "2024-09-20",
    paymentMethod: "mobile_money",
    receiptNumber: "RCP-2024-002",
    status: "partial",
    term: "first",
    academicYear: "2024-2025",
    paidBy: "Parent - Grace Fru",
    notes: "Partial payment - balance to be paid by October 30",
    createdAt: "2024-09-20T00:00:00Z",
    updatedAt: "2024-09-20T00:00:00Z",
  },
  {
    id: "pay-3",
    studentId: "std-003",
    studentName: "Aminata Sali",
    feeStructureId: "fee-2",
    feeName: "Second Term Fees - Form 4 Arts",
    amount: 70000,
    amountPaid: 0,
    balance: 70000,
    paymentDate: "",
    paymentMethod: "cash",
    receiptNumber: "",
    status: "overdue",
    term: "second",
    academicYear: "2024-2025",
    paidBy: "",
    notes: "Payment overdue - contact parent",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
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
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(mockFeeStructures)
  const [payments, setPayments] = useState<Payment[]>(mockPayments)
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>(mockPaymentPlans)
  const [reports, setReports] = useState<FinancialReport[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const createFeeStructure = async (data: Omit<FeeStructure, "id" | "createdAt" | "updatedAt">): Promise<string> => {
    setIsLoading(true)
    try {
      const newFeeStructure: FeeStructure = {
        ...data,
        id: `fee-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setFeeStructures((prev) => [...prev, newFeeStructure])
      return newFeeStructure.id
    } finally {
      setIsLoading(false)
    }
  }

  const updateFeeStructure = async (id: string, data: Partial<FeeStructure>): Promise<void> => {
    setIsLoading(true)
    try {
      setFeeStructures((prev) =>
        prev.map((fee) => (fee.id === id ? { ...fee, ...data, updatedAt: new Date().toISOString() } : fee)),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const deleteFeeStructure = async (id: string): Promise<void> => {
    setIsLoading(true)
    try {
      setFeeStructures((prev) => prev.filter((fee) => fee.id !== id))
    } finally {
      setIsLoading(false)
    }
  }

  const getFeeStructureById = (id: string): FeeStructure | undefined => {
    return feeStructures.find((fee) => fee.id === id)
  }

  const recordPayment = async (data: Omit<Payment, "id" | "createdAt" | "updatedAt">): Promise<string> => {
    setIsLoading(true)
    try {
      const newPayment: Payment = {
        ...data,
        id: `pay-${Date.now()}`,
        receiptNumber: `RCP-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, "0")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setPayments((prev) => [...prev, newPayment])
      return newPayment.id
    } finally {
      setIsLoading(false)
    }
  }

  const updatePayment = async (id: string, data: Partial<Payment>): Promise<void> => {
    setIsLoading(true)
    try {
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === id ? { ...payment, ...data, updatedAt: new Date().toISOString() } : payment,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const getPaymentsByStudent = (studentId: string): Payment[] => {
    return payments.filter((payment) => payment.studentId === studentId)
  }

  const getOutstandingPayments = (): Payment[] => {
    return payments.filter(
      (payment) => payment.status === "pending" || payment.status === "partial" || payment.status === "overdue",
    )
  }

  const createPaymentPlan = async (data: Omit<PaymentPlan, "id" | "createdAt" | "updatedAt">): Promise<string> => {
    setIsLoading(true)
    try {
      const newPaymentPlan: PaymentPlan = {
        ...data,
        id: `plan-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setPaymentPlans((prev) => [...prev, newPaymentPlan])
      return newPaymentPlan.id
    } finally {
      setIsLoading(false)
    }
  }

  const updatePaymentPlan = async (id: string, data: Partial<PaymentPlan>): Promise<void> => {
    setIsLoading(true)
    try {
      setPaymentPlans((prev) =>
        prev.map((plan) => (plan.id === id ? { ...plan, ...data, updatedAt: new Date().toISOString() } : plan)),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const generateReport = async (
    type: FinancialReport["type"],
    period: { start: string; end: string },
  ): Promise<string> => {
    setIsLoading(true)
    try {
      const newReport: FinancialReport = {
        id: `report-${Date.now()}`,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        type,
        period,
        data: {}, // This would contain the actual report data
        generatedAt: new Date().toISOString(),
        generatedBy: "Current User",
      }
      setReports((prev) => [...prev, newReport])
      return newReport.id
    } finally {
      setIsLoading(false)
    }
  }

  const getFinancialSummary = () => {
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
  }

  const value: FinancialContextType = {
    feeStructures,
    payments,
    paymentPlans,
    reports,
    isLoading,
    createFeeStructure,
    updateFeeStructure,
    deleteFeeStructure,
    getFeeStructureById,
    recordPayment,
    updatePayment,
    getPaymentsByStudent,
    getOutstandingPayments,
    createPaymentPlan,
    updatePaymentPlan,
    generateReport,
    getFinancialSummary,
  }

  return <FinancialContext.Provider value={value}>{children}</FinancialContext.Provider>
}

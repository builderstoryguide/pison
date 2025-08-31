"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface Student {
  id: string
  name: string
  studentId: string
  class: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  email: string
  phone?: string
  parentName?: string
  parentPhone?: string
}

interface FeeStructure {
  id: string
  className: string
  subsystem: "english" | "french"
  academicYear: string
  term: "first" | "second" | "third"
  fees: {
    tuition: number
    registration: number
    examination: number
    library: number
    laboratory: number
    sports: number
    pta: number
    development: number
    other: number
  }
  totalAmount: number
  dueDate: string
  createdAt: string
}

interface Payment {
  id: string
  studentId: string
  feeStructureId: string
  amount: number
  paymentMethod: "cash" | "bank_transfer" | "mobile_money" | "cheque" | "card"
  receiptNumber: string
  paymentDate: string
  academicYear: string
  term: "first" | "second" | "third"
  description?: string
  collectedBy: string
  status: "completed" | "pending" | "cancelled"
  createdAt: string
}

interface StudentFee {
  id: string
  studentId: string
  student: Student
  feeStructureId: string
  feeStructure: FeeStructure
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  status: "paid" | "partial" | "pending" | "overdue"
  dueDate: string
  payments: Payment[]
  lastPaymentDate?: string
  createdAt: string
  updatedAt: string
}

interface FinancialStats {
  totalStudents: number
  totalFeesExpected: number
  totalFeesCollected: number
  totalOutstanding: number
  collectionRate: number
  overdueAmount: number
  overdueCount: number
  recentPayments: Payment[]
  monthlyCollection: {
    month: string
    amount: number
  }[]
}

interface BursarContextType {
  students: Student[]
  feeStructures: FeeStructure[]
  studentFees: StudentFee[]
  payments: Payment[]
  financialStats: FinancialStats
  isLoading: boolean
  error: string | null

  // Fee Structure Management
  createFeeStructure: (feeStructure: Omit<FeeStructure, "id" | "createdAt">) => Promise<boolean>
  updateFeeStructure: (id: string, updates: Partial<FeeStructure>) => Promise<boolean>
  deleteFeeStructure: (id: string) => Promise<boolean>

  // Payment Management
  recordPayment: (payment: Omit<Payment, "id" | "receiptNumber" | "createdAt">) => Promise<boolean>
  updatePayment: (id: string, updates: Partial<Payment>) => Promise<boolean>
  cancelPayment: (id: string) => Promise<boolean>

  // Student Fee Management
  assignFeesToStudent: (studentId: string, feeStructureId: string) => Promise<boolean>
  getStudentFees: (studentId: string) => StudentFee[]
  getOverdueFees: () => StudentFee[]

  // Reporting
  generateFinancialReport: (startDate: string, endDate: string) => Promise<any>
  exportPaymentData: (filters: any) => Promise<boolean>

  // Utility functions
  calculateBalance: (studentFeeId: string) => number
  getPaymentHistory: (studentId: string) => Payment[]
  searchStudentFees: (query: string) => StudentFee[]
  filterFeesByStatus: (status: StudentFee["status"]) => StudentFee[]
}

const BursarContext = createContext<BursarContextType | undefined>(undefined)

// Mock data
const mockStudents: Student[] = [
  {
    id: "1",
    name: "Amina Fru",
    studentId: "STU2024001",
    class: "Form 5A",
    subsystem: "english",
    branch: "grammar",
            email: "amina.fru@student.pisonacademy.cm",
    phone: "+237 678 901 234",
    parentName: "John Fru",
    parentPhone: "+237 678 901 235",
  },
  {
    id: "2",
    name: "Pierre Mballa",
    studentId: "STU2024002",
    class: "Terminale C",
    subsystem: "french",
    branch: "grammar",
            email: "pierre.mballa@student.pisonacademy.cm",
    phone: "+237 678 901 236",
    parentName: "Marie Mballa",
    parentPhone: "+237 678 901 237",
  },
  {
    id: "3",
    name: "Grace Tabi",
    studentId: "STU2024003",
    class: "Form 4B",
    subsystem: "english",
    branch: "technical",
            email: "grace.tabi@student.pisonacademy.cm",
    phone: "+237 678 901 238",
    parentName: "Paul Tabi",
    parentPhone: "+237 678 901 239",
  },
]

const mockFeeStructures: FeeStructure[] = [
  {
    id: "1",
    className: "Form 5A",
    subsystem: "english",
    academicYear: "2024-2025",
    term: "first",
    fees: {
      tuition: 75000,
      registration: 15000,
      examination: 10000,
      library: 5000,
      laboratory: 8000,
      sports: 3000,
      pta: 2000,
      development: 5000,
      other: 2000,
    },
    totalAmount: 125000,
    dueDate: "2024-10-15",
    createdAt: "2024-09-01T00:00:00Z",
  },
  {
    id: "2",
    className: "Terminale C",
    subsystem: "french",
    academicYear: "2024-2025",
    term: "first",
    fees: {
      tuition: 80000,
      registration: 15000,
      examination: 12000,
      library: 5000,
      laboratory: 10000,
      sports: 3000,
      pta: 2000,
      development: 5000,
      other: 3000,
    },
    totalAmount: 135000,
    dueDate: "2024-10-15",
    createdAt: "2024-09-01T00:00:00Z",
  },
]

const mockPayments: Payment[] = [
  {
    id: "1",
    studentId: "1",
    feeStructureId: "1",
    amount: 75000,
    paymentMethod: "bank_transfer",
    receiptNumber: "RCP2024001",
    paymentDate: "2024-09-15",
    academicYear: "2024-2025",
    term: "first",
    description: "Partial payment - Tuition fees",
    collectedBy: "Grace Tabi",
    status: "completed",
    createdAt: "2024-09-15T10:30:00Z",
  },
  {
    id: "2",
    studentId: "2",
    feeStructureId: "2",
    amount: 135000,
    paymentMethod: "cash",
    receiptNumber: "RCP2024002",
    paymentDate: "2024-09-10",
    academicYear: "2024-2025",
    term: "first",
    description: "Full payment - All fees",
    collectedBy: "Grace Tabi",
    status: "completed",
    createdAt: "2024-09-10T14:20:00Z",
  },
]

export function BursarProvider({ children }: { children: React.ReactNode }) {
  const [students] = useState<Student[]>(mockStudents)
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(mockFeeStructures)
  const [payments, setPayments] = useState<Payment[]>(mockPayments)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate student fees based on fee structures and payments
  const generateStudentFees = (): StudentFee[] => {
    return students.map((student) => {
      const applicableFeeStructure = feeStructures.find(
        (fs) => fs.className === student.class && fs.subsystem === student.subsystem,
      )

      if (!applicableFeeStructure) {
        return {
          id: `sf-${student.id}`,
          studentId: student.id,
          student,
          feeStructureId: "",
          feeStructure: {} as FeeStructure,
          totalAmount: 0,
          paidAmount: 0,
          balanceAmount: 0,
          status: "pending" as const,
          dueDate: "",
          payments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }

      const studentPayments = payments.filter((p) => p.studentId === student.id)
      const paidAmount = studentPayments.reduce((sum, p) => sum + p.amount, 0)
      const balanceAmount = applicableFeeStructure.totalAmount - paidAmount

      let status: StudentFee["status"] = "pending"
      if (paidAmount >= applicableFeeStructure.totalAmount) {
        status = "paid"
      } else if (paidAmount > 0) {
        status = "partial"
      } else if (new Date() > new Date(applicableFeeStructure.dueDate)) {
        status = "overdue"
      }

      return {
        id: `sf-${student.id}-${applicableFeeStructure.id}`,
        studentId: student.id,
        student,
        feeStructureId: applicableFeeStructure.id,
        feeStructure: applicableFeeStructure,
        totalAmount: applicableFeeStructure.totalAmount,
        paidAmount,
        balanceAmount,
        status,
        dueDate: applicableFeeStructure.dueDate,
        payments: studentPayments,
        lastPaymentDate:
          studentPayments.length > 0
            ? studentPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0]
                .paymentDate
            : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    })
  }

  const [studentFees, setStudentFees] = useState<StudentFee[]>([])

  useEffect(() => {
    setStudentFees(generateStudentFees())
  }, [students, feeStructures, payments])

  // Calculate financial statistics
  const calculateFinancialStats = (): FinancialStats => {
    const totalStudents = students.length
    const totalFeesExpected = studentFees.reduce((sum, sf) => sum + sf.totalAmount, 0)
    const totalFeesCollected = studentFees.reduce((sum, sf) => sum + sf.paidAmount, 0)
    const totalOutstanding = totalFeesExpected - totalFeesCollected
    const collectionRate = totalFeesExpected > 0 ? (totalFeesCollected / totalFeesExpected) * 100 : 0

    const overdueFees = studentFees.filter((sf) => sf.status === "overdue")
    const overdueAmount = overdueFees.reduce((sum, sf) => sum + sf.balanceAmount, 0)
    const overdueCount = overdueFees.length

    const recentPayments = payments
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .slice(0, 5)

    // Mock monthly collection data
    const monthlyCollection = [
      { month: "Sep 2024", amount: 210000 },
      { month: "Oct 2024", amount: 180000 },
      { month: "Nov 2024", amount: 150000 },
      { month: "Dec 2024", amount: 120000 },
    ]

    return {
      totalStudents,
      totalFeesExpected,
      totalFeesCollected,
      totalOutstanding,
      collectionRate,
      overdueAmount,
      overdueCount,
      recentPayments,
      monthlyCollection,
    }
  }

  const [financialStats, setFinancialStats] = useState<FinancialStats>(calculateFinancialStats())

  useEffect(() => {
    setFinancialStats(calculateFinancialStats())
  }, [studentFees, payments])

  // Fee Structure Management
  const createFeeStructure = async (feeStructureData: Omit<FeeStructure, "id" | "createdAt">): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newFeeStructure: FeeStructure = {
        ...feeStructureData,
        id: `fs-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }

      setFeeStructures((prev) => [...prev, newFeeStructure])
      return true
    } catch (err) {
      setError("Failed to create fee structure")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updateFeeStructure = async (id: string, updates: Partial<FeeStructure>): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setFeeStructures((prev) => prev.map((fs) => (fs.id === id ? { ...fs, ...updates } : fs)))
      return true
    } catch (err) {
      setError("Failed to update fee structure")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const deleteFeeStructure = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setFeeStructures((prev) => prev.filter((fs) => fs.id !== id))
      return true
    } catch (err) {
      setError("Failed to delete fee structure")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Payment Management
  const recordPayment = async (paymentData: Omit<Payment, "id" | "receiptNumber" | "createdAt">): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const receiptNumber = `RCP${Date.now()}`
      const newPayment: Payment = {
        ...paymentData,
        id: `pay-${Date.now()}`,
        receiptNumber,
        createdAt: new Date().toISOString(),
      }

      setPayments((prev) => [...prev, newPayment])
      return true
    } catch (err) {
      setError("Failed to record payment")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updatePayment = async (id: string, updates: Partial<Payment>): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
      return true
    } catch (err) {
      setError("Failed to update payment")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const cancelPayment = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: "cancelled" as const } : p)))
      return true
    } catch (err) {
      setError("Failed to cancel payment")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Student Fee Management
  const assignFeesToStudent = async (studentId: string, feeStructureId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // This would typically create a new student fee record
      console.log("Assigning fees to student:", studentId, feeStructureId)
      return true
    } catch (err) {
      setError("Failed to assign fees to student")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const getStudentFees = (studentId: string): StudentFee[] => {
    return studentFees.filter((sf) => sf.studentId === studentId)
  }

  const getOverdueFees = (): StudentFee[] => {
    return studentFees.filter((sf) => sf.status === "overdue")
  }

  // Reporting
  const generateFinancialReport = async (startDate: string, endDate: string): Promise<any> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const filteredPayments = payments.filter((p) => {
        const paymentDate = new Date(p.paymentDate)
        return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate)
      })

      return {
        totalPayments: filteredPayments.length,
        totalAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
        paymentsByMethod: filteredPayments.reduce(
          (acc, p) => {
            acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amount
            return acc
          },
          {} as Record<string, number>,
        ),
        payments: filteredPayments,
      }
    } catch (err) {
      setError("Failed to generate financial report")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const exportPaymentData = async (filters: any): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Exporting payment data with filters:", filters)
      return true
    } catch (err) {
      setError("Failed to export payment data")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Utility functions
  const calculateBalance = (studentFeeId: string): number => {
    const studentFee = studentFees.find((sf) => sf.id === studentFeeId)
    return studentFee ? studentFee.balanceAmount : 0
  }

  const getPaymentHistory = (studentId: string): Payment[] => {
    return payments
      .filter((p) => p.studentId === studentId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  }

  const searchStudentFees = (query: string): StudentFee[] => {
    const lowercaseQuery = query.toLowerCase()
    return studentFees.filter(
      (sf) =>
        sf.student.name.toLowerCase().includes(lowercaseQuery) ||
        sf.student.studentId.toLowerCase().includes(lowercaseQuery) ||
        sf.student.class.toLowerCase().includes(lowercaseQuery),
    )
  }

  const filterFeesByStatus = (status: StudentFee["status"]): StudentFee[] => {
    return studentFees.filter((sf) => sf.status === status)
  }

  return (
    <BursarContext.Provider
      value={{
        students,
        feeStructures,
        studentFees,
        payments,
        financialStats,
        isLoading,
        error,
        createFeeStructure,
        updateFeeStructure,
        deleteFeeStructure,
        recordPayment,
        updatePayment,
        cancelPayment,
        assignFeesToStudent,
        getStudentFees,
        getOverdueFees,
        generateFinancialReport,
        exportPaymentData,
        calculateBalance,
        getPaymentHistory,
        searchStudentFees,
        filterFeesByStatus,
      }}
    >
      {children}
    </BursarContext.Provider>
  )
}

export function useBursar() {
  const context = useContext(BursarContext)
  if (context === undefined) {
    throw new Error("useBursar must be used within a BursarProvider")
  }
  return context
}

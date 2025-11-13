"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase, isSupabaseAvailable } from "./supabase"
import { useToast } from "@/hooks/use-toast"

// Employee interface (extends Teacher with HR-specific fields)
export interface Employee {
  id: string
  employeeId: string
  title: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  nationality: string
  idNumber: string
  address: string
  city: string
  region: string
  subsystem: "english" | "french"
  subjects: string[]
  classes: string[]
  qualifications: string[]
  experience: string
  employmentType: "full-time" | "part-time" | "contract" | "temporary"
  salary: number
  startDate: string
  endDate?: string
  contractRenewalDate?: string
  emergencyContact: {
    name: string
    relationship: string
    phone: string
    email?: string
    address?: string
  }
  status: "active" | "inactive" | "suspended" | "terminated" | "retired"
  department?: string
  specialization?: string
  createdAt: string
  updatedAt: string
}

// Leave request interface
export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  leaveType: "annual" | "sick" | "maternity" | "paternity" | "unpaid" | "study" | "compassionate"
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

// Attendance record interface
export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string
  checkIn: string
  checkOut?: string
  status: "present" | "absent" | "late" | "on-leave" | "half-day"
  notes?: string
  createdAt: string
  updatedAt: string
}

// Performance review interface
export interface PerformanceReview {
  id: string
  employeeId: string
  employeeName: string
  reviewPeriod: string
  reviewDate: string
  reviewerName: string
  reviewerId: string
  overallRating: number
  teachingEffectiveness: number
  classroomManagement: number
  studentEngagement: number
  professionalism: number
  collaboration: number
  strengths: string
  areasForImprovement: string
  goals: string
  comments: string
  status: "draft" | "completed" | "acknowledged"
  createdAt: string
  updatedAt: string
}

// Payroll record interface
export interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  month: string
  year: number
  basicSalary: number
  allowances: number
  deductions: number
  netSalary: number
  paymentDate: string
  paymentMethod: "bank-transfer" | "cash" | "cheque"
  status: "pending" | "paid" | "cancelled"
  createdAt: string
  updatedAt: string
}

interface EmployeeManagementContextType {
  employees: Employee[]
  leaveRequests: LeaveRequest[]
  attendanceRecords: AttendanceRecord[]
  performanceReviews: PerformanceReview[]
  payrollRecords: PayrollRecord[]
  isLoading: boolean
  error: string | null
  
  // Employee operations
  loadEmployees: () => Promise<void>
  getEmployeeById: (id: string) => Employee | undefined
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<boolean>
  updateEmployeeStatus: (id: string, status: Employee["status"]) => Promise<boolean>
  
  // Leave management
  loadLeaveRequests: (employeeId?: string) => Promise<void>
  createLeaveRequest: (data: Omit<LeaveRequest, "id" | "createdAt" | "updatedAt">) => Promise<{ success: boolean; leaveRequest?: LeaveRequest }>
  approveLeaveRequest: (id: string, approverId: string) => Promise<boolean>
  rejectLeaveRequest: (id: string, rejectionReason: string) => Promise<boolean>
  cancelLeaveRequest: (id: string) => Promise<boolean>
  
  // Attendance management
  loadAttendanceRecords: (employeeId?: string, startDate?: string, endDate?: string) => Promise<void>
  recordAttendance: (data: Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt">) => Promise<{ success: boolean; attendance?: AttendanceRecord }>
  updateAttendance: (id: string, data: Partial<AttendanceRecord>) => Promise<boolean>
  
  // Performance review management
  loadPerformanceReviews: (employeeId?: string) => Promise<void>
  createPerformanceReview: (data: Omit<PerformanceReview, "id" | "createdAt" | "updatedAt">) => Promise<{ success: boolean; review?: PerformanceReview }>
  updatePerformanceReview: (id: string, data: Partial<PerformanceReview>) => Promise<boolean>
  
  // Payroll management
  loadPayrollRecords: (employeeId?: string, year?: number, month?: string) => Promise<void>
  createPayrollRecord: (data: Omit<PayrollRecord, "id" | "createdAt" | "updatedAt">) => Promise<{ success: boolean; payroll?: PayrollRecord }>
  updatePayrollRecord: (id: string, data: Partial<PayrollRecord>) => Promise<boolean>
  processPayroll: (id: string) => Promise<boolean>
}

const EmployeeManagementContext = createContext<EmployeeManagementContextType | undefined>(undefined)

export function EmployeeManagementProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([])
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Load employees from teachers table
  const loadEmployees = async () => {
    if (!isSupabaseAvailable()) {
      console.error("❌ Supabase client is not available")
      setError("Database connection not available")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) {
        console.error("❌ Error loading employees:", fetchError)
        setError(fetchError.message)
        return
      }

      if (data) {
        const transformedEmployees = data.map((teacher: any) => ({
          id: teacher.id,
          employeeId: teacher.teacher_id,
          title: teacher.title || "",
          firstName: teacher.first_name,
          lastName: teacher.last_name,
          email: teacher.email,
          phone: teacher.phone || "",
          dateOfBirth: teacher.date_of_birth || "",
          gender: teacher.gender || "",
          nationality: teacher.nationality || "",
          idNumber: teacher.id_number || "",
          address: teacher.address || "",
          city: teacher.city || "",
          region: teacher.region || "",
          subsystem: teacher.subsystem,
          subjects: teacher.subjects || [],
          classes: teacher.classes || [],
          qualifications: teacher.qualifications || [],
          experience: teacher.experience || "",
          employmentType: teacher.employment_type,
          salary: teacher.salary || 0,
          startDate: teacher.start_date || "",
          endDate: teacher.end_date || "",
          contractRenewalDate: teacher.contract_renewal_date || "",
          emergencyContact: {
            name: teacher.emergency_contact_name || "",
            relationship: teacher.emergency_contact_relationship || "",
            phone: teacher.emergency_contact_phone || "",
            email: teacher.emergency_contact_email || "",
            address: teacher.emergency_contact_address || "",
          },
          status: teacher.status || "active",
          department: teacher.department || "",
          specialization: teacher.specialization || "",
          createdAt: teacher.created_at,
          updatedAt: teacher.updated_at,
        }))

        setEmployees(transformedEmployees)
        console.log("✅ Loaded employees:", transformedEmployees.length)
      }
    } catch (err) {
      console.error("❌ Error in loadEmployees:", err)
      setError("Failed to load employees")
    } finally {
      setIsLoading(false)
    }
  }

  // Get employee by ID
  const getEmployeeById = (id: string): Employee | undefined => {
    return employees.find((emp) => emp.id === id)
  }

  // Update employee
  const updateEmployee = async (id: string, data: Partial<Employee>): Promise<boolean> => {
    if (!isSupabaseAvailable()) {
      toast({
        title: "Error",
        description: "Database connection not available",
        variant: "destructive",
      })
      return false
    }

    try {
      const updateData: any = {}
      
      if (data.firstName) updateData.first_name = data.firstName
      if (data.lastName) updateData.last_name = data.lastName
      if (data.email) updateData.email = data.email
      if (data.phone) updateData.phone = data.phone
      if (data.salary !== undefined) updateData.salary = data.salary
      if (data.status) updateData.status = data.status
      if (data.employmentType) updateData.employment_type = data.employmentType
      if (data.startDate) updateData.start_date = data.startDate
      if (data.endDate) updateData.end_date = data.endDate

      const { error: updateError } = await supabase
        .from("teachers")
        .update(updateData)
        .eq("id", id)

      if (updateError) {
        console.error("❌ Error updating employee:", updateError)
        toast({
          title: "Error",
          description: "Failed to update employee",
          variant: "destructive",
        })
        return false
      }

      await loadEmployees()
      return true
    } catch (err) {
      console.error("❌ Error in updateEmployee:", err)
      return false
    }
  }

  // Update employee status
  const updateEmployeeStatus = async (id: string, status: Employee["status"]): Promise<boolean> => {
    return updateEmployee(id, { status })
  }

  // Load leave requests
  const loadLeaveRequests = async (employeeId?: string) => {
    // This would typically load from a leave_requests table
    // For now, returning empty array as placeholder
    setLeaveRequests([])
  }

  // Create leave request
  const createLeaveRequest = async (
    data: Omit<LeaveRequest, "id" | "createdAt" | "updatedAt">
  ): Promise<{ success: boolean; leaveRequest?: LeaveRequest }> => {
    // Placeholder implementation
    toast({
      title: "Feature Coming Soon",
      description: "Leave request management will be available soon",
    })
    return { success: false }
  }

  // Approve leave request
  const approveLeaveRequest = async (id: string, approverId: string): Promise<boolean> => {
    // Placeholder implementation
    return false
  }

  // Reject leave request
  const rejectLeaveRequest = async (id: string, rejectionReason: string): Promise<boolean> => {
    // Placeholder implementation
    return false
  }

  // Cancel leave request
  const cancelLeaveRequest = async (id: string): Promise<boolean> => {
    // Placeholder implementation
    return false
  }

  // Load attendance records
  const loadAttendanceRecords = async (
    employeeId?: string,
    startDate?: string,
    endDate?: string
  ) => {
    // Placeholder implementation
    setAttendanceRecords([])
  }

  // Record attendance
  const recordAttendance = async (
    data: Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<{ success: boolean; attendance?: AttendanceRecord }> => {
    // Placeholder implementation
    return { success: false }
  }

  // Update attendance
  const updateAttendance = async (id: string, data: Partial<AttendanceRecord>): Promise<boolean> => {
    // Placeholder implementation
    return false
  }

  // Load performance reviews
  const loadPerformanceReviews = async (employeeId?: string) => {
    // Placeholder implementation
    setPerformanceReviews([])
  }

  // Create performance review
  const createPerformanceReview = async (
    data: Omit<PerformanceReview, "id" | "createdAt" | "updatedAt">
  ): Promise<{ success: boolean; review?: PerformanceReview }> => {
    // Placeholder implementation
    return { success: false }
  }

  // Update performance review
  const updatePerformanceReview = async (
    id: string,
    data: Partial<PerformanceReview>
  ): Promise<boolean> => {
    // Placeholder implementation
    return false
  }

  // Load payroll records
  const loadPayrollRecords = async (employeeId?: string, year?: number, month?: string) => {
    // Placeholder implementation
    setPayrollRecords([])
  }

  // Create payroll record
  const createPayrollRecord = async (
    data: Omit<PayrollRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<{ success: boolean; payroll?: PayrollRecord }> => {
    // Placeholder implementation
    return { success: false }
  }

  // Update payroll record
  const updatePayrollRecord = async (id: string, data: Partial<PayrollRecord>): Promise<boolean> => {
    // Placeholder implementation
    return false
  }

  // Process payroll
  const processPayroll = async (id: string): Promise<boolean> => {
    // Placeholder implementation
    return false
  }

  // Load employees on mount
  useEffect(() => {
    loadEmployees()
  }, [])

  const value: EmployeeManagementContextType = {
    employees,
    leaveRequests,
    attendanceRecords,
    performanceReviews,
    payrollRecords,
    isLoading,
    error,
    loadEmployees,
    getEmployeeById,
    updateEmployee,
    updateEmployeeStatus,
    loadLeaveRequests,
    createLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    cancelLeaveRequest,
    loadAttendanceRecords,
    recordAttendance,
    updateAttendance,
    loadPerformanceReviews,
    createPerformanceReview,
    updatePerformanceReview,
    loadPayrollRecords,
    createPayrollRecord,
    updatePayrollRecord,
    processPayroll,
  }

  return (
    <EmployeeManagementContext.Provider value={value}>
      {children}
    </EmployeeManagementContext.Provider>
  )
}

export function useEmployeeManagement() {
  const context = useContext(EmployeeManagementContext)
  if (context === undefined) {
    throw new Error("useEmployeeManagement must be used within an EmployeeManagementProvider")
  }
  return context
}


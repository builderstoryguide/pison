import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required but not set. Please check your .env.local file.');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required but not set. Please check your .env.local file.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(_request: NextRequest) {
  try {

    // Fetch various metrics from the database
    const [
      studentsResult,
      teachersResult,
      classesResult,
      paymentsResult
    ] = await Promise.allSettled([
      // Student count
      supabase
        .from("students")
        .select("id", { count: "exact" })
        .eq("is_active", true),
      
      // Teacher count
      supabase
        .from("teachers")
        .select("id", { count: "exact" })
        .eq("is_active", true),
      
      // Class count
      supabase
        .from("classes")
        .select("id", { count: "exact" })
        .eq("is_active", true),
      
      // Recent payments (last 30 days)
      supabase
        .from("payments")
        .select("amount")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
    ])

    // Process results
    const studentsCount = studentsResult.status === "fulfilled" ? studentsResult.value.count || 0 : 0
    const teachersCount = teachersResult.status === "fulfilled" ? teachersResult.value.count || 0 : 0
    const classesCount = classesResult.status === "fulfilled" ? classesResult.value.count || 0 : 0
    
    const recentPayments = paymentsResult.status === "fulfilled" ? paymentsResult.value.data || [] : []
    const totalRevenue = recentPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    

    // Create analytics metrics
    const metrics = [
      {
        id: "total-students",
        title: "Total Students",
        value: studentsCount,
        change: 5, // Mock change percentage
        changeType: "increase" as const,
        category: "enrollment" as const,
        icon: "Users",
        description: "Active students enrolled"
      },
      {
        id: "total-teachers",
        title: "Total Teachers",
        value: teachersCount,
        change: 2,
        changeType: "increase" as const,
        category: "staffing" as const,
        icon: "GraduationCap",
        description: "Active teaching staff"
      },
      {
        id: "total-classes",
        title: "Total Classes",
        value: classesCount,
        change: 0,
        changeType: "neutral" as const,
        category: "academic" as const,
        icon: "Award",
        description: "Active classes"
      },
      {
        id: "monthly-revenue",
        title: "Monthly Revenue",
        value: `₦${totalRevenue.toLocaleString()}`,
        change: 12,
        changeType: "increase" as const,
        category: "financial" as const,
        icon: "DollarSign",
        description: "Revenue this month"
      },
    ]

    return NextResponse.json({
      success: true,
      metrics
    })

  } catch (error) {
    console.error("Analytics metrics error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch analytics metrics"
    }, { status: 500 })
  }
}

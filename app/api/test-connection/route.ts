import { NextRequest, NextResponse } from 'next/server'
import { testConnection, getDatabaseStatus } from '@/lib/database-utils'

export async function GET(_request: NextRequest) {
  try {
    const dbStatus = getDatabaseStatus()
    const isConnected = await testConnection()
    
    return NextResponse.json({
      success: isConnected,
      database: dbStatus,
      connectionTest: isConnected ? 'passed' : 'failed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

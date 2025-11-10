import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, hashedPassword } = body

    if (!password || !hashedPassword) {
      return NextResponse.json(
        { success: false, error: 'Both password and hashed password are required' },
        { status: 400 }
      )
    }

    console.log('🔐 Starting password comparison')
    
    // Compare the password with the hash
    const isMatch = await bcrypt.compare(password, hashedPassword)

    console.log('🔐 Password comparison result:', isMatch)

    if (isMatch) {
      return NextResponse.json({
        success: true,
        message: 'Password comparison successful'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Password does not match hash'
      })
    }

  } catch (error) {
    console.error('Password comparison test error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to compare password' },
      { status: 500 }
    )
  }
}

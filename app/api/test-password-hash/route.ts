import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    console.log('🔐 Starting password hashing')

    // Hash the password with the same settings used in the app
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log('🔐 Password hashing completed successfully')

    return NextResponse.json({
      success: true,
      hashedPassword,
      message: 'Password hashed successfully'
    })

  } catch (error) {
    console.error('Password hashing test error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to hash password' },
      { status: 500 }
    )
  }
}

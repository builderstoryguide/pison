import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    return NextResponse.json({
      success: true,
      hashedPassword
    })

  } catch (error) {
    console.error('❌ Password hashing error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to hash password' },
      { status: 500 }
    )
  }
}

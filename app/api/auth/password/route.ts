import { NextRequest, NextResponse } from 'next/server'
import { generateDefaultPassword, generateTemporaryPassword, validatePassword } from '@/lib/password-utils'

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case 'generate-default': {
        const { role, year } = data
        const defaultPassword = generateDefaultPassword(role, year)
        return NextResponse.json({ 
          success: true, 
          password: defaultPassword,
          expiresIn: '30 days'
        })
      }

      case 'generate-temporary': {
        const { year: tempYear } = data
        const tempPassword = generateTemporaryPassword(tempYear)
        return NextResponse.json({ 
          success: true, 
          password: tempPassword,
          expiresIn: '7 days'
        })
      }

      case 'validate': {
        const { password } = data
        const validation = validatePassword(password)
        return NextResponse.json({ 
          success: true, 
          isValid: validation.isValid,
          error: validation.error
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (_error) {
    // console.error('Password API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

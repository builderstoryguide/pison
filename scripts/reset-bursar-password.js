#!/usr/bin/env node
/**
 * Reset a user's password by email (bursar) using Supabase service role.
 * Usage: node scripts/reset-bursar-password.js [email] [newPassword]
 */

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

async function main() {
  try {
    const emailArg = process.argv[2] || 'bursar@pisonacademy.cm'
    const newPasswordArg = process.argv[3] || 'Bursar@2025X7Q3'

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
      process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', emailArg)
      .single()

    if (fetchError || !user) {
      console.error('User not found for email:', emailArg)
      process.exit(2)
    }

    const hashedPassword = await bcrypt.hash(newPasswordArg, 12)

    const passwordExpiryDate = new Date()
    passwordExpiryDate.setDate(passwordExpiryDate.getDate() + 7)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        has_default_password: true,
        password_last_changed: new Date().toISOString(),
        password_expiry_date: passwordExpiryDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update password:', updateError)
      process.exit(3)
    }

    console.log('SUCCESS')
    console.log('EMAIL=' + user.email)
    console.log('NEW_PASSWORD=' + newPasswordArg)
    console.log('NOTE=Please change this password after first login.')
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(10)
  }
}

main()



/**
 * Create admin and super-admin login accounts for Acadia test environment.
 * Idempotent: creates new users or updates password/profile if email already exists.
 *
 * Usage: node scripts/create-acadia-admin-users.js
 */

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
require('dotenv').config({ path: '.env.local' })

const ADMIN_ACCOUNTS = [
  {
    email: 'admin@acadia.test',
    password: 'upBq9FwaavEKR_Qu2UNtvLbf',
    name: 'Acadia Administrator',
    role: 'admin',
    roleSpecificIdPrefix: 'ADM',
    occupation: 'School Administrator',
    permissions: ['all', 'manage_users', 'manage_classes', 'manage_students', 'manage_teachers', 'report_generation'],
  },
  {
    email: 'superadmin@acadia.test',
    password: process.env.ACADIA_SUPERADMIN_PASSWORD || crypto.randomBytes(16).toString('base64url'),
    name: 'Acadia Super Administrator',
    role: 'admin',
    roleSpecificIdPrefix: 'SADM',
    occupation: 'Super Administrator',
    permissions: [
      'all',
      'manage_users',
      'manage_system',
      'user_management',
      'teacher_management',
      'student_management',
      'class_management',
      'subject_management',
      'assignment_management',
      'grade_management',
      'attendance_management',
      'report_generation',
      'system_configuration',
      'backup_restore',
      'audit_logs',
      'security_management',
    ],
  },
]

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

async function nextRoleSpecificId(supabase, prefix) {
  const year = new Date().getFullYear()
  const pattern = `${prefix}${year}%`

  const { data, error } = await supabase
    .from('user_profiles')
    .select('role_specific_id')
    .like('role_specific_id', pattern)
    .order('role_specific_id', { ascending: false })
    .limit(1)

  if (error) throw error

  let nextNumber = 1
  if (data?.length) {
    const lastId = data[0].role_specific_id
    const suffix = lastId.slice(prefix.length + 4)
    const parsed = Number.parseInt(suffix, 10)
    if (!Number.isNaN(parsed)) nextNumber = parsed + 1
  }

  return `${prefix}${year}${String(nextNumber).padStart(3, '0')}`
}

async function upsertAdminAccount(supabase, account) {
  const { email, password, name, role, roleSpecificIdPrefix, occupation, permissions } = account
  const passwordHash = await bcrypt.hash(password, 12)

  const { data: existing, error: lookupError } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .maybeSingle()

  if (lookupError) throw lookupError

  let userId

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        name,
        role,
        status: 'active',
        permissions,
        has_default_password: false,
        password_last_changed: new Date().toISOString(),
        password_expiry_date: null,
      })
      .eq('id', existing.id)
      .select('id, email, role, status')
      .single()

    if (updateError) throw updateError
    userId = updated.id
    console.log(`Updated existing user: ${email}`)
  } else {
    const { data: created, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        role,
        status: 'active',
        phone: '+237 600000001',
        gender: 'other',
        permissions,
        has_default_password: false,
        password_last_changed: new Date().toISOString(),
        password_expiry_date: null,
      })
      .select('id, email, role, status')
      .single()

    if (createError) throw createError
    userId = created.id
    console.log(`Created user: ${email}`)
  }

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from('user_profiles')
    .select('id, role_specific_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileLookupError) throw profileLookupError

  if (existingProfile) {
    const { error: profileUpdateError } = await supabase
      .from('user_profiles')
      .update({ occupation })
      .eq('user_id', userId)

    if (profileUpdateError) throw profileUpdateError
  } else {
    const roleSpecificId = await nextRoleSpecificId(supabase, roleSpecificIdPrefix)
    const { error: profileCreateError } = await supabase.from('user_profiles').insert({
      user_id: userId,
      role_specific_id: roleSpecificId,
      occupation,
    })

    if (profileCreateError) throw profileCreateError
  }

  return { email, password, role, userId }
}

async function main() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  console.log('Creating Acadia admin accounts...\n')

  const results = []
  for (const account of ADMIN_ACCOUNTS) {
    results.push(await upsertAdminAccount(supabase, account))
  }

  console.log('\n=== Login credentials ===')
  console.log('Use role: Administrator on the login page for both accounts.\n')
  for (const { email, password, role } of results) {
    console.log(`${email}`)
    console.log(`  Password: ${password}`)
    console.log(`  Role (login form): admin`)
    console.log(`  DB role: ${role}`)
    console.log('')
  }
}

main().catch((error) => {
  console.error('Failed to create admin accounts:', error.message || error)
  process.exit(1)
})

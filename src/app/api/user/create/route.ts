// src/app/api/user/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isValidEmail } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, customerName } = body

    console.log('📧 Creating/getting user for email:', email)

    if (!email) {
      return NextResponse.json(
        { error: 'Missing required field: email' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Call database function to create or get user
    const { data: userId, error } = await supabaseAdmin.rpc('create_or_get_user_by_email', {
      p_email: email,
      p_customer_name: customerName || ''
    })

    if (error) {
      console.error('❌ Failed to create/get user:', error)
      return NextResponse.json(
        { error: 'Failed to create user', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ User created/retrieved:', userId)

    return NextResponse.json({
      success: true,
      userId
    })

  } catch (error) {
    console.error('Error in user creation endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

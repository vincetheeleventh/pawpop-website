// src/app/api/artwork/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createArtwork } from '@/lib/supabase-artworks'
import { isValidEmail } from '@/lib/utils'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_name, customer_email, pet_name, email_captured_at, upload_deferred, user_type, price_variant } = body

    // Validate required fields (customer_name is optional for email-first flow)
    if (!customer_email) {
      return NextResponse.json(
        { error: 'Missing required field: customer_email' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(customer_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create or get user by email
    let userId: string | null = null
    try {
      console.log('👤 Creating/getting user for:', customer_email)
      const { data: userIdData, error: userError } = await supabaseAdmin!.rpc('create_or_get_user_by_email', {
        p_email: customer_email,
        p_customer_name: customer_name || ''
      })
      
      if (!userError && userIdData) {
        userId = userIdData
        console.log('✅ User ID:', userId)
      } else {
        console.error('⚠️ User creation failed, continuing without user_id:', userError)
      }
    } catch (userErr) {
      console.error('⚠️ User creation error (non-fatal):', userErr)
      // Continue anyway - user creation is optional
    }

    // Create artwork record
    const { artwork, access_token } = await createArtwork({
      customer_name: customer_name || '',
      customer_email,
      pet_name: pet_name || '',
      email_captured_at,
      upload_deferred,
      user_type,
      user_id: userId, // Link to user if created
      price_variant: price_variant || 'A' // Default to variant A
    })

    return NextResponse.json({
      success: true,
      artwork,
      access_token
    })

  } catch (error) {
    console.error('Error creating artwork:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create artwork' },
      { status: 500 }
    )
  }
}

// src/app/api/artwork/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createArtwork } from '@/lib/supabase-artworks'
import { isValidEmail } from '@/lib/utils'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_name, customer_email, pet_name, email_captured_at, upload_deferred, user_type, price_variant, user_id: providedUserId } = body

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

    // TEMPORARY: Skip user creation until migration 024 is applied
    // Use provided user_id if available, but DON'T create new users yet
    let userId: string | null = providedUserId !== undefined && providedUserId !== null ? providedUserId : null
    
    console.log('⚠️  MIGRATION 024 NOT APPLIED - Skipping user creation');
    console.log('🔍 user_id check:', { providedUserId, userId, hasUserId: !!userId });
    
    // DON'T create users until migration is applied
    // This prevents foreign key constraint errors

    // Create artwork record (without user_id for now)
    const { artwork, access_token } = await createArtwork({
      customer_name: customer_name || '',
      customer_email,
      pet_name: pet_name || '',
      email_captured_at,
      upload_deferred,
      user_type,
      user_id: null, // TEMPORARY: Set to null until migration applied
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

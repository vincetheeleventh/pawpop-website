// src/app/api/upload/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createArtwork } from '@/lib/supabase-artworks'
import { isValidEmail } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_name, customer_email, pet_name, uploaded_file_url } = body

    // Validate required fields
    if (!customer_name || !customer_email || !uploaded_file_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email
    if (!isValidEmail(customer_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create artwork record after successful upload
    const { artwork, access_token } = await createArtwork({
      customer_name,
      customer_email,
      original_image_url: uploaded_file_url,
      pet_name
    })

    // Return artwork details and access token
    return NextResponse.json({
      success: true,
      artwork_id: artwork.id,
      access_token,
      artwork_url: `/artwork/${access_token}`,
      message: 'Upload completed successfully'
    })

  } catch (error) {
    console.error('Error completing upload:', error)
    return NextResponse.json(
      { error: 'Failed to complete upload' },
      { status: 500 }
    )
  }
}

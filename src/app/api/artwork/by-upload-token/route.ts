// src/app/api/artwork/by-upload-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Missing upload token' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Fetch artwork by upload token
    const { data: artwork, error } = await supabaseAdmin
      .from('artworks')
      .select('*')
      .eq('upload_token', token)
      .single()

    if (error || !artwork) {
      console.error('Artwork not found for token:', token, error)
      return NextResponse.json(
        { error: 'Invalid or expired upload link' },
        { status: 404 }
      )
    }

    // Check if upload is still pending (should be deferred = true)
    if (artwork.upload_deferred !== true) {
      console.error('Upload not deferred for token:', token, 'upload_deferred:', artwork.upload_deferred)
      return NextResponse.json(
        { error: 'This upload link is no longer valid' },
        { status: 400 }
      )
    }
    
    // Check if already completed
    if (artwork.generation_step && artwork.generation_step !== 'pending') {
      console.log('Upload already completed for token:', token, 'generation_step:', artwork.generation_step)
      return NextResponse.json(
        { error: 'This upload link has already been used. Check your email for your artwork!' },
        { status: 400 }
      )
    }

    console.log('✅ Artwork found for upload token:', artwork.id)

    return NextResponse.json({
      success: true,
      artwork: {
        id: artwork.id,
        customer_name: artwork.customer_name,
        customer_email: artwork.customer_email,
        generation_step: artwork.generation_step,
        email_captured_at: artwork.email_captured_at,
        upload_deferred: artwork.upload_deferred
      }
    })

  } catch (error) {
    console.error('Error in by-upload-token endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

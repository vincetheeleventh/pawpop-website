// src/app/api/artwork/request-edit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createAdminReview } from '@/lib/admin-review'

const MAX_EDIT_REQUESTS = 2

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artwork_id, edit_request_text } = body

    // Validate input
    if (!artwork_id || !edit_request_text) {
      return NextResponse.json(
        { error: 'Missing required fields: artwork_id, edit_request_text' },
        { status: 400 }
      )
    }

    if (!edit_request_text.trim()) {
      return NextResponse.json(
        { error: 'Edit request cannot be empty' },
        { status: 400 }
      )
    }

    if (edit_request_text.length > 250) {
      return NextResponse.json(
        { error: 'Edit request must be less than 250 characters' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    // Get artwork details
    const { data: artwork, error: artworkError } = await supabaseAdmin
      .from('artworks')
      .select('*')
      .eq('id', artwork_id)
      .single()

    if (artworkError || !artwork) {
      console.error('Error fetching artwork:', artworkError)
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      )
    }

    // Check if artwork is completed
    if (artwork.generation_step !== 'completed') {
      return NextResponse.json(
        { error: 'Can only request edits for completed artworks' },
        { status: 400 }
      )
    }

    // Check current edit request count
    const currentCount = artwork.edit_request_count || 0
    if (currentCount >= MAX_EDIT_REQUESTS) {
      return NextResponse.json(
        { 
          error: `You've reached the maximum of ${MAX_EDIT_REQUESTS} edit requests for this artwork`,
          edit_request_count: currentCount,
          max_requests: MAX_EDIT_REQUESTS
        },
        { status: 400 }
      )
    }

    // Get the artwork image URL
    const imageUrl = artwork.generated_images?.artwork_preview ||
                    artwork.generated_images?.artwork_full_res ||
                    artwork.generated_image_url ||
                    ''

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No artwork image found' },
        { status: 400 }
      )
    }

    // Create admin review for edit request
    const review = await createAdminReview({
      artwork_id,
      review_type: 'edit_request',
      image_url: imageUrl,
      fal_generation_url: artwork.generated_images?.generation_steps?.pet_integration,
      customer_name: artwork.customer_name,
      customer_email: artwork.customer_email,
      pet_name: artwork.pet_name,
      edit_request_text: edit_request_text.trim()
    })

    if (!review) {
      throw new Error('Failed to create edit request review')
    }

    // Increment edit request count
    const { error: updateError } = await supabaseAdmin
      .from('artworks')
      .update({
        edit_request_count: currentCount + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', artwork_id)

    if (updateError) {
      console.error('Error updating edit request count:', updateError)
      // Don't fail the request if count update fails
    }

    console.log(`✅ Edit request created for artwork ${artwork_id} (${currentCount + 1}/${MAX_EDIT_REQUESTS})`)

    return NextResponse.json({
      success: true,
      message: 'Edit request submitted successfully',
      review_id: review.id,
      edit_request_count: currentCount + 1,
      max_requests: MAX_EDIT_REQUESTS,
      remaining_requests: MAX_EDIT_REQUESTS - (currentCount + 1)
    })

  } catch (error) {
    console.error('Error creating edit request:', error)
    return NextResponse.json(
      { 
        error: 'Failed to submit edit request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get edit request status for an artwork
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const artwork_id = searchParams.get('artwork_id')

    if (!artwork_id) {
      return NextResponse.json(
        { error: 'Missing artwork_id parameter' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    // Get artwork with edit request count
    const { data: artwork, error } = await supabaseAdmin
      .from('artworks')
      .select('edit_request_count, generation_step')
      .eq('id', artwork_id)
      .single()

    if (error || !artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      )
    }

    const editRequestCount = artwork.edit_request_count || 0

    return NextResponse.json({
      success: true,
      edit_request_count: editRequestCount,
      max_requests: MAX_EDIT_REQUESTS,
      remaining_requests: Math.max(0, MAX_EDIT_REQUESTS - editRequestCount),
      can_request_edit: editRequestCount < MAX_EDIT_REQUESTS && artwork.generation_step === 'completed'
    })

  } catch (error) {
    console.error('Error fetching edit request status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch edit request status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

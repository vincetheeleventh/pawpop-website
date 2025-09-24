import { NextRequest, NextResponse } from 'next/server'
import { processAdminReview } from '@/lib/admin-review'
import { sendMasterpieceReadyEmail } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase'

interface RouteParams {
  params: {
    reviewId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { reviewId } = params
    const body = await request.json()
    const { status, notes, reviewedBy } = body

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      )
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status (approved/rejected) is required' },
        { status: 400 }
      )
    }

    if (!reviewedBy) {
      return NextResponse.json(
        { success: false, error: 'Reviewer information is required' },
        { status: 400 }
      )
    }

    const success = await processAdminReview(reviewId, status, reviewedBy, notes)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Review not found or already processed' },
        { status: 404 }
      )
    }

    // If approved and it's an artwork_proof review, send completion email to customer
    if (status === 'approved' && supabaseAdmin) {
      try {
        // Get review details to determine if we should send completion email
        const { data: review } = await supabaseAdmin
          .from('admin_reviews')
          .select(`
            review_type,
            customer_name,
            customer_email,
            image_url,
            artwork_id,
            artworks!inner(access_token, generation_step)
          `)
          .eq('id', reviewId)
          .single()

        if (review && review.review_type === 'artwork_proof' && review.artworks) {
          console.log('🎉 Artwork approved! Sending completion email to customer...')
          console.log('📋 Review artworks data:', JSON.stringify(review.artworks, null, 2))
          
          // Handle both array and object cases
          const artwork = Array.isArray(review.artworks) ? review.artworks[0] : review.artworks
          
          if (artwork && artwork.access_token) {
            // Send completion email
            const emailResult = await sendMasterpieceReadyEmail({
              customerName: review.customer_name,
              customerEmail: review.customer_email,
              artworkUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/artwork/${artwork.access_token}`,
              generatedImageUrl: review.image_url
            })

            if (emailResult.success) {
              console.log('✅ Completion email sent successfully!')
            } else {
              console.warn('⚠️ Failed to send completion email:', emailResult.error)
            }
          } else {
            console.warn('⚠️ No artwork access token found, cannot send completion email')
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending completion email:', emailError)
        // Don't fail the approval process if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Review ${status} successfully`,
      emailSent: status === 'approved' ? 'attempted' : 'not_applicable'
    })

  } catch (error) {
    console.error('Error processing admin review:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process review' 
      },
      { status: 500 }
    )
  }
}

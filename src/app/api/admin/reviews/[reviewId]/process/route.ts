import { NextRequest, NextResponse } from 'next/server'
import { processAdminReview } from '@/lib/admin-review'
import { sendMasterpieceReadyEmail } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase'
import { ProductType } from '@/lib/printify-products'

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

    // Handle approval actions based on review type
    if (status === 'approved' && supabaseAdmin) {
      try {
        // Get review details to determine what actions to take
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

        if (review && review.artworks) {
          console.log(`🎉 ${review.review_type} approved! Processing actions...`)
          console.log('📋 Review artworks data:', JSON.stringify(review.artworks, null, 2))
          
          // Handle both array and object cases
          const artwork = Array.isArray(review.artworks) ? review.artworks[0] : review.artworks
          
          if (review.review_type === 'artwork_proof' && artwork?.access_token) {
            // For artwork proof approval: Send completion email
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
            
            // CRITICAL: Check if there's a pending order that needs to be created
            // This handles cases where payment was made but order wasn't created due to webhook issues
            try {
              console.log('🔍 Checking for missing order records...');
              
              // Look for any Stripe session associated with this artwork
              const { data: existingOrders } = await supabaseAdmin
                .from('orders')
                .select('id, stripe_session_id')
                .eq('artwork_id', review.artwork_id)
                .limit(1);
              
              if (!existingOrders || existingOrders.length === 0) {
                console.log('⚠️ No order found for approved artwork - checking for pending purchase...');
                
                // This is likely a case where payment was made but order wasn't created
                // We should create the order now that the artwork is approved
                const { createOrder } = await import('@/lib/supabase-orders');
                
                // Create order with reasonable defaults (will be updated when we get more info)
                const newOrder = await createOrder({
                  artwork_id: review.artwork_id,
                  stripe_session_id: `manual_${review.artwork_id}`, // Temporary - will be updated if we find the real session
                  product_type: ProductType.CANVAS_FRAMED, // Default to most popular product
                  product_size: '16x24', // Default size
                  price_cents: 24900, // $249 CAD
                  customer_email: review.customer_email,
                  customer_name: review.customer_name
                });
                
                console.log(`✅ Created missing order record: ${newOrder.id}`);
                console.log('   This order can be updated with correct Stripe session if found');
              } else {
                console.log('✅ Order already exists for this artwork');
              }
            } catch (orderError) {
              console.error('❌ Failed to create missing order:', orderError);
              // Don't fail the approval process
            }
          } else if (review.review_type === 'highres_file') {
            // For high-res file approval: Trigger Printify order creation
            console.log('🎯 High-res file approved! Triggering Printify order creation...')
            
            try {
              // Find the associated order by artwork_id
              const { data: orders } = await supabaseAdmin
                .from('orders')
                .select('stripe_session_id')
                .eq('artwork_id', review.artwork_id)
                .eq('order_status', 'pending_review')
                .order('created_at', { ascending: false })
                .limit(1)

              if (orders && orders.length > 0) {
                const stripeSessionId = orders[0].stripe_session_id
                console.log(`📦 Found pending order for session: ${stripeSessionId}`)
                
                // Import and call the Printify order creation function
                const { createPrintifyOrderAfterApproval } = await import('@/lib/order-processing')
                await createPrintifyOrderAfterApproval(stripeSessionId, review.image_url)
                
                console.log('✅ Printify order creation triggered successfully!')
              } else {
                console.warn('⚠️ No pending order found for high-res file approval')
              }
            } catch (printifyError) {
              console.error('❌ Failed to create Printify order after approval:', printifyError)
              // Don't fail the approval process if Printify order creation fails
            }
          }
        }
      } catch (error) {
        console.error('❌ Error processing approval actions:', error)
        // Don't fail the approval process if post-approval actions fail
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

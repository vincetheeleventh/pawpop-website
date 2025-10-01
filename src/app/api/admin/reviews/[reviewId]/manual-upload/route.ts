import { NextRequest, NextResponse } from 'next/server'
import { processAdminReview } from '@/lib/admin-review'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMasterpieceReadyEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { reviewId } = params

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const notes = formData.get('notes') as string
    const reviewedBy = formData.get('reviewedBy') as string

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'Image file is required' },
        { status: 400 }
      )
    }

    if (!reviewedBy) {
      return NextResponse.json(
        { success: false, error: 'Reviewer information is required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Get review details first
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('admin_reviews')
      .select(`
        *,
        artworks!inner(
          id,
          access_token,
          customer_name,
          customer_email,
          pet_name,
          generated_images,
          delivery_images
        )
      `)
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    const artwork = review.artworks

    // Store the uploaded image in Supabase storage
    console.log('📤 Storing manually uploaded image...')
    const imageBuffer = await imageFile.arrayBuffer()
    
    // Create a unique filename for the manual upload
    const timestamp = Date.now()
    const filename = `${artwork.id}/manual_upload_${timestamp}.jpg`
    
    // Upload directly to Supabase Storage
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('artwork-images')
      .upload(filename, imageBuffer, {
        contentType: imageFile.type || 'image/jpeg',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('artwork-images')
      .getPublicUrl(filename)
    
    const uploadedImageUrl = publicUrl

    console.log('✅ Manual image stored:', uploadedImageUrl)

    // Update the artwork with the new image
    const updatedGeneratedImages = {
      ...artwork.generated_images,
      artwork_preview: uploadedImageUrl,
      artwork_full_res: uploadedImageUrl
    }

    const updatedDeliveryImages = {
      ...artwork.delivery_images,
      digital_download: uploadedImageUrl
    }

    // Update artwork with new images and processing status
    const updatedProcessingStatus = {
      ...artwork.processing_status,
      artwork_generation: 'completed',
      mockup_generation: 'pending'
    }

    const { error: artworkUpdateError } = await supabaseAdmin
      .from('artworks')
      .update({
        generated_images: updatedGeneratedImages,
        delivery_images: updatedDeliveryImages,
        processing_status: updatedProcessingStatus,
        generation_step: 'completed'
      })
      .eq('id', artwork.id)

    if (artworkUpdateError) {
      console.error('Failed to update artwork:', artworkUpdateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update artwork with new image' },
        { status: 500 }
      )
    }

    // Add manual upload to regeneration history
    const currentHistory = review.regeneration_history || []
    
    // Save current image to history before replacing
    if (review.image_url) {
      const historyEntry = {
        timestamp: new Date().toISOString(),
        image_url: review.image_url,
        monalisa_base_url: artwork.generated_images?.monalisa_base,
        prompt_tweak: '',
        regenerated_monalisa: false,
        fal_generation_url: review.fal_generation_url,
        manually_uploaded: false
      }
      currentHistory.push(historyEntry)
    }
    
    // Add new manual upload entry
    const manualUploadEntry = {
      timestamp: new Date().toISOString(),
      image_url: uploadedImageUrl,
      monalisa_base_url: artwork.generated_images?.monalisa_base,
      prompt_tweak: 'Manual upload by admin',
      regenerated_monalisa: false,
      fal_generation_url: null,
      manually_uploaded: true
    }

    // Update the admin review to mark it as manually replaced
    const { error: reviewUpdateError } = await supabaseAdmin
      .from('admin_reviews')
      .update({
        image_url: uploadedImageUrl,
        manually_replaced: true,
        regeneration_history: [...currentHistory, manualUploadEntry]
      })
      .eq('id', reviewId)

    if (reviewUpdateError) {
      console.error('Failed to update review:', reviewUpdateError)
    }

    // Process the review as approved
    const success = await processAdminReview(reviewId, 'approved', reviewedBy, notes)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to approve review' },
        { status: 500 }
      )
    }

    // Send completion email to customer
    try {
      console.log('📧 Sending completion email to customer...')
      const artworkUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/artwork/${artwork.access_token}`
      
      const emailResult = await sendMasterpieceReadyEmail({
        customerName: artwork.customer_name || '',
        customerEmail: artwork.customer_email,
        petName: artwork.pet_name,
        artworkUrl,
        imageUrl: uploadedImageUrl
      })

      if (emailResult.success) {
        console.log('✅ Completion email sent successfully!')
      } else {
        console.warn('⚠️ Failed to send completion email:', emailResult.error)
      }
    } catch (emailError) {
      console.error('❌ Error sending completion email:', emailError)
      // Don't fail the process if email fails
    }

    // Generate Printify mockups in the background (same as normal artwork completion)
    try {
      console.log('🖼️ Triggering mockup generation for manually uploaded artwork:', artwork.id)
      
      // Make async call to generate mockups - don't await to avoid blocking
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/printify/generate-mockups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          artworkId: artwork.id
        })
      }).then(response => {
        if (response.ok) {
          console.log('✅ Mockup generation triggered successfully for manual upload')
        } else {
          console.error('❌ Failed to trigger mockup generation:', response.statusText)
        }
      }).catch(error => {
        console.error('❌ Error triggering mockup generation:', error)
      })
    } catch (mockupError) {
      console.error('❌ Error setting up mockup generation:', mockupError)
      // Don't fail the process if mockup generation fails
    }

    return NextResponse.json({
      success: true,
      message: 'Image replaced and review approved successfully',
      imageUrl: uploadedImageUrl
    })

  } catch (error) {
    console.error('Error in manual upload:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process manual upload' 
      },
      { status: 500 }
    )
  }
}

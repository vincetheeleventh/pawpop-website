// src/app/api/artwork/update/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { updateArtwork, getArtworkById } from '@/lib/supabase-artworks'
import { isValidUUID } from '@/lib/utils'
import { sendMasterpieceReadyEmail } from '@/lib/email'
import { storeFalImageInSupabase } from '@/lib/supabase-storage'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { artwork_id, generated_image_url, source_images, generation_step, pet_name, generated_images } = body

    // Validate required fields
    if (!artwork_id) {
      return NextResponse.json(
        { error: 'Missing required field: artwork_id' },
        { status: 400 }
      )
    }

    if (!isValidUUID(artwork_id)) {
      return NextResponse.json(
        { error: 'Invalid artwork_id format' },
        { status: 400 }
      )
    }

    // Check if artwork exists
    const existingArtwork = await getArtworkById(artwork_id)
    if (!existingArtwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      )
    }

    // Prepare update data for clean schema
    const updateData: any = {}
    
    // Handle direct generated_images JSONB update
    if (generated_images) {
      console.log('📝 Direct generated_images update:', JSON.stringify(generated_images, null, 2))
      updateData.generated_images = {
        ...existingArtwork.generated_images,
        ...generated_images
      }
    }
    
    if (generated_image_url) {
      console.log(`🔄 Processing generated_image_url for step: ${generation_step}`)
      console.log(`📸 Image URL: ${generated_image_url}`)
      
      // For now, skip Supabase storage and use direct URLs to fix the core issue
      if (generation_step === 'monalisa_generation') {
        console.log('📝 Setting monalisa_base field')
        updateData.generated_images = {
          ...existingArtwork.generated_images,
          ...updateData.generated_images, // Preserve any direct updates
          monalisa_base: generated_image_url
        }
      } else if (generation_step === 'completed') {
        console.log('📝 Setting completed artwork fields')
        updateData.generated_images = {
          ...existingArtwork.generated_images,
          ...updateData.generated_images, // Preserve any direct updates
          artwork_preview: generated_image_url,
          artwork_full_res: generated_image_url
        }
        updateData.delivery_images = {
          ...existingArtwork.delivery_images,
          digital_download: generated_image_url
        }
      } else {
        console.log('📝 Setting default preview fields')
        updateData.generated_images = {
          ...existingArtwork.generated_images,
          ...updateData.generated_images, // Preserve any direct updates
          artwork_preview: generated_image_url
        }
        updateData.delivery_images = {
          ...existingArtwork.delivery_images,
          digital_download: generated_image_url
        }
      }
      
      console.log('📋 Generated images after update:', JSON.stringify(updateData.generated_images, null, 2))
    }
    
    if (source_images) {
      updateData.source_images = {
        ...existingArtwork.source_images,
        ...source_images
      }
    }
    
    if (generation_step) {
      updateData.generation_step = generation_step
      // Update processing status based on generation step
      if (generation_step === 'completed') {
        updateData.processing_status = {
          ...existingArtwork.processing_status,
          artwork_generation: 'completed'
        }
      } else if (generation_step === 'pet_integration') {
        updateData.processing_status = {
          ...existingArtwork.processing_status,
          artwork_generation: 'processing'
        }
      } else if (generation_step === 'failed') {
        updateData.processing_status = {
          ...existingArtwork.processing_status,
          artwork_generation: 'failed'
        }
      }
    }
    
    if (pet_name !== undefined) updateData.pet_name = pet_name

    // Update artwork
    const updatedArtwork = await updateArtwork(artwork_id, updateData)

    // Send "masterpiece ready" email and generate mockups if generation just completed
    // BUT ONLY if manual approval is disabled
    if (generation_step === 'completed' && existingArtwork.generation_step !== 'completed' && generated_image_url) {
      const artworkUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://pawpopart.com'}/artwork/${existingArtwork.access_token}`
      // Check if manual approval is enabled
      const { isHumanReviewEnabled } = await import('@/lib/admin-review');
      
      if (!isHumanReviewEnabled()) {
        // Only send completion email if manual approval is disabled
        try {
          const emailResult = await sendMasterpieceReadyEmail({
            customerName: updatedArtwork.customer_name || existingArtwork.customer_name || '',
            customerEmail: updatedArtwork.customer_email || existingArtwork.customer_email,
            petName: updatedArtwork.pet_name || existingArtwork.pet_name,
            artworkUrl,
            imageUrl: generated_image_url,
            priceVariant: existingArtwork.price_variant || updatedArtwork.price_variant || 'A' // Include price variant
          })
          console.log('Masterpiece ready email sent successfully (manual approval disabled)')
        } catch (emailError) {
          console.error('Failed to send masterpiece ready email:', emailError)
          // Don't fail the request if email fails
        }
      } else {
        console.log('⏸️ Skipping completion email - manual approval enabled, waiting for admin approval')
      }

      // Generate Printify mockups in the background
      try {
        console.log('🖼️ Triggering mockup generation for artwork:', artwork_id)
        
        // Make async call to generate mockups - don't await to avoid blocking
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/printify/generate-mockups`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: generated_image_url,
            artworkId: artwork_id
          })
        }).then(response => {
          if (response.ok) {
            console.log('✅ Mockup generation triggered successfully')
          } else {
            console.error('❌ Failed to trigger mockup generation:', response.statusText)
          }
        }).catch(error => {
          console.error('❌ Error triggering mockup generation:', error)
        })
      } catch (mockupError) {
        console.error('Failed to trigger mockup generation:', mockupError)
        // Don't fail the request if mockup generation fails
      }
    }

    return NextResponse.json({
      success: true,
      artwork: {
        id: updatedArtwork.id,
        generation_step: updatedArtwork.generation_step,
        generated_images: updatedArtwork.generated_images,
        pet_name: updatedArtwork.pet_name,
        updated_at: updatedArtwork.updated_at
      }
    })

  } catch (error) {
    console.error('Error updating artwork:', error)
    return NextResponse.json(
      { error: 'Failed to update artwork' },
      { status: 500 }
    )
  }
}

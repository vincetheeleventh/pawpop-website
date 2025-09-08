// src/app/api/artwork/update/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { updateArtwork, getArtworkById } from '@/lib/supabase-artworks'
import { isValidUUID } from '@/lib/utils'
import { sendMasterpieceReadyEmail } from '@/lib/email'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { artwork_id, generated_image_url, original_pet_mom_url, original_pet_url, generation_status, pet_name } = body

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

    // Prepare update data for new schema
    const updateData: any = {}
    
    // Handle legacy fields
    if (generated_image_url) {
      updateData.generated_image_url = generated_image_url
      // Also update new schema structure
      updateData.generated_images = {
        ...existingArtwork.generated_images,
        artwork_preview: generated_image_url,
        digital_download: generated_image_url
      }
      updateData.delivery_images = {
        ...existingArtwork.delivery_images,
        digital_download: generated_image_url
      }
    }
    
    if (original_pet_mom_url) {
      updateData.original_pet_mom_url = original_pet_mom_url
      updateData.source_images = {
        ...existingArtwork.source_images,
        pet_mom_photo: original_pet_mom_url
      }
    }
    
    if (original_pet_url) {
      updateData.original_pet_url = original_pet_url
      updateData.source_images = {
        ...existingArtwork.source_images,
        pet_photo: original_pet_url
      }
    }
    
    if (generation_status) {
      updateData.generation_status = generation_status
      // Update processing status
      updateData.processing_status = {
        ...existingArtwork.processing_status,
        artwork_generation: generation_status
      }
      // Update generation step
      if (generation_status === 'completed') {
        updateData.generation_step = 'completed'
      } else if (generation_status === 'processing') {
        updateData.generation_step = 'pet_integration'
      } else if (generation_status === 'failed') {
        updateData.generation_step = 'failed'
      }
    }
    
    if (pet_name !== undefined) updateData.pet_name = pet_name

    // Update artwork
    const updatedArtwork = await updateArtwork(artwork_id, updateData)

    // Send "masterpiece ready" email and generate mockups if generation just completed
    if (generation_status === 'completed' && existingArtwork.generation_status !== 'completed' && generated_image_url) {
      const artworkUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://pawpopart.com'}/artwork/${existingArtwork.access_token}`
      
      try {
        await sendMasterpieceReadyEmail({
          customerName: existingArtwork.customer_name,
          customerEmail: existingArtwork.customer_email,
          petName: updatedArtwork.pet_name || existingArtwork.pet_name,
          artworkUrl,
          generatedImageUrl: generated_image_url
        })
        console.log('Masterpiece ready email sent successfully')
      } catch (emailError) {
        console.error('Failed to send masterpiece ready email:', emailError)
        // Don't fail the request if email fails
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
        generation_status: updatedArtwork.generation_status,
        generated_image_url: updatedArtwork.generated_image_url,
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

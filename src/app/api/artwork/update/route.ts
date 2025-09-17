// src/app/api/artwork/update/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { updateArtwork, getArtworkById } from '@/lib/supabase-artworks'
import { isValidUUID } from '@/lib/utils'
import { sendMasterpieceReadyEmail } from '@/lib/email'
import { storeFalImageInSupabase } from '@/lib/supabase-storage'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { artwork_id, generated_image_url, source_images, generation_step, pet_name } = body

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
    
    if (generated_image_url) {
      // Store image in Supabase for 30-day retention and determine field based on step
      let supabaseImageUrl: string
      
      try {
        if (generation_step === 'monalisa_generation') {
          // Store intermediate Mona Lisa image
          supabaseImageUrl = await storeFalImageInSupabase(generated_image_url, artwork_id, 'monalisa_base')
          updateData.generated_images = {
            ...existingArtwork.generated_images,
            monalisa_base: supabaseImageUrl
          }
        } else if (generation_step === 'completed') {
          // Store final artwork
          supabaseImageUrl = await storeFalImageInSupabase(generated_image_url, artwork_id, 'artwork_final')
          updateData.generated_images = {
            ...existingArtwork.generated_images,
            artwork_preview: supabaseImageUrl,
            artwork_full_res: supabaseImageUrl
          }
          updateData.delivery_images = {
            ...existingArtwork.delivery_images,
            digital_download: supabaseImageUrl
          }
        } else {
          // Default behavior - store as preview
          supabaseImageUrl = await storeFalImageInSupabase(generated_image_url, artwork_id, 'artwork_preview')
          updateData.generated_images = {
            ...existingArtwork.generated_images,
            artwork_preview: supabaseImageUrl
          }
          updateData.delivery_images = {
            ...existingArtwork.delivery_images,
            digital_download: supabaseImageUrl
          }
        }
      } catch (storageError) {
        console.error('Failed to store image in Supabase, using fal.ai URL as fallback:', storageError)
        // Fallback to fal.ai URL if Supabase storage fails
        if (generation_step === 'monalisa_generation') {
          updateData.generated_images = {
            ...existingArtwork.generated_images,
            monalisa_base: generated_image_url
          }
        } else {
          updateData.generated_images = {
            ...existingArtwork.generated_images,
            artwork_preview: generated_image_url
          }
          updateData.delivery_images = {
            ...existingArtwork.delivery_images,
            digital_download: generated_image_url
          }
        }
      }
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
    if (generation_step === 'completed' && existingArtwork.generation_step !== 'completed' && generated_image_url) {
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

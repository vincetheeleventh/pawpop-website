// src/app/api/artwork/update/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { updateArtwork, getArtworkById } from '@/lib/supabase-artworks'
import { isValidUUID } from '@/lib/utils'

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

    // Prepare update data
    const updateData: any = {}
    if (generated_image_url) updateData.generated_image_url = generated_image_url
    if (original_pet_mom_url) updateData.original_pet_mom_url = original_pet_mom_url
    if (original_pet_url) updateData.original_pet_url = original_pet_url
    if (generation_status) updateData.generation_status = generation_status
    if (pet_name !== undefined) updateData.pet_name = pet_name

    // Update artwork
    const updatedArtwork = await updateArtwork(artwork_id, updateData)

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

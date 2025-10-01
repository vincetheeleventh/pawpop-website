// API endpoint for regenerating artwork with prompt tweaks
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { reviewId } = params
    const { prompt_tweak, regenerate_monalisa } = await request.json()

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    console.log(`🔄 Starting regeneration for review ${reviewId}`)
    console.log(`📝 Prompt tweak: "${prompt_tweak}"`)
    console.log(`🎨 Regenerate MonaLisa: ${regenerate_monalisa}`)

    // 1. Get review details with artwork info
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('admin_reviews')
      .select(`
        *,
        artworks (
          id,
          source_images,
          generated_images,
          customer_name,
          customer_email,
          pet_name
        )
      `)
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      console.error('❌ Review not found:', reviewError)
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    const artwork = Array.isArray(review.artworks) ? review.artworks[0] : review.artworks

    if (!artwork) {
      return NextResponse.json(
        { error: 'Artwork not found for this review' },
        { status: 404 }
      )
    }

    // 2. Get source images
    const petMomPhoto = artwork.source_images?.pet_mom_photo
    const petPhoto = artwork.source_images?.pet_photo

    if (!petMomPhoto || !petPhoto) {
      return NextResponse.json(
        { error: 'Source images not found. Cannot regenerate.' },
        { status: 400 }
      )
    }

    console.log('✅ Source images found:', { petMomPhoto, petPhoto })

    // 3. Save current image to history before regenerating
    const currentHistory = review.regeneration_history || []
    const historyEntry = {
      timestamp: new Date().toISOString(),
      image_url: review.image_url,
      monalisa_base_url: artwork.generated_images?.monalisa_base,
      prompt_tweak: '', // Empty for original
      regenerated_monalisa: false,
      fal_generation_url: review.fal_generation_url
    }

    // Only add to history if this is not the first regeneration
    // (i.e., if there's already history or a prompt tweak was used)
    const updatedHistory = currentHistory.length === 0 && !prompt_tweak 
      ? currentHistory 
      : [...currentHistory, historyEntry]

    console.log('📚 Updated history length:', updatedHistory.length)

    // 4. Start regeneration pipeline
    let monalisaUrl = artwork.generated_images?.monalisa_base
    let falMonalisaUrl: string | undefined

    if (regenerate_monalisa || !monalisaUrl) {
      console.log('🎨 Regenerating MonaLisa base...')
      
      // Call MonaLisa Maker API
      const monalisaResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/monalisa-maker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: petMomPhoto,
          artworkId: artwork.id
        })
      })

      if (!monalisaResponse.ok) {
        const errorData = await monalisaResponse.json()
        throw new Error(`MonaLisa generation failed: ${errorData.error}`)
      }

      const monalisaData = await monalisaResponse.json()
      monalisaUrl = monalisaData.images[0]?.url
      falMonalisaUrl = monalisaData.request_id
      console.log('✅ MonaLisa regenerated:', monalisaUrl)
    } else {
      console.log('♻️ Reusing existing MonaLisa base')
    }

    // 5. Call pet integration with prompt tweak
    console.log('🐾 Starting pet integration with prompt tweak...')
    
    const petIntegrationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pet-integration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monalisaImageUrl: monalisaUrl,
        petImageUrl: petPhoto,
        artworkId: artwork.id,
        promptTweak: prompt_tweak || '', // Append to pet integration prompt
        isRegeneration: true
      })
    })

    if (!petIntegrationResponse.ok) {
      const errorData = await petIntegrationResponse.json()
      throw new Error(`Pet integration failed: ${errorData.error}`)
    }

    const petIntegrationData = await petIntegrationResponse.json()
    const newImageUrl = petIntegrationData.supabaseImageUrl
    const newFalUrl = petIntegrationData.falRequestId

    console.log('✅ Pet integration complete:', newImageUrl)

    // 6. Update review with new image and add to history
    const newHistoryEntry = {
      timestamp: new Date().toISOString(),
      image_url: newImageUrl,
      monalisa_base_url: monalisaUrl,
      prompt_tweak: prompt_tweak || '',
      regenerated_monalisa: regenerate_monalisa,
      fal_generation_url: newFalUrl
    }

    const { error: updateError } = await supabaseAdmin
      .from('admin_reviews')
      .update({
        image_url: newImageUrl,
        fal_generation_url: newFalUrl,
        regeneration_history: [...updatedHistory, newHistoryEntry]
      })
      .eq('id', reviewId)

    if (updateError) {
      console.error('❌ Failed to update review:', updateError)
      throw updateError
    }

    // 7. Also update artwork's generated_images if we regenerated MonaLisa
    if (regenerate_monalisa && monalisaUrl) {
      const currentGeneratedImages = artwork.generated_images || {}
      await supabaseAdmin
        .from('artworks')
        .update({
          generated_images: {
            ...currentGeneratedImages,
            monalisa_base: monalisaUrl,
            artwork_preview: newImageUrl
          }
        })
        .eq('id', artwork.id)
    }

    console.log('✅ Review updated successfully with regenerated artwork')

    return NextResponse.json({
      success: true,
      image_url: newImageUrl,
      monalisa_base_url: monalisaUrl,
      fal_generation_url: newFalUrl,
      regeneration_history: [...updatedHistory, newHistoryEntry]
    })

  } catch (error) {
    console.error('❌ Regeneration error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to regenerate artwork',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

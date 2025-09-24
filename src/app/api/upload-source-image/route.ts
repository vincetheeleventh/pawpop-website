import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const artworkId = formData.get('artworkId') as string
    const imageType = formData.get('imageType') as string // 'pet_mom_photo' or 'pet_photo'

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'Image file is required' },
        { status: 400 }
      )
    }

    if (!artworkId) {
      return NextResponse.json(
        { success: false, error: 'Artwork ID is required' },
        { status: 400 }
      )
    }

    if (!imageType || !['pet_mom_photo', 'pet_photo'].includes(imageType)) {
      return NextResponse.json(
        { success: false, error: 'Valid image type is required (pet_mom_photo or pet_photo)' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500 }
      )
    }

    console.log(`📤 Uploading ${imageType} for artwork ${artworkId}`)

    // Convert file to buffer
    const imageBuffer = await imageFile.arrayBuffer()
    
    // Create unique filename
    const timestamp = Date.now()
    const fileExtension = imageFile.name.split('.').pop() || 'jpg'
    const filename = `${artworkId}/source_${imageType}_${timestamp}.${fileExtension}`
    
    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('artwork-images')
      .upload(filename, imageBuffer, {
        contentType: imageFile.type || 'image/jpeg',
        upsert: true
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('artwork-images')
      .getPublicUrl(filename)

    console.log(`✅ ${imageType} uploaded successfully:`, publicUrl)

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      filename,
      imageType
    })

  } catch (error) {
    console.error('Error uploading source image:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload source image' 
      },
      { status: 500 }
    )
  }
}

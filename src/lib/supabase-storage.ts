// src/lib/supabase-storage.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Upload image to Supabase Storage for 30-day retention
 * @param imageUrl - fal.ai image URL to download and store
 * @param fileName - unique filename for storage
 * @param bucket - storage bucket name (default: 'artwork-images')
 * @returns Supabase storage URL
 */
export async function uploadImageToSupabaseStorage(
  imageUrl: string, 
  fileName: string, 
  bucket: string = 'artwork-images'
): Promise<string> {
  try {
    // Download image from fal.ai
    console.log(`📥 Downloading image from fal.ai: ${imageUrl}`)
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    // Upload to Supabase Storage
    console.log(`☁️ Uploading to Supabase Storage: ${fileName}`)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, imageBuffer, {
        contentType,
        upsert: true
      })

    if (error) {
      throw new Error(`Supabase storage upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    console.log(`✅ Image stored in Supabase: ${publicUrlData.publicUrl}`)
    return publicUrlData.publicUrl

  } catch (error) {
    console.error('❌ Failed to upload to Supabase storage:', error)
    throw error
  }
}

/**
 * Generate unique filename for artwork images
 * @param artworkId - artwork ID
 * @param step - generation step (monalisa_base, artwork_preview, etc.)
 * @param extension - file extension
 * @returns unique filename
 */
export function generateArtworkFileName(
  artworkId: string, 
  step: string, 
  extension: string = 'jpg'
): string {
  const timestamp = Date.now()
  return `${artworkId}/${step}_${timestamp}.${extension}`
}

/**
 * Store fal.ai image in Supabase with 30-day retention
 * @param falImageUrl - fal.ai image URL
 * @param artworkId - artwork ID
 * @param step - generation step
 * @returns Supabase storage URL
 */
export async function storeFalImageInSupabase(
  falImageUrl: string,
  artworkId: string,
  step: string
): Promise<string> {
  const fileName = generateArtworkFileName(artworkId, step)
  return await uploadImageToSupabaseStorage(falImageUrl, fileName)
}

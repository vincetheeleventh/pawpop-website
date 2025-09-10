// src/lib/supabase-artworks.ts
import { supabaseAdmin, type Artwork } from './supabase'
import { generateSecureToken } from './utils'

function ensureSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available - missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return supabaseAdmin;
}

export interface CreateArtworkData {
  customer_name: string
  customer_email: string
  pet_name?: string
  user_id?: string
  original_image_url?: string
}

export interface UpdateArtworkData {
  generation_step?: 'pending' | 'monalisa_generation' | 'pet_integration' | 'upscaling' | 'mockup_generation' | 'completed' | 'failed'
  source_images?: {
    pet_photo?: string
    pet_mom_photo?: string
    uploadthing_keys?: Record<string, any>
  }
  generated_images?: {
    monalisa_base?: string
    artwork_preview?: string
    artwork_full_res?: string
    generation_steps?: any[]
  }
  delivery_images?: {
    digital_download?: string
    print_ready?: string
    mockups?: Record<string, any>
  }
  processing_status?: {
    artwork_generation?: 'pending' | 'processing' | 'completed' | 'failed'
    upscaling?: 'not_required' | 'pending' | 'processing' | 'completed' | 'failed'
    mockup_generation?: 'pending' | 'processing' | 'completed' | 'failed'
  }
  generation_metadata?: Record<string, any>
  pet_name?: string
}

/**
 * Create a new artwork record with access token
 */
export async function createArtwork(data: CreateArtworkData): Promise<{ artwork: Artwork; access_token: string }> {
  const access_token = generateSecureToken()
  const token_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  const { data: artwork, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .insert({
      ...data,
      access_token,
      token_expires_at: token_expires_at.toISOString(),
      generation_step: 'pending',
      source_images: {
        pet_photo: '',
        pet_mom_photo: '',
        uploadthing_keys: {}
      },
      generated_images: {
        monalisa_base: '',
        artwork_preview: '',
        artwork_full_res: '',
        generation_steps: []
      },
      delivery_images: {
        digital_download: '',
        print_ready: '',
        mockups: {}
      },
      processing_status: {
        artwork_generation: 'pending',
        upscaling: 'not_required',
        mockup_generation: 'pending'
      },
      generation_metadata: {}
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating artwork:', error)
    throw new Error(`Failed to create artwork: ${error.message}`)
  }

  return { artwork, access_token }
}

/**
 * Get artwork by access token (public access)
 */
export async function getArtworkByToken(token: string): Promise<Artwork | null> {
  const { data: artwork, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .select('*')
    .eq('access_token', token)
    .gt('token_expires_at', new Date().toISOString())
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No matching record
    }
    console.error('Error fetching artwork by token:', error)
    throw new Error(`Failed to fetch artwork: ${error.message}`)
  }

  return artwork
}

/**
 * Get artwork by ID (admin access)
 */
export async function getArtworkById(id: string): Promise<Artwork | null> {
  const { data: artwork, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching artwork by ID:', error)
    throw new Error(`Failed to fetch artwork: ${error.message}`)
  }

  return artwork
}

/**
 * Update artwork data
 */
export async function updateArtwork(id: string, updates: UpdateArtworkData): Promise<Artwork> {
  const { data: artwork, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating artwork:', error)
    throw new Error(`Failed to update artwork: ${error.message}`)
  }

  return artwork
}

/**
 * Get artworks by status for processing
 */
export async function getArtworksByGenerationStatus(status: 'pending' | 'processing' | 'completed' | 'failed'): Promise<Artwork[]> {
  const { data: artworks, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .select('*')
    .eq('generation_step', status)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching artworks by status:', error)
    throw new Error(`Failed to fetch artworks: ${error.message}`)
  }

  return artworks || []
}

/**
 * Get artworks by customer email
 */
export async function getArtworksByCustomer(email: string): Promise<Artwork[]> {
  const { data: artworks, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .select('*')
    .eq('customer_email', email)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching artworks by customer:', error)
    throw new Error(`Failed to fetch artworks: ${error.message}`)
  }

  return artworks || []
}

/**
 * Delete artwork (admin only)
 */
export async function deleteArtwork(id: string): Promise<void> {
  const { error } = await ensureSupabaseAdmin()
    .from('artworks')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting artwork:', error)
    throw new Error(`Failed to delete artwork: ${error.message}`)
  }
}

/**
 * Extend artwork token expiration
 */
export async function extendArtworkToken(id: string, days: number = 30): Promise<Artwork> {
  const new_expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  
  const { data: artwork, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .update({ token_expires_at: new_expiry.toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error extending artwork token:', error)
    throw new Error(`Failed to extend token: ${error.message}`)
  }

  return artwork
}

/**
 * Update artwork upscale status and URL
 */
export async function updateArtworkUpscaleStatus(
  id: string, 
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_required',
  upscaled_image_url?: string
): Promise<Artwork> {
  // First get current artwork to preserve existing data
  const { data: currentArtwork } = await ensureSupabaseAdmin()
    .from('artworks')
    .select('processing_status, generated_images, generation_metadata')
    .eq('id', id)
    .single()

  const updateData: any = {
    processing_status: {
      ...currentArtwork?.processing_status,
      upscaling: status
    },
    generation_metadata: {
      ...currentArtwork?.generation_metadata,
      ...(status === 'completed' ? { upscale_completed_at: new Date().toISOString() } : {})
    }
  }
  
  if (upscaled_image_url) {
    updateData.generated_images = {
      ...currentArtwork?.generated_images,
      artwork_full_res: upscaled_image_url
    }
  }

  const { data: artwork, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating artwork upscale status:', error)
    throw new Error(`Failed to update upscale status: ${error.message}`)
  }

  return artwork
}

/**
 * Get artworks that need upscaling (for batch processing)
 */
export async function getArtworksNeedingUpscale(): Promise<Artwork[]> {
  const { data: artworks, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .select('*')
    .eq('generation_step', 'completed')
    .contains('processing_status', { upscaling: 'pending' })
    .order('created_at', { ascending: true })
    .limit(10) // Process in batches

  if (error) {
    console.error('Error getting artworks needing upscale:', error)
    throw new Error(`Failed to get artworks needing upscale: ${error.message}`)
  }

  return artworks || []
}

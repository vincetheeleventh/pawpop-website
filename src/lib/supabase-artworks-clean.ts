// src/lib/supabase-artworks-clean.ts
// Clean artwork management with consolidated lifecycle approach
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
  pet_mom_image_url: string
  pet_image_url: string
}

export interface UpdateArtworkData {
  generation_status?: 'pending' | 'processing' | 'completed' | 'failed'
  upscale_status?: 'not_started' | 'pending' | 'processing' | 'completed' | 'failed'
  generated_image_url?: string
  upscaled_image_url?: string
  generation_started_at?: string
  generation_completed_at?: string
  upscale_started_at?: string
  upscale_completed_at?: string
  fal_request_id?: string
  generation_params?: object
  delivery_images?: object
  generated_images?: object
  source_images?: object
  generation_step?: 'pending' | 'monalisa_generation' | 'pet_integration' | 'upscaling' | 'mockup_generation' | 'completed' | 'failed'
  processing_status?: object
  generation_metadata?: object
}

/**
 * Create or get anonymous user by email
 */
async function ensureAnonymousUser(email: string): Promise<string> {
  const { data, error } = await ensureSupabaseAdmin()
    .rpc('create_anonymous_user', { user_email: email })

  if (error) {
    console.error('Error creating anonymous user:', error)
    throw new Error(`Failed to create user: ${error.message}`)
  }

  return data
}

/**
 * Create a single artwork record for complete lifecycle
 */
export async function createArtwork(data: CreateArtworkData): Promise<{ artwork: Artwork; access_token: string }> {
  // Ensure user exists
  const user_id = await ensureAnonymousUser(data.customer_email)
  
  const access_token = generateSecureToken()
  const token_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  const { data: artwork, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .insert({
      user_id,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      pet_name: data.pet_name,
      pet_mom_image_url: data.pet_mom_image_url,
      pet_image_url: data.pet_image_url,
      access_token,
      token_expires_at: token_expires_at.toISOString(),
      generation_status: 'pending',
      upscale_status: 'not_started'
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
 * Update artwork with lifecycle progression
 */
export async function updateArtworkLifecycle(id: string, updates: UpdateArtworkData): Promise<Artwork> {
  // Auto-set timestamps based on status changes
  const timestampUpdates: Partial<UpdateArtworkData> = {}
  
  if (updates.generation_status === 'processing' && !updates.generation_started_at) {
    timestampUpdates.generation_started_at = new Date().toISOString()
  }
  
  if (updates.generation_status === 'completed' && !updates.generation_completed_at) {
    timestampUpdates.generation_completed_at = new Date().toISOString()
  }
  
  if (updates.upscale_status === 'processing' && !updates.upscale_started_at) {
    timestampUpdates.upscale_started_at = new Date().toISOString()
  }
  
  if (updates.upscale_status === 'completed' && !updates.upscale_completed_at) {
    timestampUpdates.upscale_completed_at = new Date().toISOString()
  }

  const { data: artwork, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .update({ ...updates, ...timestampUpdates })
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
 * Get artwork by token with complete lifecycle info
 */
export async function getArtworkByToken(token: string): Promise<Artwork | null> {
  const { data, error } = await ensureSupabaseAdmin()
    .rpc('get_artwork_lifecycle', { artwork_token: token })

  if (error) {
    console.error('Error fetching artwork by token:', error)
    throw new Error(`Failed to fetch artwork: ${error.message}`)
  }

  return data?.[0] || null
}

/**
 * Get all artworks for a customer (by email)
 */
export async function getCustomerArtworks(email: string): Promise<Artwork[]> {
  const { data: artworks, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .select('*')
    .eq('customer_email', email)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching customer artworks:', error)
    throw new Error(`Failed to fetch artworks: ${error.message}`)
  }

  return artworks || []
}

/**
 * Get artworks by generation status for processing
 */
export async function getArtworksByGenerationStatus(status: 'pending' | 'processing' | 'completed' | 'failed'): Promise<Artwork[]> {
  const { data: artworks, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .select('*')
    .eq('generation_status', status)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching artworks by generation status:', error)
    throw new Error(`Failed to fetch artworks: ${error.message}`)
  }

  return artworks || []
}

/**
 * Get artworks ready for upscaling
 */
export async function getArtworksForUpscaling(): Promise<Artwork[]> {
  const { data: artworks, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .select('*')
    .eq('generation_status', 'completed')
    .eq('upscale_status', 'not_started')
    .not('generated_image_url', 'is', null)
    .order('generation_completed_at', { ascending: true })

  if (error) {
    console.error('Error fetching artworks for upscaling:', error)
    throw new Error(`Failed to fetch artworks: ${error.message}`)
  }

  return artworks || []
}

/**
 * Mark artwork for upscaling (when order requires high-res)
 */
export async function requestArtworkUpscaling(artwork_id: string): Promise<Artwork> {
  return updateArtworkLifecycle(artwork_id, {
    upscale_status: 'pending'
  })
}

/**
 * Clean up expired artworks (optional maintenance function)
 */
export async function cleanupExpiredArtworks(): Promise<number> {
  const { data, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .delete()
    .lt('token_expires_at', new Date().toISOString())
    .select('id')

  if (error) {
    console.error('Error cleaning up expired artworks:', error)
    throw new Error(`Failed to cleanup artworks: ${error.message}`)
  }

  return data?.length || 0
}

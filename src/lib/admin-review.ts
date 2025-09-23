// src/lib/admin-review.ts
import { supabaseAdmin } from './supabase'
import { sendAdminReviewNotification } from './email'

export interface AdminReview {
  id: string
  artwork_id: string
  review_type: 'artwork_proof' | 'highres_file'
  status: 'pending' | 'approved' | 'rejected'
  image_url: string
  fal_generation_url?: string
  customer_name: string
  customer_email: string
  pet_name?: string
  review_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  artwork_token?: string
}

export interface CreateReviewData {
  artwork_id: string
  review_type: 'artwork_proof' | 'highres_file'
  image_url: string
  fal_generation_url?: string
  customer_name: string
  customer_email: string
  pet_name?: string
}

// Check if human review is enabled
export function isHumanReviewEnabled(): boolean {
  return process.env.ENABLE_HUMAN_REVIEW === 'true'
}

// Create a new admin review
export async function createAdminReview(data: CreateReviewData): Promise<AdminReview | null> {
  if (!isHumanReviewEnabled()) {
    console.log('Human review disabled, skipping review creation')
    return null
  }

  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  try {
    const { data: review, error } = await supabaseAdmin
      .from('admin_reviews')
      .insert({
        artwork_id: data.artwork_id,
        review_type: data.review_type,
        image_url: data.image_url,
        fal_generation_url: data.fal_generation_url,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        pet_name: data.pet_name
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating admin review:', error)
      throw error
    }

    // Update artwork review status
    await updateArtworkReviewStatus(data.artwork_id, data.review_type, 'pending')

    // Send email notification to admin
    try {
      await sendAdminReviewNotification({
        reviewId: review.id,
        reviewType: data.review_type,
        customerName: data.customer_name,
        petName: data.pet_name,
        imageUrl: data.image_url,
        falGenerationUrl: data.fal_generation_url
      })
    } catch (emailError) {
      console.error('Failed to send admin review notification:', emailError)
      // Don't fail the review creation if email fails
    }

    console.log(`✅ Admin review created: ${review.id} (${data.review_type})`)
    return review

  } catch (error) {
    console.error('Error in createAdminReview:', error)
    throw error
  }
}

// Get all pending reviews
export async function getPendingReviews(reviewType?: 'artwork_proof' | 'highres_file'): Promise<AdminReview[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_pending_reviews', { p_review_type: reviewType || null })

    if (error) {
      console.error('Error getting pending reviews:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getPendingReviews:', error)
    throw error
  }
}

// Process a review (approve/reject)
export async function processAdminReview(
  reviewId: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
  notes?: string
): Promise<boolean> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  try {
    const { data, error } = await supabaseAdmin
      .rpc('process_admin_review', {
        p_review_id: reviewId,
        p_status: status,
        p_reviewed_by: reviewedBy,
        p_notes: notes || null
      })

    if (error) {
      console.error('Error processing admin review:', error)
      throw error
    }

    console.log(`✅ Admin review processed: ${reviewId} -> ${status}`)
    return data === true

  } catch (error) {
    console.error('Error in processAdminReview:', error)
    throw error
  }
}

// Update artwork review status
export async function updateArtworkReviewStatus(
  artworkId: string,
  reviewType: 'artwork_proof' | 'highres_file',
  status: 'pending' | 'approved' | 'rejected' | 'not_required'
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  try {
    const { error } = await supabaseAdmin
      .rpc('update_artwork_review_status', {
        p_artwork_id: artworkId,
        p_review_type: reviewType,
        p_status: status
      })

    if (error) {
      console.error('Error updating artwork review status:', error)
      throw error
    }

    console.log(`✅ Artwork review status updated: ${artworkId} ${reviewType} -> ${status}`)
  } catch (error) {
    console.error('Error in updateArtworkReviewStatus:', error)
    throw error
  }
}

// Check if artwork needs review
export async function checkArtworkReviewStatus(artworkId: string): Promise<{
  artwork_proof: string
  highres_file: string
}> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('artworks')
      .select('review_status')
      .eq('id', artworkId)
      .single()

    if (error) {
      console.error('Error checking artwork review status:', error)
      throw error
    }

    return data?.review_status || {
      artwork_proof: 'not_required',
      highres_file: 'not_required'
    }
  } catch (error) {
    console.error('Error in checkArtworkReviewStatus:', error)
    throw error
  }
}

// Get review by ID
export async function getAdminReview(reviewId: string): Promise<AdminReview | null> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('admin_reviews')
      .select(`
        *,
        artworks!inner(access_token)
      `)
      .eq('id', reviewId)
      .single()

    if (error) {
      console.error('Error getting admin review:', error)
      throw error
    }

    return {
      ...data,
      artwork_token: data.artworks?.access_token
    }
  } catch (error) {
    console.error('Error in getAdminReview:', error)
    throw error
  }
}

// Helper function to determine if review is required for a step
export function shouldCreateReview(reviewType: 'artwork_proof' | 'highres_file'): boolean {
  if (!isHumanReviewEnabled()) {
    return false
  }

  // For initial launch, review all orders
  return true
}

// Helper function to wait for review approval
export async function waitForReviewApproval(
  artworkId: string,
  reviewType: 'artwork_proof' | 'highres_file',
  maxWaitMinutes: number = 60
): Promise<boolean> {
  if (!isHumanReviewEnabled()) {
    return true // Skip if disabled
  }

  const startTime = Date.now()
  const maxWaitMs = maxWaitMinutes * 60 * 1000

  while (Date.now() - startTime < maxWaitMs) {
    const status = await checkArtworkReviewStatus(artworkId)
    const reviewStatus = status[reviewType]

    if (reviewStatus === 'approved') {
      return true
    }

    if (reviewStatus === 'rejected') {
      return false
    }

    // Wait 30 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 30000))
  }

  // Timeout - log warning but don't fail the process
  console.warn(`⚠️ Review timeout for artwork ${artworkId} ${reviewType} after ${maxWaitMinutes} minutes`)
  return true // Allow process to continue
}

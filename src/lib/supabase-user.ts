// User management functions based on email identification
import { supabaseAdmin, type Artwork, type Order } from './supabase'

function ensureSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available - missing SUPABASE_SERVICE_ROLE_KEY')
  }
  return supabaseAdmin
}

export interface UserProfile {
  email: string
  artworks: Artwork[]
  orders: Order[]
  stats: {
    total_artworks: number
    total_orders: number
    completed_artworks: number
    total_spent_cents: number
  }
}

/**
 * Get all data for a user by email (artworks + orders)
 */
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  try {
    // Get all artworks for this email
    const { data: artworks, error: artworksError } = await ensureSupabaseAdmin()
      .from('artworks')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })

    if (artworksError) {
      console.error('Error fetching user artworks:', artworksError)
      throw new Error(`Failed to fetch artworks: ${artworksError.message}`)
    }

    // Get all orders for this email
    const { data: orders, error: ordersError } = await ensureSupabaseAdmin()
      .from('orders')
      .select(`
        *,
        artworks!inner(
          id,
          pet_name,
          generated_images
        )
      `)
      .eq('customer_email', email)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching user orders:', ordersError)
      throw new Error(`Failed to fetch orders: ${ordersError.message}`)
    }

    // Calculate stats
    const completedArtworks = artworks?.filter(a => a.generation_step === 'completed').length || 0
    const totalSpent = orders?.reduce((sum, order) => sum + (order.price_cents || 0), 0) || 0

    return {
      email,
      artworks: artworks || [],
      orders: orders || [],
      stats: {
        total_artworks: artworks?.length || 0,
        total_orders: orders?.length || 0,
        completed_artworks: completedArtworks,
        total_spent_cents: totalSpent
      }
    }

  } catch (error) {
    console.error('Error getting user by email:', error)
    return null
  }
}

/**
 * Get artworks for a user by email
 */
export async function getUserArtworks(email: string): Promise<Artwork[]> {
  const { data: artworks, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .select('*')
    .eq('customer_email', email)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user artworks:', error)
    throw new Error(`Failed to fetch artworks: ${error.message}`)
  }

  return artworks || []
}

/**
 * Get orders for a user by email
 */
export async function getUserOrders(email: string): Promise<Order[]> {
  const { data: orders, error } = await ensureSupabaseAdmin()
    .from('orders')
    .select(`
      *,
      artworks!inner(
        id,
        pet_name,
        generated_images
      )
    `)
    .eq('customer_email', email)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user orders:', error)
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  return orders || []
}

/**
 * Check if email has any artworks (returning user detection)
 */
export async function isReturningUser(email: string): Promise<boolean> {
  const { data, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .select('id')
    .eq('customer_email', email)
    .limit(1)

  if (error) {
    console.error('Error checking returning user:', error)
    return false
  }

  return (data?.length || 0) > 0
}

/**
 * Get user's most recent artwork
 */
export async function getUserLatestArtwork(email: string): Promise<Artwork | null> {
  const { data: artwork, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .select('*')
    .eq('customer_email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching latest artwork:', error)
    return null
  }

  return artwork
}

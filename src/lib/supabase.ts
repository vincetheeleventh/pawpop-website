// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role for admin operations
export const supabaseAdmin = (() => {
  if (!supabaseServiceRoleKey) {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY - admin operations will not be available')
    return null
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
})()

// Database types
export interface Artwork {
  id: string
  user_id?: string
  original_image_url: string
  generated_image_url?: string
  pet_name?: string
  customer_name: string
  customer_email: string
  original_pet_mom_url?: string
  original_pet_url?: string
  access_token?: string
  token_expires_at?: string
  generation_status: 'pending' | 'completed' | 'failed'
  mockup_urls?: Array<{
    type: string
    title: string
    description: string
    mockupUrl: string
    productId: string
  }>
  mockup_generated_at?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  artwork_id: string
  stripe_session_id: string
  stripe_payment_intent_id?: string
  product_type: 'digital' | 'art_print' | 'framed_canvas'
  product_size: string
  price_cents: number
  customer_email: string
  customer_name: string
  shipping_address?: any
  order_status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed'
  printify_order_id?: string
  printify_status?: string
  created_at: string
  updated_at: string
}

// Extended Order type with joined artwork data
export interface OrderWithArtwork extends Order {
  artworks: Artwork
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: string
  notes?: string
  created_at: string
}

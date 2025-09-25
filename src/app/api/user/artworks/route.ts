// Get all artworks for a user by email
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isValidEmail } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const email = searchParams.get('email')

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database admin access not configured' },
        { status: 500 }
      )
    }

    // Get all artworks for this email
    const { data: artworks, error } = await supabaseAdmin
      .from('artworks')
      .select(`
        id,
        pet_name,
        customer_name,
        generation_step,
        processing_status,
        generated_images,
        delivery_images,
        access_token,
        created_at,
        updated_at
      `)
      .eq('customer_email', email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user artworks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch artworks' },
        { status: 500 }
      )
    }

    // Get order history for this email
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        artwork_id,
        product_type,
        product_size,
        price_cents,
        order_status,
        created_at,
        artworks!inner(
          pet_name,
          generated_images
        )
      `)
      .eq('customer_email', email)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching user orders:', ordersError)
      // Continue without orders if there's an error
    }

    return NextResponse.json({
      success: true,
      user: {
        email,
        artworks: artworks || [],
        orders: orders || [],
        stats: {
          total_artworks: artworks?.length || 0,
          total_orders: orders?.length || 0,
          completed_artworks: artworks?.filter(a => a.generation_step === 'completed').length || 0
        }
      }
    })

  } catch (error) {
    console.error('Error in user artworks endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

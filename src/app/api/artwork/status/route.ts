// src/app/api/artwork/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getArtworksByStatus } from '@/lib/supabase-artworks'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'pending' | 'completed' | 'failed'

    if (!status || !['pending', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid or missing status parameter. Must be: pending, completed, or failed' },
        { status: 400 }
      )
    }

    const artworks = await getArtworksByStatus(status)

    return NextResponse.json({
      success: true,
      artworks: artworks.map(artwork => ({
        id: artwork.id,
        customer_name: artwork.customer_name,
        customer_email: artwork.customer_email,
        pet_name: artwork.pet_name,
        generation_status: artwork.generation_status,
        original_image_url: artwork.original_image_url,
        generated_image_url: artwork.generated_image_url,
        created_at: artwork.created_at,
        updated_at: artwork.updated_at
      })),
      count: artworks.length
    })

  } catch (error) {
    console.error('Error fetching artworks by status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch artworks' },
      { status: 500 }
    )
  }
}

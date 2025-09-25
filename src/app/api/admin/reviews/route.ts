import { NextRequest, NextResponse } from 'next/server'
import { getPendingReviews } from '@/lib/admin-review'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const reviewType = searchParams.get('type') as 'artwork_proof' | 'highres_file' | null

    // Get all reviews (pending and completed)
    const reviews = await getPendingReviews(reviewType || undefined)

    return NextResponse.json({
      success: true,
      reviews
    })

  } catch (error) {
    console.error('Error fetching admin reviews:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch reviews' 
      },
      { status: 500 }
    )
  }
}

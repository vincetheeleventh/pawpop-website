import { NextRequest, NextResponse } from 'next/server'
import { getAdminReview } from '@/lib/admin-review'

interface RouteParams {
  params: {
    reviewId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { reviewId } = params

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      )
    }

    const review = await getAdminReview(reviewId)

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      review
    })

  } catch (error) {
    console.error('Error fetching admin review:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch review' 
      },
      { status: 500 }
    )
  }
}

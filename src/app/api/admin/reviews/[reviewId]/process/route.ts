import { NextRequest, NextResponse } from 'next/server'
import { processAdminReview } from '@/lib/admin-review'

interface RouteParams {
  params: {
    reviewId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { reviewId } = params
    const body = await request.json()
    const { status, notes, reviewedBy } = body

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      )
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status (approved/rejected) is required' },
        { status: 400 }
      )
    }

    if (!reviewedBy) {
      return NextResponse.json(
        { success: false, error: 'Reviewer information is required' },
        { status: 400 }
      )
    }

    const success = await processAdminReview(reviewId, status, reviewedBy, notes)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Review not found or already processed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Review ${status} successfully`
    })

  } catch (error) {
    console.error('Error processing admin review:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process review' 
      },
      { status: 500 }
    )
  }
}

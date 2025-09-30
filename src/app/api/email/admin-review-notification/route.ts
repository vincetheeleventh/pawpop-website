import { NextRequest, NextResponse } from 'next/server'
import { sendAdminReviewNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      reviewId, 
      reviewType, 
      customerName, 
      customerEmail,
      petName, 
      imageUrl, 
      falGenerationUrl 
    } = body

    if (!reviewId || !reviewType || !customerEmail || !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await sendAdminReviewNotification({
      reviewId,
      reviewType,
      customerName: customerName || '',
      customerEmail,
      petName,
      imageUrl,
      falGenerationUrl
    })

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error sending admin review notification:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send notification' 
      },
      { status: 500 }
    )
  }
}

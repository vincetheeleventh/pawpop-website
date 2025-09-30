import { NextRequest, NextResponse } from 'next/server'
import { sendMasterpieceReadyEmail } from '@/lib/email'
import { isValidEmail } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, artworkUrl, generatedImageUrl, petName } = body

    // Validate required fields
    if (!customerName || !customerEmail || !artworkUrl || !generatedImageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, customerEmail, artworkUrl, generatedImageUrl' },
        { status: 400 }
      )
    }

    // Validate email
    if (!isValidEmail(customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if manual approval is enabled
    const { isHumanReviewEnabled } = await import('@/lib/admin-review');
    
    if (isHumanReviewEnabled()) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Manual approval enabled - completion email will be sent after admin approval' 
        },
        { status: 200 }
      );
    }

    // Send masterpiece ready email
    const result = await sendMasterpieceReadyEmail({
      customerName: customerName || '',
      customerEmail,
      artworkUrl,
      imageUrl: generatedImageUrl,
      petName
    })

    if (!result.success) {
      console.error('Failed to send masterpiece ready email:', result.error)
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      )
    }

    console.log('Masterpiece ready email sent successfully')
    return NextResponse.json({
      success: true,
      message: 'Masterpiece ready email sent successfully'
    })

  } catch (error) {
    console.error('Error sending masterpiece ready email:', error)
    return NextResponse.json(
      { error: 'Failed to send masterpiece ready email' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { sendMasterpieceCreatingEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, petName, artworkUrl } = body

    if (!customerName || !customerEmail || !artworkUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await sendMasterpieceCreatingEmail({
      customerName,
      customerEmail,
      petName: petName || '',
      artworkUrl
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
    console.error('Error sending masterpiece creating email:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      },
      { status: 500 }
    )
  }
}

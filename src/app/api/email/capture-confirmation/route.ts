// src/app/api/email/capture-confirmation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendEmailCaptureConfirmation } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, uploadUrl } = body

    if (!customerEmail || !uploadUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: customerEmail, uploadUrl' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    console.log('📧 Sending email capture confirmation to:', customerEmail)

    const result = await sendEmailCaptureConfirmation({
      customerName: customerName || '',
      customerEmail,
      uploadUrl
    })

    if (!result.success) {
      console.error('Failed to send email capture confirmation:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    console.log('✅ Email capture confirmation sent successfully')

    return NextResponse.json({
      success: true,
      message: 'Email capture confirmation sent successfully'
    })

  } catch (error) {
    console.error('Error in email capture confirmation endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

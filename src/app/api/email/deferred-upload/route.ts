// src/app/api/email/deferred-upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendDeferredUploadEmail } from '@/lib/email'

/**
 * Send deferred upload email when user skips photo upload
 * POST /api/email/deferred-upload
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, uploadToken } = body

    if (!customerName || !customerEmail || !uploadToken) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, customerEmail, uploadToken' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const uploadUrl = `${baseUrl}/upload/${uploadToken}`

    const result = await sendDeferredUploadEmail({
      customerName,
      customerEmail,
      uploadUrl
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, uploadUrl })
  } catch (error) {
    console.error('Error in deferred upload email endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

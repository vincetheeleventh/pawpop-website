// src/app/api/email/upload-reminder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendUploadReminder } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Send upload reminder email to a specific customer
 * POST /api/email/upload-reminder
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artworkId, customerName, customerEmail, uploadUrl, reminderNumber } = body

    if (!artworkId || !customerName || !customerEmail || !uploadUrl || !reminderNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log(`📧 Sending upload reminder #${reminderNumber} to:`, customerEmail)

    const result = await sendUploadReminder({
      customerName,
      customerEmail,
      uploadUrl,
      reminderNumber
    })

    if (!result.success) {
      console.error('Failed to send upload reminder:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    // Mark reminder as sent in database
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.rpc('mark_reminder_sent', {
        artwork_id_param: artworkId
      })

      if (error) {
        console.error('Failed to mark reminder as sent:', error)
        // Don't fail the request if database update fails
      }
    }

    console.log('✅ Upload reminder sent successfully')

    return NextResponse.json({
      success: true,
      message: 'Upload reminder sent successfully'
    })

  } catch (error) {
    console.error('Error in upload reminder endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get artworks needing upload reminders and send them
 * GET /api/email/upload-reminder?send=true
 * This endpoint should be called by a cron job
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sendReminders = searchParams.get('send') === 'true'
    const hoursParam = searchParams.get('hours')
    const maxRemindersParam = searchParams.get('maxReminders')

    const hours = hoursParam ? parseInt(hoursParam) : 24
    const maxReminders = maxRemindersParam ? parseInt(maxRemindersParam) : 3

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get artworks needing reminders
    const { data: artworks, error } = await supabaseAdmin.rpc('get_artworks_needing_reminders', {
      hours_since_capture: hours,
      max_reminders: maxReminders
    })

    if (error) {
      console.error('Failed to get artworks needing reminders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch artworks' },
        { status: 500 }
      )
    }

    console.log(`📊 Found ${artworks?.length || 0} artworks needing reminders`)

    if (!sendReminders) {
      // Just return the list without sending
      return NextResponse.json({
        count: artworks?.length || 0,
        artworks: artworks || []
      })
    }

    // Send reminders
    const results = []
    for (const artwork of artworks || []) {
      const uploadUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/upload/${artwork.upload_token}`
      const reminderNumber = (artwork.upload_reminder_count || 0) + 1

      try {
        const result = await sendUploadReminder({
          customerName: artwork.customer_name,
          customerEmail: artwork.customer_email,
          uploadUrl,
          reminderNumber
        })

        if (result.success) {
          // Mark reminder as sent
          await supabaseAdmin.rpc('mark_reminder_sent', {
            artwork_id_param: artwork.artwork_id
          })

          results.push({
            artworkId: artwork.artwork_id,
            email: artwork.customer_email,
            reminderNumber,
            success: true
          })
        } else {
          results.push({
            artworkId: artwork.artwork_id,
            email: artwork.customer_email,
            reminderNumber,
            success: false,
            error: result.error
          })
        }
      } catch (error) {
        console.error(`Failed to send reminder for artwork ${artwork.artwork_id}:`, error)
        results.push({
          artworkId: artwork.artwork_id,
          email: artwork.customer_email,
          reminderNumber,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    console.log(`✅ Sent ${successCount}/${results.length} reminders successfully`)

    return NextResponse.json({
      totalArtworks: artworks?.length || 0,
      remindersSent: successCount,
      results
    })

  } catch (error) {
    console.error('Error in upload reminder cron endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

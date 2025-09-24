import { NextResponse } from 'next/server'
import { isHumanReviewEnabled } from '@/lib/admin-review'

export async function GET() {
  try {
    const enabled = isHumanReviewEnabled()
    
    return NextResponse.json({
      success: true,
      humanReviewEnabled: enabled
    })
  } catch (error) {
    console.error('Error checking review status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check review status',
        humanReviewEnabled: false // Default to false on error
      },
      { status: 500 }
    )
  }
}

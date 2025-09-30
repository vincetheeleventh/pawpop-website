// src/app/api/artwork/generate-upload-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artworkId } = body

    console.log('📝 Generate upload token request for artwork:', artworkId)

    if (!artworkId) {
      console.error('❌ Missing artworkId in request')
      return NextResponse.json(
        { error: 'Missing artworkId' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      console.error('❌ Database not configured')
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Generate upload token using database function
    console.log('🔄 Calling generate_upload_token database function...')
    const { data, error } = await supabaseAdmin.rpc('generate_upload_token')

    if (error) {
      console.error('❌ Failed to generate upload token:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { 
          error: 'Failed to generate upload token',
          details: error.message,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    const uploadToken = data as string

    // Update artwork with upload token
    const { error: updateError } = await supabaseAdmin
      .from('artworks')
      .update({ upload_token: uploadToken })
      .eq('id', artworkId)

    if (updateError) {
      console.error('Failed to update artwork with upload token:', updateError)
      return NextResponse.json(
        { error: 'Failed to save upload token' },
        { status: 500 }
      )
    }

    console.log('✅ Upload token generated for artwork:', artworkId)

    return NextResponse.json({
      success: true,
      uploadToken
    })

  } catch (error) {
    console.error('Error in generate upload token endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

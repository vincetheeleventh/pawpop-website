// src/app/api/artwork/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    
    if (!status) {
      return NextResponse.json({ error: 'Status parameter is required' }, { status: 400 });
    }
    
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    // Query artworks by generation_step
    const { data: artworks, error } = await supabaseAdmin
      .from('artworks')
      .select(`
        id,
        customer_name,
        customer_email,
        pet_name,
        generation_step,
        processing_status,
        generated_images,
        delivery_images,
        created_at,
        updated_at
      `)
      .eq('generation_step', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching artworks:', error);
      return NextResponse.json({ error: 'Failed to fetch artworks' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      artworks: artworks || [],
      count: artworks?.length || 0
    });

  } catch (error) {
    console.error('Error in artwork status endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

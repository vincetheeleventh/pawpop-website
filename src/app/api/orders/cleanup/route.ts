// src/app/api/orders/cleanup/route.ts
import { NextResponse } from 'next/server';
import { cleanupStalePendingOrders, getStalePendingOrders } from '@/lib/supabase-orders';

export async function POST(req: Request) {
  try {
    const { hoursOld = 24, dryRun = false } = await req.json().catch(() => ({}));

    console.log(`🧹 Order cleanup requested - Hours: ${hoursOld}, Dry run: ${dryRun}`);

    if (dryRun) {
      // Just get the stale orders without cleaning them up
      const staleOrders = await getStalePendingOrders(hoursOld);
      
      return NextResponse.json({
        success: true,
        dryRun: true,
        message: `Found ${staleOrders.length} stale pending orders`,
        staleOrders: staleOrders.map(order => ({
          id: order.id,
          stripe_session_id: order.stripe_session_id,
          created_at: order.created_at,
          customer_email: order.customer_email,
          product_type: order.product_type,
          age_hours: Math.round((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60))
        }))
      });
    }

    // Actually clean up the orders
    const result = await cleanupStalePendingOrders(hoursOld);

    return NextResponse.json({
      success: true,
      cleaned: result.cleaned,
      errors: result.errors,
      message: `Successfully cleaned up ${result.cleaned} stale pending orders`
    });

  } catch (error) {
    console.error('Order cleanup API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during cleanup' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check for stale orders without cleaning
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const hoursOld = parseInt(url.searchParams.get('hours') || '24');

    const staleOrders = await getStalePendingOrders(hoursOld);
    
    return NextResponse.json({
      success: true,
      count: staleOrders.length,
      staleOrders: staleOrders.map(order => ({
        id: order.id,
        stripe_session_id: order.stripe_session_id,
        created_at: order.created_at,
        customer_email: order.customer_email,
        product_type: order.product_type,
        age_hours: Math.round((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60))
      }))
    });

  } catch (error) {
    console.error('Stale orders check API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error checking stale orders' 
      },
      { status: 500 }
    );
  }
}

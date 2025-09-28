// src/app/api/orders/reconcile/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getOrderByStripeSession, createOrder, updateOrderAfterPayment } from '@/lib/supabase-orders';
import { parseOrderMetadata } from '@/lib/order-processing';

/**
 * Order Reconciliation API
 * Handles edge cases where orders exist in Stripe but not in our database
 * Can be called manually or via scheduled job
 */
export async function POST(req: Request) {
  try {
    const { sessionIds, timeRange } = await req.json();
    const reconciliationResults = [];

    // If specific session IDs provided, reconcile those
    if (sessionIds && Array.isArray(sessionIds)) {
      for (const sessionId of sessionIds) {
        const result = await reconcileSession(sessionId);
        reconciliationResults.push(result);
      }
    }
    
    // If time range provided, reconcile recent sessions
    else if (timeRange) {
      const { hours = 24 } = timeRange;
      const cutoffTime = Math.floor((Date.now() - hours * 60 * 60 * 1000) / 1000);
      
      console.log(`🔍 Reconciling orders from last ${hours} hours...`);
      
      if (!stripe) {
        throw new Error('Stripe not configured');
      }
      
      // Get recent checkout sessions from Stripe
      const sessions = await stripe.checkout.sessions.list({
        created: { gte: cutoffTime },
        limit: 100
      });
      
      for (const session of sessions.data) {
        if (session.payment_status === 'paid') {
          const result = await reconcileSession(session.id);
          reconciliationResults.push(result);
        }
      }
    }

    return NextResponse.json({
      success: true,
      reconciled: reconciliationResults.length,
      results: reconciliationResults
    });

  } catch (error) {
    console.error('❌ Order reconciliation failed:', error);
    return NextResponse.json(
      { error: 'Reconciliation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function reconcileSession(sessionId: string) {
  try {
    console.log(`🔄 Reconciling session: ${sessionId}`);
    
    // Check if order already exists
    const existingOrder = await getOrderByStripeSession(sessionId);
    if (existingOrder) {
      console.log(`✅ Order already exists for session ${sessionId}`);
      return { sessionId, status: 'exists', orderId: existingOrder.id };
    }
    
    if (!stripe) {
      throw new Error('Stripe not configured');
    }
    
    // Get session from Stripe (without expanding shipping_details for live sessions)
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (stripeSession.payment_status !== 'paid') {
      console.log(`⏭️ Session ${sessionId} not paid, skipping`);
      return { sessionId, status: 'not_paid' };
    }
    
    // Parse metadata
    const metadata = parseOrderMetadata(stripeSession);
    if (!metadata) {
      console.log(`⚠️ No metadata found for session ${sessionId}`);
      return { sessionId, status: 'no_metadata' };
    }
    
    // Create missing order
    const newOrder = await createOrder({
      artwork_id: stripeSession.metadata?.artworkId || 'reconciled',
      stripe_session_id: sessionId,
      product_type: metadata.productType,
      product_size: metadata.size,
      price_cents: stripeSession.amount_total || 0,
      customer_email: stripeSession.customer_details?.email || 'unknown@example.com',
      customer_name: stripeSession.customer_details?.name || metadata.customerName || 'Reconciled Customer'
    });
    
    // Update order status to paid (without shipping details for now)
    await updateOrderAfterPayment(
      sessionId,
      stripeSession.payment_intent as string,
      null // Skip shipping details for live sessions
    );
    
    console.log(`🚨 Reconciled order created: ${newOrder.id} for session ${sessionId}`);
    
    return { 
      sessionId, 
      status: 'reconciled', 
      orderId: newOrder.id,
      customerEmail: stripeSession.customer_details?.email 
    };
    
  } catch (error) {
    console.error(`❌ Failed to reconcile session ${sessionId}:`, error);
    return { 
      sessionId, 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ready',
    description: 'Order reconciliation API - use POST with sessionIds or timeRange'
  });
}

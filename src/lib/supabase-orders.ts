// src/lib/supabase-orders.ts
import { supabaseAdmin, type Order, type OrderWithArtwork, type OrderStatusHistory, type Artwork } from './supabase';
import { ProductType } from './printify';
import crypto from 'crypto';

function ensureSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available - missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return supabaseAdmin;
}

// Create artwork record
export async function createArtwork(data: {
  user_id?: string;
  original_image_url: string;
  pet_name?: string;
  customer_name: string;
}): Promise<Artwork> {
  const { data: artwork, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .insert({
      ...data,
      generation_step: 'pending',
      processing_status: {
        artwork_generation: 'pending',
        upscaling: 'pending',
        mockup_generation: 'pending'
      }
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating artwork:', error);
    throw new Error(`Failed to create artwork: ${error.message}`);
  }

  return artwork;
}

// Update artwork with generated image
export async function updateArtworkImage(
  artworkId: string, 
  generatedImageUrl: string
): Promise<void> {
  const { error } = await ensureSupabaseAdmin()
    .from('artworks')
    .update({
      generation_step: 'completed',
      generated_images: {
        artwork_preview: generatedImageUrl
      },
      processing_status: {
        artwork_generation: 'completed',
        upscaling: 'pending',
        mockup_generation: 'pending'
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', artworkId);

  if (error) {
    console.error('Error updating artwork:', error);
    throw new Error(`Failed to update artwork: ${error.message}`);
  }
}

// Create order record
export async function createOrder(data: {
  artwork_id: string;
  stripe_session_id: string;
  product_type: ProductType;
  product_size: string;
  price_cents: number;
  customer_email: string;
  customer_name: string;
}): Promise<Order> {
  const { data: order, error } = await ensureSupabaseAdmin()
    .from('orders')
    .insert({
      ...data,
      order_status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    throw new Error(`Failed to create order: ${error.message}`);
  }

  return order;
}

// Update order status after payment
export async function updateOrderAfterPayment(
  stripeSessionId: string,
  paymentIntentId: string,
  shippingAddress?: any
): Promise<void> {
  // Debug logging for shipping address
  console.log('🔍 updateOrderAfterPayment - Shipping address data:', {
    sessionId: stripeSessionId,
    hasShippingAddress: !!shippingAddress,
    shippingAddressType: typeof shippingAddress,
    shippingAddressKeys: shippingAddress ? Object.keys(shippingAddress) : null,
    shippingAddress: shippingAddress ? JSON.stringify(shippingAddress, null, 2) : null
  });

  const { error } = await ensureSupabaseAdmin()
    .from('orders')
    .update({
      order_status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
      shipping_address: shippingAddress,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_session_id', stripeSessionId);

  if (error) {
    console.error('Error updating order after payment:', error);
    throw new Error(`Failed to update order: ${error.message}`);
  }
}

// Update order status
export async function updateOrderStatus(
  stripeSessionId: string,
  status: string
): Promise<void> {
  const { error } = await ensureSupabaseAdmin()
    .from('orders')
    .update({
      order_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_session_id', stripeSessionId);

  if (error) {
    console.error('Error updating order status:', error);
    throw new Error(`Failed to update order status: ${error.message}`);
  }
}

// Update order with Printify details
export async function updateOrderWithPrintify(
  stripeSessionId: string,
  printifyOrderId: string,
  printifyStatus: string
): Promise<void> {
  const { error } = await ensureSupabaseAdmin()
    .from('orders')
    .update({
      printify_order_id: printifyOrderId,
      printify_status: printifyStatus,
      order_status: 'processing',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_session_id', stripeSessionId);

  if (error) {
    console.error('Error updating order with Printify details:', error);
    throw new Error(`Failed to update order: ${error.message}`);
  }
}

// Update order status from Printify webhook
export async function updateOrderFromPrintify(
  printifyOrderId: string,
  printifyStatus: string
): Promise<OrderWithArtwork | null> {
  // Map Printify status to our order status
  const orderStatus = mapPrintifyStatusToOrderStatus(printifyStatus);

  const { data: order, error } = await ensureSupabaseAdmin()
    .from('orders')
    .update({
      printify_status: printifyStatus,
      order_status: orderStatus,
      updated_at: new Date().toISOString()
    })
    .eq('printify_order_id', printifyOrderId)
    .select('*, artworks(*)')
    .single();

  if (error) {
    console.error('Error updating order from Printify:', error);
    return null;
  }

  // Add to status history
  await addOrderStatusHistory(order.id, printifyStatus, `Printify status update: ${printifyStatus}`);

  return order;
}

// Get order by Stripe session ID
export async function getOrderByStripeSession(stripeSessionId: string): Promise<OrderWithArtwork | null> {
  const { data: order, error } = await ensureSupabaseAdmin()
    .from('orders')
    .select('*, artworks(*)')
    .eq('stripe_session_id', stripeSessionId)
    .single();

  if (error) {
    console.error('Error getting order by Stripe session:', error);
    return null;
  }

  return order;
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<OrderWithArtwork | null> {
  const { data: order, error } = await ensureSupabaseAdmin()
    .from('orders')
    .select('*, artworks(*)')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error getting order by ID:', error);
    return null;
  }

  return order;
}

// Get orders by user ID
export async function getOrdersByUser(userId: string): Promise<OrderWithArtwork[]> {
  const { data: orders, error } = await ensureSupabaseAdmin()
    .from('orders')
    .select('*, artworks(*)')
    .eq('artworks.user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting orders by user:', error);
    return [];
  }

  return orders || [];
}

// Get failed orders for retry
export async function getFailedOrders(): Promise<OrderWithArtwork[]> {
  const { data: orders, error } = await ensureSupabaseAdmin()
    .from('orders')
    .select('*, artworks(*)')
    .eq('order_status', 'paid')
    .is('printify_order_id', null)
    .neq('product_type', 'digital')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error getting failed orders:', error);
    return [];
  }

  return orders || [];
}

// Add order status history
export async function addOrderStatusHistory(
  orderId: string,
  status: string,
  notes?: string
): Promise<void> {
  const { error } = await ensureSupabaseAdmin()
    .from('order_status_history')
    .insert({
      order_id: orderId,
      status,
      notes
    });

  if (error) {
    console.error('Error adding order status history:', error);
  }
}

// Get order status history
export async function getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
  const { data: history, error } = await ensureSupabaseAdmin()
    .from('order_status_history')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting order status history:', error);
    return [];
  }

  return history || [];
}

// Map Printify status to our order status
function mapPrintifyStatusToOrderStatus(printifyStatus: string): string {
  switch (printifyStatus.toLowerCase()) {
    case 'pending':
    case 'in-production':
      return 'processing';
    case 'fulfilled':
    case 'shipped':
      return 'shipped';
    case 'delivered':
      return 'delivered';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'processing';
  }
}

// Health check for database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await ensureSupabaseAdmin()
      .from('orders')
      .select('id')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
}

// Cleanup stale pending orders (older than specified hours)
export async function cleanupStalePendingOrders(hoursOld: number = 24): Promise<{
  cleaned: number;
  errors: string[];
}> {
  const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();
  const errors: string[] = [];
  
  try {
    console.log(`🧹 Cleaning up pending orders older than ${hoursOld} hours (before ${cutoffTime})`);
    
    // First, get the orders that will be cleaned up for logging
    const { data: stalePendingOrders, error: selectError } = await ensureSupabaseAdmin()
      .from('orders')
      .select('id, stripe_session_id, created_at, customer_email, product_type')
      .eq('order_status', 'pending')
      .lt('created_at', cutoffTime);

    if (selectError) {
      errors.push(`Failed to query stale orders: ${selectError.message}`);
      return { cleaned: 0, errors };
    }

    if (!stalePendingOrders || stalePendingOrders.length === 0) {
      console.log('✅ No stale pending orders found');
      return { cleaned: 0, errors };
    }

    console.log(`📋 Found ${stalePendingOrders.length} stale pending orders to clean up:`, 
      stalePendingOrders.map(o => ({ 
        id: o.id, 
        session: o.stripe_session_id, 
        age: Math.round((Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60)) + 'h',
        email: o.customer_email,
        type: o.product_type
      }))
    );

    // Update stale pending orders to cancelled
    const { data: updatedOrders, error: updateError } = await ensureSupabaseAdmin()
      .from('orders')
      .update({ 
        order_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('order_status', 'pending')
      .lt('created_at', cutoffTime)
      .select('id, stripe_session_id');

    if (updateError) {
      errors.push(`Failed to update stale orders: ${updateError.message}`);
      return { cleaned: 0, errors };
    }

    const cleanedCount = updatedOrders?.length || 0;
    
    // Add status history for cleaned orders
    if (updatedOrders && updatedOrders.length > 0) {
      for (const order of updatedOrders) {
        try {
          await addOrderStatusHistory(
            order.id, 
            'cancelled', 
            `Automatically cancelled - checkout session abandoned for ${hoursOld}+ hours`
          );
        } catch (historyError) {
          errors.push(`Failed to add status history for order ${order.id}: ${historyError}`);
        }
      }
    }

    console.log(`✅ Successfully cleaned up ${cleanedCount} stale pending orders`);
    return { cleaned: cleanedCount, errors };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during cleanup';
    errors.push(`Cleanup operation failed: ${errorMessage}`);
    console.error('❌ Stale order cleanup failed:', error);
    return { cleaned: 0, errors };
  }
}

// Get stale pending orders for monitoring (without cleaning them up)
export async function getStalePendingOrders(hoursOld: number = 24): Promise<Order[]> {
  const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();
  
  const { data: staleOrders, error } = await ensureSupabaseAdmin()
    .from('orders')
    .select('*')
    .eq('order_status', 'pending')
    .lt('created_at', cutoffTime)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error getting stale pending orders:', error);
    return [];
  }

  return staleOrders || [];
}

// Get artwork by secure token for email delivery
export async function getArtworkByToken(token: string): Promise<Artwork | null> {
  const { data: artwork, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .select('*')
    .eq('access_token', token)
    .eq('generation_status', 'completed')
    .single();

  if (error) {
    console.error('Error getting artwork by token:', error);
    return null;
  }

  return artwork;
}

// Generate secure access token for artwork
export async function generateArtworkToken(artworkId: string): Promise<string | null> {
  const token = crypto.randomUUID();
  
  const { error } = await ensureSupabaseAdmin()
    .from('artworks')
    .update({
      access_token: token,
      token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      updated_at: new Date().toISOString()
    })
    .eq('id', artworkId);

  if (error) {
    console.error('Error generating artwork token:', error);
    return null;
  }

  return token;
}

// Create artwork with email for the new workflow
export async function createArtworkWithEmail(data: {
  customer_email: string;
  customer_name: string;
  pet_name?: string;
  original_pet_mom_url: string;
  original_pet_url: string;
}): Promise<Artwork | null> {
  const { data: artwork, error } = await ensureSupabaseAdmin()
    .from('artworks')
    .insert({
      customer_email: data.customer_email,
      customer_name: data.customer_name,
      pet_name: data.pet_name,
      original_pet_mom_url: data.original_pet_mom_url,
      original_pet_url: data.original_pet_url,
      generation_status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating artwork:', error);
    return null;
  }

  return artwork;
}

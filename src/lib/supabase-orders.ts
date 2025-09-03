// src/lib/supabase-orders.ts
import { supabaseAdmin, type Order, type OrderStatusHistory, type Artwork } from './supabase';
import { ProductType } from './printify';
import crypto from 'crypto';

// Create artwork record
export async function createArtwork(data: {
  user_id?: string;
  original_image_url: string;
  pet_name?: string;
  customer_name: string;
}): Promise<Artwork> {
  const { data: artwork, error } = await supabaseAdmin
    .from('artworks')
    .insert({
      ...data,
      generation_status: 'pending'
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
  const { error } = await supabaseAdmin
    .from('artworks')
    .update({
      generated_image_url: generatedImageUrl,
      generation_status: 'completed',
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
  const { data: order, error } = await supabaseAdmin
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
  const { error } = await supabaseAdmin
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

// Update order with Printify details
export async function updateOrderWithPrintify(
  stripeSessionId: string,
  printifyOrderId: string,
  printifyStatus: string
): Promise<void> {
  const { error } = await supabaseAdmin
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
): Promise<Order | null> {
  // Map Printify status to our order status
  const orderStatus = mapPrintifyStatusToOrderStatus(printifyStatus);

  const { data: order, error } = await supabaseAdmin
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
export async function getOrderByStripeSession(stripeSessionId: string): Promise<Order | null> {
  const { data: order, error } = await supabaseAdmin
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
export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data: order, error } = await supabaseAdmin
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
export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const { data: orders, error } = await supabaseAdmin
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
export async function getFailedOrders(): Promise<Order[]> {
  const { data: orders, error } = await supabaseAdmin
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
  const { error } = await supabaseAdmin
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
  const { data: history, error } = await supabaseAdmin
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
    const { error } = await supabaseAdmin
      .from('orders')
      .select('id')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
}

// Get artwork by secure token for email delivery
export async function getArtworkByToken(token: string): Promise<Artwork | null> {
  const { data: artwork, error } = await supabaseAdmin
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
  
  const { error } = await supabaseAdmin
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
  const { data: artwork, error } = await supabaseAdmin
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

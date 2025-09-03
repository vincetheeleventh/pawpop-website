// src/app/api/orders/retry/[orderId]/route.ts
import { NextResponse } from 'next/server';
import { getOrderById } from '@/lib/supabase-orders';
import { processOrder, parseOrderMetadata } from '@/lib/order-processing';

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;
    
    if (!orderId) {
      return new NextResponse('Order ID is required', { status: 400 });
    }

    // Get order details
    const order = await getOrderById(orderId);
    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    // Check if order is eligible for retry
    if (order.order_status !== 'paid' || order.printify_order_id) {
      return new NextResponse('Order is not eligible for retry', { status: 400 });
    }

    // Skip digital products
    if (order.product_type === 'digital') {
      return new NextResponse('Digital products do not require Printify processing', { status: 400 });
    }

    // Reconstruct session and metadata for retry
    const mockSession = {
      id: order.stripe_session_id,
      payment_intent: order.stripe_payment_intent_id,
      shipping_details: order.shipping_address
    } as any;

    const metadata = {
      productType: order.product_type,
      imageUrl: order.artworks?.generated_image_url || '',
      size: order.product_size,
      customerName: order.customer_name,
      petName: order.artworks?.pet_name
    };

    // Retry order processing
    await processOrder({ session: mockSession, metadata });

    return NextResponse.json({ 
      success: true, 
      message: 'Order retry initiated successfully' 
    });

  } catch (error) {
    console.error('Error retrying order:', error);
    return new NextResponse('Failed to retry order', { status: 500 });
  }
}

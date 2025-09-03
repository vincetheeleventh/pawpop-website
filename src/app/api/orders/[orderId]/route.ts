// src/app/api/orders/[orderId]/route.ts
import { NextResponse } from 'next/server';
import { getOrderById, getOrderStatusHistory } from '@/lib/supabase-orders';

export async function GET(
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

    // Get order status history
    const statusHistory = await getOrderStatusHistory(orderId);

    return NextResponse.json({
      order,
      statusHistory
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

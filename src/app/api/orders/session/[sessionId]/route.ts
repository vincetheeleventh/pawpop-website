// src/app/api/orders/session/[sessionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getOrderByStripeSession } from '@/lib/supabase-orders';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get order details from database
    let order = await getOrderByStripeSession(sessionId);

    if (!order) {
      // FAILURE CONDITION: Order not found - could be webhook failure
      console.log(`⚠️ Order not found for session ${sessionId} - checking Stripe directly`);
      
      try {
        // Fallback: Check Stripe session directly and create order if payment succeeded
        const { stripe } = await import('@/lib/stripe');
        if (stripe) {
          const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
          
          if (stripeSession.payment_status === 'paid') {
            console.log('💳 Payment confirmed in Stripe but order missing - creating emergency order');
            
            // Parse metadata and create order
            const { parseOrderMetadata } = await import('@/lib/order-processing');
            const { createOrder } = await import('@/lib/supabase-orders');
            
            const metadata = parseOrderMetadata(stripeSession);
            if (metadata) {
              const emergencyOrder = await createOrder({
                artwork_id: stripeSession.metadata?.artworkId || 'emergency',
                stripe_session_id: sessionId,
                product_type: metadata.productType,
                product_size: metadata.size,
                price_cents: stripeSession.amount_total || 0,
                customer_email: stripeSession.customer_details?.email || 'unknown@example.com',
                customer_name: stripeSession.customer_details?.name || metadata.customerName || 'Emergency Customer'
              });
              
              console.log('🚨 Emergency order created:', emergencyOrder.id);
              
              // Update order status to paid (skip shipping details for live sessions)
              const { updateOrderAfterPayment } = await import('@/lib/supabase-orders');
              await updateOrderAfterPayment(
                sessionId,
                stripeSession.payment_intent as string,
                null // Skip shipping details for live sessions to avoid API errors
              );
              
              // Retry getting the order
              const newOrder = await getOrderByStripeSession(sessionId);
              if (newOrder) {
                order = newOrder;
              }
            }
          }
        }
      } catch (emergencyError) {
        console.error('❌ Emergency order creation failed:', emergencyError);
      }
      
      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
    }

    // Generate a simple order number from the database ID
    // Format: PP-XXXXX (PawPop + last 5 digits of order ID)
    const orderNumber = `PP-${order.id.slice(-5).toUpperCase()}`;

    // Calculate estimated delivery based on product type
    const getEstimatedDelivery = (productType: string) => {
      const now = new Date();
      let businessDays = 0;
      
      switch (productType) {
        case 'digital':
          return 'Available immediately';
        case 'art_print':
          businessDays = 7; // 5-7 business days
          break;
        case 'framed_canvas':
          businessDays = 10; // 7-10 business days
          break;
        default:
          businessDays = 7;
      }
      
      // Add business days (skip weekends)
      let deliveryDate = new Date(now);
      let addedDays = 0;
      
      while (addedDays < businessDays) {
        deliveryDate.setDate(deliveryDate.getDate() + 1);
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
          addedDays++;
        }
      }
      
      return deliveryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Format product type for display
    const formatProductType = (productType: string) => {
      switch (productType) {
        case 'digital':
          return 'Digital Download';
        case 'art_print':
          return 'Premium Art Print';
        case 'framed_canvas':
          return 'Framed Canvas';
        default:
          return productType;
      }
    };

    // Format price for display
    const formatPrice = (priceCents: number) => {
      return `$${(priceCents / 100).toFixed(2)}`;
    };

    // Prepare response data
    const orderData = {
      orderNumber,
      orderId: order.id,
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      productType: formatProductType(order.product_type),
      productSize: order.product_size,
      price: formatPrice(order.price_cents),
      orderStatus: order.order_status,
      estimatedDelivery: getEstimatedDelivery(order.product_type),
      createdAt: order.created_at,
      artwork: order.artworks ? {
        id: order.artworks.id,
        petName: order.artworks.pet_name,
        previewImage: order.artworks.generated_images?.artwork_preview,
        accessToken: order.artworks.access_token
      } : null,
      shippingAddress: order.shipping_address,
      printifyOrderId: order.printify_order_id,
      printifyStatus: order.printify_status
    };

    return NextResponse.json(orderData);

  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

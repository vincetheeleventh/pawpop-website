// src/app/api/webhook/printify/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { handleOrderStatusUpdate } from '@/lib/order-processing';
import { updateOrderFromPrintify } from '@/lib/supabase-orders';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const signature = headers().get('x-printify-signature');
    
    // Verify webhook signature (if configured)
    if (process.env.PRINTIFY_WEBHOOK_SECRET && signature) {
      // TODO: Implement signature verification
      // const expectedSignature = crypto.createHmac('sha256', process.env.PRINTIFY_WEBHOOK_SECRET)
      //   .update(JSON.stringify(body))
      //   .digest('hex');
      // if (signature !== expectedSignature) {
      //   return new NextResponse('Invalid signature', { status: 401 });
      // }
    }

    console.log('Printify webhook received:', body.type);

    // Handle different Printify webhook events
    switch (body.type) {
      case 'order:updated':
        const orderData = body.data;
        const updatedOrder = await updateOrderFromPrintify(orderData.id, orderData.status);
        if (updatedOrder) {
          await handleOrderStatusUpdate(orderData.external_id, orderData.status);
          console.log(`Printify order ${orderData.id} updated to status: ${orderData.status}`);
        }
        break;

      case 'order:sent-to-production':
        console.log(`Printify order ${body.data.id} sent to production`);
        break;

      case 'order:shipment:created':
        console.log(`Printify order ${body.data.id} shipment created`);
        // TODO: Send tracking information to customer
        break;

      case 'order:shipment:delivered':
        console.log(`Printify order ${body.data.id} delivered`);
        // TODO: Send delivery confirmation to customer
        break;

      default:
        console.log(`Unhandled Printify webhook type: ${body.type}`);
    }

    return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
    
  } catch (error) {
    console.error('Error processing Printify webhook:', error);
    return new NextResponse('Webhook processing failed', { status: 500 });
  }
}

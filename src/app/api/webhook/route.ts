import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { processOrder, parseOrderMetadata, handleOrderStatusUpdate } from '@/lib/order-processing';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;

  // Check if Stripe is configured
  if (!stripe) {
    return new NextResponse('Stripe not configured', { status: 503 });
  }

  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err}`);
    return new NextResponse('Webhook Error', { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      try {
        const session = event.data.object;
        console.log('Checkout completed:', session.id);
        
        // Parse order metadata
        const metadata = parseOrderMetadata(session);
        if (!metadata) {
          console.error('Missing order metadata in session:', session.id);
          break;
        }

        // Process the order (create Printify order for physical products)
        await processOrder({ session, metadata });
        console.log('Order processed successfully:', session.id);
        
      } catch (error) {
        console.error('Error processing checkout session:', error);
        // Don't return error to Stripe - we'll handle retry logic separately
      }
      break;
      
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      break;
      
    case 'payment_intent.payment_failed':
      const paymentFailed = event.data.object;
      console.error('Payment failed:', paymentFailed.id);
      break;
      
    // Note: Printify webhooks would be handled by a separate endpoint
    // since they're not Stripe events
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}

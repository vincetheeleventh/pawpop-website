import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { processOrder, parseOrderMetadata, handleOrderStatusUpdate } from '@/lib/order-processing';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { trackStripeWebhook } from '@/lib/monitoring';
import { getOrderByStripeSession, updateOrderAfterPayment } from '@/lib/supabase-orders';

export async function POST(req: Request) {
  const startTime = Date.now();
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
    
    // Track webhook failure
    await trackStripeWebhook({
      eventId: 'unknown',
      eventType: 'signature_verification_failed',
      status: 'failed',
      processingTime: Date.now() - startTime,
      errorMessage: err instanceof Error ? err.message : 'Signature verification failed'
    });
    
    return new NextResponse('Webhook Error', { status: 400 });
  }

  console.log(`Received webhook event: ${event.type} with ID: ${event.id}`);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      try {
        const session = event.data.object;
        console.log('Checkout completed:', session.id);
        
        // Parse order metadata
        const metadata = parseOrderMetadata(session);
        if (!metadata) {
          console.log('No order metadata found - likely a test event:', session.id);
          // For test events or sessions without metadata, just log and continue
          break;
        }

        // Retrieve full session with shipping details for physical products
        let fullSession = session;
        if (metadata.productType !== 'digital') {
          try {
            console.log('🚚 Retrieving full session with shipping details for physical product');
            fullSession = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ['shipping_details']
            });
            console.log('✅ Full session retrieved with shipping details');
          } catch (retrieveError) {
            console.error('❌ Failed to retrieve full session with shipping details:', retrieveError);
            // Continue with original session - shipping details will be null but order can still process
          }
        }

        // Ensure order exists in database (create if it doesn't exist)
        let existingOrder: any = await getOrderByStripeSession(session.id);
        if (!existingOrder) {
          console.log('📝 Order not found in database, creating from webhook...');
          const { createOrder } = await import('@/lib/supabase-orders');
          
          try {
            const newOrder = await createOrder({
              artwork_id: session.metadata?.artworkId || 'unknown',
              stripe_session_id: session.id,
              product_type: metadata.productType,
              product_size: metadata.size,
              price_cents: session.amount_total || 0,
              customer_email: session.customer_details?.email || 'unknown@example.com',
              customer_name: session.customer_details?.name || metadata.customerName || 'Unknown Customer'
            });
            console.log('✅ Order created from webhook:', newOrder.id);
            existingOrder = newOrder;
          } catch (createError) {
            console.error('❌ Failed to create order from webhook:', createError);
            
            // FAILURE CONDITION: Database connection failure
            if (createError instanceof Error && 
                (createError.message.includes('connection') || 
                 createError.message.includes('timeout') ||
                 createError.message.includes('ECONNREFUSED'))) {
              console.log('🔄 Database connection issue detected, scheduling retry...');
              
              // Schedule retry via monitoring system
              try {
                const { trackStripeWebhook } = await import('@/lib/monitoring');
                await trackStripeWebhook({
                  eventId: event.id,
                  eventType: 'order_creation_retry_needed',
                  status: 'failed',
                  processingTime: Date.now() - startTime,
                  errorMessage: `Database connection failure for session ${session.id}`
                });
              } catch (monitoringError) {
                console.error('Failed to track retry need:', monitoringError);
              }
            }
            
            // Continue processing even if order creation fails
          }
        } else {
          console.log('✅ Order already exists in database:', existingOrder.id);
        }

        // Update order status to paid and add shipping address
        if (existingOrder) {
          try {
            await updateOrderAfterPayment(
              session.id,
              session.payment_intent as string,
              (fullSession as any).shipping_details
            );
            console.log('✅ Order updated with payment details');
          } catch (updateError) {
            console.error('❌ Failed to update order after payment:', updateError);
          }
        }

        // Process the order (create Printify order for physical products)
        await processOrder({ session: fullSession, metadata });
        console.log('Order processed successfully:', session.id);

        // Track purchase conversion for Google Ads (server-side)
        try {
          const { trackServerSideConversion } = await import('@/lib/google-ads-server');
          
          const conversionData = {
            orderId: session.id,
            value: (session.amount_total || 0) / 100, // Convert cents to dollars
            currency: (session.currency || 'cad').toUpperCase(),
            productType: metadata.productType || 'PawPop Print',
            customerEmail: session.customer_details?.email || undefined,
            customParameters: {
              customer_name: metadata.customerName,
              pet_name: metadata.petName,
              frame_upgrade: metadata.frameUpgrade,
              size: metadata.size
            }
          };
          
          const trackingResult = await trackServerSideConversion(conversionData);
          if (trackingResult.success) {
            console.log('✅ Google Ads server-side conversion tracked successfully');
          } else {
            console.warn('⚠️ Google Ads server-side conversion tracking failed:', trackingResult.error);
          }
        } catch (trackingError) {
          console.error('❌ Failed to track purchase conversion:', trackingError);
        }

        // Send order confirmation email
        try {
          const customerName = session.customer_details?.name || metadata.customerName || 'Valued Customer';
          const customerEmail = session.customer_details?.email;
          
          if (customerEmail) {
            await sendOrderConfirmationEmail({
              customerName: customerName || '',
              customerEmail,
              orderNumber: session.id,
              productType: metadata.productType || 'PawPop Print',
              productSize: metadata.size,
              price: (session.amount_total || 0) / 100,
              amount: session.amount_total || 0,
              currency: session.currency || 'usd',
              petName: metadata.petName
            });
            console.log('Order confirmation email sent successfully');
          }
        } catch (emailError) {
          console.error('Failed to send order confirmation email:', emailError);
          // Don't fail the request if email fails
        }
        
        // Track successful webhook processing
        await trackStripeWebhook({
          eventId: event.id,
          eventType: event.type,
          status: 'success',
          processingTime: Date.now() - startTime
        });
        
      } catch (error) {
        console.error('Error processing checkout session:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Track webhook failure
        await trackStripeWebhook({
          eventId: event.id,
          eventType: event.type,
          status: 'failed',
          processingTime: Date.now() - startTime,
          errorMessage: error instanceof Error ? error.message : 'Unknown error processing checkout session'
        });
        
        // Don't return error to Stripe - we'll handle retry logic separately
      }
      break;
      
    case 'payment_intent.succeeded':
      try {
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Track successful payment intent
        await trackStripeWebhook({
          eventId: event.id,
          eventType: event.type,
          status: 'success',
          processingTime: Date.now() - startTime
        });
      } catch (error) {
        await trackStripeWebhook({
          eventId: event.id,
          eventType: event.type,
          status: 'failed',
          processingTime: Date.now() - startTime,
          errorMessage: error instanceof Error ? error.message : 'Error processing payment_intent.succeeded'
        });
      }
      break;
      
    case 'payment_intent.payment_failed':
      try {
        const paymentFailed = event.data.object;
        console.error('Payment failed:', paymentFailed.id);
        
        // Track payment failure
        await trackStripeWebhook({
          eventId: event.id,
          eventType: event.type,
          status: 'success', // Webhook processing was successful, even though payment failed
          processingTime: Date.now() - startTime
        });
      } catch (error) {
        await trackStripeWebhook({
          eventId: event.id,
          eventType: event.type,
          status: 'failed',
          processingTime: Date.now() - startTime,
          errorMessage: error instanceof Error ? error.message : 'Error processing payment_intent.payment_failed'
        });
      }
      break;

    case 'checkout.session.expired':
      try {
        const expiredSession = event.data.object;
        console.log('Checkout session expired:', expiredSession.id);
        
        // Update order status to cancelled for expired sessions
        const { updateOrderStatus } = await import('@/lib/supabase-orders');
        await updateOrderStatus(expiredSession.id, 'cancelled');
        console.log('✅ Order marked as cancelled due to session expiration');
        
        // Track expired session
        await trackStripeWebhook({
          eventId: event.id,
          eventType: event.type,
          status: 'success',
          processingTime: Date.now() - startTime
        });
      } catch (error) {
        console.error('Error processing expired session:', error);
        await trackStripeWebhook({
          eventId: event.id,
          eventType: event.type,
          status: 'failed',
          processingTime: Date.now() - startTime,
          errorMessage: error instanceof Error ? error.message : 'Error processing checkout.session.expired'
        });
      }
      break;

    case 'checkout.session.async_payment_failed':
      try {
        const failedSession = event.data.object;
        console.log('Checkout session async payment failed:', failedSession.id);
        
        // Update order status to cancelled for failed async payments
        const { updateOrderStatus } = await import('@/lib/supabase-orders');
        await updateOrderStatus(failedSession.id, 'cancelled');
        console.log('✅ Order marked as cancelled due to async payment failure');
        
        // Track failed async payment
        await trackStripeWebhook({
          eventId: event.id,
          eventType: event.type,
          status: 'success',
          processingTime: Date.now() - startTime
        });
      } catch (error) {
        console.error('Error processing async payment failure:', error);
        await trackStripeWebhook({
          eventId: event.id,
          eventType: event.type,
          status: 'failed',
          processingTime: Date.now() - startTime,
          errorMessage: error instanceof Error ? error.message : 'Error processing checkout.session.async_payment_failed'
        });
      }
      break;
      
    // Note: Printify webhooks would be handled by a separate endpoint
    // since they're not Stripe events
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
      
      // Track unhandled event types for monitoring
      await trackStripeWebhook({
        eventId: event.id,
        eventType: event.type,
        status: 'success', // Successfully received but unhandled
        processingTime: Date.now() - startTime
      });
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}

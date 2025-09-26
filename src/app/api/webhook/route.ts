import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { processOrder, parseOrderMetadata, handleOrderStatusUpdate } from '@/lib/order-processing';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { trackStripeWebhook } from '@/lib/monitoring';

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

        // Process the order (create Printify order for physical products)
        await processOrder({ session, metadata });
        console.log('Order processed successfully:', session.id);

        // Process coupon usage if applicable
        if (metadata.couponCode && metadata.couponId) {
          try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(
              process.env.SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { error: couponError } = await supabase.rpc('apply_coupon_code', {
              p_coupon_id: metadata.couponId,
              p_order_id: session.id,
              p_artwork_id: metadata.artworkId,
              p_original_amount: parseFloat(metadata.originalAmount || '0'),
              p_discount_amount: parseFloat(metadata.discountAmount || '0'),
              p_final_amount: parseFloat(metadata.finalAmount || '0'),
              p_user_email: session.customer_details?.email || null,
              p_ip_address: null, // Not available in webhook
              p_user_agent: null // Not available in webhook
            });

            if (couponError) {
              console.error('❌ Failed to record coupon usage:', couponError);
            } else {
              console.log('✅ Coupon usage recorded:', metadata.couponCode);
            }
          } catch (couponProcessingError) {
            console.error('❌ Error processing coupon usage:', couponProcessingError);
          }
        }

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
              customerName,
              customerEmail,
              orderNumber: session.id,
              productType: metadata.productType || 'PawPop Print',
              productSize: metadata.size,
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

// Simulate webhook for testing - triggers order confirmation email after successful payment
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { parseOrderMetadata } from '@/lib/order-processing';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { session_id, type } = body;

    if (type !== 'checkout.session.completed' || !session_id) {
      return new NextResponse('Invalid request', { status: 400 });
    }

    console.log('🧪 Simulating webhook for session:', session_id);

    // Check Stripe configuration
    if (!stripe) {
      return new NextResponse('Stripe not configured', { status: 503 });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log('📄 Retrieved session:', session.id);

    // Parse order metadata
    const metadata = parseOrderMetadata(session);
    if (!metadata) {
      console.log('No order metadata found for session:', session_id);
      return new NextResponse('No metadata found', { status: 400 });
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
          currency: session.currency || 'cad',
          petName: metadata.petName
        });
        console.log('✅ Order confirmation email sent successfully to:', customerEmail);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Order confirmation email sent successfully',
          recipient: customerEmail,
          orderNumber: session.id
        });
      } else {
        console.warn('⚠️ No customer email found in session');
        return NextResponse.json({ 
          success: false, 
          message: 'No customer email found' 
        }, { status: 400 });
      }
    } catch (emailError) {
      console.error('❌ Failed to send order confirmation email:', emailError);
      return NextResponse.json({ 
        success: false, 
        error: emailError instanceof Error ? emailError.message : 'Email sending failed',
        details: 'Check if RESEND_API_KEY is configured'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Webhook simulation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook simulation endpoint for testing order confirmation emails',
    usage: 'POST /api/webhook/simulate with { "session_id": "cs_test_...", "type": "checkout.session.completed" }'
  });
}

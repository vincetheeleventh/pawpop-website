// Test endpoint to send order confirmation email
import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerEmail = 'pawpopart@gmail.com' } = body;

    console.log('🧪 Testing order confirmation email to:', customerEmail);

    await sendOrderConfirmationEmail({
      customerName: 'Test Customer',
      customerEmail: customerEmail,
      orderNumber: `test_order_${Date.now()}`,
      productType: 'art_print',
      productSize: '16x24',
      amount: 3600, // $36.00 in cents
      currency: 'cad',
      petName: 'Buddy'
    });

    console.log('✅ Test email sent successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Test order confirmation email sent successfully',
      recipient: customerEmail
    });

  } catch (error) {
    console.error('❌ Test email failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check if RESEND_API_KEY is configured in .env.local'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test email endpoint. Send POST request to test order confirmation email.',
    usage: 'POST /api/test-email with optional { "customerEmail": "your@email.com" }'
  });
}

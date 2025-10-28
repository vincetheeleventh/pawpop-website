// Test endpoint to send Pop5Pack proof email
import { NextResponse } from 'next/server';
import { sendPop5PackProofEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      customerEmail = 'vincentxi717@gmail.com',
      parodyStyle = 'wizard',
      proofImageUrl = 'https://fal.media/files/lion/example-proof.jpg',
      artworkId = `test_${Date.now()}`
    } = body;

    console.log('🧪 Testing Pop5Pack proof email to:', customerEmail);
    console.log('📧 Email config:', {
      testMode: process.env.EMAIL_TEST_MODE,
      resendKey: process.env.RESEND_API_KEY ? 'configured' : 'missing',
    });

    const result = await sendPop5PackProofEmail({
      customerEmail,
      parodyStyle,
      proofImageUrl,
      artworkId,
    });

    console.log('📬 Email send result:', result);

    if (result.success) {
      console.log('✅ Test email sent successfully to:', customerEmail);
      console.log('📨 Message ID:', result.messageId);
      return NextResponse.json({ 
        success: true, 
        message: 'Pop5Pack proof email sent successfully',
        recipient: customerEmail,
        messageId: result.messageId,
        note: 'Check spam folder if not received. Email sent from: hello@updates.pawpopart.com'
      });
    } else {
      throw new Error(result.error || 'Failed to send email');
    }

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
    message: 'Test Pop5Pack proof email endpoint.',
    usage: 'POST /api/test-email with optional { "customerEmail": "your@email.com", "parodyStyle": "wizard" }',
    defaultRecipient: 'vincentxi717@gmail.com',
    emailConfig: {
      testMode: process.env.EMAIL_TEST_MODE === 'true',
      testRecipient: process.env.EMAIL_TEST_RECIPIENT || 'pawpopart@gmail.com',
      resendConfigured: !!process.env.RESEND_API_KEY,
    }
  });
}

// src/app/api/test/env-check/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    printifyApiToken: process.env.PRINTIFY_API_TOKEN ? 'SET' : 'NOT SET',
    printifyShopId: process.env.PRINTIFY_SHOP_ID ? process.env.PRINTIFY_SHOP_ID : 'NOT SET',
    printifyWebhookSecret: process.env.PRINTIFY_WEBHOOK_SECRET ? 'SET' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    // FAL.ai configuration
    falKey: process.env.FAL_KEY ? 'SET' : 'NOT SET',
    hfToken: process.env.HF_TOKEN ? 'SET' : 'NOT SET',
    // Email and review settings
    resendApiKey: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
    emailTestMode: process.env.EMAIL_TEST_MODE,
    enableHumanReview: process.env.ENABLE_HUMAN_REVIEW,
    humanReviewEnabled: process.env.ENABLE_HUMAN_REVIEW === 'true',
    adminEmail: process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL : 'NOT SET'
  });
}
